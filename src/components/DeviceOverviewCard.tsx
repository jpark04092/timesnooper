import React, { useState, useRef } from 'react';
import { ChildDevice } from '../types';
import { Tablet, Smartphone, Battery, BatteryCharging, ShieldAlert, ShieldCheck, Lock, Activity, AlertTriangle, Plus, EyeOff, Eye } from 'lucide-react';

interface DeviceOverviewCardProps {
  devices: ChildDevice[];
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
  onAddNewDevice: () => void;
  onToggleStealth?: (deviceId: string) => void;
}

export const DeviceOverviewCard: React.FC<DeviceOverviewCardProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  onAddNewDevice,
  onToggleStealth,
}) => {
  const [modelClickCounts, setModelClickCounts] = useState<Record<string, number>>({});
  const clickTimerRef = useRef<Record<string, any>>({});

  const handleModelClick = (e: React.MouseEvent, deviceId: string) => {
    e.stopPropagation();

    const currentCount = (modelClickCounts[deviceId] || 0) + 1;

    if (clickTimerRef.current[deviceId]) {
      clearTimeout(clickTimerRef.current[deviceId] as any);
    }

    clickTimerRef.current[deviceId] = setTimeout(() => {
      setModelClickCounts((prev) => ({ ...prev, [deviceId]: 0 }));
    }, 2500);

    if (currentCount >= 7) {
      setModelClickCounts((prev) => ({ ...prev, [deviceId]: 0 }));
      if (onToggleStealth) {
        onToggleStealth(deviceId);
      }
    } else {
      setModelClickCounts((prev) => ({ ...prev, [deviceId]: currentCount }));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <span>연결된 아동 기기 목록</span>
          <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">
            {devices.length}대
          </span>
        </h2>
        <button
          id="btn-add-new-device"
          onClick={onAddNewDevice}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> 기기 추가
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {devices.map((device) => {
          const isSelected = device.id === selectedDeviceId;
          const telemetry = device.todayTelemetry;
          const totalHours = Math.floor(telemetry.screenTimeMinutes / 60);
          const totalMins = telemetry.screenTimeMinutes % 60;
          const timeStr = `${totalHours > 0 ? `${totalHours}시간 ` : ''}${totalMins}분`;
          const limitPercent = Math.min(100, Math.round((telemetry.screenTimeMinutes / device.dailyGoalLimitMinutes) * 100));
          const isOverLimit = telemetry.screenTimeMinutes > device.dailyGoalLimitMinutes;
          const clickCount = modelClickCounts[device.id] || 0;

          return (
            <div
              key={device.id}
              id={`device-card-${device.id}`}
              onClick={() => onSelectDevice(device.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              {/* Top Row: Device icon, Name, Model, Android version */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {device.isTablet ? <Tablet className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{device.childName}</span>
                      {device.isTablet && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                          태블릿
                        </span>
                      )}
                      {device.stealthModeEnabled ? (
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5" title="스텔스 모드 활성화됨">
                          <EyeOff className="w-2.5 h-2.5" /> 스텔스
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse" title="스텔스 모드 해제됨 (앱 아이콘 노출)">
                          <Eye className="w-2.5 h-2.5" /> 노출 모드
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                      <span className="truncate max-w-[120px]">{device.deviceName}</span>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={(e) => handleModelClick(e, device.id)}
                        className="font-mono text-slate-600 hover:text-blue-600 px-1 py-0.5 rounded bg-slate-100 hover:bg-blue-50 transition-colors select-none cursor-pointer"
                        title="클릭하여 모델명 확인 (연속 7회 클릭 시 스텔스 모드 토글)"
                      >
                        {device.model || 'SM-Model'}
                        {clickCount > 0 && clickCount < 7 && (
                          <span className="ml-1 text-[10px] text-blue-600 font-bold animate-bounce">
                            ({clickCount}/7)
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Battery & Status */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 justify-end">
                    {telemetry.isCharging ? (
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    ) : (
                      <Battery className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>{telemetry.batteryLevel}%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {device.androidVersion.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Security & Anti-Uninstall Badges */}
              <div className="grid grid-cols-3 gap-1.5 my-2.5 pt-2 border-t border-slate-100 text-[11px]">
                <div className="bg-emerald-50 text-emerald-800 rounded px-2 py-1 flex items-center gap-1 font-semibold border border-emerald-100" title="Device Owner 모드로 앱 삭제 버튼이 OS 레벨에서 비활성화됨">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>삭제 방지: ON</span>
                </div>
                <div className="bg-blue-50 text-blue-800 rounded px-2 py-1 flex items-center gap-1 font-semibold border border-blue-100" title="재부팅, 태스크 킬, 캐시 청소 시 1초 내 즉시 부활">
                  <Activity className="w-3 h-3 text-blue-600" />
                  <span>부팅 부활: 작동</span>
                </div>
                <div className="bg-amber-50 text-amber-800 rounded px-2 py-1 flex items-center gap-1 font-semibold border border-amber-100" title={`매일 ${device.scheduledReportTime || '22:00'} 알람 정확 예약`}>
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>{device.scheduledReportTime || '22:00'} 리포트: 무결</span>
                </div>
              </div>

              {/* Progress & Today Usage */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">오늘 사용 시간</span>
                  <span className={`font-bold ${isOverLimit ? 'text-rose-600' : 'text-slate-900'}`}>
                    {timeStr} <span className="text-slate-400 font-normal">/ {Math.floor(device.dailyGoalLimitMinutes / 60)}시간</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOverLimit
                        ? 'bg-rose-500'
                        : limitPercent > 75
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${limitPercent}%` }}
                  />
                </div>
              </div>

              {/* Late night alert if any */}
              {telemetry.lateNightUsageMinutes > 0 && (
                <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>야간(22시 이후) {telemetry.lateNightUsageMinutes}분 사용 감지됨</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
