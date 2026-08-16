import React, { useState } from 'react';
import { ChildDevice } from '../types';
import { X, Play, Plus, Moon, Sparkles } from 'lucide-react';

interface SimulateUsageModalProps {
  device: ChildDevice;
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (appName: string, category: 'game' | 'video' | 'sns' | 'education', minutes: number, isLateNight: boolean) => void;
}

export const SimulateUsageModal: React.FC<SimulateUsageModalProps> = ({
  device,
  isOpen,
  onClose,
  onSimulate,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<'youtube' | 'roblox' | 'ebs' | 'kakao' | 'custom'>('youtube');
  const [customAppName, setCustomAppName] = useState('');
  const [customCategory, setCustomCategory] = useState<'game' | 'video' | 'sns' | 'education'>('game');
  const [minutesToAdd, setMinutesToAdd] = useState(30);
  const [isLateNight, setIsLateNight] = useState(false);

  if (!isOpen) return null;

  const presets = [
    { id: 'youtube', name: 'YouTube (유튜브 영상)', category: 'video' as const, defaultMins: 45 },
    { id: 'roblox', name: 'Roblox (로블록스 게임)', category: 'game' as const, defaultMins: 30 },
    { id: 'ebs', name: 'EBS 초등 인강 (학습)', category: 'education' as const, defaultMins: 40 },
    { id: 'kakao', name: '카카오톡 메신저', category: 'sns' as const, defaultMins: 15 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let appName = '';
    let category: 'game' | 'video' | 'sns' | 'education' = 'game';

    if (selectedPreset === 'custom') {
      appName = customAppName.trim() || '임의 앱';
      category = customCategory;
    } else {
      const preset = presets.find((p) => p.id === selectedPreset)!;
      appName = preset.name;
      category = preset.category;
    }

    onSimulate(appName, category, minutesToAdd, isLateNight);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">실시간 앱 사용 시뮬레이션</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {device.childName} ({device.deviceName})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">실행할 앱 선택</label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(p.id as any);
                    setMinutesToAdd(p.defaultMins);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                    selectedPreset === p.id
                      ? 'bg-blue-50 border-blue-500 font-bold text-blue-900 ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>{p.name}</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">{p.defaultMins}분 권장</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>추가 사용 시간</span>
              <span className="text-blue-600 font-extrabold text-sm">{minutesToAdd}분</span>
            </div>
            <input
              type="range"
              min={5}
              max={180}
              step={5}
              value={minutesToAdd}
              onChange={(e) => setMinutesToAdd(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>5분</span>
              <span>1시간</span>
              <span>2시간</span>
              <span>3시간</span>
            </div>
          </div>

          {/* Late night toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-xs font-bold text-purple-900">심야 시간대 (22시 이후) 사용</div>
                <div className="text-[10px] text-purple-700">데일리 리포트의 야간 경고 지표에 집계됩니다</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isLateNight}
              onChange={(e) => setIsLateNight(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> 사용시간 즉시 반영
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
