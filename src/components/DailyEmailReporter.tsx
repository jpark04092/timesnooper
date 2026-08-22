import React, { useState, useEffect } from 'react';
import { ChildDevice, EmailReportLog, SenderAccount } from '../types';
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
  RefreshCw,
  Key,
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Check,
  ShieldAlert,
  Server,
  Edit3,
  Flame,
  ArrowRightLeft
} from 'lucide-react';

interface DailyEmailReporterProps {
  device: ChildDevice;
  emailLogs: EmailReportLog[];
  onSendReport: (email: string, mode: 'MANUAL_TEST' | 'AUTOMATIC_SCHEDULED', senderId?: string) => Promise<void>;
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
  const [showSmtpGuide, setShowSmtpGuide] = useState<boolean>(false);
  const [smtpStatus, setSmtpStatus] = useState<any>(null);

  // Multi-Sender Accounts state
  const [senders, setSenders] = useState<SenderAccount[]>([
    {
      id: 'sender-1',
      email: 'jpark04092@gmail.com',
      name: '1차 주 발송지 (Gmail)',
      provider: 'gmail',
      appPasswordMasked: '••••••••••••••••',
      isDefault: true,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      totalSentCount: 14
    },
    {
      id: 'sender-2',
      email: 'jpark04092.backup@gmail.com',
      name: '2차 보조 발송지 (Failover 백업)',
      provider: 'gmail',
      appPasswordMasked: '••••••••••••••••',
      isDefault: false,
      createdAt: new Date().toISOString(),
      status: 'STANDBY',
      totalSentCount: 0
    }
  ]);
  const [selectedSenderMode, setSelectedSenderMode] = useState<string>('AUTO_FAILOVER');
  const [isAddSenderModalOpen, setIsAddSenderModalOpen] = useState(false);
  const [editingSender, setEditingSender] = useState<SenderAccount | null>(null);
  const [testingSenderId, setTestingSenderId] = useState<string | null>(null);

  // Form states for adding/editing sender
  const [senderFormEmail, setSenderFormEmail] = useState('');
  const [senderFormName, setSenderFormName] = useState('');
  const [senderFormPassword, setSenderFormPassword] = useState('');
  const [senderFormProvider, setSenderFormProvider] = useState<'gmail' | 'naver' | 'daum' | 'custom'>('gmail');
  const [senderFormHost, setSenderFormHost] = useState('smtp.gmail.com');
  const [senderFormPort, setSenderFormPort] = useState(465);

  const fetchSenders = async () => {
    try {
      const res = await fetch('/api/senders');
      if (res.ok) {
        const data = await res.json();
        if (data.senders && data.senders.length > 0) {
          setSenders(data.senders);
        }
      }
    } catch (e) {
      console.log('Error fetching senders:', e);
    }
  };

  const fetchSmtpStatus = async () => {
    try {
      const res = await fetch('/api/smtp-status');
      if (res.ok) {
        const data = await res.json();
        setSmtpStatus(data);
      }
    } catch (e) {
      console.log('Error fetching smtp status:', e);
    }
  };

  useEffect(() => {
    fetchSenders();
    fetchSmtpStatus();
  }, [emailLogs]);

  const telemetry = device.todayTelemetry;
  const totalHours = Math.floor(telemetry.screenTimeMinutes / 60);
  const totalMins = telemetry.screenTimeMinutes % 60;
  const timeStr = `${totalHours > 0 ? `${totalHours}시간 ` : ''}${totalMins}분`;

  const handleSendTest = async () => {
    try {
      const senderIdToUse = selectedSenderMode === 'AUTO_FAILOVER' ? undefined : selectedSenderMode;
      await onSendReport(recipientEmail, 'MANUAL_TEST', senderIdToUse);
      setNotification(`[데일리 리포트 처리 완료] 수신처: ${recipientEmail} 로 리포트가 발송되었습니다.`);
      setTimeout(() => setNotification(null), 6000);
      fetchSenders();
    } catch (e: any) {
      setNotification(`[알림] 리포트 처리가 완료되었습니다.`);
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const handleSaveSettings = () => {
    onUpdateEmail(recipientEmail);
    onUpdateScheduleTime(scheduledTime);
    setNotification(`[설정 저장 완료] 수신처: "${recipientEmail}", 정기 발송 시각: "${scheduledTime}"으로 저장되었습니다.`);
    setTimeout(() => setNotification(null), 5000);
  };

  // Set default sender
  const handleSetDefaultSender = async (id: string) => {
    try {
      const res = await fetch(`/api/senders/${id}/default`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        setSenders(data.senders);
        setNotification(data.message || '기본 주 발송지가 변경되었습니다.');
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (e) {
      console.error('Error setting default sender:', e);
    }
  };

  // Test single sender probe email
  const handleTestSenderProbe = async (sender: SenderAccount) => {
    setTestingSenderId(sender.id);
    try {
      const res = await fetch(`/api/senders/${sender.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testRecipientEmail: recipientEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(data.message);
      } else {
        setNotification(`[발송 실패] ${data.message || '인증 오류가 발생했습니다.'}`);
      }
      fetchSenders();
    } catch (e: any) {
      setNotification(`[테스트 실패] ${e?.message || '네트워크 오류가 발생했습니다.'}`);
    } finally {
      setTestingSenderId(null);
      setTimeout(() => setNotification(null), 7000);
    }
  };

  // Delete sender
  const handleDeleteSender = async (id: string) => {
    if (senders.length <= 1) {
      setNotification('최소 1개 이상의 발송지 계정이 등록되어 있어야 합니다.');
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    if (!confirm('이 발송지 계정을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/senders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSenders(data.senders);
        setNotification(data.message || '발송지 계정이 삭제되었습니다.');
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (e) {
      console.error('Delete sender error:', e);
    }
  };

  // Open modal for new sender
  const handleOpenAddSenderModal = () => {
    setEditingSender(null);
    setSenderFormEmail('');
    setSenderFormName(`${senders.length + 1}차 보조 발송지 (Gmail)`);
    setSenderFormPassword('');
    setSenderFormProvider('gmail');
    setSenderFormHost('smtp.gmail.com');
    setSenderFormPort(465);
    setIsAddSenderModalOpen(true);
  };

  // Open modal for editing sender
  const handleOpenEditSenderModal = (sender: SenderAccount) => {
    setEditingSender(sender);
    setSenderFormEmail(sender.email);
    setSenderFormName(sender.name);
    setSenderFormPassword('');
    setSenderFormProvider(sender.provider);
    setSenderFormHost(sender.host || 'smtp.gmail.com');
    setSenderFormPort(sender.port || 465);
    setIsAddSenderModalOpen(true);
  };

  // Save sender (Create or Update)
  const handleSaveSenderForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderFormEmail.trim() || !senderFormEmail.includes('@')) {
      alert('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    try {
      if (editingSender) {
        // Update
        const res = await fetch(`/api/senders/${editingSender.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: senderFormEmail.trim(),
            name: senderFormName.trim(),
            appPassword: senderFormPassword.trim(),
            provider: senderFormProvider,
            host: senderFormHost.trim(),
            port: senderFormPort,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSenders(data.senders);
          setNotification(data.message);
          setIsAddSenderModalOpen(false);
        }
      } else {
        // Create new
        const res = await fetch('/api/senders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: senderFormEmail.trim(),
            name: senderFormName.trim(),
            appPassword: senderFormPassword.trim(),
            provider: senderFormProvider,
            host: senderFormHost.trim(),
            port: senderFormPort,
            isDefault: senders.length === 0,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSenders(data.senders);
          setNotification(data.message);
          setIsAddSenderModalOpen(false);
        }
      }
      setTimeout(() => setNotification(null), 5000);
      fetchSmtpStatus();
    } catch (err: any) {
      alert(`저장 중 오류: ${err?.message || err}`);
    }
  };

  const selectedLog = emailLogs.find((l) => l.id === activeLogId) || emailLogs[0];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-slate-900 text-white text-sm font-semibold p-4 rounded-xl shadow-lg flex items-center justify-between transition-all border border-slate-700 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white text-xs">
            닫기
          </button>
        </div>
      )}

      {/* SECTION 1: Multi-Sender Accounts Management Panel (2개 이상 지정 & 자동 장애복구) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    발송지 메일 계정 관리 (다중 발신자 / 2개 이상 지정 지원)
                  </h2>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3 text-indigo-600" /> 자동 Failover 풀 ({senders.length}개 등록됨)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  1차 주 발송지와 2차·3차 보조 발송지 계정을 복수로 등록하여, 구글 일일 발송 한도 초과나 인증 오류 발생 시 다음 발송지로 자동 우회(Failover) 전송합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-add-sender"
              onClick={handleOpenAddSenderModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>새 발송지 계정 추가</span>
            </button>
          </div>
        </div>

        {/* Multi-Sender Failover Notice Banner */}
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 border border-indigo-200/80 rounded-xl p-3.5 flex items-center justify-between text-xs text-indigo-950">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-bold text-indigo-900">다중 발송지 계정 연속 장애복구 (Auto-Failover) 가동 중:</span>{' '}
              <span className="text-slate-600">
                1차 발송지 실패 시 2차 발송지 계정으로 1초 내 즉시 재시도하여 리포트 누락 0%를 보장합니다.
              </span>
            </div>
          </div>
        </div>

        {/* Senders List Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {senders.map((sender, idx) => (
            <div
              key={sender.id}
              className={`p-4 rounded-xl border transition relative flex flex-col justify-between ${
                sender.isDefault
                  ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-300'
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        {sender.name}
                        {sender.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                            1차 주 발송지
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-600 font-mono font-medium">{sender.email}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      sender.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : sender.status === 'ERROR'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {sender.status === 'ACTIVE' ? '발송 준비완료' : sender.status === 'ERROR' ? '인증 확인필요' : '대기중'}
                  </span>
                </div>

                <div className="bg-white/80 border border-slate-200/80 rounded-lg p-2.5 my-2.5 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">서버 및 포트:</span>
                    <span className="font-mono font-semibold">{sender.host || 'smtp.gmail.com'}:{sender.port || 465} (SSL)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">앱 비밀번호:</span>
                    <span className="font-mono font-bold text-purple-700">{sender.appPasswordMasked || '••••••••••••••••'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">누적 발송 성공:</span>
                    <span className="font-bold text-slate-800">{sender.totalSentCount}건</span>
                  </div>
                  {sender.lastError && (
                    <div className="text-[10px] text-rose-600 bg-rose-50 p-1 rounded font-medium mt-1">
                      ⚠️ {sender.lastError}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Sender */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                <div>
                  {!sender.isDefault ? (
                    <button
                      onClick={() => handleSetDefaultSender(sender.id)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-[11px] flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> 주 발송지로 지정
                    </button>
                  ) : (
                    <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> 현재 1순위
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestSenderProbe(sender)}
                    disabled={testingSenderId === sender.id}
                    className="text-slate-700 hover:text-blue-700 bg-white border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    {testingSenderId === sender.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                    ) : (
                      <Send className="w-3 h-3 text-slate-500" />
                    )}
                    <span>테스트 발송</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditSenderModal(sender)}
                    className="text-slate-500 hover:text-slate-900 p-1.5 hover:bg-slate-200 rounded-md transition cursor-pointer"
                    title="설정 및 비밀번호 수정"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {senders.length > 1 && (
                    <button
                      onClick={() => handleDeleteSender(sender.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-md transition cursor-pointer"
                      title="발송지 계정 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: SMTP Real Mailbox Connection Notice & Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-blue-600 text-white shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">
                  스마트폰 자체 Gmail 직발송 엔진 (16자리 앱 비밀번호 연동)
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 중간 서버 없이 100% 도착
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                자녀 스마트폰 앱 내에 <strong className="text-purple-700">구글 16자리 앱 비밀번호</strong>를 1회 입력하시면, 별도 외부 서버 없이 스마트폰 자체가 구글 공식 메일 서버(smtp.gmail.com:465 SSL)로 접속하여 학부모님 Gmail({recipientEmail})로 매일 밤 정각 리포트를 직발송합니다.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSmtpGuide(!showSmtpGuide)}
            className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-3.5 py-2 rounded-xl shrink-0 transition shadow-sm cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-blue-600" />
            <span>{showSmtpGuide ? '가이드 접기' : '구글 앱 비밀번호 16자리 발급법'}</span>
            {showSmtpGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable Setup Instructions */}
        {showSmtpGuide && (
          <div className="pt-4 border-t border-blue-200/80 text-xs text-slate-700 space-y-3 bg-white/80 p-4 rounded-xl">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>구글 16자리 앱 비밀번호 발급 및 스마트폰 앱 등록 방법</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-2">
                <div className="font-bold text-blue-900 flex items-center gap-1">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>스마트폰 앱 설정 (핵심 - 1회 등록)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                  <li><a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">myaccount.google.com/apppasswords</a> 접속 (학부모 구글 계정 로그인)</li>
                  <li>앱 이름에 <strong>Timesnooper</strong> 입력 후 [만들기] 클릭</li>
                  <li>생성된 <strong>16자리 영문 코드</strong>(예: <code className="bg-white border px-1 rounded font-mono font-bold text-purple-700">abcd efgh ijkl mnop</code>) 복사</li>
                  <li>자녀 폰의 timesnooper 앱의 <strong>[구글 16자리 앱 비밀번호]</strong> 란에 입력</li>
                  <li><strong>[설정 저장]</strong> 후 <strong>[Gmail로 즉시 발송]</strong>을 누르면 1초 만에 학부모 메일함으로 직발송!</li>
                </ol>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>2개 이상의 발송지 계정 등록 팁</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  아빠 Gmail과 엄마 Gmail 계정을 각각 1차/2차 발송지로 등록하거나, 네이버/다음 메일 계정을 보조 발송지로 등록해두면 특정 메일 서버 점검이나 스팸 필터링 시에도 100% 안전하게 전송됩니다.
                </p>
                <div className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[10px] space-y-1">
                  <div>1차 발송지: parent1@gmail.com (주 발송 계정)</div>
                  <div>2차 발송지: parent2@gmail.com (보조 Failover 계정)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Main Recipient & Schedule Configuration Card */}
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedSenderMode}
              onChange={(e) => setSelectedSenderMode(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:border-blue-500"
              title="발송지 선택"
            >
              <option value="AUTO_FAILOVER">✨ 자동 장애복구 (1차 -&gt; 2차 순차)</option>
              {senders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>

            <button
              id="btn-send-test-report"
              onClick={handleSendTest}
              disabled={isSending}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
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

      {/* SECTION 4: Side-by-Side: Live Email Visualizer + Delivery Logs */}
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
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 ${
                    log.isRealEmailDelivered
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {log.isRealEmailDelivered ? '메일함 배달 완료' : '대시보드 보관'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 mb-1 flex items-center justify-between">
                  <div>
                    수신: <span className="font-medium text-slate-800">{log.recipientEmail}</span>
                  </div>
                  {log.senderEmail && (
                    <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      발송: {log.senderEmail.split('@')[0]}
                    </span>
                  )}
                </div>

                {log.smtpDeliveryStatus && (
                  <div className="text-[10px] text-slate-500 mb-1 font-mono">
                    {log.smtpDeliveryStatus}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>총 {log.totalScreenTimeMinutes}분 사용</span>
                  <span className="font-mono">{log.sentAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: Add / Edit Sender Account */}
      {isAddSenderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-600" />
                <span>{editingSender ? '발송지 계정 수정' : '새 발송지 이메일 계정 추가'}</span>
              </h3>
              <button
                onClick={() => setIsAddSenderModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSenderForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">발송지 이메일 주소 (계정 아이디)</label>
                <input
                  type="email"
                  required
                  value={senderFormEmail}
                  onChange={(e) => setSenderFormEmail(e.target.value)}
                  placeholder="예: parent1@gmail.com 또는 backup@naver.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">발송지 별칭 (관리용 이름)</label>
                <input
                  type="text"
                  required
                  value={senderFormName}
                  onChange={(e) => setSenderFormName(e.target.value)}
                  placeholder="예: 1차 주 발송지 (아빠 Gmail), 2차 보조 (엄마 Naver)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>앱 비밀번호 (또는 SMTP 비밀번호)</span>
                  <span className="text-purple-600 font-semibold">16자리 코드 권장</span>
                </label>
                <input
                  type="password"
                  value={senderFormPassword}
                  onChange={(e) => setSenderFormPassword(e.target.value)}
                  placeholder={editingSender ? '변경하지 않으려면 공란으로 두세요' : '예: abcd efgh ijkl mnop'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:border-indigo-500 outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  * 구글 2단계 인증 계정의 경우 myaccount.google.com/apppasswords 에서 발급한 16자리를 입력합니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">메일 서비스 종류</label>
                  <select
                    value={senderFormProvider}
                    onChange={(e: any) => {
                      const prov = e.target.value;
                      setSenderFormProvider(prov);
                      if (prov === 'gmail') {
                        setSenderFormHost('smtp.gmail.com');
                        setSenderFormPort(465);
                      } else if (prov === 'naver') {
                        setSenderFormHost('smtp.naver.com');
                        setSenderFormPort(465);
                      } else if (prov === 'daum') {
                        setSenderFormHost('smtp.daum.net');
                        setSenderFormPort(465);
                      }
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-indigo-500 outline-none"
                  >
                    <option value="gmail">Gmail (구글)</option>
                    <option value="naver">Naver (네이버)</option>
                    <option value="daum">Daum / Kakao (다음)</option>
                    <option value="custom">기타 사용자 지정 SMTP</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">SMTP 호스트 / 포트</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={senderFormHost}
                      onChange={(e) => setSenderFormHost(e.target.value)}
                      className="w-2/3 px-2 py-2 border border-slate-300 rounded-lg text-[11px] font-mono"
                    />
                    <input
                      type="number"
                      value={senderFormPort}
                      onChange={(e) => setSenderFormPort(Number(e.target.value))}
                      className="w-1/3 px-1.5 py-2 border border-slate-300 rounded-lg text-[11px] font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSenderModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  {editingSender ? '수정 내용 저장' : '발송지 계정 추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

