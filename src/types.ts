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

export interface HourlyUsage {
  hour: number; // 0 - 23
  minutes: number;
  mainApp: string;
}

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
  lateNightUsageMinutes: number; // usage between 22:00 and 06:00
}

export interface ChildDevice {
  id: string;
  childName: string;
  deviceName: string;
  model: string;
  androidVersion: string; // e.g. "Android 13 (API 33)", "Android 11 (API 30)"
  isTablet: boolean;
  deviceOwnerActive: boolean; // ADB dpm set-device-owner status (prevents uninstall)
  usageStatsGranted: boolean;
  batteryOptimizationIgnored: boolean;
  bootReceiverArmed: boolean;
  accessibilityArmed: boolean;
  stealthModeEnabled: boolean;
  lastHeartbeat: string;
  registeredAt: string;
  reportRecipientEmail: string;
  scheduledReportTime: string; // e.g. "22:00"
  dailyGoalLimitMinutes: number; // e.g. 180 (3 hours)
  todayTelemetry: DeviceTelemetry;
  yesterdayTelemetry?: DeviceTelemetry;
}

export interface EmailReportLog {
  id: string;
  deviceId: string;
  deviceName: string;
  childName: string;
  recipientEmail: string;
  sentAt: string;
  reportDate: string;
  totalScreenTimeMinutes: number;
  topApp: string;
  status: 'DELIVERED' | 'SCHEDULED' | 'FAILED';
  deliveryMode: 'AUTOMATIC_SCHEDULED' | 'AUTOMATIC_10AM' | 'MANUAL_TEST';
  htmlPreview: string;
  aiAdvice?: string;
}

export interface AndroidProjectFile {
  name: string;
  path: string;
  language: 'kotlin' | 'xml' | 'gradle' | 'shell' | 'yaml' | 'json' | 'markdown' | 'toml';
  description: string;
  content: string;
}
