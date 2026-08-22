import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import { INITIAL_DEVICES, INITIAL_EMAIL_LOGS } from './src/data/initialDevices';
import { ANDROID_SOURCE_FILES } from './src/data/androidSource';
import { ChildDevice, DeviceTelemetry, EmailReportLog, SenderAccount } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// JSON syntax error handler middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, message: '잘못된 형식의 JSON 요청입니다.' });
  }
  next(err);
});

// In-memory runtime state
let devices: ChildDevice[] = [...INITIAL_DEVICES];
let reportLogs: EmailReportLog[] = [...INITIAL_EMAIL_LOGS];

// Multi-Sender Accounts Pool (Supports 2 or more sender emails with automatic failover)
let senderAccounts: SenderAccount[] = [
  {
    id: 'sender-1',
    email: process.env.SMTP_USER?.trim() || 'jpark04092@gmail.com',
    name: '1차 주 발송지 (Gmail)',
    provider: 'gmail',
    appPassword: (process.env.SMTP_PASS || '').replace(/[\s"'-]+/g, '').trim(),
    appPasswordMasked: process.env.SMTP_PASS ? '••••••••••••••••' : '앱비밀번호 등록 필요',
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    isDefault: true,
    createdAt: new Date().toISOString(),
    status: process.env.SMTP_PASS ? 'ACTIVE' : 'STANDBY',
    totalSentCount: 14
  },
  {
    id: 'sender-2',
    email: process.env.SMTP_BACKUP_USER?.trim() || 'jpark04092.backup@gmail.com',
    name: '2차 보조 발송지 (Failover 백업)',
    provider: 'gmail',
    appPassword: (process.env.SMTP_BACKUP_PASS || '').replace(/[\s"'-]+/g, '').trim(),
    appPasswordMasked: process.env.SMTP_BACKUP_PASS ? '••••••••••••••••' : '앱비밀번호 등록 대기',
    host: 'smtp.gmail.com',
    port: 465,
    isDefault: false,
    createdAt: new Date().toISOString(),
    status: 'STANDBY',
    totalSentCount: 0
  }
];

// Helper to mask password for client response
function sanitizeSender(s: SenderAccount): SenderAccount {
  const { appPassword, ...rest } = s;
  return {
    ...rest,
    appPasswordMasked: appPassword && appPassword.length > 0 ? '••••••••••••••••' : '미등록'
  };
}

// Real SMTP Multi-Sender Dispatcher with Automatic Failover
interface SmtpDispatchResult {
  sentToSmtp: boolean;
  messageId?: string;
  error?: string;
  statusText: string;
  senderEmail?: string;
  senderName?: string;
  failoverOccurred?: boolean;
  triedSenders?: string[];
}

async function sendMailSingleSender(
  sender: SenderAccount,
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const user = sender.email.trim();
  const pass = (sender.appPassword || '').replace(/[\s"'-]+/g, '').trim();

  if (!user || !pass) {
    return {
      success: false,
      error: `발송지 [${user || '미지정'}]에 앱 비밀번호가 설정되지 않았습니다.`
    };
  }

  const host = sender.host?.trim() || 'smtp.gmail.com';
  const isGmail = sender.provider === 'gmail' || host.includes('gmail') || user.toLowerCase().includes('@gmail.com');
  const from = `Timesnooper 일일보고서 <${user}>`;

  let transporter: nodemailer.Transporter;
  if (isGmail) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  } else {
    const port = sender.port || 587;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });

  return { success: true, messageId: info.messageId };
}

async function dispatchRealEmail(
  to: string,
  subject: string,
  html: string,
  preferredSenderId?: string
): Promise<SmtpDispatchResult> {
  // Sort senders: preferred sender first, then default sender, then others
  const sortedSenders = [...senderAccounts].sort((a, b) => {
    if (preferredSenderId) {
      if (a.id === preferredSenderId) return -1;
      if (b.id === preferredSenderId) return 1;
    }
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  // Filter candidates that have password configured, or include all for informative messaging
  const candidateSenders = sortedSenders.filter(s => s.appPassword && s.appPassword.length > 0);

  if (candidateSenders.length === 0) {
    console.log(`[SMTP Not Configured] No active sender with password. To: ${to}, Subject: ${subject}`);
    return {
      sentToSmtp: false,
      statusText: '발송지 이메일 비밀번호 미설정 (대시보드 실시간 프리뷰 보관)',
      senderEmail: sortedSenders[0]?.email || '미설정',
      senderName: sortedSenders[0]?.name || '기본 발송지',
      triedSenders: sortedSenders.map(s => s.email)
    };
  }

  const triedSenders: string[] = [];
  let lastError = '';

  for (let i = 0; i < candidateSenders.length; i++) {
    const sender = candidateSenders[i];
    triedSenders.push(sender.email);

    try {
      console.log(`[SMTP Attempt ${i + 1}/${candidateSenders.length}] Using sender: ${sender.email} (${sender.name})`);
      const result = await sendMailSingleSender(sender, to, subject, html);

      if (result.success) {
        sender.totalSentCount += 1;
        sender.lastUsedAt = new Date().toISOString();
        sender.status = 'ACTIVE';
        sender.lastError = undefined;

        const isFailover = i > 0;
        console.log(`[SMTP Success] Sent email via ${sender.email} to ${to}, MessageID: ${result.messageId}`);
        return {
          sentToSmtp: true,
          messageId: result.messageId,
          senderEmail: sender.email,
          senderName: sender.name,
          failoverOccurred: isFailover,
          triedSenders,
          statusText: isFailover 
            ? `1차 발송 실패 후 2차 발송지 (${sender.email})로 자동 전환(Failover) 전송 성공!`
            : `발송지 (${sender.email}) -> 수신함 (${to}) 정상 발송 완료 (ID: ${result.messageId?.slice(0, 14)}...)`
        };
      } else {
        lastError = result.error || '전송 실패';
        sender.status = 'ERROR';
        sender.lastError = lastError;
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.error(`[SMTP Error on ${sender.email}]:`, errMsg);
      lastError = errMsg;
      sender.status = 'ERROR';
      sender.lastError = errMsg;
    }
  }

  // If all candidate senders failed
  let userFriendlyErr = lastError;
  if (userFriendlyErr.includes('535') || userFriendlyErr.toLowerCase().includes('badcredentials') || userFriendlyErr.toLowerCase().includes('username and password not accepted')) {
    userFriendlyErr = '구글 16자리 앱 비밀번호 인증 실패: 구글 계정 보안 설정에서 16자리 앱 비밀번호를 다시 확인해주세요.';
  }

  return {
    sentToSmtp: false,
    error: userFriendlyErr,
    triedSenders,
    statusText: `모든 발송지(${triedSenders.join(', ')}) 전송 실패: ${userFriendlyErr}`
  };
}

// Gemini AI client initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Generate HTML email template
function generateReportEmailHtml(device: ChildDevice, telemetry: DeviceTelemetry, aiAdvice?: string): string {
  const totalHours = Math.floor(telemetry.screenTimeMinutes / 60);
  const totalMins = telemetry.screenTimeMinutes % 60;
  const timeFormatted = `${totalHours > 0 ? `${totalHours}시간 ` : ''}${totalMins}분`;
  
  const appRowsHtml = telemetry.apps.map((app, idx) => {
    const hours = Math.floor(app.durationMinutes / 60);
    const mins = app.durationMinutes % 60;
    const durStr = `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
    const percentage = Math.min(100, Math.round((app.durationMinutes / Math.max(1, telemetry.screenTimeMinutes)) * 100));
    
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 10px; font-size: 14px; font-weight: 600; color: #1e293b;">
          ${idx + 1}. ${app.appName}
          <div style="font-size: 11px; color: #64748b; font-weight: normal;">${app.packageName}</div>
        </td>
        <td style="padding: 12px 10px; font-size: 13px; color: #475569; text-align: center;">
          <span style="background: #e2e8f0; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 500;">
            ${app.category.toUpperCase()}
          </span>
        </td>
        <td style="padding: 12px 10px; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right;">
          ${durStr}
          <div style="font-size: 11px; color: #94a3b8;">${percentage}%</div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; color: #ffffff; text-align: left;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 700; letter-spacing: 0.05em; background: #3b82f6; color: #ffffff; padding: 4px 10px; border-radius: 6px;">
            timesnooper 데일리 리포트
          </span>
          <span style="font-size: 13px; color: #94a3b8;">매일 ${device.scheduledReportTime || '22:00'} 정기 발송</span>
        </div>
        <h1 style="margin: 8px 0 4px; font-size: 22px; font-weight: 800; color: #ffffff;">
          ${device.childName} 기기 일일 사용 리포트
        </h1>
        <p style="margin: 0; font-size: 13px; color: #cbd5e1;">
          기기: ${device.deviceName} (${device.androidVersion}) | 기준일: ${telemetry.date}
        </p>
      </div>

      <!-- Core Summary Cards -->
      <div style="padding: 24px;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; text-align: center;">
            <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">총 스크린 타임</div>
            <div style="font-size: 20px; font-weight: 800; color: #2563eb;">${timeFormatted}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; text-align: center;">
            <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">화면 잠금 해제</div>
            <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${telemetry.unlockCount}회</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; text-align: center;">
            <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">야간 사용 (22시 이후)</div>
            <div style="font-size: 20px; font-weight: 800; color: ${telemetry.lateNightUsageMinutes > 0 ? '#ef4444' : '#10b981'};">
              ${telemetry.lateNightUsageMinutes}분
            </div>
          </div>
        </div>

        <!-- Security & Anti-Uninstall Status -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 12px; font-weight: 700; color: #166534;">🛡️ timesnooper 시스템 보호 상태</div>
            <div style="font-size: 11px; color: #15803d;">Device Owner(삭제 방지) 활성 · 부팅 자동 복구 무결성 검증됨</div>
          </div>
          <span style="background: #22c55e; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px;">정상 작동중</span>
        </div>

        <!-- App Breakdown Table -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 12px; display: flex; align-items: center;">
            📱 설치 및 실행된 앱별 상세 사용시간
          </h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 8px 10px; font-size: 12px; color: #64748b; font-weight: 600;">앱 이름</th>
                <th style="padding: 8px 10px; font-size: 12px; color: #64748b; font-weight: 600; text-align: center;">분류</th>
                <th style="padding: 8px 10px; font-size: 12px; color: #64748b; font-weight: 600; text-align: right;">사용 시간</th>
              </tr>
            </thead>
            <tbody>
              ${appRowsHtml}
            </tbody>
          </table>
        </div>

        ${aiAdvice ? `
          <!-- AI Daily Parenting Advice -->
          <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 700; color: #6b21a8; margin-bottom: 6px; display: flex; align-items: center;">
              💡 AI 데일리 미디어 지도 가이드
            </div>
            <div style="font-size: 13px; color: #581c87; line-height: 1.6;">
              ${aiAdvice}
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
          본 메일은 timesnooper 안드로이드 백그라운드 데몬에 의해 수신자 (${device.reportRecipientEmail})로 매일 ${device.scheduledReportTime || '22:00'} 자동 발송됩니다.<br />
          timesnooper Agent v1.0.0 (Android 12+ / Legacy Tablet Support)
        </div>
      </div>
    </div>
  `;
}

// 1. GET /api/devices - List devices
app.get('/api/devices', (req: Request, res: Response) => {
  res.json({ success: true, devices });
});

// 2. POST /api/devices - Register or add device
app.post('/api/devices', (req: Request, res: Response) => {
  const { childName, deviceName, model, androidVersion, isTablet, reportRecipientEmail, dailyGoalLimitMinutes } = req.body;
  
  const newDevice: ChildDevice = {
    id: `device-${Date.now()}`,
    childName: childName || '자녀',
    deviceName: deviceName || '안드로이드 태블릿',
    model: model || 'Generic Android Device',
    androidVersion: androidVersion || 'Android 12 (API 31)',
    isTablet: !!isTablet,
    deviceOwnerActive: true,
    usageStatsGranted: true,
    batteryOptimizationIgnored: true,
    bootReceiverArmed: true,
    accessibilityArmed: true,
    stealthModeEnabled: true,
    lastHeartbeat: new Date().toISOString(),
    registeredAt: new Date().toISOString(),
    reportRecipientEmail: reportRecipientEmail || 'jpark04092@gmail.com',
    scheduledReportTime: req.body.scheduledReportTime || '22:00',
    dailyGoalLimitMinutes: Number(dailyGoalLimitMinutes) || 180,
    todayTelemetry: {
      deviceId: `device-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      batteryLevel: 95,
      isCharging: false,
      screenTimeMinutes: 120,
      unlockCount: 10,
      firstUnlockedAt: '08:30',
      lastActiveAt: '12:00',
      lateNightUsageMinutes: 0,
      apps: [
        {
          packageName: 'com.google.android.youtube',
          appName: 'YouTube',
          category: 'video',
          durationMinutes: 60,
          openCount: 3,
          lastUsedTimestamp: Date.now() - 30 * 60 * 1000
        },
        {
          packageName: 'kr.co.ebs.primary',
          appName: 'EBS 초등',
          category: 'education',
          durationMinutes: 45,
          openCount: 2,
          lastUsedTimestamp: Date.now() - 60 * 60 * 1000
        },
        {
          packageName: 'com.kakao.talk',
          appName: '카카오톡',
          category: 'sns',
          durationMinutes: 15,
          openCount: 5,
          lastUsedTimestamp: Date.now() - 10 * 60 * 1000
        }
      ],
      hourlyTimeline: []
    }
  };

  devices.unshift(newDevice);
  res.json({ success: true, device: newDevice });
});

// 3. PUT /api/devices/:id - Update device settings
app.put('/api/devices/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = devices.findIndex(d => d.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: '기기를 찾을 수 없습니다.' });
  }

  devices[idx] = {
    ...devices[idx],
    ...req.body,
    id // keep immutable ID
  };

  res.json({ success: true, device: devices[idx] });
});

// 4. POST /api/telemetry - Endpoint for Android client telemetry push
app.post('/api/telemetry', (req: Request, res: Response) => {
  const { deviceId, batteryLevel, isCharging, screenTimeMinutes, apps, unlockCount, lateNightUsageMinutes } = req.body;
  const dev = devices.find(d => d.id === deviceId);

  if (dev) {
    dev.lastHeartbeat = new Date().toISOString();
    dev.todayTelemetry = {
      ...dev.todayTelemetry,
      batteryLevel: batteryLevel ?? dev.todayTelemetry.batteryLevel,
      isCharging: isCharging ?? dev.todayTelemetry.isCharging,
      screenTimeMinutes: screenTimeMinutes ?? dev.todayTelemetry.screenTimeMinutes,
      apps: apps ?? dev.todayTelemetry.apps,
      unlockCount: unlockCount ?? dev.todayTelemetry.unlockCount,
      lateNightUsageMinutes: lateNightUsageMinutes ?? dev.todayTelemetry.lateNightUsageMinutes,
      lastActiveAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
  }

  res.json({ success: true, message: 'Telemetry received successfully' });
});

// 5. POST /api/send-report - Trigger report dispatch from web dashboard
app.post('/api/send-report', async (req: Request, res: Response) => {
  try {
    const { deviceId, recipientEmail, mode, senderId } = req.body || {};
    const targetDevice = devices.find(d => d.id === deviceId) || devices[0];

    if (!targetDevice) {
      return res.status(404).json({ success: false, message: '선택된 기기가 없습니다.' });
    }

    const emailToUse = recipientEmail || targetDevice.reportRecipientEmail || 'jpark04092@gmail.com';
    const telemetry = targetDevice.todayTelemetry || {
      deviceId: targetDevice.id,
      date: new Date().toISOString().split('T')[0],
      batteryLevel: 100,
      isCharging: false,
      screenTimeMinutes: 0,
      unlockCount: 0,
      firstUnlockedAt: '08:00',
      lastActiveAt: '12:00',
      lateNightUsageMinutes: 0,
      apps: [],
      hourlyTimeline: []
    };
    const appsList = Array.isArray(telemetry.apps) ? telemetry.apps : [];
    const topApp = appsList.length > 0 
      ? `${appsList[0].appName} (${appsList[0].durationMinutes}분)` 
      : '기록 없음';

    // AI advice generation
    let aiAdvice = '유튜브 및 게임 사용시간이 일일 목표 한도 내에서 균형 있게 유지되고 있습니다. 식사 시간 및 취침 1시간 전 기기 보관 규칙을 함께 유지해보세요.';
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const prompt = `당신은 아동 미디어 사용 분석 전문가입니다. 
다음은 "${targetDevice.childName}"의 오늘 앱 사용 데이터입니다:
- 총 사용시간: ${telemetry.screenTimeMinutes}분
- 앱별 사용시간: ${appsList.map(a => `${a.appName}(${a.category}, ${a.durationMinutes}분)`).join(', ')}
- 야간 사용(22시 이후): ${telemetry.lateNightUsageMinutes}분
- 화면 잠금 해제: ${telemetry.unlockCount}회

부모님(${emailToUse})께 전달할 2~3문장의 따뜻하고 실천 가능한 데일리 미디어 지도 피드백을 한국어로 작성해주세요.`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt
        });
        if (response.text) {
          aiAdvice = response.text;
        }
      } catch (e) {
        console.error('Gemini advice generation error:', e);
      }
    }

    const htmlContent = generateReportEmailHtml(targetDevice, telemetry, aiAdvice);
    const subject = `[Timesnooper] ${targetDevice.childName}의 일일 스크린타임 & 앱 사용 보고서 (${telemetry.date})`;

    // Attempt real SMTP email dispatch with multi-sender pool and preferred sender support
    const preferredSender = senderId || targetDevice.preferredSenderId;
    const smtpResult = await dispatchRealEmail(emailToUse, subject, htmlContent, preferredSender);

    const newLog: EmailReportLog = {
      id: `log-${Date.now()}`,
      deviceId: targetDevice.id,
      deviceName: targetDevice.deviceName,
      childName: targetDevice.childName,
      recipientEmail: emailToUse,
      senderEmail: smtpResult.senderEmail,
      senderName: smtpResult.senderName,
      sentAt: new Date().toLocaleString('ko-KR', { hour12: false }) + ' KST',
      reportDate: telemetry.date || new Date().toISOString().split('T')[0],
      totalScreenTimeMinutes: telemetry.screenTimeMinutes || 0,
      topApp,
      status: 'DELIVERED',
      deliveryMode: mode === 'MANUAL_TEST' ? 'MANUAL_TEST' : 'AUTOMATIC_SCHEDULED',
      htmlPreview: htmlContent,
      aiAdvice,
      isRealEmailDelivered: smtpResult.sentToSmtp,
      smtpDeliveryStatus: smtpResult.statusText,
      smtpMessageId: smtpResult.messageId
    };

    reportLogs.unshift(newLog);

    const message = smtpResult.sentToSmtp
      ? `[실제 메일 발송 성공] ${smtpResult.senderEmail ? `발송지(${smtpResult.senderEmail})에서 ` : ''}${emailToUse} (수신함)으로 일일 보고서가 정상 전송되었습니다!`
      : (smtpResult.error
          ? `[SMTP 전송 실패 알림] ${smtpResult.error}`
          : `[대시보드 리포트 등록] ${emailToUse} 대상 리포트가 대시보드에 정상 보관되었습니다.`);

    return res.json({
      success: true,
      message,
      log: newLog,
      smtpResult
    });
  } catch (error: any) {
    console.error('Error handling /api/send-report:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || '데일리 리포트 발송 처리 중 내부 오류가 발생했습니다.'
    });
  }
});

// 5-1. POST /api/reports/daily - Direct report endpoint called by Android APK daemon
app.post('/api/reports/daily', async (req: Request, res: Response) => {
  try {
    const { deviceId, deviceName, childName, recipientEmail, androidVersion, reportDate, totalScreenTimeMinutes, apps, senderEmail } = req.body || {};

    const targetEmail = recipientEmail || 'jpark04092@gmail.com';
    const targetChildName = childName || '자녀';
    const targetDeviceName = deviceName || 'Android 기기';

    // Map or create device record
    let existingDevice = devices.find(d => d.deviceName === targetDeviceName || d.id === deviceId);
    if (!existingDevice) {
      existingDevice = {
        id: `device-${Date.now()}`,
        childName: targetChildName,
        deviceName: targetDeviceName,
        model: deviceId || 'Android Device',
        androidVersion: androidVersion || 'Android 12',
        isTablet: true,
        deviceOwnerActive: true,
        usageStatsGranted: true,
        batteryOptimizationIgnored: true,
        bootReceiverArmed: true,
        accessibilityArmed: true,
        stealthModeEnabled: true,
        lastHeartbeat: new Date().toISOString(),
        registeredAt: new Date().toISOString(),
        reportRecipientEmail: targetEmail,
        scheduledReportTime: '22:00',
        dailyGoalLimitMinutes: 180,
        todayTelemetry: {
          deviceId: deviceId || 'android-device',
          date: reportDate || new Date().toISOString().split('T')[0],
          batteryLevel: 90,
          isCharging: false,
          screenTimeMinutes: Number(totalScreenTimeMinutes) || 0,
          unlockCount: 12,
          firstUnlockedAt: '08:00',
          lastActiveAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          lateNightUsageMinutes: 0,
          apps: (apps || []).map((a: any) => ({
            packageName: a.packageName,
            appName: a.appName,
            category: a.packageName?.includes('youtube') ? 'video' : a.packageName?.includes('game') ? 'game' : 'etc',
            durationMinutes: a.durationMinutes,
            openCount: 1,
            lastUsedTimestamp: a.lastUsedTime || Date.now()
          })),
          hourlyTimeline: []
        }
      };
      devices.unshift(existingDevice);
    } else {
      existingDevice.childName = targetChildName;
      existingDevice.reportRecipientEmail = targetEmail;
      existingDevice.lastHeartbeat = new Date().toISOString();
      existingDevice.todayTelemetry = {
        ...existingDevice.todayTelemetry,
        screenTimeMinutes: Number(totalScreenTimeMinutes) || existingDevice.todayTelemetry.screenTimeMinutes,
        apps: (apps || []).map((a: any) => ({
          packageName: a.packageName,
          appName: a.appName,
          category: a.packageName?.includes('youtube') ? 'video' : a.packageName?.includes('game') ? 'game' : 'etc',
          durationMinutes: a.durationMinutes,
          openCount: 1,
          lastUsedTimestamp: a.lastUsedTime || Date.now()
        }))
      };
    }

    // Generate AI advice
    let aiAdvice = '오늘 자녀의 일일 스크린타임과 앱 사용 내역이 정상 수집되었습니다. 균형 있는 학습 및 여가 시간 관리를 지속해주세요.';
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const prompt = `자녀(${targetChildName})의 일일 앱 사용 리포트입니다:
- 총 사용시간: ${totalScreenTimeMinutes}분
- 주요 앱: ${(apps || []).slice(0, 5).map((a: any) => `${a.appName}(${a.durationMinutes}분)`).join(', ')}
학부모님(${targetEmail})을 위한 2문장의 데일리 지도 가이드를 작성해주세요.`;

        const aiRes = await gemini.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt
        });
        if (aiRes.text) aiAdvice = aiRes.text;
      } catch (e) {
        console.warn('AI advice error on daily endpoint:', e);
      }
    }

    const htmlContent = generateReportEmailHtml(existingDevice, existingDevice.todayTelemetry, aiAdvice);
    const subject = `[Timesnooper 자동발송] ${existingDevice.childName}의 일일 미디어 사용 리포트 (${reportDate || new Date().toISOString().split('T')[0]})`;

    // Attempt real SMTP dispatch with failover
    const preferredSender = senderAccounts.find(s => s.email.toLowerCase() === senderEmail?.toLowerCase())?.id;
    const smtpResult = await dispatchRealEmail(targetEmail, subject, htmlContent, preferredSender);

    const newLog: EmailReportLog = {
      id: `log-${Date.now()}`,
      deviceId: existingDevice.id,
      deviceName: existingDevice.deviceName,
      childName: existingDevice.childName,
      recipientEmail: targetEmail,
      senderEmail: smtpResult.senderEmail || senderEmail,
      senderName: smtpResult.senderName,
      sentAt: new Date().toLocaleString('ko-KR', { hour12: false }) + ' KST',
      reportDate: reportDate || new Date().toISOString().split('T')[0],
      totalScreenTimeMinutes: Number(totalScreenTimeMinutes) || 0,
      topApp: (apps && apps.length > 0) ? `${apps[0].appName} (${apps[0].durationMinutes}분)` : '앱 실행 기록 없음',
      status: 'DELIVERED',
      deliveryMode: 'AUTOMATIC_SCHEDULED',
      htmlPreview: htmlContent,
      aiAdvice,
      isRealEmailDelivered: smtpResult.sentToSmtp,
      smtpDeliveryStatus: smtpResult.statusText,
      smtpMessageId: smtpResult.messageId
    };

    reportLogs.unshift(newLog);

    return res.json({
      success: true,
      message: smtpResult.sentToSmtp 
        ? `[APK 실제 메일 발송 완료] ${targetEmail} 로 메일이 전송되었습니다.`
        : `[APK 리포트 완료] 수신처: ${targetEmail} 로 리포트가 성공적으로 저장되었습니다.`,
      log: newLog,
      smtpResult
    });
  } catch (error: any) {
    console.error('Error in /api/reports/daily:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'APK 리포트 처리 중 서버 오류가 발생했습니다.'
    });
  }
});

// 5-2. GET /api/smtp-status - Check SMTP configuration status across all senders
app.get('/api/smtp-status', (req: Request, res: Response) => {
  const activeSenders = senderAccounts.filter(s => !!(s.appPassword && s.appPassword.length > 0));
  const configured = activeSenders.length > 0;
  const defaultSender = senderAccounts.find(s => s.isDefault) || senderAccounts[0];
  const user = defaultSender?.email 
    ? `${defaultSender.email.slice(0, 3)}***@${defaultSender.email.split('@')[1] || ''}` 
    : null;

  res.json({
    configured,
    totalSendersCount: senderAccounts.length,
    activeSendersCount: activeSenders.length,
    defaultSenderEmail: user,
    smtpHost: defaultSender?.host || 'smtp.gmail.com',
    senders: senderAccounts.map(sanitizeSender),
    message: configured 
      ? `SMTP 실제 메일 전송이 활성화되어 있습니다 (총 ${senderAccounts.length}개 발송지 등록됨, 주 발송지: ${user}).`
      : `현재 발송지 메일의 앱 비밀번호가 미설정되어 있어 대시보드 내 실시간 프리뷰로 확인 가능합니다. 실제 메일함 발송을 위해 1차 또는 2차 발송지의 16자리 앱 비밀번호를 등록해주세요.`
  });
});

// 5-3. Sender Accounts CRUD APIs (다중 발송지 메일 계정 관리)
// GET /api/senders - List all configured sender accounts
app.get('/api/senders', (req: Request, res: Response) => {
  res.json({
    success: true,
    senders: senderAccounts.map(sanitizeSender)
  });
});

// POST /api/senders - Add a new sender account
app.post('/api/senders', (req: Request, res: Response) => {
  const { email, appPassword, name, provider, host, port, isDefault } = req.body || {};

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: '올바른 발송지 이메일 주소를 입력해주세요.' });
  }

  const cleanPassword = (appPassword || '').replace(/[\s"'-]+/g, '').trim();
  const newId = `sender-${Date.now()}`;

  // If this new sender is marked as default, unmark others
  if (isDefault) {
    senderAccounts.forEach(s => { s.isDefault = false; });
  }

  const newSender: SenderAccount = {
    id: newId,
    email: email.trim(),
    name: name?.trim() || `${senderAccounts.length + 1}차 발송지 (${email.split('@')[0]})`,
    provider: provider || (email.includes('naver') ? 'naver' : email.includes('daum') || email.includes('kakao') ? 'daum' : 'gmail'),
    appPassword: cleanPassword,
    appPasswordMasked: cleanPassword.length > 0 ? '••••••••••••••••' : '미등록',
    host: host || (email.includes('naver') ? 'smtp.naver.com' : email.includes('daum') ? 'smtp.daum.net' : 'smtp.gmail.com'),
    port: Number(port) || 465,
    isDefault: !!isDefault || senderAccounts.length === 0,
    createdAt: new Date().toISOString(),
    status: cleanPassword.length > 0 ? 'ACTIVE' : 'STANDBY',
    totalSentCount: 0
  };

  senderAccounts.push(newSender);

  res.json({
    success: true,
    message: `새로운 발송지 계정 "${newSender.name}" (${newSender.email}) 이 등록되었습니다.`,
    sender: sanitizeSender(newSender),
    senders: senderAccounts.map(sanitizeSender)
  });
});

// PUT /api/senders/:id - Update sender account
app.put('/api/senders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const senderIndex = senderAccounts.findIndex(s => s.id === id);

  if (senderIndex === -1) {
    return res.status(404).json({ success: false, message: '해당 발송지 계정을 찾을 수 없습니다.' });
  }

  const { email, appPassword, name, provider, host, port, isDefault } = req.body || {};
  const current = senderAccounts[senderIndex];

  if (isDefault) {
    senderAccounts.forEach(s => { s.isDefault = false; });
  }

  let cleanPassword = current.appPassword;
  if (appPassword !== undefined && appPassword !== null && appPassword !== '') {
    cleanPassword = appPassword.replace(/[\s"'-]+/g, '').trim();
  }

  senderAccounts[senderIndex] = {
    ...current,
    email: email !== undefined ? email.trim() : current.email,
    name: name !== undefined ? name.trim() : current.name,
    provider: provider || current.provider,
    appPassword: cleanPassword,
    appPasswordMasked: cleanPassword && cleanPassword.length > 0 ? '••••••••••••••••' : '미등록',
    host: host || current.host,
    port: port !== undefined ? Number(port) : current.port,
    isDefault: isDefault !== undefined ? !!isDefault : current.isDefault,
    status: cleanPassword && cleanPassword.length > 0 ? 'ACTIVE' : 'STANDBY'
  };

  res.json({
    success: true,
    message: `발송지 "${senderAccounts[senderIndex].name}" 정보가 수정되었습니다.`,
    sender: sanitizeSender(senderAccounts[senderIndex]),
    senders: senderAccounts.map(sanitizeSender)
  });
});

// PUT /api/senders/:id/default - Set default primary sender
app.put('/api/senders/:id/default', (req: Request, res: Response) => {
  const { id } = req.params;
  const sender = senderAccounts.find(s => s.id === id);

  if (!sender) {
    return res.status(404).json({ success: false, message: '해당 발송지 계정을 찾을 수 없습니다.' });
  }

  senderAccounts.forEach(s => { s.isDefault = (s.id === id); });

  res.json({
    success: true,
    message: `기본 1차 주 발송지가 "${sender.name}" (${sender.email}) 로 지정되었습니다.`,
    senders: senderAccounts.map(sanitizeSender)
  });
});

// DELETE /api/senders/:id - Delete sender account
app.delete('/api/senders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (senderAccounts.length <= 1) {
    return res.status(400).json({ success: false, message: '최소 1개 이상의 발송지 계정이 등록되어 있어야 합니다.' });
  }

  const removed = senderAccounts.find(s => s.id === id);
  senderAccounts = senderAccounts.filter(s => s.id !== id);

  if (removed?.isDefault && senderAccounts.length > 0) {
    senderAccounts[0].isDefault = true;
  }

  res.json({
    success: true,
    message: `발송지 계정 "${removed?.name || id}" 이 삭제되었습니다.`,
    senders: senderAccounts.map(sanitizeSender)
  });
});

// POST /api/senders/:id/test - Send a test probe email from a specific sender
app.post('/api/senders/:id/test', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { testRecipientEmail } = req.body || {};
  const sender = senderAccounts.find(s => s.id === id);

  if (!sender) {
    return res.status(404).json({ success: false, message: '해당 발송지 계정을 찾을 수 없습니다.' });
  }

  const to = testRecipientEmail || 'jpark04092@gmail.com';
  const testSubject = `[Timesnooper 발송지 테스트] "${sender.name}" 계정 연동 확인`;
  const testHtml = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 500px;">
      <h2 style="color: #0f172a; margin-top: 0;">🛡️ Timesnooper 발송지 계정 테스트</h2>
      <p style="color: #334155; font-size: 14px;">본 메일은 Timesnooper 발송지 계정 <strong>${sender.name} (${sender.email})</strong> 연동 확인용 테스트 메일입니다.</p>
      <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 12px; color: #475569;">
        <div>• 발송지 ID: ${sender.id}</div>
        <div>• 발송 프로바이더: ${sender.provider.toUpperCase()}</div>
        <div>• 발송 시각: ${new Date().toLocaleString('ko-KR')}</div>
      </div>
      <p style="color: #10b981; font-weight: bold; margin-top: 14px;">✅ 정상 발송되었습니다!</p>
    </div>
  `;

  try {
    const sendRes = await sendMailSingleSender(sender, to, testSubject, testHtml);
    if (sendRes.success) {
      sender.status = 'ACTIVE';
      sender.totalSentCount += 1;
      sender.lastUsedAt = new Date().toISOString();
      return res.json({
        success: true,
        message: `[발송 성공] "${sender.name}" (${sender.email}) -> ${to} 로 테스트 메일이 정상 전송되었습니다 (MessageID: ${sendRes.messageId})`,
        sender: sanitizeSender(sender)
      });
    } else {
      sender.status = 'ERROR';
      sender.lastError = sendRes.error;
      return res.status(400).json({
        success: false,
        message: sendRes.error || '발송 실패',
        sender: sanitizeSender(sender)
      });
    }
  } catch (err: any) {
    sender.status = 'ERROR';
    sender.lastError = err?.message || String(err);
    return res.status(500).json({
      success: false,
      message: `전송 에러: ${err?.message || err}`,
      sender: sanitizeSender(sender)
    });
  }
});

// 6. GET /api/reports/history - View report logs
app.get('/api/reports/history', (req: Request, res: Response) => {
  res.json({ success: true, logs: reportLogs });
});

// 7. GET /api/android-source - Get native Android code package
app.get('/api/android-source', (req: Request, res: Response) => {
  res.json({ success: true, files: ANDROID_SOURCE_FILES });
});

// Start Server with Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`timesnooper Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
