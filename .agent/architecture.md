# 🏗️ Timesnooper System Architecture

> 이 문서는 Timesnooper 시스템의 아키텍처, 안드로이드 백그라운드 생존 메커니즘, 보안 제어, 데일리 리포트 발송 파이프라인을 기술적으로 상세히 정리한 문서입니다.

---

## 📐 1. 전체 시스템 3계층 아키텍처

```text
+-----------------------------------------------------------------------------------+
|                           1. 학부모 웹 대시보드 (React 19)                         |
|   - 기기별 스크린타임 / 야간 사용량 / 앱별 타임라인 모니터링                        |
|   - 데일리 리포트 HTML 실시간 프리뷰 및 발송 이력 열람                            |
|   - 일일 목표 시간 및 발송 시각 (기본 22:00) 설정                                 |
|   - ADB 명령어 가이드 및 안드로이드 소스코드 탐색기                                 |
+----------------------------------------+------------------------------------------+
                                         | REST API (HTTP/JSON)
                                         v
+-----------------------------------------------------------------------------------+
|                           2. 백엔드 서버 (Node.js Express)                         |
|   - 기기 텔레메트리 및 설정 상태 관리 (In-Memory / API)                            |
|   - Google GenAI (gemini-3.7-flash) 데일리 양육 코멘트 자동 생성                  |
|   - Nodemailer SMTP 발송 엔진 (대시보드 테스트 발송 지원)                          |
|   - Vite SPA 번들링 & 정적 서빙                                                   |
+----------------------------------------+------------------------------------------+
                                         ^
                                         | Report API Fallback (/api/reports/daily)
                                         |
+----------------------------------------+------------------------------------------+
|                       3. 안드로이드 네이티브 앱 (Kotlin)                           |
|                                                                                   |
|  [무중단 백그라운드]                [자가 부활 & 알람]             [보안 & 삭제 차단]    |
|  TimesnooperMonitorService        BootReceiver (우선순위 999)    DevicePolicyManager  |
|  FOREGROUND_SPECIAL_USE           AlarmManager (Doze 관통)       Device Owner 설정    |
|  15분 주기 UsageStatsManager      DailyReportAlarmReceiver       앱 삭제 버튼 비활성  |
|                                                                                   |
|  [이메일 직발송 엔진]              [스텔스 모드 제어]                               |
|  DirectEmailSender (SSLSocket)    StealthReceiver                                 |
|  smtp.gmail.com:465 Direct        LauncherAlias 비활성화 / 다이얼 *#*#8463#*#*     |
+----------------------------------------+------------------------------------------+
                                         |
                                         | SMTP Direct (SSL:465)
                                         v
+-----------------------------------------------------------------------------------+
|                           4. 학부모 Gmail 메일함                                  |
|   - 매일 밤 22:00 정각 HTML 일일 사용 보고서 자동 수신                            |
+-----------------------------------------------------------------------------------+
```

---

## 🛡️ 2. 안드로이드 클라이언트 핵심 4대 원리

### (1) 무중단 백그라운드 상주 (Anti-Kill & Continuous Tracking)
- **포그라운드 서비스**: 안드로이드 12~14 정책에 맞춰 `FOREGROUND_SERVICE_SPECIAL_USE` 타입(`ParentalScreenTimeTracking`)과 최소 중요도(`IMPORTANCE_MIN`) 알림 채널을 등록하여 무중단 상주.
- **START_STICKY & onTaskRemoved**:
  - `onStartCommand()`에서 `START_STICKY`를 반환하여 OS에 의해 킬당하더라도 자동 재생성.
  - 사용자가 '최근 앱 목록'에서 앱을 스와이프하여 강제 종료 시, `onTaskRemoved()`가 즉시 실행되어 `AlarmManager`를 통해 1초 후 서비스를 다시 띄우는 `PendingIntent` 예약.
- **배터리 최적화 예외**: `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` 및 `dumpsys deviceidle whitelist`를 통해 Doze 모드로 인한 백그라운드 일시정지 차단.
- **15분 주기 추적**: `SingleThreadScheduledExecutor`가 15분마다 `UsageStatsManager.queryUsageStats()`를 호출하여 당일 앱별 사용량을 `TelemetryRepository`에 로컬 캐싱.

### (2) 재부팅 및 시스템 청소 후 자가 부활 (Resurrection)
- **우선순위 999의 `BootReceiver`**:
  - 수신 인텐트: `BOOT_COMPLETED`, `LOCKED_BOOT_COMPLETED`, `MY_PACKAGE_REPLACED`, `QUICKBOOT_POWERON` (HTC/스냅드래곤 고속부팅 대응).
  - 기기가 재부팅되거나 시스템 캐시 청소, 앱 자동 업데이트가 발생하더라도 즉시 `TimesnooperMonitorService`를 재시작하고, 당일 밤 데일리 알람을 누락 없이 재스케줄링.

### (3) OS 레벨 앱 무단 삭제 완전 차단 (Device Owner)
- **Enterprise Device Owner**:
  - `TimesnooperAdminReceiver`를 ADB 명령어(`dpm set-device-owner`)로 기기 소유자로 등록.
  - `DevicePolicyManager.setUninstallBlocked(adminComponent, packageName, true)`를 호출하여 시스템 설정의 **'앱 삭제' 버튼 자체를 비활성화(회색)**.
  - 자녀가 안전모드(Safe Mode)로 부팅하더라도 관리자 권한 해제 불가.

### (4) 스텔스 모드 (아이콘 숨김 & 비상 복구)
- **원리**: `MainActivity` 본체는 활성화 상태로 두고, 런처 진입점인 `LauncherAlias` 컴포넌트만 `COMPONENT_ENABLED_STATE_DISABLED`로 전환하여 홈 화면과 앱 서랍에서 아이콘을 완벽히 제거.
- **비상 복구 통로**:
  1. **전화 다이얼 시크릿 코드**: `*#*#8463#*#*` (*#*#TIME#*#*) 입력 시 `StealthReceiver`가 수신하여 `MainActivity`를 호출.
  2. **ADB 브로드캐스트**: `adb shell am broadcast -a com.timesnooper.app.ACTION_UNHIDE_ICON -p com.timesnooper.app` 실행 시 `LauncherAlias`를 즉시 복원. (Android 보안 예외 우회)

---

## 📬 3. 데일리 리포트 발송 파이프라인 (시퀀스)

```text
[매일 22:00 정각]
   |
   v
[AlarmManager (RTC_WAKEUP)] -> [DailyReportAlarmReceiver]
   |
   +---> 다음 날 22:00 알람 자동 재등록
   |
   v
[WorkManager: SendDailyReportWorker (네트워크 연결 제약 조건)]
   |
   v 하루치 UsageStatsManager 데이터 집계 & 포맷팅
   |
   +---[1순위: 기기 직접 발송 (DirectEmailSender)]-----------------------+
   |    - SharedPreferences에 16자리 구글 앱 비밀번호가 있는 경우           |
   |    - SSLSocket -> smtp.gmail.com:465 접속                            |
   |    - AUTH LOGIN (Base64 이메일/비밀번호) 인증                         |
   |    - RFC 822 MIME HTML 메시지 전송                                   |
   |    - 성공 시: 발송 완료 로그 기록 & 작업 종료                        |
   |                                                                     |
   +---[2순위 Fallback: 중앙 서버 발송 (TimesnooperApiClient)]-----------+
        - 앱 비밀번호 미등록 또는 기기 발송 실패 시 실행                  |
        - Retrofit POST /api/reports/daily                               |
        - Express 서버 수신 -> Gemini 3.7 Flash AI 피드백 생성            |
        - 서버 환경변수 SMTP(Nodemailer)로 발송 / 대시보드 저장          |
```

---

## 🤖 4. Gemini AI 양육 코멘트 생성 파이프라인
- **엔진**: `@google/genai` (SDK v2), 모델: `gemini-3.7-flash`
- **입력 데이터**:
  - 자녀 이름, 총 스크린타임, 앱별 사용시간(상위 앱 리스트), 야간(22시 이후) 사용량, 화면 잠금 해제 횟수
- **프롬프트 전략**:
  - 아동 미디어 사용 분석 전문가 페르소나 적용
  - 2~3문장의 따뜻하고 실천 가능한 학부모 지도 가이드 작성
  - HTML 일일 이메일 템플릿의 '💡 AI 데일리 미디어 지도 가이드' 영역에 동적 삽입

