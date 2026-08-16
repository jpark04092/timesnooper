import React, { useState } from 'react';
import { ChildDevice, AppUsageItem } from '../types';
import {
  Clock,
  Sparkles,
  Gamepad2,
  Tv,
  BookOpen,
  MessageCircle,
  Globe,
  SlidersHorizontal,
  PlusCircle,
  Lock,
  Moon,
  Unlock,
  AlertCircle,
  Layers,
  ChevronRight
} from 'lucide-react';

interface UsageAnalyticsViewProps {
  device: ChildDevice;
  onOpenSimulateModal: () => void;
  onUpdateLimit: (minutes: number) => void;
}

export const UsageAnalyticsView: React.FC<UsageAnalyticsViewProps> = ({
  device,
  onOpenSimulateModal,
  onUpdateLimit,
}) => {
  const telemetry = device.todayTelemetry;
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [showLimitSettings, setShowLimitSettings] = useState(false);
  const [newLimitHours, setNewLimitHours] = useState(Math.floor(device.dailyGoalLimitMinutes / 60));

  // Category counts and calculations
  const categories = [
    { key: 'all', label: '전체 앱' },
    { key: 'video', label: '동영상/유튜브', icon: Tv, color: 'text-rose-600 bg-rose-50' },
    { key: 'game', label: '게임', icon: Gamepad2, color: 'text-amber-600 bg-amber-50' },
    { key: 'education', label: '학습/인강', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'sns', label: '메신저/SNS', icon: MessageCircle, color: 'text-blue-600 bg-blue-50' },
  ];

  const filteredApps = telemetry.apps.filter((app) => {
    if (activeCategoryFilter === 'all') return true;
    return app.category === activeCategoryFilter;
  });

  const totalMinutes = telemetry.screenTimeMinutes || 1;
  const totalHours = Math.floor(telemetry.screenTimeMinutes / 60);
  const remainingMins = telemetry.screenTimeMinutes % 60;

  // Category totals
  const categoryTotals = telemetry.apps.reduce((acc, app) => {
    acc[app.category] = (acc[app.category] || 0) + app.durationMinutes;
    return acc;
  }, {} as Record<string, number>);

  const handleSaveLimit = () => {
    onUpdateLimit(newLimitHours * 60);
    setShowLimitSettings(false);
  };

  return (
    <div className="space-y-6">
      {/* Device Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900">{device.childName} 사용 리포트</h2>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium border border-slate-200">
                {device.deviceName}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-3">
              <span>기준 일자: {telemetry.date}</span>
              <span>•</span>
              <span>최근 백그라운드 동기화: {new Date(device.lastHeartbeat).toLocaleTimeString('ko-KR')}</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">삭제 방지 및 부팅 부활 적용</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-simulate-usage"
              onClick={onOpenSimulateModal}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>실시간 사용시간 추가 시뮬레이션</span>
            </button>
            <button
              id="btn-toggle-limit"
              onClick={() => setShowLimitSettings(!showLimitSettings)}
              className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>목표 한도 설정</span>
            </button>
          </div>
        </div>

        {/* Goal limit edit dropdown */}
        {showLimitSettings && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
            <span className="text-xs font-medium text-slate-700">일일 권장 사용 목표:</span>
            <select
              value={newLimitHours}
              onChange={(e) => setNewLimitHours(Number(e.target.value))}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 font-semibold"
            >
              <option value={1}>1시간 (60분)</option>
              <option value={2}>2시간 (120분)</option>
              <option value={3}>3시간 (180분)</option>
              <option value={4}>4시간 (240분)</option>
              <option value={5}>5시간 (300분)</option>
            </select>
            <button
              onClick={handleSaveLimit}
              className="text-xs bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>총 스크린 타임</span>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {totalHours > 0 ? `${totalHours}시간 ` : ''}{remainingMins}분
            </div>
            <div className="text-[11px] text-slate-500">목표 {Math.floor(device.dailyGoalLimitMinutes / 60)}시간</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Unlock className="w-3.5 h-3.5 text-indigo-600" />
              <span>화면 잠금 해제</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{telemetry.unlockCount}회</div>
            <div className="text-[11px] text-slate-500">첫 해제 {telemetry.firstUnlockedAt}</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Moon className="w-3.5 h-3.5 text-purple-600" />
              <span>심야 사용 (22시 이후)</span>
            </div>
            <div
              className={`text-lg font-bold ${
                telemetry.lateNightUsageMinutes > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {telemetry.lateNightUsageMinutes}분
            </div>
            <div className="text-[11px] text-slate-500">
              {telemetry.lateNightUsageMinutes > 0 ? '수면 방해 주의' : '정상 수면 유지'}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>학습/인강 비율</span>
            </div>
            <div className="text-lg font-bold text-emerald-700">
              {Math.round(((categoryTotals['education'] || 0) / totalMinutes) * 100)}%
            </div>
            <div className="text-[11px] text-slate-500">{categoryTotals['education'] || 0}분 학습</div>
          </div>
        </div>
      </div>

      {/* Category Proportions Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span>카테고리별 사용 비율</span>
          <span className="text-xs text-slate-400 font-normal">총 {telemetry.apps.length}개 앱 추적 중</span>
        </h3>

        {/* Multi-color Progress Segment */}
        <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden mb-4">
          <div
            className="bg-rose-500 transition-all"
            style={{ width: `${((categoryTotals['video'] || 0) / totalMinutes) * 100}%` }}
            title={`동영상: ${categoryTotals['video'] || 0}분`}
          />
          <div
            className="bg-amber-500 transition-all"
            style={{ width: `${((categoryTotals['game'] || 0) / totalMinutes) * 100}%` }}
            title={`게임: ${categoryTotals['game'] || 0}분`}
          />
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${((categoryTotals['education'] || 0) / totalMinutes) * 100}%` }}
            title={`학습: ${categoryTotals['education'] || 0}분`}
          />
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${((categoryTotals['sns'] || 0) / totalMinutes) * 100}%` }}
            title={`SNS: ${categoryTotals['sns'] || 0}분`}
          />
          <div
            className="bg-slate-400 transition-all"
            style={{
              width: `${(Math.max(0, totalMinutes - (categoryTotals['video'] || 0) - (categoryTotals['game'] || 0) - (categoryTotals['education'] || 0) - (categoryTotals['sns'] || 0)) / totalMinutes) * 100}%`
            }}
            title="기타"
          />
        </div>

        {/* Category Legend & Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50/60 border border-rose-100">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div className="text-xs">
              <span className="text-slate-600 block">동영상/유튜브</span>
              <span className="font-bold text-slate-900">{categoryTotals['video'] || 0}분</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/60 border border-amber-100">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <div className="text-xs">
              <span className="text-slate-600 block">게임/엔터</span>
              <span className="font-bold text-slate-900">{categoryTotals['game'] || 0}분</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="text-xs">
              <span className="text-slate-600 block">학습/인강</span>
              <span className="font-bold text-slate-900">{categoryTotals['education'] || 0}분</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/60 border border-blue-100">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <div className="text-xs">
              <span className="text-slate-600 block">메신저/SNS</span>
              <span className="font-bold text-slate-900">{categoryTotals['sns'] || 0}분</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Heatmap Timeline (00:00 to 23:00) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">시간대별 사용 히트맵 (0시 ~ 24시)</h3>
          <span className="text-xs text-slate-400">막대를 클릭하여 시간대 확인</span>
        </div>

        <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 items-end h-28 pt-4 pb-1 bg-slate-50 rounded-xl px-2 border border-slate-100">
          {Array.from({ length: 24 }).map((_, hour) => {
            const match = telemetry.hourlyTimeline?.find((h) => h.hour === hour);
            const minutes = match ? match.minutes : 0;
            const mainApp = match?.mainApp || '-';
            const heightPercent = Math.min(100, Math.round((minutes / 60) * 100));

            const isNight = hour >= 22 || hour <= 6;

            return (
              <div
                key={hour}
                className="flex flex-col items-center h-full justify-end group relative cursor-pointer"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                  <div className="bg-slate-900 text-white text-[11px] rounded-md py-1 px-2 whitespace-nowrap shadow-lg">
                    <div className="font-bold">{hour}시: {minutes}분 사용</div>
                    {mainApp !== '-' && <div className="text-slate-300">주요 앱: {mainApp}</div>}
                  </div>
                  <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                </div>

                {/* Bar */}
                <div
                  className={`w-full rounded-t transition-all ${
                    minutes > 0
                      ? isNight
                        ? 'bg-rose-500 hover:bg-rose-600'
                        : 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-slate-200/60'
                  }`}
                  style={{ height: minutes > 0 ? `${Math.max(12, heightPercent)}%` : '4px' }}
                />
                <span className="text-[9px] text-slate-400 font-mono mt-1">{hour}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Installed & Executed App Detailed Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">앱별 상세 사용시간 내역</h3>
            <p className="text-xs text-slate-500">Android UsageStatsManager 백그라운드 수집 데이터</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategoryFilter(cat.key)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activeCategoryFilter === cat.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* App List */}
        <div className="divide-y divide-slate-100">
          {filteredApps.map((app, index) => {
            const percentage = Math.min(100, Math.round((app.durationMinutes / totalMinutes) * 100));
            const hours = Math.floor(app.durationMinutes / 60);
            const mins = app.durationMinutes % 60;
            const timeStr = `${hours > 0 ? `${hours}시간 ` : ''}${mins}분`;

            return (
              <div key={app.packageName} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">{app.appName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                          app.category === 'video'
                            ? 'bg-rose-100 text-rose-700'
                            : app.category === 'game'
                            ? 'bg-amber-100 text-amber-700'
                            : app.category === 'education'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {app.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate">{app.packageName}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-extrabold text-sm text-slate-900">{timeStr}</div>
                  <div className="text-xs text-slate-400 font-medium">전체의 {percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
