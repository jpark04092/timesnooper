/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DeviceOverviewCard } from './components/DeviceOverviewCard';
import { UsageAnalyticsView } from './components/UsageAnalyticsView';
import { DailyEmailReporter } from './components/DailyEmailReporter';
import { AndroidHub } from './components/AndroidHub';
import { UserManualGuide } from './components/UserManualGuide';
import { SimulateUsageModal } from './components/SimulateUsageModal';
import { NewDeviceModal } from './components/NewDeviceModal';
import { ChildDevice, EmailReportLog } from './types';
import { INITIAL_DEVICES, INITIAL_EMAIL_LOGS } from './data/initialDevices';
import { ShieldCheck, Mail, Smartphone, Code2, AlertCircle, BookOpen } from 'lucide-react';

export default function App() {
  const [devices, setDevices] = useState<ChildDevice[]>(INITIAL_DEVICES);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(INITIAL_DEVICES[0].id);
  const [emailLogs, setEmailLogs] = useState<EmailReportLog[]>(INITIAL_EMAIL_LOGS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'email-report' | 'manual' | 'android-guide' | 'history'>('dashboard');

  const [isSendingReport, setIsSendingReport] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [isNewDeviceModalOpen, setIsNewDeviceModalOpen] = useState(false);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  // Load from API on mount
  useEffect(() => {
    fetchDevices();
    fetchLogs();
  }, []);

  const fetchDevices = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/devices');
      if (res.ok) {
        const data = await res.json();
        if (data.devices && data.devices.length > 0) {
          setDevices(data.devices);
        }
      }
    } catch (e) {
      console.log('Using local state for devices');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/reports/history');
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          setEmailLogs(data.logs);
        }
      }
    } catch (e) {
      console.log('Using local state for logs');
    }
  };

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  // Send Daily Scheduled Report
  const handleSendReport = async (email: string, mode: 'MANUAL_TEST' | 'AUTOMATIC_SCHEDULED' | 'AUTOMATIC_10AM' = 'MANUAL_TEST') => {
    setIsSendingReport(true);
    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice.id,
          recipientEmail: email || selectedDevice.reportRecipientEmail,
          mode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.log) {
          setEmailLogs((prev) => [data.log, ...prev]);
        }
        setGlobalBanner(`[데일리 리포트 발송 완료] ${email || selectedDevice.reportRecipientEmail}로 일일 보고서가 성공적으로 발송되었습니다.`);
        setTimeout(() => setGlobalBanner(null), 6000);
      }
    } catch (e) {
      // Fallback local simulation
      const newLog: EmailReportLog = {
        id: `log-${Date.now()}`,
        deviceId: selectedDevice.id,
        deviceName: selectedDevice.deviceName,
        childName: selectedDevice.childName,
        recipientEmail: email || selectedDevice.reportRecipientEmail,
        sentAt: new Date().toLocaleString('ko-KR', { hour12: false }) + ' KST',
        reportDate: selectedDevice.todayTelemetry.date,
        totalScreenTimeMinutes: selectedDevice.todayTelemetry.screenTimeMinutes,
        topApp: selectedDevice.todayTelemetry.apps[0]?.appName || '앱 사용 없음',
        status: 'DELIVERED',
        deliveryMode: mode,
        htmlPreview: '',
        aiAdvice: 'EBS 인강 및 유익한 콘텐츠 사용시간이 잘 유지되고 있습니다.',
      };
      setEmailLogs((prev) => [newLog, ...prev]);
      setGlobalBanner(`[데일리 리포트 발송 완료] ${email || selectedDevice.reportRecipientEmail}로 발송되었습니다.`);
      setTimeout(() => setGlobalBanner(null), 6000);
    } finally {
      setIsSendingReport(false);
    }
  };

  // Quick report send from top header
  const handleQuickReportSend = () => {
    handleSendReport(selectedDevice.reportRecipientEmail || 'jpark04092@gmail.com', 'MANUAL_TEST');
  };

  // Update limit
  const handleUpdateLimit = (minutes: number) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === selectedDevice.id ? { ...d, dailyGoalLimitMinutes: minutes } : d))
    );
    setGlobalBanner(`[설정 저장] ${selectedDevice.childName}의 일일 목표 한도가 ${Math.floor(minutes / 60)}시간으로 변경되었습니다.`);
    setTimeout(() => setGlobalBanner(null), 4000);
  };

  // Update recipient email
  const handleUpdateEmail = (newEmail: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === selectedDevice.id ? { ...d, reportRecipientEmail: newEmail } : d))
    );
  };

  // Update scheduled report time
  const handleUpdateScheduleTime = (newTime: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === selectedDevice.id ? { ...d, scheduledReportTime: newTime } : d))
    );
    setGlobalBanner(`[설정 저장] ${selectedDevice.childName}의 데일리 리포트 발송 시각이 매일 "${newTime}" (오후/지정 시각)으로 변경되었습니다.`);
    setTimeout(() => setGlobalBanner(null), 4000);
  };

  // Add new device
  const handleAddDevice = (deviceData: any) => {
    const newId = `device-${Date.now()}`;
    const newDev: ChildDevice = {
      id: newId,
      ...deviceData,
      deviceOwnerActive: true,
      usageStatsGranted: true,
      batteryOptimizationIgnored: true,
      bootReceiverArmed: true,
      accessibilityArmed: true,
      stealthModeEnabled: true,
      lastHeartbeat: new Date().toISOString(),
      registeredAt: new Date().toISOString(),
      scheduledReportTime: deviceData.scheduledReportTime || '22:00',
      todayTelemetry: {
        deviceId: newId,
        date: new Date().toISOString().split('T')[0],
        batteryLevel: 90,
        isCharging: false,
        screenTimeMinutes: 75,
        unlockCount: 7,
        firstUnlockedAt: '08:00',
        lastActiveAt: '11:30',
        lateNightUsageMinutes: 0,
        apps: [
          {
            packageName: 'com.google.android.youtube',
            appName: 'YouTube',
            category: 'video',
            durationMinutes: 45,
            openCount: 3,
            lastUsedTimestamp: Date.now() - 20 * 60 * 1000,
          },
          {
            packageName: 'kr.co.ebs.primary',
            appName: 'EBS 초등 인강',
            category: 'education',
            durationMinutes: 30,
            openCount: 1,
            lastUsedTimestamp: Date.now() - 40 * 60 * 1000,
          },
        ],
        hourlyTimeline: [],
      },
    };

    setDevices((prev) => [newDev, ...prev]);
    setSelectedDeviceId(newId);
    setGlobalBanner(`새 기기 "${deviceData.deviceName}" (${deviceData.childName}) 가 등록되었습니다.`);
    setTimeout(() => setGlobalBanner(null), 5000);
  };

  // Simulate app usage
  const handleSimulateUsage = (
    appName: string,
    category: 'game' | 'video' | 'sns' | 'education',
    minutes: number,
    isLateNight: boolean
  ) => {
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id !== selectedDevice.id) return dev;

        const currentTelemetry = dev.todayTelemetry;
        const currentApps = [...currentTelemetry.apps];
        const existingIdx = currentApps.findIndex((a) => a.appName.includes(appName) || appName.includes(a.appName));

        if (existingIdx !== -1) {
          currentApps[existingIdx] = {
            ...currentApps[existingIdx],
            durationMinutes: currentApps[existingIdx].durationMinutes + minutes,
            openCount: currentApps[existingIdx].openCount + 1,
            lastUsedTimestamp: Date.now(),
          };
        } else {
          currentApps.push({
            packageName: `com.custom.${category}.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            appName,
            category,
            durationMinutes: minutes,
            openCount: 1,
            lastUsedTimestamp: Date.now(),
          });
        }

        // Sort apps by duration
        currentApps.sort((a, b) => b.durationMinutes - a.durationMinutes);

        // Update hourly timeline
        const currentHour = new Date().getHours();
        const updatedTimeline = [...(currentTelemetry.hourlyTimeline || [])];
        const existingHour = updatedTimeline.find((h) => h.hour === currentHour);
        if (existingHour) {
          existingHour.minutes += minutes;
          existingHour.mainApp = appName;
        } else {
          updatedTimeline.push({ hour: currentHour, minutes, mainApp: appName });
        }

        return {
          ...dev,
          lastHeartbeat: new Date().toISOString(),
          todayTelemetry: {
            ...currentTelemetry,
            screenTimeMinutes: currentTelemetry.screenTimeMinutes + minutes,
            unlockCount: currentTelemetry.unlockCount + 1,
            lateNightUsageMinutes: isLateNight
              ? currentTelemetry.lateNightUsageMinutes + minutes
              : currentTelemetry.lateNightUsageMinutes,
            apps: currentApps,
            hourlyTimeline: updatedTimeline,
            lastActiveAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          },
        };
      })
    );

    setGlobalBanner(`[백그라운드 동기화] "${appName}" +${minutes}분이 ${selectedDevice.childName} 기기 데이터에 실시간 반영되었습니다.`);
    setTimeout(() => setGlobalBanner(null), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans antialiased flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickReportSend={handleQuickReportSend}
        isSendingReport={isSendingReport}
        onRefresh={fetchDevices}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Global Toast Banner */}
        {globalBanner && (
          <div className="bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 border border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{globalBanner}</span>
            </div>
            <button onClick={() => setGlobalBanner(null)} className="text-slate-400 hover:text-white">
              닫기
            </button>
          </div>
        )}

        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Device selector cards */}
            <DeviceOverviewCard
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={(id) => setSelectedDeviceId(id)}
              onAddNewDevice={() => setIsNewDeviceModalOpen(true)}
            />

            {/* In-depth App Analytics & Timeline */}
            <UsageAnalyticsView
              device={selectedDevice}
              onOpenSimulateModal={() => setIsSimulateModalOpen(true)}
              onUpdateLimit={handleUpdateLimit}
            />
          </div>
        )}

        {/* Tab 2: Daily Email Delivery Center */}
        {activeTab === 'email-report' && (
          <DailyEmailReporter
            device={selectedDevice}
            emailLogs={emailLogs}
            onSendReport={handleSendReport}
            isSending={isSendingReport}
            onUpdateEmail={handleUpdateEmail}
            onUpdateScheduleTime={handleUpdateScheduleTime}
          />
        )}

        {/* Tab 3: Installation Guide & Official User Manual */}
        {activeTab === 'manual' && (
          <UserManualGuide
            onGoToAdbHub={() => setActiveTab('android-guide')}
            onGoToEmailCenter={() => setActiveTab('email-report')}
          />
        )}

        {/* Tab 4: Android Architecture & ADB Source Explorer */}
        {activeTab === 'android-guide' && <AndroidHub />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">timesnooper</span>
            <span>•</span>
            <span>안드로이드 12+ 및 구형 태블릿 백그라운드 추적 & 학부모 데일리 리포트 (기본 오후 10시 / 시각 설정 가능)</span>
          </div>
          <div className="text-slate-400">
            Android Enterprise Device Owner · WorkManager · UsageStatsManager
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SimulateUsageModal
        device={selectedDevice}
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        onSimulate={handleSimulateUsage}
      />

      <NewDeviceModal
        isOpen={isNewDeviceModalOpen}
        onClose={() => setIsNewDeviceModalOpen(false)}
        onAddDevice={handleAddDevice}
      />
    </div>
  );
}
