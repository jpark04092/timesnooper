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
  FileCode,
  Github,
  Play,
  PackageCheck,
  FolderGit2
} from 'lucide-react';

export const AndroidHub: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidProjectFile>(ANDROID_SOURCE_FILES[0]);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'architecture' | 'adb-setup' | 'github-actions' | 'code-explorer'>('architecture');

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
              onClick={() => setActiveTab('github-actions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'github-actions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Actions APK 빌드</span>
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

            {/* Step 4: Stealth Reactivation */}
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                  <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">TIP</span>
                  <span>스텔스 모드 후 앱 재활성화 (홈 화면 아이콘 복원 & 화면 열기)</span>
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      'adb shell am broadcast -a com.timesnooper.app.ACTION_UNHIDE_ICON -p com.timesnooper.app',
                      'step4'
                    )
                  }
                  className="text-xs bg-purple-200 hover:bg-purple-300 text-purple-900 font-semibold px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
                >
                  {copiedText === 'step4' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'step4' ? '복사됨!' : '복사'}</span>
                </button>
              </div>
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                adb shell am broadcast -a com.timesnooper.app.ACTION_UNHIDE_ICON -p com.timesnooper.app
              </div>
              <p className="text-[11px] text-purple-800 mt-2">
                * <code className="font-mono text-slate-700">pm enable</code> 시 발생하는 안드로이드 <code className="font-mono text-rose-700">SecurityException</code>을 우회하여 앱 내부 <code className="font-mono">StealthReceiver</code>가 앱 권한으로 아이콘을 100% 안전하게 복원하고 화면을 엽니다. (전화 앱 다이얼: <code className="font-bold">*#*#8463#*#*</code>)
              </p>
            </div>

            {/* Step 5: Clean Uninstall */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-xs text-slate-900">
                  앱 완전 삭제 및 관리자 권한 해제 (기기 반납/초기화 시)
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      'adb shell dpm remove-active-admin com.timesnooper.app/.receiver.TimesnooperAdminReceiver\nadb uninstall com.timesnooper.app',
                      'step5'
                    )
                  }
                  className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
                >
                  {copiedText === 'step5' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'step5' ? '복사됨!' : '복사'}</span>
                </button>
              </div>
              <div className="bg-slate-900 text-rose-300 p-3 rounded-lg font-mono text-xs overflow-x-auto whitespace-pre">
{`adb shell dpm remove-active-admin com.timesnooper.app/.receiver.TimesnooperAdminReceiver
adb uninstall com.timesnooper.app`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: GitHub Actions CI/CD Build Hub */}
      {activeTab === 'github-actions' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Github className="w-5 h-5 text-slate-900" />
                  <h3 className="font-bold text-slate-900 text-base">GitHub Actions 무인 자동 APK 빌드 워크플로우</h3>
                  <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                    Java 17 (setup-java@v5) + Gradle v4 액션
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  로컬에 Android Studio를 설치할 필요 없이, GitHub 저장소에 코드를 Push하거나 원클릭 수동 실행(workflow_dispatch)하면 1~2분 만에 설치용 APK가 자동 생성됩니다.
                </p>
              </div>

              <button
                onClick={() => {
                  const wf = ANDROID_SOURCE_FILES.find((f) => f.name === 'build-apk.yml');
                  if (wf) handleDownloadFile(wf);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>build-apk.yml 다운로드</span>
              </button>
            </div>

            {/* Error Fix & Optimization Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-blue-800">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>GitHub Actions 최적화 및 저장소 release/ 폴더 자동 APK 커밋 탑재 완료</span>
              </div>
              <p className="text-blue-700 leading-relaxed">
                • <strong>코드 저장소 내 release/ 폴더 자동 배치</strong>: 워크플로우가 빌드 완료 후 <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">release/timesnooper-debug.apk</code> 및 릴리즈 파일을 저장소 브랜치로 자동 커밋·푸시하여 별도 아티팩트 다운로드 절차 없이 GitHub 웹 코드 탐색기에서 바로 다운로드할 수 있습니다.<br/>
                • <strong>무한 루프 방지 & 권한</strong>: <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">permissions: contents: write</code> 및 <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">[skip ci]</code> 태그를 적용하여 안전하게 자동 저장됩니다.<br/>
                • <strong>최신 런타임 호환</strong>: <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">actions/setup-java@v5</code> & <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">gradle/actions/setup-gradle@v4</code>로 Node 24 러너 완벽 지원.
              </p>
            </div>

            {/* 3 Step Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                  <span>Push 또는 워크플로우 실행</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  코드를 Push하거나 GitHub 저장소 <strong>Actions</strong> 탭에서 <strong>Run workflow</strong> 버튼을 클릭합니다.
                </p>
              </div>

              <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                  <span>APK 빌드 및 release/ 폴더 커밋</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  클라우드 러너에서 Gradle이 APK를 빌드한 후, 저장소의 <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-blue-700">release/</code> 폴더로 APK 파일을 자동 복사하여 커밋 및 푸시합니다.
                </p>
              </div>

              <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">3</span>
                  <span>저장소 Code 탭에서 즉시 다운로드</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  GitHub 저장소의 <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-emerald-700">release/timesnooper-debug.apk</code> 파일을 클릭하여 언제든 원클릭으로 다운로드하고 기기에 설치합니다.
                </p>
              </div>
            </div>

            {/* Workflow YAML Preview & Copy */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">.github/workflows/build-apk.yml 전체 워크플로우 코드</span>
                </div>
                <button
                  onClick={() => {
                    const wf = ANDROID_SOURCE_FILES.find((f) => f.name === 'build-apk.yml');
                    if (wf) handleCopy(wf.content, 'workflow-copy');
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedText === 'workflow-copy' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'workflow-copy' ? '복사됨!' : 'YAML 코드 복사'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 text-slate-200 text-xs font-mono p-4 rounded-xl overflow-x-auto max-h-[380px] overflow-y-auto leading-relaxed border border-slate-800">
                <code>
                  {ANDROID_SOURCE_FILES.find((f) => f.name === 'build-apk.yml')?.content}
                </code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Code Explorer */}
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
