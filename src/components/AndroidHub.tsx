import React, { useState } from 'react';
import { ANDROID_SOURCE_FILES } from '../data/androidSource';
import { AndroidProjectFile } from '../types';
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  Layers,
  Cpu,
  RefreshCw,
  Lock,
  Smartphone,
  Tablet,
  CheckCircle2,
  FileCode
} from 'lucide-react';

export const AndroidHub: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidProjectFile>(ANDROID_SOURCE_FILES[0]);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'architecture' | 'adb-setup' | 'code-explorer'>('architecture');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleDownloadFile = (file: AndroidProjectFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Sub Header & Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded">
                NATIVE KOTLIN / ANDROID 12+ & TABLET
              </span>
              <span className="text-xs text-slate-400 font-medium">timesnooper Native Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5">
              안드로이드 12+ 및 구형 태블릿 무중단 백그라운드 & 삭제 방지 아키텍처
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              어린이가 백그라운드 서비스를 끄거나 앱을 삭제할 수 없도록 Android Enterprise Device Owner 및
              시스템 리시버로 철통 방어합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'architecture'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              3대 보안 원리
            </button>
            <button
              onClick={() => setActiveTab('adb-setup')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'adb-setup'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              ADB 원클릭 명령어
            </button>
            <button
              onClick={() => setActiveTab('code-explorer')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'code-explorer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              소스 코드 탐색기 ({ANDROID_SOURCE_FILES.length}개 파일)
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Architecture Pillars */}
      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pillar 1: Background & Anti-Kill */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">1. 무중단 백그라운드 상주</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              안드로이드 12, 13, 14의 백그라운드 실행 제한을 극복하기 위해 <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">FOREGROUND_SERVICE_SPECIAL_USE</code> 및 <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">START_STICKY</code>를 적용합니다.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>최근 앱 목록에서 스와이프 종료 시 1초 내 즉각 자가 재부팅</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>배터리 최적화 예외 (Doze Mode 우회)</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Boot & Clean Resurrection */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">2. 재부팅 및 캐시정리 후 부활</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              기기 전원 재부팅, 배터리 방전 후 충전 켬, 시스템 업데이트, 캐시 정리 시 최고 우선순위(Priority 999) <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-600 font-mono">BootReceiver</code>가 가동됩니다.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>BOOT_COMPLETED & QUICKBOOT 인텐트 감지</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>오전 10시 알람 스케줄러 누락 없이 즉시 재등록</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: Anti-Uninstall Device Owner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">3. 앱 삭제 절대 불가 (Device Owner)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              안드로이드 엔터프라이즈의 <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-600 font-mono">DevicePolicyManager</code>를 통해 시스템 설정 메뉴의 &apos;앱 삭제&apos; 버튼 자체를 비활성화(회색)합니다.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>setUninstallBlocked()로 OS 레벨 삭제 차단</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>안전모드(Safe Mode) 진입 시에도 강제 삭제 불가</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: ADB Setup Guide */}
      {activeTab === 'adb-setup' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-600" />
              <span>기기 등록 및 삭제 방지 ADB 원클릭 설정 가이드</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              자녀의 태블릿/스마트폰을 USB로 PC에 연결한 후 아래 명령어를 터미널에서 순서대로 실행하세요.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-xs text-slate-900">
                  Step 1. 디바이스 오너(Device Owner) 활성화 (앱 삭제 완벽 방지)
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      'adb shell dpm set-device-owner com.timesnooper.app/.receiver.TimesnooperAdminReceiver',
                      'step1'
                    )
                  }
                  className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
                >
                  {copiedText === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'step1' ? '복사됨!' : '복사'}</span>
                </button>
              </div>
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                adb shell dpm set-device-owner com.timesnooper.app/.receiver.TimesnooperAdminReceiver
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                * 실행 후 기기 설정의 &apos;앱 정보 &gt; 삭제&apos; 버튼이 &apos;관리자에 의해 비활성화됨&apos;으로 변경됩니다.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-xs text-slate-900">
                  Step 2. 사용기록 조회 권한 일괄 부여 (UsageStatsManager)
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      'adb shell pm grant com.timesnooper.app android.permission.PACKAGE_USAGE_STATS',
                      'step2'
                    )
                  }
                  className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
                >
                  {copiedText === 'step2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'step2' ? '복사됨!' : '복사'}</span>
                </button>
              </div>
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                adb shell pm grant com.timesnooper.app android.permission.PACKAGE_USAGE_STATS
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-xs text-slate-900">
                  Step 3. 배터리 절전모드(Doze) 화이트리스트 등록 (백그라운드 생존 보장)
                </div>
                <button
                  onClick={() =>
                    handleCopy('adb shell dumpsys deviceidle whitelist +com.timesnooper.app', 'step3')
                  }
                  className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
                >
                  {copiedText === 'step3' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'step3' ? '복사됨!' : '복사'}</span>
                </button>
              </div>
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                adb shell dumpsys deviceidle whitelist +com.timesnooper.app
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Code Explorer */}
      {activeTab === 'code-explorer' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12">
          {/* File sidebar (4 cols) */}
          <div className="md:col-span-4 border-r border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Android Studio 프로젝트 파일
            </div>
            {ANDROID_SOURCE_FILES.map((file) => (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                  selectedFile.name === file.name
                    ? 'bg-white text-blue-600 font-bold border border-slate-200 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="truncate">{file.name}</span>
                </div>
                <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase">
                  {file.language}
                </span>
              </button>
            ))}
          </div>

          {/* Code viewer (8 cols) */}
          <div className="md:col-span-8 p-4 flex flex-col bg-slate-950 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <div className="font-bold text-sm text-white font-mono">{selectedFile.path}</div>
                <div className="text-xs text-slate-400 mt-0.5">{selectedFile.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedFile.content, selectedFile.name)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedText === selectedFile.name ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === selectedFile.name ? '복사됨!' : '코드 복사'}</span>
                </button>
                <button
                  onClick={() => handleDownloadFile(selectedFile)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>다운로드</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <pre className="text-xs font-mono text-slate-300 p-3 bg-slate-900/80 rounded-xl overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed border border-slate-800">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
