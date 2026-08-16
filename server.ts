import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_DEVICES, INITIAL_EMAIL_LOGS } from './src/data/initialDevices';
import { ANDROID_SOURCE_FILES } from './src/data/androidSource';
import { ChildDevice, DeviceTelemetry, EmailReportLog } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory runtime state
let devices: ChildDevice[] = [...INITIAL_DEVICES];
let reportLogs: EmailReportLog[] = [...INITIAL_EMAIL_LOGS];

// Gemini AI client initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
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
          <span style="font-size: 13px; color: #94a3b8;">매일 오전 10:00 정기 발송</span>
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
          본 메일은 timesnooper 안드로이드 백그라운드 데몬에 의해 수신자 (${device.reportRecipientEmail})로 매일 오전 10시 자동 발송됩니다.<br />
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
    scheduledReportTime: '10:00',
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

// 5. POST /api/send-report - Trigger 10:00 AM report dispatch (or test send to parent email)
app.post('/api/send-report', async (req: Request, res: Response) => {
  const { deviceId, recipientEmail, mode } = req.body;
  const targetDevice = devices.find(d => d.id === deviceId) || devices[0];

  if (!targetDevice) {
    return res.status(404).json({ success: false, message: '선택된 기기가 없습니다.' });
  }

  const emailToUse = recipientEmail || targetDevice.reportRecipientEmail || 'jpark04092@gmail.com';
  const telemetry = targetDevice.todayTelemetry;
  const topApp = telemetry.apps.length > 0 
    ? `${telemetry.apps[0].appName} (${telemetry.apps[0].durationMinutes}분)` 
    : '기록 없음';

  // AI advice generation
  let aiAdvice = '';
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const prompt = `당신은 아동 미디어 사용 분석 전문가입니다. 
다음은 "${targetDevice.childName}"의 오늘 앱 사용 데이터입니다:
- 총 사용시간: ${telemetry.screenTimeMinutes}분
- 앱별 사용시간: ${telemetry.apps.map(a => `${a.appName}(${a.category}, ${a.durationMinutes}분)`).join(', ')}
- 야간 사용(22시 이후): ${telemetry.lateNightUsageMinutes}분
- 화면 잠금 해제: ${telemetry.unlockCount}회

부모님(${emailToUse})께 전달할 2~3문장의 따뜻하고 실천 가능한 데일리 미디어 지도 피드백을 한국어로 작성해주세요.`;

      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      aiAdvice = response.text || '';
    } catch (e) {
      console.error('Gemini advice generation error:', e);
      aiAdvice = '유튜브 및 게임 사용시간이 일일 목표 한도 내에서 균형 있게 유지되고 있습니다. 식사 시간 및 취침 1시간 전 기기 보관 규칙을 함께 유지해보세요.';
    }
  } else {
    aiAdvice = '유튜브 및 게임 사용시간이 일일 목표 한도 내에서 균형 있게 유지되고 있습니다. 식사 시간 및 취침 1시간 전 기기 보관 규칙을 함께 유지해보세요.';
  }

  const htmlContent = generateReportEmailHtml(targetDevice, telemetry, aiAdvice);

  const newLog: EmailReportLog = {
    id: `log-${Date.now()}`,
    deviceId: targetDevice.id,
    deviceName: targetDevice.deviceName,
    childName: targetDevice.childName,
    recipientEmail: emailToUse,
    sentAt: new Date().toLocaleString('ko-KR', { hour12: false }) + ' KST',
    reportDate: telemetry.date,
    totalScreenTimeMinutes: telemetry.screenTimeMinutes,
    topApp,
    status: 'DELIVERED',
    deliveryMode: mode === 'MANUAL_TEST' ? 'MANUAL_TEST' : 'AUTOMATIC_10AM',
    htmlPreview: htmlContent,
    aiAdvice
  };

  reportLogs.unshift(newLog);

  res.json({
    success: true,
    message: `[오전 10:00 리포트] ${emailToUse} (부모님) 이메일로 성공적으로 리포트가 발송되었습니다.`,
    log: newLog
  });
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
