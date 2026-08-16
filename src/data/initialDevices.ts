import { ChildDevice, EmailReportLog } from '../types';

export const INITIAL_DEVICES: ChildDevice[] = [
  {
    id: 'device-tab-01',
    childName: '김민준 (초4)',
    deviceName: '민준이 태블릿 (Galaxy Tab S8)',
    model: 'SM-X700',
    androidVersion: 'Android 13 (API 33)',
    isTablet: true,
    deviceOwnerActive: true,
    usageStatsGranted: true,
    batteryOptimizationIgnored: true,
    bootReceiverArmed: true,
    accessibilityArmed: true,
    stealthModeEnabled: true,
    lastHeartbeat: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    registeredAt: '2026-06-15T09:00:00Z',
    reportRecipientEmail: 'jpark04092@gmail.com',
    scheduledReportTime: '10:00',
    dailyGoalLimitMinutes: 180, // 3h limit
    todayTelemetry: {
      deviceId: 'device-tab-01',
      date: new Date().toISOString().split('T')[0],
      batteryLevel: 78,
      isCharging: false,
      screenTimeMinutes: 215, // 3h 35m
      unlockCount: 22,
      firstUnlockedAt: '07:45',
      lastActiveAt: '21:30',
      lateNightUsageMinutes: 35,
      apps: [
        {
          packageName: 'com.google.android.youtube',
          appName: 'YouTube',
          category: 'video',
          durationMinutes: 85,
          openCount: 8,
          lastUsedTimestamp: Date.now() - 45 * 60 * 1000,
          icon: 'PlaySquare'
        },
        {
          packageName: 'com.roblox.client',
          appName: 'Roblox (로블록스)',
          category: 'game',
          durationMinutes: 55,
          openCount: 4,
          lastUsedTimestamp: Date.now() - 90 * 60 * 1000,
          icon: 'Gamepad2'
        },
        {
          packageName: 'kr.co.ebs.primary',
          appName: 'EBS 초등 인강 (학습)',
          category: 'education',
          durationMinutes: 40,
          openCount: 2,
          lastUsedTimestamp: Date.now() - 150 * 60 * 1000,
          icon: 'BookOpen'
        },
        {
          packageName: 'com.supercell.brawlstars',
          appName: '브롤스타즈 (Brawl Stars)',
          category: 'game',
          durationMinutes: 25,
          openCount: 3,
          lastUsedTimestamp: Date.now() - 300 * 60 * 1000,
          icon: 'Sword'
        },
        {
          packageName: 'com.kakao.talk',
          appName: '카카오톡',
          category: 'sns',
          durationMinutes: 10,
          openCount: 12,
          lastUsedTimestamp: Date.now() - 15 * 60 * 1000,
          icon: 'MessageCircle'
        }
      ],
      hourlyTimeline: [
        { hour: 0, minutes: 0, mainApp: '-' },
        { hour: 1, minutes: 0, mainApp: '-' },
        { hour: 2, minutes: 0, mainApp: '-' },
        { hour: 3, minutes: 0, mainApp: '-' },
        { hour: 4, minutes: 0, mainApp: '-' },
        { hour: 5, minutes: 0, mainApp: '-' },
        { hour: 6, minutes: 0, mainApp: '-' },
        { hour: 7, minutes: 10, mainApp: '카카오톡' },
        { hour: 8, minutes: 20, mainApp: 'YouTube' },
        { hour: 9, minutes: 0, mainApp: '-' },
        { hour: 10, minutes: 0, mainApp: '-' },
        { hour: 11, minutes: 0, mainApp: '-' },
        { hour: 12, minutes: 15, mainApp: 'YouTube' },
        { hour: 13, minutes: 0, mainApp: '-' },
        { hour: 14, minutes: 0, mainApp: '-' },
        { hour: 15, minutes: 30, mainApp: 'Roblox' },
        { hour: 16, minutes: 40, mainApp: 'EBS 초등' },
        { hour: 17, minutes: 25, mainApp: '브롤스타즈' },
        { hour: 18, minutes: 0, mainApp: '-' },
        { hour: 19, minutes: 15, mainApp: 'YouTube' },
        { hour: 20, minutes: 25, mainApp: 'Roblox' },
        { hour: 21, minutes: 35, mainApp: 'YouTube' },
        { hour: 22, minutes: 0, mainApp: '-' },
        { hour: 23, minutes: 0, mainApp: '-' }
      ]
    },
    yesterdayTelemetry: {
      deviceId: 'device-tab-01',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      batteryLevel: 45,
      isCharging: true,
      screenTimeMinutes: 160,
      unlockCount: 18,
      firstUnlockedAt: '08:10',
      lastActiveAt: '20:45',
      lateNightUsageMinutes: 0,
      apps: [
        {
          packageName: 'com.google.android.youtube',
          appName: 'YouTube',
          category: 'video',
          durationMinutes: 60,
          openCount: 6,
          lastUsedTimestamp: Date.now() - 95000000
        },
        {
          packageName: 'kr.co.ebs.primary',
          appName: 'EBS 초등 인강',
          category: 'education',
          durationMinutes: 50,
          openCount: 2,
          lastUsedTimestamp: Date.now() - 100000000
        },
        {
          packageName: 'com.roblox.client',
          appName: 'Roblox',
          category: 'game',
          durationMinutes: 40,
          openCount: 3,
          lastUsedTimestamp: Date.now() - 90000000
        },
        {
          packageName: 'com.kakao.talk',
          appName: '카카오톡',
          category: 'sns',
          durationMinutes: 10,
          openCount: 9,
          lastUsedTimestamp: Date.now() - 88000000
        }
      ],
      hourlyTimeline: []
    }
  },
  {
    id: 'device-tab-legacy-02',
    childName: '김서아 (7세)',
    deviceName: '서아 구형 레거시 태블릿 (Lenovo Tab M10)',
    model: 'Lenovo TB-X606F',
    androidVersion: 'Android 10 (API 29 / 구형 태블릿)',
    isTablet: true,
    deviceOwnerActive: true,
    usageStatsGranted: true,
    batteryOptimizationIgnored: true,
    bootReceiverArmed: true,
    accessibilityArmed: true,
    stealthModeEnabled: true,
    lastHeartbeat: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    registeredAt: '2026-07-01T14:00:00Z',
    reportRecipientEmail: 'jpark04092@gmail.com',
    scheduledReportTime: '10:00',
    dailyGoalLimitMinutes: 120, // 2h limit
    todayTelemetry: {
      deviceId: 'device-tab-legacy-02',
      date: new Date().toISOString().split('T')[0],
      batteryLevel: 62,
      isCharging: false,
      screenTimeMinutes: 105,
      unlockCount: 8,
      firstUnlockedAt: '09:15',
      lastActiveAt: '18:10',
      lateNightUsageMinutes: 0,
      apps: [
        {
          packageName: 'com.google.android.apps.youtube.kids',
          appName: 'YouTube Kids (유튜브 키즈)',
          category: 'video',
          durationMinutes: 65,
          openCount: 4,
          lastUsedTimestamp: Date.now() - 120 * 60 * 1000,
          icon: 'Play'
        },
        {
          packageName: 'com.smartstudy.pinkfong',
          appName: '핑크퐁 동요 동화',
          category: 'education',
          durationMinutes: 30,
          openCount: 2,
          lastUsedTimestamp: Date.now() - 240 * 60 * 1000,
          icon: 'Music'
        },
        {
          packageName: 'com.touchpal.drawing',
          appName: '키즈 색칠놀이 드로잉',
          category: 'game',
          durationMinutes: 10,
          openCount: 2,
          lastUsedTimestamp: Date.now() - 360 * 60 * 1000,
          icon: 'Palette'
        }
      ],
      hourlyTimeline: [
        { hour: 9, minutes: 15, mainApp: 'YouTube Kids' },
        { hour: 10, minutes: 20, mainApp: 'YouTube Kids' },
        { hour: 11, minutes: 0, mainApp: '-' },
        { hour: 12, minutes: 0, mainApp: '-' },
        { hour: 13, minutes: 0, mainApp: '-' },
        { hour: 14, minutes: 30, mainApp: '핑크퐁 동요' },
        { hour: 15, minutes: 0, mainApp: '-' },
        { hour: 16, minutes: 10, mainApp: '키즈 색칠놀이' },
        { hour: 17, minutes: 30, mainApp: 'YouTube Kids' }
      ]
    }
  }
];

export const INITIAL_EMAIL_LOGS: EmailReportLog[] = [
  {
    id: 'log-101',
    deviceId: 'device-tab-01',
    deviceName: '민준이 태블릿 (Galaxy Tab S8)',
    childName: '김민준 (초4)',
    recipientEmail: 'jpark04092@gmail.com',
    sentAt: '2026-08-15 10:00:02 KST',
    reportDate: '2026-08-14',
    totalScreenTimeMinutes: 160,
    topApp: 'YouTube (60분)',
    status: 'DELIVERED',
    deliveryMode: 'AUTOMATIC_10AM',
    htmlPreview: '',
    aiAdvice: 'EBS 학습 시간(50분)이 전일 대비 20% 상승했습니다. 주말 로블록스 게임 시간만 규칙을 정해주시면 아주 이상적인 미디어 습관이 형성될 수 있습니다.'
  },
  {
    id: 'log-100',
    deviceId: 'device-tab-legacy-02',
    deviceName: '서아 구형 레거시 태블릿 (Lenovo Tab M10)',
    childName: '김서아 (7세)',
    recipientEmail: 'jpark04092@gmail.com',
    sentAt: '2026-08-15 10:00:04 KST',
    reportDate: '2026-08-14',
    totalScreenTimeMinutes: 95,
    topApp: 'YouTube Kids (65분)',
    status: 'DELIVERED',
    deliveryMode: 'AUTOMATIC_10AM',
    htmlPreview: '',
    aiAdvice: '야간 시간대 사용 없이 권장 시간(2시간 이내)을 모범적으로 준수하였습니다.'
  }
];
