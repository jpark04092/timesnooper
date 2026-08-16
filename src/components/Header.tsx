import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Mail, Smartphone, Code2, RefreshCw, Sparkles, Send, BookOpen } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'email-report' | 'manual' | 'android-guide' | 'history';
  setActiveTab: (tab: 'dashboard' | 'email-report' | 'manual' | 'android-guide' | 'history') => void;
  onQuickReportSend: () => void;
  isSendingReport: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onQuickReportSend,
  isSendingReport,
  onRefresh,
  isRefreshing,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [timeUntilReport, setTimeUntilReport] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Calculate time until next scheduled report (Default: 22:00 / 10:00 PM)
      const nextReport = new Date(now);
      nextReport.setHours(22, 0, 0, 0);
      if (now.getTime() >= nextReport.getTime()) {
        nextReport.setDate(nextReport.getDate() + 1);
      }
      const diffMs = nextReport.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntilReport(`${diffHours}시간 ${diffMins}분 후`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-sm text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-xl tracking-tighter">
              ts
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">timesnooper</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 백그라운드 상주 중
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                아동 안드로이드 앱 사용시간 백그라운드 추적 & 학부모 데일리 리포트 (기본 오후 10시 / 시각 설정 가능)
              </p>
            </div>
          </div>

          {/* Right Action Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Scheduled Report Timer Badge */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <span className="text-slate-400">다음 정기 리포트(22:00): </span>
                <span className="font-bold text-amber-300">{timeUntilReport}</span>
              </div>
            </div>

            {/* Quick Test Send Button */}
            <button
              id="btn-quick-send-report"
              onClick={onQuickReportSend}
              disabled={isSendingReport}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow flex items-center gap-1.5 cursor-pointer"
              title="지금 즉시 데일리 리포트를 학부모 이메일로 발송 테스트합니다"
            >
              {isSendingReport ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>발송 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">리포트 즉시 발송</span>
                  <span className="sm:hidden">발송</span>
                </>
              )}
            </button>

            {/* Refresh */}
            <button
              id="btn-refresh-telemetry"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
              title="기기 텔레메트리 새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-slate-800 pt-1 pb-1 overflow-x-auto no-scrollbar">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-blue-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>기기 모니터링 & 앱 사용시간</span>
          </button>

          <button
            id="tab-email-report"
            onClick={() => setActiveTab('email-report')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'email-report'
                ? 'bg-slate-800 text-blue-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>10:00 AM 데일리 이메일 발송 센터</span>
          </button>

          <button
            id="tab-manual"
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-slate-800 text-blue-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>설치 가이드 & 사용설명서</span>
          </button>

          <button
            id="tab-android-guide"
            onClick={() => setActiveTab('android-guide')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'android-guide'
                ? 'bg-slate-800 text-blue-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>안드로이드 앱 소스 & ADB 아키텍처</span>
          </button>
        </div>
      </div>
    </header>
  );
};
