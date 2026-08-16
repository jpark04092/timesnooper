import React, { useState } from 'react';
import {
  BookOpen,
  Smartphone,
  Tablet,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  HelpCircle,
  Key,
  ShieldCheck,
  Mail,
  Zap,
  Terminal,
  Printer,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Clock,
  Lock,
  Layers,
  FileText,
  Sliders,
  EyeOff
} from 'lucide-react';

interface UserManualGuideProps {
  onGoToAdbHub: () => void;
  onGoToEmailCenter: () => void;
}

export const UserManualGuide: React.FC<UserManualGuideProps> = ({ onGoToAdbHub, onGoToEmailCenter }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'quick-install' | 'device-owner' | 'email-report' | 'stealth' | 'versions' | 'troubleshooting' | 'uninstall'>('quick-install');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> OFFICIAL MANUAL
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-500/30">
                v2.4 LTS (Android 8.0 ~ 14+)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              timesnooper 설치 가이드 및 완벽 사용설명서
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              아이의 기기(태블릿/스마트폰)에 앱을 안전하게 설치하고, 삭제 방지(Device Owner) 설정부터 매일 오전 10시 정기 리포트 수신까지 모든 과정을 안내합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
              title="이 설명서를 인쇄하거나 PDF로 저장합니다"
            >
              <Printer className="w-4 h-4" />
              <span>설명서 인쇄 / PDF</span>
            </button>
            <button
              onClick={onGoToEmailCenter}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
            >
              <Mail className="w-4 h-4" />
              <span>이메일 발송 센터로 이동</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Quick Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max">
          <button
            onClick={() => setActiveSection('quick-install')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeSection === 'quick-install'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>1. 4단계 초간단 설치</span>
          </button>

          <button
            onClick={() => setActiveSection('device-owner')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeSection === 'device-owner'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>2. 삭제 방지(ADB) 등록</span>
          </button>

          <button
            onClick={() => setActiveSection('email-report')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeSection === 'email-report'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>3. 정기 이메일 리포트 사용법</span>
          </button>

          <button
            onClick={() => setActiveSection('stealth')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeSection === 'stealth'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <EyeOff className="w-4 h-4" />
            <span>4. 스텔스 & 시크릿 진입</span>
          </button>

          <button
            onClick={() => setActiveSection('versions')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeSection === 'versions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Tablet className="w-4 h-4" />
            <span>5. 구형/신형 기기별 설정</span>
          </button>

          <button
            onClick={() => setActiveSection('troubleshooting')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeSection === 'troubleshooting'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>6. 문제 해결 & FAQ</span>
          </button>

          <button
            onClick={() => setActiveSection('uninstall')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeSection === 'uninstall'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>7. 정상 삭제/해제 가이드</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: 4-Step Quick Install */}
      {activeSection === 'quick-install' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">4단계 초간단 설치 가이드</h2>
                <p className="text-xs text-slate-500">초보 부모님도 5분 안에 따라 하실 수 있는 기본 설치 절차입니다.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Step 1 */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded">STEP 1</span>
                  <span className="text-xs text-slate-400 font-medium">소요시간: 1분</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">자녀 기기 개발자 옵션 & USB 디버깅 켜기</h3>
                <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>자녀 태블릿/스마트폰의 <strong>[설정]</strong> 앱을 실행합니다.</li>
                  <li>맨 아래 <strong>[태블릿 정보]</strong> 또는 <strong>[휴대전화 정보]</strong> → <strong>[소프트웨어 정보]</strong>로 이동합니다.</li>
                  <li><strong>[빌드 번호(Build number)]</strong> 항목을 <strong>연속으로 7번</strong> 빠르게 탭합니다. ("개발자 모드가 켜졌습니다" 메시지 확인)</li>
                  <li>다시 [설정] 첫 화면으로 나와 맨 밑에 새로 생긴 <strong>[개발자 옵션]</strong>으로 진입합니다.</li>
                  <li><strong>[USB 디버깅(USB Debugging)]</strong> 항목을 <strong>[사용 중 / 켬]</strong>으로 활성화합니다.</li>
                </ol>
              </div>

              {/* Step 2 */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-0.5 rounded">STEP 2</span>
                  <span className="text-xs text-slate-400 font-medium">소요시간: 1분</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">timesnooper APK 설치 및 3대 필수 권한 승인</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  자녀 기기에 timesnooper APK를 설치한 뒤, 최초 1회 실행하여 다음 3대 권한을 허용합니다:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-slate-800">사용정보 접근 허용 (Usage Stats)</strong>
                      <p className="text-slate-500 text-[11px]">어떤 앱을 몇 분 동안 실행했는지 정확히 기록합니다.</p>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-slate-800">배터리 사용량 최적화 중지 (Doze Mode 예외)</strong>
                      <p className="text-slate-500 text-[11px]">기기가 절전 모드에 들어가도 백그라운드 감시가 꺼지지 않게 합니다.</p>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-slate-800">알림 권한 허용 (Android 13+)</strong>
                      <p className="text-slate-500 text-[11px]">무중단 포그라운드 서비스를 시스템에서 종료시키지 않도록 고정합니다.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-0.5 rounded">STEP 3 (핵심)</span>
                  <span className="text-xs text-slate-400 font-medium">소요시간: 2분</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">PC에 연결하여 삭제 방지(Device Owner) 활성화</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  자녀가 설정에서 앱을 강제로 지울 수 없도록 안드로이드 OS 최고 관리자 권한을 부여합니다.
                </p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs space-y-2">
                  <div className="text-slate-400 text-[11px]"># USB 케이블로 PC와 연결 후 터미널/CMD에서 실행:</div>
                  <div className="text-emerald-400 break-all select-all">
                    adb shell dpm set-device-owner com.timesnooper.agent/.receiver.TimesnooperAdminReceiver
                  </div>
                </div>
                <button
                  onClick={() => handleCopy('adb shell dpm set-device-owner com.timesnooper.agent/.receiver.TimesnooperAdminReceiver', 'step3-adb')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedId === 'step3-adb' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedId === 'step3-adb' ? '명령어가 복사되었습니다!' : 'ADB 명령어 복사하기'}</span>
                </button>
              </div>

              {/* Step 4 */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-purple-600 text-white text-xs font-bold px-2.5 py-0.5 rounded">STEP 4</span>
                  <span className="text-xs text-slate-400 font-medium">소요시간: 1분</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">스텔스 모드(아이콘 숨김) & 부모 이메일 등록</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  timesnooper 앱 설정에서 학부모 이메일(<code className="bg-slate-200 px-1 rounded text-purple-700 font-mono">jpark04092@gmail.com</code> 등)을 등록하고 <strong>[스텔스 모드 활성화]</strong>를 켭니다.
                </p>
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-xs text-purple-900 space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>이제 설치가 완료되었습니다!</span>
                  </div>
                  <p className="text-purple-700 text-[11px] leading-relaxed">
                    홈 화면에서 앱 아이콘이 사라지며, 아이가 재부팅하거나 앱을 강제 종료해도 1초 안에 자동 부활하여 매일 오전 10:00에 이메일로 리포트를 자동 전송합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Device Owner ADB Deep Dive */}
      {activeSection === 'device-owner' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">삭제 방지 (Device Owner) 완벽 가이드</h2>
                <p className="text-xs text-slate-500">
                  Google Android Enterprise 보안 표준을 활용하여 '앱 삭제' 버튼을 OS 레벨에서 완전히 비활성화합니다.
                </p>
              </div>
            </div>

            {/* Why Device Owner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>일반 관리자(Device Admin) vs Device Owner 차이점</span>
              </div>
              <p className="leading-relaxed">
                일반 자녀보호 앱이 사용하는 <em>Device Admin</em>은 아이가 [설정 - 보안 - 기기 관리자]에서 체크를 풀면 바로 삭제할 수 있습니다. 
                반면 timesnooper가 사용하는 <strong>Device Owner</strong>는 기업용 관리자 권한으로, <strong>사용자(아이)가 임의로 권한을 해제하거나 삭제하는 것이 시스템적으로 완전히 불가능</strong>합니다.
              </p>
            </div>

            {/* ADB Command Box */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">순서대로 입력하는 ADB 명령어</h3>
              <div className="bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-4">
                <div>
                  <span className="text-slate-400"># 1. PC에 기기가 정상 인식되었는지 확인</span>
                  <div className="text-emerald-400 mt-1">adb devices</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">결과에 &apos;xxxxxxx device&apos;라고 떠야 합니다. (&apos;unauthorized&apos;인 경우 태블릿 화면에서 USB 디버깅 허용 팝업 승인)</div>
                </div>

                <div>
                  <span className="text-slate-400"># 2. timesnooper를 Device Owner로 승격</span>
                  <div className="text-emerald-400 mt-1 select-all break-all">
                    adb shell dpm set-device-owner com.timesnooper.agent/.receiver.TimesnooperAdminReceiver
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">성공 시 &quot;Success: Device owner set to package...&quot; 메시지가 출력됩니다.</div>
                </div>

                <div>
                  <span className="text-slate-400"># 3. 배터리 최적화 예외(백그라운드 무제한 허용) 원클릭 명령</span>
                  <div className="text-emerald-400 mt-1 select-all break-all">
                    adb shell dumpsys deviceidle whitelist +com.timesnooper.agent
                  </div>
                </div>

                <div>
                  <span className="text-slate-400"># 4. 사용정보 통계 접근 권한 원클릭 승인</span>
                  <div className="text-emerald-400 mt-1 select-all break-all">
                    adb shell pm grant com.timesnooper.agent android.permission.PACKAGE_USAGE_STATS
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleCopy('adb shell dpm set-device-owner com.timesnooper.agent/.receiver.TimesnooperAdminReceiver', 'owner-cmd')}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === 'owner-cmd' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedId === 'owner-cmd' ? '복사 완료!' : 'Device Owner 등록 명령어 복사'}</span>
                </button>
                <button
                  onClick={onGoToAdbHub}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Terminal className="w-4 h-4" />
                  <span>전체 ADB 원클릭 스크립트 도구 열기</span>
                </button>
              </div>
            </div>

            {/* Crucial Tip: Accounts Error */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>중요: &quot;Not allowed to set the device owner because there are already some accounts&quot; 오류 시</span>
              </div>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                이미 구글 계정이나 삼성 계정, 카카오톡 등이 기기에 로그인되어 있으면 안드로이드 보안상 Device Owner 설정이 막힙니다. 
                이 경우 <strong>[설정] → [계정 및 백업] → [계정 관리]</strong>에서 로그인된 계정들을 <strong>잠시 [삭제(로그아웃)]</strong>한 뒤 ADB 명령어를 입력하시고, 등록이 성공한 후 다시 계정을 로그인하시면 영구적으로 유지됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Email Report System */}
      {activeSection === 'email-report' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">데일리 정기 이메일 리포트 운영법 (기본 오후 10시 / 시각 설정 가능)</h2>
                <p className="text-xs text-slate-500">부모님이 하루 일과를 마치며 자녀의 당일 미디어 사용 실태를 쉽게 점검할 수 있도록 지원합니다.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* How it works */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>매일 오후 10:00 (22:00) 기본 발송 & Doze 절전모드 우회</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  기본 발송 시각은 <strong>매일 오후 10시(22:00)</strong>로 설정되어 있으며, 설정에서 원하는 시간(오전/오후 분 단위)으로 자유롭게 변경 가능합니다. 안드로이드 시스템의 <code className="bg-slate-200 px-1 rounded font-mono text-blue-700">AlarmManager.setExactAndAllowWhileIdle</code> 엔진이 탑재되어 있어, 자녀의 태블릿이 슬립(화면 꺼짐) 상태이거나 Doze(절전) 모드에 깊이 빠져 있어도 정확히 정각에 CPU를 깨워 메일을 발송합니다.
                </p>
                <div className="bg-white border border-slate-200 p-3 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-slate-800">이메일 리포트 주요 분석 항목:</div>
                  <ul className="text-slate-500 text-[11px] list-disc list-inside space-y-1">
                    <li>하루 총 스크린타임 및 권장 목표 달성 여부</li>
                    <li>22:00 이후 심야 수면시간 몰래 사용 여부 (경고 알림)</li>
                    <li>설치 및 실행된 상위 TOP 앱(유튜브, 게임, 인강 등)별 분/초 단위 기록</li>
                    <li>화면 잠금 해제 횟수 및 첫 사용/마지막 사용 시각</li>
                    <li>AI 일일 미디어 균형 지도 조언</li>
                  </ul>
                </div>
              </div>

              {/* Email Delivery Options */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>수신 이메일 & 발송 시각 변경 방법</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  기본 수신 이메일은 <strong className="text-slate-900">jpark04092@gmail.com</strong>, 기본 발송 시각은 <strong className="text-slate-900">22:00 (오후 10시)</strong>로 지정되어 있으며, <strong>[데일리 이메일 발송 센터]</strong> 탭에서 수신 이메일과 발송 시각을 손쉽게 변경 및 저장할 수 있습니다.
                </p>
                <div className="space-y-2 pt-2">
                  <button
                    onClick={onGoToEmailCenter}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Mail className="w-4 h-4" />
                    <span>실제 HTML 이메일 미리보기 & 발송 시각/이메일 설정</span>
                  </button>
                  <p className="text-[11px] text-slate-500 text-center">
                    * 정기 시각이 되기 전이라도 언제든 [즉시 발송] 버튼을 눌러 발송 테스트를 진행할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Stealth Mode & Secret Dial */}
      {activeSection === 'stealth' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">스텔스 모드 (런처 아이콘 은폐) & 시크릿 진입법</h2>
                <p className="text-xs text-slate-500">아이가 앱의 존재를 인지하고 삭제/조작을 시도하는 것을 원천 방지합니다.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm">스텔스 모드 작동 원리</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  안드로이드의 <code className="bg-slate-200 px-1 rounded font-mono text-purple-700">PackageManager.setComponentEnabledSetting()</code> API를 활용하여 홈 화면(런처)에서 앱 아이콘을 완전히 숨깁니다.
                </p>
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-xs text-purple-900 space-y-1">
                  <div className="font-semibold">보안 효과:</div>
                  <ul className="text-[11px] text-purple-800 list-disc list-inside space-y-0.5">
                    <li>자녀의 홈 화면 및 앱 서랍에 timesnooper 아이콘이 노출되지 않음</li>
                    <li>호기심이나 거부감으로 인한 앱 조작 시도 사전 차단</li>
                    <li>백그라운드 모니터링 및 10시 이메일 발송은 100% 정상 작동</li>
                  </ul>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-sm">부모 전용 시크릿 관리자 모드 진입 2가지 방법</h3>
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-1">
                    <strong className="text-slate-900 flex items-center gap-1.5">
                      <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">방법 A</span>
                      기본 전화 다이얼러 시크릿 코드 입력
                    </strong>
                    <p className="text-slate-600 text-[11px]">
                      전화 앱(다이얼)을 열고 <span className="font-mono font-bold text-purple-700 text-sm">*#*#8463#*#*</span> (*#*#TIME#*#*)를 입력하면 숨겨진 관리자 설정 화면이 즉시 열립니다.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-1">
                    <strong className="text-slate-900 flex items-center gap-1.5">
                      <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">방법 B</span>
                      전화 기능이 없는 Wi-Fi 전용 태블릿인 경우 (ADB)
                    </strong>
                    <div className="bg-slate-900 text-emerald-400 p-2 rounded font-mono text-[11px] mt-1 break-all">
                      adb shell am start -n com.timesnooper.agent/.ui.MainActivity
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: Versions (Old Tablets vs New Android) */}
      {activeSection === 'versions' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <Tablet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">구형 태블릿 (Android 8~11) vs 최신 기기 (Android 12~14+) 최적화</h2>
                <p className="text-xs text-slate-500">기기 연식과 OS 버전에 따른 메모리 및 서비스 특화 설정 가이드입니다.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Old Tablets */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-amber-50/30">
                <div className="flex items-center justify-between">
                  <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-0.5 rounded">구형 태블릿 (Android 8.0 ~ 11.0)</span>
                  <span className="text-xs text-amber-700 font-semibold">Galaxy Tab A, Lenovo Tab M 등</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">RAM 부족 OOM(Out of Memory) 킬러 대응</h3>
                <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>저용량 메모리 풋프린트:</strong> timesnooper는 백그라운드 구동 시 18MB 미만의 초경량 메모리만 점유하여 2GB/3GB 저사양 탭에서도 쾌적합니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>자동 재부팅 리시버:</strong> 시스템 메모리 청소 앱이나 캐시 클리너가 서비스를 종료시키더라도 <code className="bg-amber-100 text-amber-800 px-1 rounded font-mono">START_STICKY</code>로 1초 내 자동 부활합니다.</span>
                  </li>
                </ul>
              </div>

              {/* New Android */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-blue-50/30">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded">최신 기기 (Android 12, 13, 14+)</span>
                  <span className="text-xs text-blue-700 font-semibold">Galaxy Tab S9, 최신 스마트폰</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">엄격한 백그라운드 제한 & FGS 타입 지정</h3>
                <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Android 14 Foreground Service Type:</strong> <code className="bg-blue-100 text-blue-800 px-1 rounded font-mono">specialUse</code> 타입을 선언하여 안드로이드 14의 포그라운드 강제 중지 정책을 완벽 준수합니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>AlarmManager Idle 허용:</strong> 안드로이드 12+의 엄격한 Doze 모드 속에서도 10:00 정시 리포트 발송 알람이 누락되지 않습니다.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: Troubleshooting & FAQ */}
      {activeSection === 'troubleshooting' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">자주 묻는 질문 (FAQ) & 트러블슈팅</h2>
                <p className="text-xs text-slate-500">설치 및 운영 중 발생할 수 있는 주요 상황별 해결책입니다.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Q1 */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-blue-600">
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-black">Q1</span>
                  아이가 태블릿을 껐다 켜거나(재부팅), 최근 실행 앱 목록에서 날려버리면 꺼지나요?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-7">
                  <strong>절대 꺼지지 않습니다.</strong> timesnooper는 부팅 완료 브로드캐스트(<code className="bg-slate-100 text-slate-800 px-1 rounded font-mono">BOOT_COMPLETED</code>) 최고 우선순위 리시버가 등록되어 있어 부팅 즉시 서비스가 재시작됩니다. 또한 스와이프로 강제 종료하더라도 <code className="bg-slate-100 text-slate-800 px-1 rounded font-mono">onTaskRemoved()</code> 훅을 통해 1초 이내에 자동 자가 부활(Restart)합니다.
                </p>
              </div>

              {/* Q2 */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-blue-600">
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-black">Q2</span>
                  ADB 명령어 실행 시 &apos;device unauthorized&apos; 오류가 뜹니다.
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-7">
                  태블릿 화면을 켜보시면 <strong>&quot;이 컴퓨터에서 항상 USB 디버깅을 허용하시겠습니까?&quot;</strong>라는 보안 팝업이 떠 있습니다. [항상 허용]에 체크하시고 [확인]을 누른 뒤 다시 ADB 명령어를 실행해 주세요.
                </p>
              </div>

              {/* Q3 */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-blue-600">
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-black">Q3</span>
                  오전 10시 이메일이 스팸함으로 들어가거나 오지 않아요.
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-7">
                  Gmail의 경우 처음 1회성으로 [스팸함] 또는 [프로모션 탭]으로 분류될 수 있습니다. 메일함에서 <strong>[스팸 해제]</strong> 또는 <strong>[안전한 발신자로 추가]</strong>를 한 번만 눌러주시면 이후부터 받은편지함으로 정시 도착합니다.
                </p>
              </div>

              {/* Q4 */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-blue-600">
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-black">Q4</span>
                  인터넷(Wi-Fi)이 꺼져 있을 때의 사용시간도 기록되나요?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-7">
                  <strong>네, 모두 완벽히 기록됩니다.</strong> 인터넷 연결이 끊어져 있어도 기기 로컬의 Room SQLite DB에 초 단위로 오프라인 저장되며, 10시 정기 발송 시점 또는 Wi-Fi가 다시 연결되는 순간 일괄 동기화되어 학부모에게 보고됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: Normal Uninstallation & Reset */}
      {activeSection === 'uninstall' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">앱 정상 삭제 및 기기 원상복구 가이드 (부모 전용)</h2>
                <p className="text-xs text-slate-500">
                  아이가 성장하여 모니터링을 종료하거나, 기기를 중고로 양도/판매하고자 할 때 안전하게 삭제하는 공식 절차입니다.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
              <p className="leading-relaxed">
                Device Owner로 보호된 앱은 일반적인 [설정 → 앱 삭제] 버튼으로는 지워지지 않습니다. 부모님이 직접 PC에 연결하여 다음 명령어를 입력하면 삭제 방지가 해제되고 정상 제거할 수 있습니다.
              </p>
            </div>

            <div className="bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-4">
              <div>
                <span className="text-slate-400"># 1. Device Owner 삭제 방지 정책 해제</span>
                <div className="text-emerald-400 mt-1 select-all break-all">
                  adb shell dpm remove-active-admin com.timesnooper.agent/.receiver.TimesnooperAdminReceiver
                </div>
              </div>

              <div>
                <span className="text-slate-400"># 2. timesnooper 앱 완전 삭제</span>
                <div className="text-emerald-400 mt-1 select-all break-all">
                  adb uninstall com.timesnooper.agent
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleCopy('adb shell dpm remove-active-admin com.timesnooper.agent/.receiver.TimesnooperAdminReceiver\nadb uninstall com.timesnooper.agent', 'uninstall-cmd')}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'uninstall-cmd' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId === 'uninstall-cmd' ? '해제 명령어 복사 완료!' : '삭제 & 해제 명령어 복사'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
