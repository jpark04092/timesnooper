# 📁 Timesnooper Project File Structure

> 이 문서는 Timesnooper 프로젝트 내 모든 파일과 디렉토리의 역할 및 구조를 분석하여 정리한 문서입니다.

---

## 🌳 전체 디렉토리 트리

```text
timesnooper/
├── .agent/                             # AI Agent 협업 및 컨텍스트 보존 디렉토리
│   ├── README.md                       # 핵심 요약 및 인덱스
│   ├── file_structure.md               # 파일 구조 및 모듈 매핑 (본 문서)
│   ├── architecture.md                 # 3계층 아키텍처 및 안드로이드 보안 원리
│   ├── api_and_data_models.md          # REST API & 데이터 모델 & ADB 명세
│   └── usage_limit_alert_feature.md    # 일일 사용 한도 초과 시 실시간 즉시 메일 발송 상세 명세
├── .github/
│   └── workflows/
│       └── build-apk.yml               # GitHub Actions 무인 자동 APK 빌드 워크플로우
├── app/                                # Android Native Kotlin 애플리케이션
│   ├── build.gradle.kts                # 앱 모듈 빌드 스크립트 (dependencies, SDK 설정)
│   ├── proguard-rules.pro              # Proguard 난독화/최적화 룰
│   └── src/main/
│       ├── AndroidManifest.xml         # 권한, 서비스, 리시버, 액티비티 선언
│       ├── java/com/timesnooper/app/
│       │   ├── TimesnooperApp.kt       # Application 인스턴스 초기화
│       │   ├── data/
│       │   │   ├── ReportPayload.kt    # 리포트 데이터 전송용 DTO
│       │   │   └── TelemetryRepository.kt # 텔레메트리 캐싱 및 SharedPreferences 관리
│       │   ├── network/
│       │   │   ├── DirectEmailSender.kt   # SSLSocket 기반 스마트폰 자체 Gmail 직발송 엔진
│       │   │   └── TimesnooperApiClient.kt # 중앙 웹서버 통신용 Retrofit 클라이언트
│       │   ├── receiver/
│       │   │   ├── BootReceiver.kt             # 부팅/업데이트 시 무조건 자동 부활 (Priority 999)
│       │   │   ├── DailyReportAlarmReceiver.kt # 매일 정기 시각 정밀 알람 스케줄러
│       │   │   ├── StealthReceiver.kt          # 스텔스 모드 제어 & 비상 복구 리시버 (*#*#8463#*#*)
│       │   │   └── TimesnooperAdminReceiver.kt # Device Owner (앱 삭제 차단) 리시버
│       │   ├── service/
│       │   │   └── TimesnooperMonitorService.kt # 무중단 포그라운드 서비스 (15분 주기 추적)
│       │   ├── ui/
│       │   │   └── MainActivity.kt     # 설정 화면, 권한 요청, 테스트 발송, 스텔스 토글
│       │   └── worker/
│       │       └── SendDailyReportWorker.kt # WorkManager 기반 일일 사용량 집계 & 메일 발송
│       └── res/
│           ├── layout/activity_main.xml # 메인 액티비티 레이아웃 XML
│           ├── values/                  # colors.xml, strings.xml, themes.xml
│           └── xml/device_admin_policies.xml # 디바이스 관리자 정책 선언
├── assets/                             # 정적 리소스 (아이콘, 가이드 이미지 등)
├── gradle/
│   ├── libs.versions.toml              # Gradle 버전 카탈로그 (의존성 버전 관리)
│   └── wrapper/
│       └── gradle-wrapper.properties   # Gradle Wrapper 8.4 설정
├── release/                            # 빌드 완료된 안드로이드 APK 저장소
│   ├── README.md                       # APK 다운로드 및 설치 안내
│   ├── app-debug.apk                   # 디버그 빌드 APK
│   ├── timesnooper-debug.apk           # 최신 디버그 APK
│   └── timesnooper-release-unsigned.apk # 릴리즈 빌드 APK (서명 전)
├── src/                                # React 19 Frontend Web Dashboard
│   ├── components/
│   │   ├── AndroidHub.tsx              # 안드로이드 아키텍처, ADB 가이드, CI/CD, 코드 탐색기
│   │   ├── DailyEmailReporter.tsx      # 데일리 리포트 미리보기, 발송 로그, SMTP 가이드
│   │   ├── DeviceOverviewCard.tsx      # 등록 기기 목록 카드, 상태 및 배터리 표시
│   │   ├── Header.tsx                  # 상단 내비게이션 바, 탭 전환, 빠른 발송 버튼
│   │   ├── NewDeviceModal.tsx          # 신규 아동 기기 수동 등록 모달
│   │   ├── SimulateUsageModal.tsx      # 가상 앱 사용시간 시뮬레이션 모달
│   │   ├── UsageAnalyticsView.tsx      # 시간대별/앱별 사용량 차트, 일일 목표 한도 조절
│   │   └── UserManualGuide.tsx         # 공식 사용자 설치 & 운영 매뉴얼 가이드
│   ├── data/
│   │   ├── androidSource.ts            # 웹상에서 탐색 가능한 네이티브 안드로이드 소스코드 데이터
│   │   └── initialDevices.ts           # 초기 데모 기기 및 발송 이력 목업 데이터
│   ├── App.tsx                         # 루트 대시보드 컴포넌트 (상태 관리, 라우팅, 모달 제어)
│   ├── index.css                       # Tailwind CSS 설정 및 글로벌 스타일
│   ├── main.tsx                        # React DOM 렌더링 진입점
│   └── types.ts                        # 프론트/백엔드 공유 TypeScript 인터페이스 정의
├── .env.example                        # 환경 변수 예시 (SMTP_USER, SMTP_PASS, GEMINI_API_KEY)
├── .gitignore                          # Git 무시 파일 목록
├── build.gradle.kts                    # Root Gradle 빌드 설정
├── bun.lock                            # Bun 패키지 잠금 파일
├── gradlew / gradlew.bat               # Gradle Wrapper 실행 스크립트
├── index.html                          # 웹 애플리케이션 HTML 템플릿
├── metadata.json                       # 프로젝트 메타데이터 (AI Studio / Bolt 호환)
├── package.json                        # Node.js 의존성 및 실행 스크립트 정의
├── server.ts                           # Express 백엔드 서버 (API + Gemini AI + Nodemailer + Vite SPA)
├── settings.gradle.kts                 # Gradle 프로젝트 및 리포지토리 구성
├── tsconfig.json                       # TypeScript 컴파일러 구성
└── vite.config.ts                      # Vite 번들러 및 Tailwind 플러그인 설정
```

---

## 📄 파일별 세부 역할 매핑

### 1. 루트 설정 및 백엔드 (`/`)

| 파일명 | 역할 및 주요 기능 |
| :--- | :--- |
| `server.ts` | **중앙 Express 서버**: <br>• REST API 제공 (`/api/devices`, `/api/reports/daily`, `/api/send-report`, `/api/telemetry`, `/api/smtp-status` 등)<br>• Google GenAI (`gemini-3.7-flash`) 연동 데일리 양육 피드백 생성<br>• Nodemailer 기반 HTML 이메일 발송 엔진<br>• Vite 개발 미들웨어 및 프로덕션 정적 파일 서빙 |
| `package.json` | 프로젝트 의존성 (`@google/genai`, `express`, `nodemailer`, `react`, `lucide-react`, `motion` 등) 및 스크립트 (`dev`, `build`, `start`, `lint`) |
| `vite.config.ts` | Vite 6 설정 (`@vitejs/plugin-react`, `@tailwindcss/vite`, 포트 3000) |
| `tsconfig.json` | TypeScript 설정 (`ESNext`, `React-JSX`, Bundler 모듈 해상도) |
| `metadata.json` | 프로젝트 이름, 한 줄 설명, 권한 및 Gemini 서버 사이드 기능 명시 |
| `.env.example` | SMTP 설정 (`SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`) 및 `GEMINI_API_KEY` 가이드 |

---

### 2. 웹 프론트엔드 대시보드 (`src/`)

| 파일/디렉토리 | 역할 및 주요 기능 |
| :--- | :--- |
| `src/App.tsx` | **최상위 컨테이너**: 기기 상태(`devices`), 이메일 로그(`emailLogs`), 활성 탭(`activeTab`) 관리, API 통신 및 토스트 배너 처리 |
| `src/types.ts` | **타입 정의**: `ChildDevice`, `DeviceTelemetry`, `AppUsageItem`, `HourlyUsage`, `EmailReportLog`, `AndroidProjectFile` |
| `src/components/Header.tsx` | 상단 내비게이션, 탭 스위처(대시보드/이메일센터/매뉴얼/안드로이드허브), 빠른 리포트 발송 버튼 |
| `src/components/DeviceOverviewCard.tsx` | 등록된 자녀 기기 카드 목록, 배터리 잔량, 충전 상태, 삭제 방지(Device Owner) 상태, 기기 추가 버튼 |
| `src/components/UsageAnalyticsView.tsx` | 일일 총 스크린타임, 앱별 사용시간 막대그래프, 시간대별 사용 히트맵, 일일 목표 사용 한도 슬라이더 |
| `src/components/DailyEmailReporter.tsx` | HTML 리포트 실시간 렌더링 미리보기, 발송 이력 타임라인, 발송 시각/수신 이메일 변경, 구글 앱 비밀번호 발급 안내 |
| `src/components/AndroidHub.tsx` | 3대 보안/백그라운드 원리 설명, ADB 원클릭 명령어, GitHub Actions CI 빌드 가이드, 네이티브 코드 뷰어 |
| `src/components/UserManualGuide.tsx` | 단계별 부모 설치 매뉴얼, 구형 태블릿 세팅 팁, 권한 부여 체크리스트 |
| `src/components/SimulateUsageModal.tsx` | 앱 사용시간(YouTube, Roblox, 게임 등) 및 야간 사용을 수동으로 추가하여 동작을 테스트하는 시뮬레이터 |
| `src/components/NewDeviceModal.tsx` | 신규 자녀 기기(이름, 모델명, OS 버전, 발송 시각, 일일 한도) 등록 다이얼로그 |
| `src/data/initialDevices.ts` | 초기 데모용 기기 2대(갤럭시 탭 S8, 레노버 M10 레거시) 및 리포트 발송 이력 목업 데이터 |
| `src/data/androidSource.ts` | 웹 브라우저 내 `AndroidHub`에서 열람 가능한 안드로이드 Kotlin 및 XML 소스코드 텍스트 데이터 |

---

### 3. 안드로이드 네이티브 앱 (`app/src/main/`)

| 파일/디렉토리 | 역할 및 주요 기능 |
| :--- | :--- |
| `AndroidManifest.xml` | 필수 권한 선언 (`PACKAGE_USAGE_STATS`, `FOREGROUND_SERVICE_SPECIAL_USE`, `RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM` 등), `LauncherAlias`, 리시버 및 서비스 등록 |
| `TimesnooperApp.kt` | Android `Application` 클래스 (글로벌 초기화 및 로깅) |
| `service/TimesnooperMonitorService.kt` | **무중단 감시 서비스**: 포그라운드 알림 상주, 10분 주기 `UsageStatsManager` 데이터 캐싱 및 일일 사용 한도 초과 실시간 검사, `onTaskRemoved` 시 1초 내 자동 부활 |
| `receiver/BootReceiver.kt` | **자가 부활 리시버**: 기기 부팅(`BOOT_COMPLETED`), 빠른 부팅(`QUICKBOOT_POWERON`), 앱 업데이트(`MY_PACKAGE_REPLACED`) 감지 후 서비스 및 알람 즉시 재가동 |
| `receiver/TimesnooperAdminReceiver.kt` | **삭제 방지 관리자**: `DeviceAdminReceiver`, ADB `dpm set-device-owner`를 통해 OS 설정의 '앱 삭제' 버튼 비활성화 |
| `receiver/DailyReportAlarmReceiver.kt` | **정기 알람 스케줄러**: `AlarmManager.setExactAndAllowWhileIdle`로 Doze 모드를 깨워 매일 지정 시각(기본 22:00)에 `SendDailyReportWorker`를 Enqueue하고 내일 알람 재등록 |
| `receiver/StealthReceiver.kt` | **스텔스 모드 제어**: `LauncherAlias`를 비활성화하여 런처에서 아이콘을 숨기고, 비상 다이얼(`*#*#8463#*#*`) 또는 ADB 브로드캐스트(`ACTION_UNHIDE_ICON`)로 안전 복구 |
| `worker/SendDailyReportWorker.kt` | **일일/초과 리포트 작업자**: `WorkManager` 백그라운드 코루틴으로 일일/실시간 `UsageStats`를 집계하여 `DirectEmailSender` 또는 `TimesnooperApiClient`로 전송 |
| `network/DirectEmailSender.kt` | **기기 직발송 엔진**: 중간 서버 없이 순수 `SSLSocket`(`smtp.gmail.com:465`)과 구글 앱 비밀번호를 사용하여 RFC 822 MIME HTML 이메일 직접 발송 (일일 안심 리포트 및 한도 초과 긴급 경고 템플릿 지원) |
| `network/TimesnooperApiClient.kt` | 중앙 Express 서버(`/api/reports/daily`)로 리포트 JSON을 전송하는 Retrofit HTTP 클라이언트 |
| `data/TelemetryRepository.kt` | 텔레메트리 스냅샷을 `SharedPreferences`에 안전하게 캐싱 |
| `data/ReportPayload.kt` | 일일 리포트 데이터 모델 (`ReportPayload`, `AppStatEntry`, `isThresholdAlert`, `thresholdMinutes`) |
| `ui/MainActivity.kt` | 학부모 이메일, 발신자 Gmail, 구글 앱 비밀번호, 발송 시각, 일일 사용 한도(분 및 프리셋), 권한 승인, 테스트 발송 및 스텔스 모드 설정 UI |

---

### 4. CI/CD 및 릴리즈 (`.github/`, `release/`)

| 파일/디렉토리 | 역할 및 주요 기능 |
| :--- | :--- |
| `.github/workflows/build-apk.yml` | GitHub Actions 워크플로우: Push, PR, 수동 실행 시 Java 17 + Gradle 8.4로 디버그/릴리즈 APK를 자동 빌드하고 `release/` 폴더로 커밋 |
| `release/timesnooper-debug.apk` | GitHub Actions에서 자동 빌드되어 즉시 설치 가능한 디버그 APK 바이너리 |
| `release/README.md` | APK 다운로드 및 안드로이드 기기 설치 매뉴얼 |

