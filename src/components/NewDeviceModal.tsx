import React, { useState } from 'react';
import { X, Tablet, Smartphone, Plus } from 'lucide-react';

interface NewDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDevice: (deviceData: {
    childName: string;
    deviceName: string;
    model: string;
    androidVersion: string;
    isTablet: boolean;
    reportRecipientEmail: string;
    dailyGoalLimitMinutes: number;
  }) => void;
}

export const NewDeviceModal: React.FC<NewDeviceModalProps> = ({
  isOpen,
  onClose,
  onAddDevice,
}) => {
  const [childName, setChildName] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [model, setModel] = useState('Galaxy Tab A9');
  const [androidVersion, setAndroidVersion] = useState('Android 13 (API 33)');
  const [isTablet, setIsTablet] = useState(true);
  const [reportRecipientEmail, setReportRecipientEmail] = useState('jpark04092@gmail.com');
  const [dailyGoalLimitMinutes, setDailyGoalLimitMinutes] = useState(180);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) return;

    onAddDevice({
      childName: childName.trim(),
      deviceName: deviceName.trim() || `${childName}의 태블릿`,
      model,
      androidVersion,
      isTablet,
      reportRecipientEmail,
      dailyGoalLimitMinutes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">새 아동 기기 등록</h3>
            <p className="text-xs text-slate-300 mt-0.5">안드로이드 12+ 및 구형 태블릿 연동</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">자녀 이름 및 학년 *</label>
            <input
              type="text"
              required
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="예: 김민준 (초등 3학년)"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">기기 닉네임</label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="예: 거실용 갤럭시 탭"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">기기 형태</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTablet(true)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 ${
                    isTablet ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" /> 태블릿
                </button>
                <button
                  type="button"
                  onClick={() => setIsTablet(false)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 ${
                    !isTablet ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> 스마트폰
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">안드로이드 OS 버전</label>
            <select
              value={androidVersion}
              onChange={(e) => setAndroidVersion(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium outline-none"
            >
              <option value="Android 14 (API 34 / 최신)">Android 14 (최신 태블릿)</option>
              <option value="Android 13 (API 33)">Android 13 (Galaxy Tab S8/S9 등)</option>
              <option value="Android 12 (API 31/32)">Android 12 (표준 지원)</option>
              <option value="Android 11 (API 30 / 레거시)">Android 11 (구형 레거시 태블릿)</option>
              <option value="Android 10 (API 29 / 레거시)">Android 10 (구형 레거시 태블릿)</option>
              <option value="Android 9 Pie (API 28 / 레거시)">Android 9 Pie (구형 태블릿)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">10시 데일리 리포트 수신 이메일</label>
            <input
              type="email"
              required
              value={reportRecipientEmail}
              onChange={(e) => setReportRecipientEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

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
              <Plus className="w-4 h-4" /> 기기 등록 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
