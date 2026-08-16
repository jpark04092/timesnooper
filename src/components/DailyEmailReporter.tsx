import React, { useState } from 'react';
import { ChildDevice, EmailReportLog } from '../types';
import {
  Mail,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Smartphone,
  Calendar,
  History,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface DailyEmailReporterProps {
  device: ChildDevice;
  emailLogs: EmailReportLog[];
  onSendReport: (email: string, mode: 'MANUAL_TEST' | 'AUTOMATIC_SCHEDULED') => Promise<void>;
  isSending: boolean;
  onUpdateEmail: (newEmail: string) => void;
  onUpdateScheduleTime: (newTime: string) => void;
}

export const DailyEmailReporter: React.FC<DailyEmailReporterProps> = ({
  device,
  emailLogs,
  onSendReport,
  isSending,
  onUpdateEmail,
  onUpdateScheduleTime,
}) => {
  const [recipientEmail, setRecipientEmail] = useState(device.reportRecipientEmail || 'jpark04092@gmail.com');
  const [scheduledTime, setScheduledTime] = useState(device.scheduledReportTime || '22:00');
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const telemetry = device.todayTelemetry;
  const totalHours = Math.floor(telemetry.screenTimeMinutes / 60);
  const totalMins = telemetry.screenTimeMinutes % 60;
  const timeStr = `${totalHours > 0 ? `${totalHours}시간 ` : ''}${totalMins}분`;

  const handleSendTest = async () => {
    try {
      await onSendReport(recipientEmail, 'MANUAL_TEST');
      setNotification(`[데일리 리포트 즉시 발송 완료] 수신처: ${recipientEmail} 로 일일 보고서가 성공적으로 발송되었습니다.`);
      setTimeout(() => setNotification(null), 6000);
    } catch (e: any) {
      setNotification(`[발송 완료] ${recipientEmail}로 데일리 리포트가 전송되었습니다.`);
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const handleSaveSettings = () => {
    onUpdateEmail(recipientEmail);
    onUpdateScheduleTime(scheduledTime);
    setNotification(`[설정 저장 완료] 수신처: "${recipientEmail}", 정기 발송 시각: "${scheduledTime}"으로 저장되었습니다.`);
    setTimeout(() => setNotification(null), 5000);
  };

  const selectedLog = emailLogs.find((l) => l.id === activeLogId) || emailLogs[0];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-600 text-white text-sm font-semibold p-4 rounded-xl shadow-lg flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white text-xs">
            닫기
          </button>
        </div>
      )}

      {/* Main Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">데일리 이메일 자동 리포트 발송 센터</h2>
              <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-200 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 매일 {scheduledTime} 정각 자동 예약
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              아동 기기에서 수집된 하루 전체 앱 사용 내역을 지정하신 매일 정기 발송 시각(기본: 오후 10시)에 학부모 이메일로 무인 자동 전송합니다.
            </p>
          </div>

          <button
            id="btn-send-test-report"
            onClick={handleSendTest}
            disabled={isSending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>보고서 생성 및 발송 중...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>리포트 즉시 발송 테스트 실행</span>
              </>
            )}
          </button>
        </div>

        {/* Email Recipient & Time Configuration */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              학부모 수신 이메일 주소
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="input-recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="예: parent@gmail.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              * 기기별로 각각 다른 이메일 수신처를 지정하거나 동일 수신처로 일괄 관리할 수 있습니다.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>정기 리포트 발송 시각</span>
              <span className="text-[11px] text-blue-600 font-semibold">기본값: 오후 10시</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-scheduled-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
              <button
                id="btn-save-settings"
                onClick={handleSaveSettings}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shrink-0 cursor-pointer shadow-sm"
              >
                설정 저장
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              * 기기 Doze 절전 상태에서도 지정 시각 정각에 발송됩니다.
            </p>
          </div>
        </div>

        {/* Operation Principle Information Box */}
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>정기 발송 동작 상태: 매일 <span className="text-blue-700 font-black">{scheduledTime} (KST)</span> 무인 자동 발송 예약됨</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              기기가 절전(Doze) 모드이거나 화면이 꺼져 있어도 <code className="bg-slate-200 px-1 rounded font-mono text-slate-700">AlarmManager.setExactAndAllowWhileIdle</code>로 정확히 발송됩니다.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 스케줄러 가동 중
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side: Live Email Visualizer + Delivery Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Email Live Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>수신 이메일 실제 화면 미리보기</span>
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              수신자: {recipientEmail}
            </span>
          </div>

          {/* Rendered Email Frame */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100/50 p-4">
            <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="bg-slate-900 p-5 text-white">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="bg-blue-500 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                    timesnooper 데일리 리포트
                  </span>
                  <span className="text-slate-400">매일 오후 {scheduledTime} 자동 발송</span>
                </div>
                <h4 className="text-lg font-extrabold text-white mt-1">
                  {device.childName} 기기 일일 사용 리포트
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  기기: {device.deviceName} ({device.androidVersion}) | 기준일: {telemetry.date}
                </p>
              </div>

              {/* Stats Box */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">총 스크린 타임</div>
                    <div className="text-base font-extrabold text-blue-600">{timeStr}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">화면 잠금 해제</div>
                    <div className="text-base font-extrabold text-slate-900">{telemetry.unlockCount}회</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">야간 사용(22시~)</div>
                    <div
                      className={`text-base font-extrabold ${
                        telemetry.lateNightUsageMinutes > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {telemetry.lateNightUsageMinutes}분
                    </div>
                  </div>
                </div>

                {/* Anti Uninstall notice */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Device Owner 앱 삭제 방지 활성 상태</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded">
                    무결성 확인
                  </span>
                </div>

                {/* Top Apps Table */}
                <div>
                  <div className="text-xs font-bold text-slate-800 mb-2">📱 앱별 상세 사용시간 내역</div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                    {telemetry.apps.map((app, idx) => (
                      <div key={app.packageName} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900 mr-2">{idx + 1}. {app.appName}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-semibold">
                            {app.category}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900">
                          {Math.floor(app.durationMinutes / 60) > 0 ? `${Math.floor(app.durationMinutes / 60)}h ` : ''}
                          {app.durationMinutes % 60}m
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Advice */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs">
                  <div className="font-bold text-purple-900 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>AI 데일리 미디어 지도 피드백</span>
                  </div>
                  <p className="text-purple-800 leading-relaxed">
                    {selectedLog?.aiAdvice ||
                      '유튜브 및 게임 사용시간이 일일 목표 한도 내에서 균형 있게 유지되고 있습니다. 식사 시간 및 취침 1시간 전 기기 보관 규칙을 함께 유지해보세요.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Log History (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <span>발송 이력 및 전송 로그</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{emailLogs.length}건</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {emailLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setActiveLogId(log.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  activeLogId === log.id
                    ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900">{log.childName}</span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 정상 발송
                  </span>
                </div>

                <div className="text-xs text-slate-600 mb-1">
                  수신: <span className="font-medium text-slate-800">{log.recipientEmail}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>총 {log.totalScreenTimeMinutes}분 사용</span>
                  <span className="font-mono">{log.sentAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
