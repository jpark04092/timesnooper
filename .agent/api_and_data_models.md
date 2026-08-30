# 🔌 Timesnooper API & Data Models Reference

> 이 문서는 Express 백엔드의 REST API 엔드포인트 명세, TypeScript 및 Kotlin 데이터 모델, SharedPreferences 키 구조, 필수 ADB 명령어를 집대성한 레퍼런스입니다.

---

## 🌐 1. Express 백엔드 REST API 명세

| Method | Endpoint | 설명 | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/devices` | 등록된 모든 자녀 기기 목록 및 오늘 텔레메트리 반환 | 없음 | `{ success: boolean, devices: ChildDevice[] }` |
| `POST` | `/api/devices` | 신규 기기 수동 등록 | `{ childName, deviceName, model, androidVersion, isTablet, reportRecipientEmail, dailyGoalLimitMinutes, scheduledReportTime }` | `{ success: boolean, device: ChildDevice }` |
| `PUT` | `/api/devices/:id` | 특정 기기의 설정(발송 시각, 이메일, 목표 시간 등) 업데이트 | URL param: `id`, Body: `Partial<ChildDevice>` | `{ success: boolean, device: ChildDevice }` |
| `POST` | `/api/telemetry` | 안드로이드 기기로부터 실시간 텔레메트리 수신 | `{ deviceId, batteryLevel, isCharging, screenTimeMinutes, apps, unlockCount, lateNightUsageMinutes }` | `{ success: boolean, message: string }` |
| `POST` | `/api/send-report` | 웹 대시보드에서 데일리 리포트 즉시 발송 트리거 (Gemini AI + Nodemailer) | `{ deviceId, recipientEmail, mode: 'MANUAL_TEST' \| 'AUTOMATIC_SCHEDULED' }` | `{ success: boolean, message: string, log: EmailReportLog, smtpResult }` |
| `POST` | `/api/reports/daily` | 안드로이드 APK 데몬(WorkManager)이 직접 호출하는 일일 리포트 엔드포인트 | `{ deviceId, deviceName, childName, recipientEmail, androidVersion, reportDate, totalScreenTimeMinutes, apps: AppStatEntry[] }` | `{ success: boolean, message: string, log: EmailReportLog, smtpResult }` |
| `GET` | `/api/smtp-status` | 서버의 SMTP(Gmail 앱 비밀번호 등) 설정 상태 확인 | 없음 | `{ configured: boolean, smtpUser: string \| null, smtpHost: string \| null, message: string }` |
| `GET` | `/api/senders` | 등록된 다중 발송지(Sender Accounts) 목록 조회 | 없음 | `{ success: boolean, senders: SenderAccount[] }` |
| `POST` | `/api/senders` | 신규 발송지 계정 추가 (Gmail, Naver, Daum, 커스텀 SMTP) | `{ email, name, appPassword, provider, host, port, isDefault }` | `{ success: boolean, message: string, senders: SenderAccount[] }` |
| `PUT` | `/api/senders/:id` | 발송지 계정 정보 및 앱 비밀번호 수정 | URL param: `id`, Body: `Partial<SenderAccount>` | `{ success: boolean, message: string, senders: SenderAccount[] }` |
| `DELETE` | `/api/senders/:id` | 특정 발송지 계정 삭제 | URL param: `id` | `{ success: boolean, message: string, senders: SenderAccount[] }` |
| `PUT` | `/api/senders/:id/default` | 1차 주 발송지(Default Primary) 지정 | URL param: `id` | `{ success: boolean, message: string, senders: SenderAccount[] }` |
| `POST` | `/api/senders/:id/test` | 특정 발송지 계정 단독 프로브(Probe) 테스트 메일 발송 | `{ testRecipientEmail? }` | `{ success: boolean, message: string }` |
| `GET` | `/api/reports/history` | 이메일 발송 이력 및 전송 로그 조회 | 없음 | `{ success: boolean, logs: EmailReportLog[] }` |
| `GET` | `/api/android-source` | 웹 브라우저용 네이티브 안드로이드 소스코드 파일 패키지 반환 | 없음 | `{ success: boolean, files: AndroidProjectFile[] }` |

---

## 📦 2. TypeScript 데이터 모델 (`src/types.ts`)

```typescript
// 앱별 사용량 아이템
export interface AppUsageItem {
  packageName: string;
  appName: string;
  category: 'game' | 'video' | 'sns' | 'education' | 'utility' | 'browser' | 'other';
  durationMinutes: number;
  openCount: number;
  lastUsedTimestamp: number;
  icon?: string;
  isRestricted?: boolean;
  timeLimitMinutes?: number;
}

// 시간대별 사용량 (0~23시)
export interface HourlyUsage {
  hour: number;
  minutes: number;
  mainApp: string;
}

// 기기 일일 텔레메트리
export interface DeviceTelemetry {
  deviceId: string;
  date: string; // YYYY-MM-DD
  batteryLevel: number;
  isCharging: boolean;
  screenTimeMinutes: number;
  apps: AppUsageItem[];
  hourlyTimeline: HourlyUsage[];
  unlockCount: number;
  firstUnlockedAt: string;
  lastActiveAt: string;
  lateNightUsageMinutes: number; // 22:00 ~ 06:00
}

// 자녀 기기 마스터 정보
export interface ChildDevice {
  id: string;
  childName: string;
  deviceName: string;
  model: string;
  androidVersion: string;
  isTablet: boolean;
  deviceOwnerActive: boolean;
  usageStatsGranted: boolean;
  batteryOptimizationIgnored: boolean;
  bootReceiverArmed: boolean;
  accessibilityArmed: boolean;
  stealthModeEnabled: boolean;
  lastHeartbeat: string;
  registeredAt: string;
  reportRecipientEmail: string;
  scheduledReportTime: string; // e.g. "22:00"
  dailyGoalLimitMinutes: number; // e.g. 180 (분)
  todayTelemetry: DeviceTelemetry;
  yesterdayTelemetry?: DeviceTelemetry;
}

// 발송지 메일 계정 (2개 이상 지정 & 자동 Failover 지원)
export interface SenderAccount {
  id: string;
  email: string;
  name: string;
  provider: 'gmail' | 'naver' | 'daum' | 'custom';
  appPasswordMasked?: string;
  isDefault: boolean;
  host?: string;
  port?: number;
  createdAt: string;
  status: 'ACTIVE' | 'STANDBY' | 'ERROR';
  lastError?: string;
  totalSentCount: number;
}

// 이메일 발송 로그
export interface EmailReportLog {
  id: string;
  deviceId: string;
  deviceName: string;
  childName: string;
  recipientEmail: string;
  senderEmail?: string;
  senderName?: string;
  sentAt: string;
  reportDate: string;
  totalScreenTimeMinutes: number;
  topApp: string;
  status: 'DELIVERED' | 'SCHEDULED' | 'FAILED';
  deliveryMode: 'AUTOMATIC_SCHEDULED' | 'AUTOMATIC_10AM' | 'MANUAL_TEST';
  htmlPreview: string;
  aiAdvice?: string;
  isRealEmailDelivered?: boolean;
  smtpDeliveryStatus?: string;
  smtpMessageId?: string;
}
```

---

## 📱 3. 안드로이드 Kotlin 데이터 모델 & SharedPreferences

### (1) 데이터 클래스 (`app/src/main/java/com/timesnooper/app/data/ReportPayload.kt`)
```kotlin
data class ReportPayload(
    val deviceId: String,
    val deviceName: String,
    val childName: String = "자녀",
    val recipientEmail: String = "jpark04092@gmail.com",
    val androidVersion: String,
    val reportDate: String,
    val totalScreenTimeMinutes: Int,
    val apps: List<AppStatEntry>,
    val isThresholdAlert: Boolean = false,
    val thresholdMinutes: Int = 0
)

data class AppStatEntry(
    val packageName: String,
    val appName: String,
    val durationMinutes: Int,
    val lastUsedTime: Long
)
```

### (2) SharedPreferences 키 구조
- **`timesnooper_prefs`** (사용자 설정 및 인증 정보):
  - `parent_email` (String): 학부모 수신 이메일 주소 (기본값: `jpark04092@gmail.com`)
  - `child_name` (String): 자녀 이름/기기 별칭 (기본값: `자녀`)
  - `sender_email` (String): 발신용 Gmail 계정 주소
  - `sender_app_password` (String): 발신용 16자리 구글 앱 비밀번호
  - `admin_password` (String): 관리자 진입 보호 비밀번호
  - `report_time` (String): 정기 발송 시각 문자열 (기본값: `22:00`)
  - `report_hour` (Int): 발송 시간 (0~23, 기본값: `22`)
  - `report_minute` (Int): 발송 분 (0~59, 기본값: `0`)
  - `usage_limit_enabled` (Boolean): 일일 사용 한도 초과 시 즉시 메일 발송 활성화 여부
  - `usage_limit_minutes` (Int): 일일 사용 한도 분 (기본값: `120`)
  - `last_limit_alert_date` (String): 당일 중복 발송 방지용 마지막 알림 날짜 (`yyyy-MM-dd`)
- **`timesnooper_telemetry`** (백그라운드 캐시):
  - `last_sync_timestamp` (Long): 마지막 텔레메트리 수집 타임스탬프
  - `cached_app_count` (Int): 캐시된 앱 개수

---

## 💻 4. 필수 ADB 명령어 모음 (Cheat Sheet)

### 1) 기기 초기 등록 & 삭제 방지 (Device Owner)
```bash
# 1. Device Owner 관리자 활성화 (앱 삭제 버튼 비활성화)
adb shell dpm set-device-owner com.timesnooper.app/.receiver.TimesnooperAdminReceiver

# 2. 사용정보 접근 권한(UsageStatsManager) 일괄 부여
adb shell pm grant com.timesnooper.app android.permission.PACKAGE_USAGE_STATS

# 3. 배터리 최적화(Doze 모드) 예외 등록
adb shell dumpsys deviceidle whitelist +com.timesnooper.app
```

### 2) 스텔스 모드 해제 & 앱 UI 복구
```bash
# 스텔스 모드로 숨겨진 런처 아이콘 및 메인화면 안전 복구 브로드캐스트
adb shell am broadcast -a com.timesnooper.app.ACTION_UNHIDE_ICON -p com.timesnooper.app

# 또는 액티비티 직접 실행
adb shell am start -n com.timesnooper.app/.ui.MainActivity
```

### 3) 수동 알람 트리거 및 테스트
```bash
# 데일리 리포트 알람 브로드캐스트 강제 트리거
adb shell am broadcast -a android.intent.action.BOOT_COMPLETED -p com.timesnooper.app
```

### 4) 관리자 권한 해제 및 완전 삭제 (기기 반납 시)
```bash
adb shell dpm remove-active-admin com.timesnooper.app/.receiver.TimesnooperAdminReceiver
adb uninstall com.timesnooper.app
```

