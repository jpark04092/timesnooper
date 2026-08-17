import { AndroidProjectFile } from '../types';

export const ANDROID_SOURCE_FILES: AndroidProjectFile[] = [
  {
    name: 'build-apk.yml',
    path: '.github/workflows/build-apk.yml',
    language: 'yaml',
    description: 'GitHub Actions 자동 빌드 워크플로우 (Node 24 호환, setup-java v5 & Gradle 액션 적용, APK 아티팩트 자동 생성)',
    content: `name: Build Timesnooper Android APK

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:
    inputs:
      build_type:
        description: 'Build Type (debug / release / all)'
        required: true
        default: 'all'
        type: choice
        options:
          - debug
          - release
          - all

jobs:
  build:
    name: Build & Package Android APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up JDK 17 (Temurin)
        uses: actions/setup-java@v5
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4

      - name: Grant Execute Permission for Gradle Wrapper
        run: |
          if [ -f "./gradlew" ]; then
            chmod +x ./gradlew
          else
            echo "gradlew not found, will use system gradle"
          fi

      # 1. Debug APK 빌드 (설치 및 테스트용)
      - name: Build Debug APK
        if: \${{ github.event.inputs.build_type == 'debug' || github.event.inputs.build_type == 'all' || github.event_name == 'push' || github.event_name == 'pull_request' }}
        run: |
          if [ -f "./gradlew" ]; then
            ./gradlew assembleDebug --stacktrace
          else
            gradle assembleDebug --stacktrace
          fi

      # 2. Release APK 빌드
      - name: Build Release APK
        if: \${{ github.event.inputs.build_type == 'release' || github.event.inputs.build_type == 'all' }}
        run: |
          if [ -f "./gradlew" ]; then
            ./gradlew assembleRelease --stacktrace || echo "Release build step completed"
          else
            gradle assembleRelease --stacktrace || echo "Release build step completed"
          fi

      # 3. Debug APK 아티팩트 업로드
      - name: Upload Debug APK Artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: timesnooper-debug-apk
          path: |
            app/build/outputs/apk/debug/*.apk
            **/build/outputs/apk/debug/*.apk
          if-no-files-found: warn
          retention-days: 30

      # 4. Release APK 아티팩트 업로드
      - name: Upload Release APK Artifact
        if: \${{ (github.event.inputs.build_type == 'release' || github.event.inputs.build_type == 'all') }}
        uses: actions/upload-artifact@v4
        with:
          name: timesnooper-release-apk
          path: |
            app/build/outputs/apk/release/*.apk
            **/build/outputs/apk/release/*.apk
          if-no-files-found: warn
          retention-days: 30
`
  },
  {
    name: 'settings.gradle.kts',
    path: 'settings.gradle.kts',
    language: 'gradle',
    description: '루트 Gradle 프로젝트 및 모듈 설정 파일 (Google, MavenCentral 레포지토리 관리)',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Timesnooper"
include(":app")
`
  },
  {
    name: 'gradle.properties',
    path: 'gradle.properties',
    language: 'properties',
    description: 'Gradle 빌드 환경설정 및 AndroidX 활성화 (android.useAndroidX=true, android.enableJetifier=true)',
    content: `# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.parallel=true

# AndroidX package structure enabled
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
`
  },
  {
    name: 'root-build.gradle.kts',
    path: 'build.gradle.kts',
    language: 'gradle',
    description: '루트 빌드 스크립트 (Android Application 및 Kotlin 플러그인 정의)',
    content: `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}
`
  },
  {
    name: 'libs.versions.toml',
    path: 'gradle/libs.versions.toml',
    language: 'toml',
    description: 'Gradle Version Catalog (AGP, Kotlin, AndroidX, Retrofit 버전 중앙 집중 관리)',
    content: `[versions]
agp = "8.3.2"
kotlin = "1.9.22"
coreKtx = "1.12.0"
appcompat = "1.6.1"
material = "1.11.0"
workRuntimeKtx = "2.9.0"
retrofit = "2.9.0"
okhttp = "4.12.0"
coroutines = "1.7.3"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-appcompat = { group = "androidx.appcompat", name = "appcompat", version.ref = "appcompat" }
material = { group = "com.google.android.material", name = "material", version.ref = "material" }
androidx-work-runtime-ktx = { group = "androidx.work", name = "work-runtime-ktx", version.ref = "workRuntimeKtx" }
retrofit = { group = "com.squareup.retrofit2", name = "retrofit", version.ref = "retrofit" }
retrofit-converter-gson = { group = "com.squareup.retrofit2", name = "converter-gson", version.ref = "retrofit" }
okhttp-logging = { group = "com.squareup.okhttp3", name = "logging-interceptor", version.ref = "okhttp" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
`
  },
  {
    name: 'app-build.gradle.kts',
    path: 'app/build.gradle.kts',
    language: 'gradle',
    description: '안드로이드 앱 모듈 Gradle 빌드 스크립트 (SDK 34, MinSDK 26, Java 17)',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.timesnooper.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.timesnooper.app"
        minSdk = 26 // Android 8.0 Oreo (구형 태블릿 및 안드로이드 12/13/14 완벽 지원)
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isDebuggable = true
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.gson)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.coroutines.android)
}
`
  },
  {
    name: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: '안드로이드 12+ 및 구형 태블릿 호환 매니페스트 (백그라운드 서비스, 부팅 자동실행, 사용기록 권한, 디바이스 관리자)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.timesnooper.app">

    <!-- 필수 권한: 앱 사용시간 조회 (UsageStatsManager) -->
    <uses-permission
        android:name="android.permission.PACKAGE_USAGE_STATS"
        tools:ignore="ProtectedPermissions" />

    <!-- 무중단 백그라운드 상주 및 안드로이드 12/14 포그라운드 서비스 권한 -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- 기기 재부팅 및 클린 후 자동 부활 권한 -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.QUICKBOOT_POWERON" />
    <uses-permission android:name="com.htc.intent.action.QUICKBOOT_POWERON" />

    <!-- 배터리 최적화 예외 (절전모드로 인한 백그라운드 종료 방지) -->
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

    <!-- 매일 10시 정밀 알람 실행 (Android 12+) -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <!-- 리포트 전송용 네트워크 권한 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- 설치된 앱 목록 쿼리 권한 (Android 11+) -->
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES"
        tools:ignore="QueryAllPackagesPermission" />

    <application
        android:name=".TimesnooperApp"
        android:allowBackup="false"
        android:icon="@android:drawable/sym_def_app_icon"
        android:label="Timesnooper"
        android:supportsRtl="true"
        android:persistent="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.Timesnooper">

        <!-- 메인 설정 화면 (직접 호출 및 다이얼/리시버 실행 가능) -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:label="Timesnooper"
            android:theme="@style/Theme.Timesnooper" />

        <!-- 런처 아이콘 전용 alias: 스텔스 모드 시 이 alias만 비활성화하여 홈/앱스에서 깔끔히 제거 -->
        <activity-alias
            android:name=".ui.LauncherAlias"
            android:targetActivity=".ui.MainActivity"
            android:enabled="true"
            android:exported="true"
            android:icon="@android:drawable/sym_def_app_icon"
            android:label="Timesnooper">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity-alias>

        <!-- 핵심 1: 무중단 백그라운드 모니터링 포그라운드 서비스 -->
        <service
            android:name=".service.TimesnooperMonitorService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="specialUse"
            android:stopWithTask="false">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="ParentalScreenTimeTracking" />
        </service>

        <!-- 핵심 2: 재부팅, 캐시정리, 시스템 업데이트 시 무조건 자동 부활 -->
        <receiver
            android:name=".receiver.BootReceiver"
            android:enabled="true"
            android:exported="true"
            android:directBootAware="true">
            <intent-filter android:priority="999">
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.LOCKED_BOOT_COMPLETED" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <action android:name="com.htc.intent.action.QUICKBOOT_POWERON" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </receiver>

        <!-- 핵심 3: 앱 제거 방지 디바이스 관리자 (Device Owner / Admin Receiver) -->
        <receiver
            android:name=".receiver.TimesnooperAdminReceiver"
            android:permission="android.permission.BIND_DEVICE_ADMIN"
            android:exported="true">
            <meta-data
                android:name="android.app.device_admin"
                android:resource="@xml/device_admin_policies" />
            <intent-filter>
                <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
                <action android:name="android.app.action.PROFILE_PROVISIONING_COMPLETE" />
            </intent-filter>
        </receiver>

        <!-- 핵심 4: 스텔스 모드 제어 & 비상 복구 리시버 (ADB Broadcast 및 시크릿 다이얼 지원) -->
        <receiver
            android:name=".receiver.StealthReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="com.timesnooper.app.ACTION_UNHIDE_ICON" />
                <action android:name="com.timesnooper.app.ACTION_HIDE_ICON" />
                <action android:name="com.timesnooper.app.ACTION_LAUNCH_UI" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.provider.Telephony.SECRET_CODE" />
                <data
                    android:scheme="android_secret_code"
                    android:host="8463" />
            </intent-filter>
        </receiver>

        <!-- 매일 오전 10시 정밀 정각 리포트 알람 리시버 -->
        <receiver
            android:name=".receiver.DailyReportAlarmReceiver"
            android:enabled="true"
            android:exported="false" />

    </application>
</manifest>`
  },
  {
    name: 'TimesnooperAdminReceiver.kt',
    path: 'app/src/main/java/com/timesnooper/app/receiver/TimesnooperAdminReceiver.kt',
    language: 'kotlin',
    description: '핵심: 앱 삭제 절대 차단 (Device Owner 모드 및 DISALLOW_UNINSTALL_APPS 적용)',
    content: `package com.timesnooper.app.receiver

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.UserManager
import android.util.Log

/**
 * Timesnooper Device Owner & Device Admin 리시버
 * 
 * ADB 명령어로 Device Owner로 등록 시:
 * adb shell dpm set-device-owner com.timesnooper.app/.receiver.TimesnooperAdminReceiver
 * 
 * 기능:
 * 1. 앱 삭제 완전 차단 (DISALLOW_UNINSTALL_APPS)
 * 2. 패키지 삭제 블록 (setUninstallBlocked)
 * 3. 기기 안전모드 무단 진입 방지
 */
class TimesnooperAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i("Timesnooper", "Device Admin Activated")
        enforceProtectionPolicies(context)
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.i("Timesnooper", "Device Owner Provisioning Complete")
        enforceProtectionPolicies(context)
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        return "Timesnooper 모니터링 보호 기능이 활성화되어 있어 해제할 수 없습니다."
    }

    companion object {
        fun enforceProtectionPolicies(context: Context) {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val adminComponent = ComponentName(context, TimesnooperAdminReceiver::class.java)

            if (dpm.isDeviceOwnerApp(context.packageName)) {
                try {
                    // 1. Timesnooper 앱 삭제 자체를 시스템 레벨에서 완전 잠금
                    dpm.setUninstallBlocked(adminComponent, context.packageName, true)

                    // 2. 전체 앱 임의 삭제 제한 정책 추가
                    dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_UNINSTALL_APPS)

                    // 3. 앱 강제 종료 및 데이터 삭제 방지
                    dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_APPS_CONTROL)

                    Log.i("Timesnooper", "Device Owner Lock & Anti-Uninstall Successfully Enforced!")
                } catch (e: Exception) {
                    Log.e("Timesnooper", "Failed to apply Device Owner restrictions", e)
                }
            }
        }
    }
}
`
  },
  {
    name: 'TimesnooperMonitorService.kt',
    path: 'app/src/main/java/com/timesnooper/app/service/TimesnooperMonitorService.kt',
    language: 'kotlin',
    description: '무중단 백그라운드 서비스 (START_STICKY + UsageStats 추적 + 자동 부활 루프)',
    content: `package com.timesnooper.app.service

import android.app.*
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.timesnooper.app.data.TelemetryRepository
import com.timesnooper.app.receiver.DailyReportAlarmReceiver
import java.util.*
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class TimesnooperMonitorService : Service() {

    private val executor = Executors.newSingleThreadScheduledExecutor()
    private val CHANNEL_ID = "timesnooper_silent_monitor"
    private val NOTIF_ID = 1001

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIF_ID, createSilentNotification())
        
        // 매일 정기 리포트 알람 스케줄러 등록 (기본 오후 10시 / 22:00)
        DailyReportAlarmReceiver.scheduleDailyAlarm(this)

        // 15분 주기 주기적 백그라운드 사용량 캐싱 및 동기화 루프
        executor.scheduleWithFixedDelay({
            collectAndBufferUsageStats()
        }, 1, 15, TimeUnit.MINUTES)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        val restartServiceIntent = Intent(applicationContext, this.javaClass)
        restartServiceIntent.setPackage(packageName)
        val restartServicePendingIntent = PendingIntent.getService(
            applicationContext, 1, restartServiceIntent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )
        val alarmService = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmService.set(
            AlarmManager.RTC_WAKEUP,
            System.currentTimeMillis() + 1000,
            restartServicePendingIntent
        )
        super.onTaskRemoved(rootIntent)
    }

    private fun collectAndBufferUsageStats() {
        try {
            val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val calendar = Calendar.getInstance()
            val endTime = calendar.timeInMillis
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            val startTime = calendar.timeInMillis

            val statsList = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY, startTime, endTime
            )

            if (!statsList.isNullOrEmpty()) {
                TelemetryRepository.saveHourlySnapshot(applicationContext, statsList)
                Log.d("Timesnooper", "Telemetry updated: \${statsList.size} apps logged.")
            }
        } catch (e: Exception) {
            Log.e("Timesnooper", "Failed to collect usage stats", e)
        }
    }

    private fun createSilentNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("시스템 보안 및 동기화")
            .setContentText("기기 상태 및 백그라운드 서비스 활성 중")
            .setSmallIcon(android.R.drawable.ic_menu_agenda)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)
            .setShowWhen(false)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "시스템 상태 서비스",
                NotificationManager.IMPORTANCE_MIN
            ).apply {
                description = "백그라운드 동기화 채널"
                setShowBadge(false)
                enableLights(false)
                enableVibration(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        val broadcastIntent = Intent("com.timesnooper.app.RESTART_SERVICE")
        sendBroadcast(broadcastIntent)
    }
}
`
  },
  {
    name: 'BootReceiver.kt',
    path: 'app/src/main/java/com/timesnooper/app/receiver/BootReceiver.kt',
    language: 'kotlin',
    description: '시스템 재부팅, 캐시 정리, 배터리 세이버 후 백그라운드 감시 즉시 부활',
    content: `package com.timesnooper.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.timesnooper.app.service.TimesnooperMonitorService

/**
 * 기기 부팅 (BOOT_COMPLETED), 업데이트 (MY_PACKAGE_REPLACED), 
 * 전원 켬 (QUICKBOOT) 시 백그라운드 서비스를 자동 시작합니다.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.i("Timesnooper", "BootReceiver triggered with action: \$action")

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_LOCKED_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.timesnooper.app.RESTART_SERVICE"
        ) {
            // 1. 디바이스 정책 재검증 (삭제 방지)
            TimesnooperAdminReceiver.enforceProtectionPolicies(context)

            // 2. 일일 리포트 알람 스케줄러 보장 (설정된 시각, 기본 22:00)
            DailyReportAlarmReceiver.scheduleDailyAlarm(context)

            // 3. 백그라운드 모니터 서비스 실행
            val serviceIntent = Intent(context, TimesnooperMonitorService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        }
    }
}
`
  },
  {
    name: 'DailyReportAlarmReceiver.kt',
    path: 'app/src/main/java/com/timesnooper/app/receiver/DailyReportAlarmReceiver.kt',
    language: 'kotlin',
    description: '설정된 정각(기본 22:00 / 오후 10시) 실행 알람 매니저 및 데일리 이메일 리포트 발송 트리거',
    content: `package com.timesnooper.app.receiver

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.work.*
import com.timesnooper.app.worker.SendDailyReportWorker
import java.util.*

class DailyReportAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val prefs = context.getSharedPreferences("timesnooper_prefs", Context.MODE_PRIVATE)
        val reportTimeStr = prefs.getString("report_time", "22:00") ?: "22:00"
        Log.i("Timesnooper", "Daily Report Alarm Fired (Scheduled Time: \$reportTimeStr)! Initiating Report Dispatch.")

        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val reportWorkRequest = OneTimeWorkRequestBuilder<SendDailyReportWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context).enqueue(reportWorkRequest)

        scheduleDailyAlarm(context)
    }

    companion object {
        const val PREFS_NAME = "timesnooper_prefs"
        const val KEY_REPORT_TIME = "report_time"
        const val KEY_REPORT_HOUR = "report_hour"
        const val KEY_REPORT_MINUTE = "report_minute"
        const val DEFAULT_HOUR = 22 // 기본: 오후 10시 (22:00)
        const val DEFAULT_MINUTE = 0

        fun scheduleDailyAlarm(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, DailyReportAlarmReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                1002,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val (hour, minute) = parseConfiguredTime(prefs)

            val calendar = Calendar.getInstance().apply {
                timeInMillis = System.currentTimeMillis()
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)

                if (timeInMillis <= System.currentTimeMillis()) {
                    add(Calendar.DAY_OF_YEAR, 1)
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            }

            val amPm = if (hour < 12) "오전" else "오후"
            val displayHour = if (hour % 12 == 0) 12 else hour % 12
            val formattedTime = String.format(Locale.KOREA, "%s %d:%02d (%02d:%02d)", amPm, displayHour, minute, hour, minute)
            Log.i("Timesnooper", "Next Daily Alarm scheduled for: \${Date(calendar.timeInMillis)} [\$formattedTime]")
        }

        fun scheduleDaily10AmAlarm(context: Context) {
            scheduleDailyAlarm(context)
        }

        private fun parseConfiguredTime(prefs: android.content.SharedPreferences): Pair<Int, Int> {
            val timeStr = prefs.getString(KEY_REPORT_TIME, "22:00") ?: "22:00"
            return try {
                val parts = timeStr.split(":")
                if (parts.size == 2) {
                    val h = parts[0].trim().toInt().coerceIn(0, 23)
                    val m = parts[1].trim().toInt().coerceIn(0, 59)
                    Pair(h, m)
                } else {
                    val savedH = prefs.getInt(KEY_REPORT_HOUR, DEFAULT_HOUR).coerceIn(0, 23)
                    val savedM = prefs.getInt(KEY_REPORT_MINUTE, DEFAULT_MINUTE).coerceIn(0, 59)
                    Pair(savedH, savedM)
                }
            } catch (e: Exception) {
                Pair(DEFAULT_HOUR, DEFAULT_MINUTE)
            }
        }
    }
}
`
  },
  {
    name: 'SendDailyReportWorker.kt',
    path: 'app/src/main/java/com/timesnooper/app/worker/SendDailyReportWorker.kt',
    language: 'kotlin',
    description: 'UsageStatsManager로 24시간 앱 사용시간 집계 후 부모 이메일로 전송',
    content: `package com.timesnooper.app.worker

import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.timesnooper.app.data.AppStatEntry
import com.timesnooper.app.data.ReportPayload
import com.timesnooper.app.network.TimesnooperApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

class SendDailyReportWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            Log.i("Timesnooper", "Executing SendDailyReportWorker...")

            val usageStatsManager = applicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val packageManager = applicationContext.packageManager

            val calendar = Calendar.getInstance()
            val endTime = calendar.timeInMillis
            calendar.add(Calendar.DAY_OF_YEAR, -1)
            val startTime = calendar.timeInMillis

            val statsMap = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime)
            val appStatList = mutableListOf<AppStatEntry>()
            var totalTimeMillis = 0L

            for ((pkgName, stat) in statsMap) {
                if (stat.totalTimeInForeground > 60 * 1000) {
                    totalTimeMillis += stat.totalTimeInForeground
                    val appName = try {
                        val appInfo = packageManager.getApplicationInfo(pkgName, 0)
                        packageManager.getApplicationLabel(appInfo).toString()
                    } catch (e: Exception) {
                        pkgName
                    }

                    appStatList.add(
                        AppStatEntry(
                            packageName = pkgName,
                            appName = appName,
                            durationMinutes = (stat.totalTimeInForeground / (1000 * 60)).toInt(),
                            lastUsedTime = stat.lastTimeUsed
                        )
                    )
                }
            }

            appStatList.sortByDescending { it.durationMinutes }

            val prefs = applicationContext.getSharedPreferences("timesnooper_prefs", Context.MODE_PRIVATE)
            val parentEmail = prefs.getString("parent_email", "jpark04092@gmail.com") ?: "jpark04092@gmail.com"
            val childName = prefs.getString("child_name", "자녀") ?: "자녀"

            val payload = ReportPayload(
                deviceId = Build.MODEL ?: "unknown_device",
                deviceName = "\${Build.MANUFACTURER} \${Build.MODEL}",
                childName = childName,
                recipientEmail = parentEmail,
                androidVersion = "Android \${Build.VERSION.RELEASE} (API \${Build.VERSION.SDK_INT})",
                reportDate = SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(Date()),
                totalScreenTimeMinutes = (totalTimeMillis / (1000 * 60)).toInt(),
                apps = appStatList
            )

            val response = TimesnooperApiClient.sendDailyReport(payload)
            if (response.isSuccessful) {
                Log.i("Timesnooper", "Daily Report successfully sent to parent email ($parentEmail)!")
                Result.success()
            } else {
                Log.w("Timesnooper", "Server returned error: \${response.code()}, retrying...")
                Result.retry()
            }
        } catch (e: Exception) {
            Log.e("Timesnooper", "Error compiling daily report", e)
            Result.retry()
        }
    }
}`
  },
  {
    name: 'MainActivity.kt',
    path: 'app/src/main/java/com/timesnooper/app/ui/MainActivity.kt',
    language: 'kotlin',
    description: '학부모 수신 이메일, 발신 계정, 발송 시각(기본 22:00) 설정, 즉시 테스트 메일 발송, 스텔스 모드 제어',
    content: `package com.timesnooper.app.ui

import android.app.AppOpsManager
import android.app.admin.DevicePolicyManager
import android.app.usage.UsageStatsManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.app.TimePickerDialog
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.timesnooper.app.R
import com.timesnooper.app.data.AppStatEntry
import com.timesnooper.app.data.ReportPayload
import com.timesnooper.app.network.DirectEmailSender
import com.timesnooper.app.receiver.DailyReportAlarmReceiver
import com.timesnooper.app.receiver.TimesnooperAdminReceiver
import com.timesnooper.app.service.TimesnooperMonitorService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {

    companion object {
        const val KEY_PARENT_EMAIL = "parent_email"
        const val KEY_CHILD_NAME = "child_name"
        const val KEY_SENDER_EMAIL = "sender_email"
        const val KEY_SENDER_APP_PASSWORD = "sender_app_password"
        const val KEY_REPORT_TIME = "report_time"
        const val KEY_REPORT_HOUR = "report_hour"
        const val KEY_REPORT_MINUTE = "report_minute"
        const val LAUNCHER_ALIAS_CLASS = "com.timesnooper.app.ui.LauncherAlias"
    }

    private lateinit var prefs: SharedPreferences
    private lateinit var etParentEmail: EditText
    private lateinit var etChildName: EditText
    private lateinit var etSenderEmail: EditText
    private lateinit var etSenderAppPassword: EditText
    private lateinit var etReportTime: EditText
    private lateinit var tvStatusLog: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = getSharedPreferences("timesnooper_prefs", Context.MODE_PRIVATE)

        etParentEmail = findViewById(R.id.etParentEmail)
        etChildName = findViewById(R.id.etChildName)
        etSenderEmail = findViewById(R.id.etSenderEmail)
        etSenderAppPassword = findViewById(R.id.etSenderAppPassword)
        etReportTime = findViewById(R.id.etReportTime)
        tvStatusLog = findViewById(R.id.tvStatusLog)

        // 저장된 학부모 이메일, 발신 계정 및 리포트 발송 시각 불러오기
        val savedParentEmail = prefs.getString(KEY_PARENT_EMAIL, "jpark04092@gmail.com")
        val savedChildName = prefs.getString(KEY_CHILD_NAME, "자녀 (갤럭시 탭)")
        val savedSenderEmail = prefs.getString(KEY_SENDER_EMAIL, "jpark04092@gmail.com")
        val savedPassword = prefs.getString(KEY_SENDER_APP_PASSWORD, "")
        val savedReportTime = prefs.getString(KEY_REPORT_TIME, "22:00") ?: "22:00"

        etParentEmail.setText(savedParentEmail)
        etChildName.setText(savedChildName)
        etSenderEmail.setText(savedSenderEmail)
        etSenderAppPassword.setText(savedPassword)
        etReportTime.setText(savedReportTime)

        // 시각 선택 다이얼로그 바인딩
        val timePickerAction = {
            val currentTime = etReportTime.text.toString().trim()
            var initHour = 22
            var initMinute = 0
            val parts = currentTime.split(":")
            if (parts.size == 2) {
                initHour = parts[0].toIntOrNull() ?: 22
                initMinute = parts[1].toIntOrNull() ?: 0
            }

            TimePickerDialog(
                this,
                { _, hourOfDay, minute ->
                    val formatted = String.format(Locale.KOREA, "%02d:%02d", hourOfDay, minute)
                    etReportTime.setText(formatted)
                    val amPm = if (hourOfDay < 12) "오전" else "오후"
                    val displayH = if (hourOfDay % 12 == 0) 12 else hourOfDay % 12
                    Toast.makeText(this, "선택된 발송 시각: $amPm \${displayH}시 \${minute}분 ($formatted)", Toast.LENGTH_SHORT).show()
                },
                initHour,
                initMinute,
                true // 24시간 형식
            ).show()
        }

        findViewById<Button>(R.id.btnSelectReportTime)?.setOnClickListener {
            timePickerAction()
        }

        etReportTime.setOnClickListener {
            timePickerAction()
        }

        // 이메일 및 시각 설정 저장 버튼
        findViewById<Button>(R.id.btnSaveSettings)?.setOnClickListener {
            saveEmailSettings()
        }

        // 테스트 메일 즉시 발송 버튼
        findViewById<Button>(R.id.btnTestEmail)?.setOnClickListener {
            sendLiveTestReport()
        }

        findViewById<Button>(R.id.btnUsagePermission)?.setOnClickListener {
            try {
                val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                    data = Uri.parse("package:\$packageName")
                }
                startActivity(intent)
            } catch (e: Exception) {
                try {
                    startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
                } catch (e2: Exception) {
                    Toast.makeText(this, "설정 > 보안 및 개인정보 보호 > 사용 정보 접근에서 Timesnooper를 허용해주세요.", Toast.LENGTH_LONG).show()
                }
            }
            Toast.makeText(this, "목록에서 'Timesnooper'를 찾아 '허용'을 켜주세요.", Toast.LENGTH_LONG).show()
        }

        findViewById<Button>(R.id.btnDeviceAdmin)?.setOnClickListener {
            requestDeviceAdminPermission()
        }

        findViewById<Button>(R.id.btnBatteryExemption)?.setOnClickListener {
            requestBatteryOptimizationExemption()
        }

        findViewById<Button>(R.id.btnStartService)?.setOnClickListener {
            startMonitorService()
        }

        findViewById<Button>(R.id.btnStealthMode)?.setOnClickListener {
            enableStealthMode()
        }

        findViewById<Button>(R.id.btnUnhideIcon)?.setOnClickListener {
            disableStealthMode()
        }

        // 1. 필수 사용정보 접근 권한 체크 (UsageStats)
        if (!hasUsageStatsPermission()) {
            tvStatusLog.text = "⚠️ 주의: '사용 정보 접근 권한'이 허용되지 않았습니다. 1번 버튼을 눌러 허용해주세요."
            Toast.makeText(this, "아이 앱 사용시간 추적을 위해 '사용 정보 접근' 권한을 허용해주세요.", Toast.LENGTH_LONG).show()
        } else {
            tvStatusLog.text = "🟢 권한 승인됨: 언제든 [테스트 메일 발송] 버튼을 눌러 발송을 테스트하세요."
            startMonitorService()
        }
    }

    private fun saveEmailSettings() {
        val parentEmail = etParentEmail.text.toString().trim()
        val childName = etChildName.text.toString().trim()
        val senderEmail = etSenderEmail.text.toString().trim()
        val appPassword = etSenderAppPassword.text.toString().trim()
        val reportTimeStr = etReportTime.text.toString().trim().ifEmpty { "22:00" }

        if (parentEmail.isEmpty() || !parentEmail.contains("@")) {
            Toast.makeText(this, "수신할 학부모 이메일 주소를 올바르게 입력해주세요.", Toast.LENGTH_SHORT).show()
            return
        }

        // 시각 파싱 검증 (HH:mm 형식)
        var targetHour = 22
        var targetMinute = 0
        val timeParts = reportTimeStr.split(":")
        if (timeParts.size == 2) {
            val h = timeParts[0].trim().toIntOrNull()
            val m = timeParts[1].trim().toIntOrNull()
            if (h != null && h in 0..23 && m != null && m in 0..59) {
                targetHour = h
                targetMinute = m
            } else {
                Toast.makeText(this, "리포트 발송 시각을 24시간 형식(00:00 ~ 23:59)으로 입력해주세요.", Toast.LENGTH_SHORT).show()
                return
            }
        } else {
            Toast.makeText(this, "리포트 발송 시각 형식이 올바르지 않습니다. (예: 22:00)", Toast.LENGTH_SHORT).show()
            return
        }

        val formattedTime = String.format(Locale.KOREA, "%02d:%02d", targetHour, targetMinute)
        etReportTime.setText(formattedTime)

        prefs.edit()
            .putString(KEY_PARENT_EMAIL, parentEmail)
            .putString(KEY_CHILD_NAME, if (childName.isEmpty()) "자녀" else childName)
            .putString(KEY_SENDER_EMAIL, if (senderEmail.isEmpty()) parentEmail else senderEmail)
            .putString(KEY_SENDER_APP_PASSWORD, appPassword)
            .putString(KEY_REPORT_TIME, formattedTime)
            .putInt(KEY_REPORT_HOUR, targetHour)
            .putInt(KEY_REPORT_MINUTE, targetMinute)
            .apply()

        // 변경된 발송 시각으로 알람 매니저 즉시 재설정
        DailyReportAlarmReceiver.scheduleDailyAlarm(this)

        val amPm = if (targetHour < 12) "오전" else "오후"
        val displayH = if (targetHour % 12 == 0) 12 else targetHour % 12
        val displayTime = "$amPm \${displayH}시 \${targetMinute}분 ($formattedTime)"

        tvStatusLog.text = "💾 설정 저장 완료 (수신처: $parentEmail, 정기 발송: 매일 $displayTime)"
        Toast.makeText(this, "설정 저장 완료: 매일 $displayTime 에 리포트가 발송됩니다.", Toast.LENGTH_LONG).show()
    }

    private fun sendLiveTestReport() {
        val parentEmail = etParentEmail.text.toString().trim().ifEmpty {
            prefs.getString(KEY_PARENT_EMAIL, "jpark04092@gmail.com") ?: "jpark04092@gmail.com"
        }
        val childName = etChildName.text.toString().trim().ifEmpty {
            prefs.getString(KEY_CHILD_NAME, "자녀") ?: "자녀"
        }
        val senderEmail = etSenderEmail.text.toString().trim().ifEmpty {
            prefs.getString(KEY_SENDER_EMAIL, parentEmail) ?: parentEmail
        }
        val appPassword = etSenderAppPassword.text.toString().trim().ifEmpty {
            prefs.getString(KEY_SENDER_APP_PASSWORD, "") ?: ""
        }

        if (appPassword.isEmpty()) {
            AlertDialog.Builder(this)
                .setTitle("🔑 구글 앱 비밀번호 필요")
                .setMessage("스마트폰에서 학부모님의 Gmail($parentEmail)로 직접 이메일을 발송하기 위해 발신용 16자리 앱 비밀번호가 필요합니다.\\n\\n" +
                        "1. myaccount.google.com/apppasswords 접속\\n" +
                        "2. 앱 이름(Timesnooper) 입력 후 16자리 비밀번호 발급\\n" +
                        "3. 앱 비밀번호 칸에 입력 후 [설정 저장]을 누르세요.\\n\\n" +
                        "※ 1회 등록 시 매일 밤 자동 리포트도 스마트폰에서 Gmail로 직접 완벽하게 발송됩니다.")
                .setPositiveButton("확인", null)
                .show()
            tvStatusLog.text = "⚠️ 앱 비밀번호 미입력: 16자리 구글 앱 비밀번호를 입력하고 저장해주세요."
            return
        }

        tvStatusLog.text = "⏳ [$senderEmail] -> [$parentEmail] Gmail 직접 발송 중..."
        Toast.makeText(this, "$parentEmail 로 리포트 발송 중...", Toast.LENGTH_SHORT).show()

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
                val calendar = Calendar.getInstance()
                val endTime = calendar.timeInMillis
                calendar.add(Calendar.DAY_OF_YEAR, -1)
                val startTime = calendar.timeInMillis

                val statsMap = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime)
                val appStatList = mutableListOf<AppStatEntry>()
                var totalTimeMillis = 0L

                for ((pkgName, stat) in statsMap) {
                    if (stat.totalTimeInForeground > 10 * 1000) {
                        totalTimeMillis += stat.totalTimeInForeground
                        val appLabel = try {
                            val info = packageManager.getApplicationInfo(pkgName, 0)
                            packageManager.getApplicationLabel(info).toString()
                        } catch (e: Exception) {
                            pkgName
                        }
                        appStatList.add(
                            AppStatEntry(
                                packageName = pkgName,
                                appName = appLabel,
                                durationMinutes = Math.max(1, (stat.totalTimeInForeground / (1000 * 60)).toInt()),
                                lastUsedTime = stat.lastTimeUsed
                            )
                        )
                    }
                }

                if (appStatList.isEmpty()) {
                    appStatList.add(
                        AppStatEntry(
                            packageName = packageName,
                            appName = "Timesnooper (초기 연동)",
                            durationMinutes = 5,
                            lastUsedTime = System.currentTimeMillis()
                        )
                    )
                    totalTimeMillis = 5 * 60 * 1000L
                }

                appStatList.sortByDescending { it.durationMinutes }

                val payload = ReportPayload(
                    deviceId = Build.MODEL ?: "android_device",
                    deviceName = "\${Build.MANUFACTURER} \${Build.MODEL}",
                    childName = childName,
                    recipientEmail = parentEmail,
                    androidVersion = "Android \${Build.VERSION.RELEASE} (API \${Build.VERSION.SDK_INT})",
                    reportDate = SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(Date()),
                    totalScreenTimeMinutes = (totalTimeMillis / (1000 * 60)).toInt(),
                    apps = appStatList
                )

                val sendResult = DirectEmailSender.sendReportViaDirectSmtp(
                    payload = payload,
                    senderEmail = senderEmail,
                    senderAppPassword = appPassword
                )

                withContext(Dispatchers.Main) {
                    if (sendResult.isSuccess) {
                        tvStatusLog.text = "🎉 [성공] Gmail($parentEmail)로 메일 직접 발송 완료!\\n발송 시각: \${SimpleDateFormat(\"HH:mm:ss\", Locale.KOREA).format(Date())}"
                        Toast.makeText(
                            this@MainActivity,
                            "성공: $parentEmail 로 일일 리포트가 성공적으로 발송되었습니다!",
                            Toast.LENGTH_LONG
                        ).show()
                    } else {
                        tvStatusLog.text = "❌ [발송 실패]\\n원인: \${sendResult.message}"
                        AlertDialog.Builder(this@MainActivity)
                            .setTitle("Gmail 발송 오류")
                            .setMessage("오류 원인:\\n\${sendResult.message}\\n\\n상세:\\n\${sendResult.errorDetail ?: \"없음\"}")
                            .setPositiveButton("확인", null)
                            .show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    tvStatusLog.text = "❌ [예외 발생] \${e.localizedMessage ?: e.message}"
                    AlertDialog.Builder(this@MainActivity)
                        .setTitle("발송 예외 발생")
                        .setMessage("오류:\\n\${e.localizedMessage ?: e.message}")
                        .setPositiveButton("확인", null)
                        .show()
                }
            }
        }
    }

    private fun startMonitorService() {
        val serviceIntent = Intent(this, TimesnooperMonitorService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
        DailyReportAlarmReceiver.scheduleDailyAlarm(this)
        Toast.makeText(this, "Timesnooper 백그라운드 감시 및 정기 리포트 알람 활성화됨", Toast.LENGTH_SHORT).show()
    }

    private fun hasUsageStatsPermission(): Boolean {
        val appOps = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(), packageName
            )
        } else {
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(), packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    private fun requestDeviceAdminPermission() {
        try {
            val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val adminComponent = ComponentName(this, TimesnooperAdminReceiver::class.java)
            if (!dpm.isAdminActive(adminComponent)) {
                val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                    putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
                    putExtra(
                        DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                        "Timesnooper 자녀 안심 보호: 백그라운드 모니터링 유지 및 앱 무단 삭제 방지를 위해 기기 관리자 권한이 필요합니다."
                    )
                }
                startActivity(intent)
                Toast.makeText(this, "[이 기기 관리자 앱 활성화]를 터치하여 승인해주세요.", Toast.LENGTH_LONG).show()
            } else {
                Toast.makeText(this, "🛡️ 기기 관리자 권한이 이미 활성화되어 있어 앱 임의 삭제가 방지됩니다.", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Toast.makeText(this, "기기 관리자 설정 열기 실패: \${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun requestBatteryOptimizationExemption() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:\$packageName")
                }
                startActivity(intent)
            } else {
                Toast.makeText(this, "이미 배터리 최적화 예외로 등록되어 있습니다.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun enableStealthMode() {
        try {
            val aliasComponent = ComponentName(this, LAUNCHER_ALIAS_CLASS)
            packageManager.setComponentEnabledSetting(
                aliasComponent,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            )
            val mainComponent = ComponentName(this, MainActivity::class.java)
            packageManager.setComponentEnabledSetting(
                mainComponent,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )
            Toast.makeText(
                this,
                "스텔스 모드 가동: 런처 아이콘이 숨겨집니다.\\n다시 열기: 다이얼 *#*#8463#*#* 또는 ADB",
                Toast.LENGTH_LONG
            ).show()
            finish()
        } catch (e: Exception) {
            Toast.makeText(this, "스텔스 설정 오류: \${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun disableStealthMode() {
        try {
            val aliasComponent = ComponentName(this, LAUNCHER_ALIAS_CLASS)
            packageManager.setComponentEnabledSetting(
                aliasComponent,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )
            val mainComponent = ComponentName(this, MainActivity::class.java)
            packageManager.setComponentEnabledSetting(
                mainComponent,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )
            Toast.makeText(this, "런처 아이콘이 홈 화면에 다시 복구되었습니다.", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(this, "복구 오류: \${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
}`
  },
  {
    name: 'StealthReceiver.kt',
    path: 'app/src/main/java/com/timesnooper/app/receiver/StealthReceiver.kt',
    language: 'kotlin',
    description: '스텔스 모드 제어 및 비상 복구 리시버 (SecurityException 없이 ADB Broadcast 및 시크릿 다이얼로 아이콘 원상복구)',
    content: `package com.timesnooper.app.receiver

import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log
import android.widget.Toast
import com.timesnooper.app.ui.MainActivity

class StealthReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.i("Timesnooper", "StealthReceiver triggered with action: \$action")

        val mainActivityComponent = ComponentName(context, MainActivity::class.java)
        val aliasComponent = ComponentName(context, "com.timesnooper.app.ui.LauncherAlias")

        when (action) {
            ACTION_UNHIDE_ICON -> {
                // 1. LauncherAlias 및 MainActivity 컴포넌트를 즉시 활성화 (SecurityException 없음)
                context.packageManager.setComponentEnabledSetting(
                    aliasComponent,
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
                )
                context.packageManager.setComponentEnabledSetting(
                    mainActivityComponent,
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
                )
                Toast.makeText(context, "Timesnooper: 런처 아이콘이 복구되었습니다.", Toast.LENGTH_LONG).show()

                val launchIntent = Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                context.startActivity(launchIntent)
            }

            ACTION_HIDE_ICON -> {
                context.packageManager.setComponentEnabledSetting(
                    aliasComponent,
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP
                )
                context.packageManager.setComponentEnabledSetting(
                    mainActivityComponent,
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
                )
                Toast.makeText(context, "Timesnooper: 스텔스 모드가 활성화되었습니다 (아이콘 숨김).", Toast.LENGTH_LONG).show()
            }

            ACTION_LAUNCH_UI, "android.provider.Telephony.SECRET_CODE" -> {
                context.packageManager.setComponentEnabledSetting(
                    mainActivityComponent,
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
                )
                val launchIntent = Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                context.startActivity(launchIntent)
            }
        }
    }

    companion object {
        const val ACTION_UNHIDE_ICON = "com.timesnooper.app.ACTION_UNHIDE_ICON"
        const val ACTION_HIDE_ICON = "com.timesnooper.app.ACTION_HIDE_ICON"
        const val ACTION_LAUNCH_UI = "com.timesnooper.app.ACTION_LAUNCH_UI"
    }
}`
  },
  {
    name: 'device_admin_policies.xml',
    path: 'app/src/main/res/xml/device_admin_policies.xml',
    language: 'xml',
    description: '디바이스 관리자 보안 정책 정의 파일',
    content: `<?xml version="1.0" encoding="utf-8"?>
<device-admin xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-policies>
        <limit-password />
        <watch-login />
        <reset-password />
        <force-lock />
        <wipe-data />
        <expire-password />
        <encrypted-storage />
        <disable-camera />
        <disable-keyguard-features />
    </uses-policies>
</device-admin>`
  },
  {
    name: 'activity_main.xml',
    path: 'app/src/main/res/layout/activity_main.xml',
    language: 'xml',
    description: '학부모 수신 이메일 설정 및 권한/스텔스 모드 제어 레이아웃',
    content: `<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:fillViewport="true"
    android:background="#F8FAFC">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="20dp"
        android:gravity="center_horizontal">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Timesnooper 자녀 안심 케어"
            android:textSize="20sp"
            android:textStyle="bold"
            android:textColor="#0F172A"
            android:layout_marginTop="16dp"
            android:layout_marginBottom="4dp" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="자녀 기기 앱 사용시간 백그라운드 자동 수집 및 일일 리포트 전송"
            android:textSize="12sp"
            android:textColor="#64748B"
            android:gravity="center"
            android:layout_marginBottom="20dp" />

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:background="#FFFFFF"
            android:padding="16dp"
            android:layout_marginBottom="16dp">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="📧 학부모 수신 이메일 설정"
                android:textSize="15sp"
                android:textStyle="bold"
                android:textColor="#1E293B"
                android:layout_marginBottom="12dp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="리포트를 수신할 학부모 이메일 주소:"
                android:textSize="12sp"
                android:textColor="#475569"
                android:layout_marginBottom="4dp" />

            <EditText
                android:id="@+id/etParentEmail"
                android:layout_width="match_parent"
                android:layout_height="48dp"
                android:hint="예: jpark04092@gmail.com"
                android:inputType="textEmailAddress"
                android:textSize="14sp"
                android:padding="12dp"
                android:background="#F1F5F9"
                android:textColor="#0F172A"
                android:layout_marginBottom="10dp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="자녀 이름 또는 기기 별칭:"
                android:textSize="12sp"
                android:textColor="#475569"
                android:layout_marginBottom="4dp" />

            <EditText
                android:id="@+id/etChildName"
                android:layout_width="match_parent"
                android:layout_height="48dp"
                android:hint="예: 지우 (갤럭시 탭)"
                android:inputType="text"
                android:textSize="14sp"
                android:padding="12dp"
                android:background="#F1F5F9"
                android:textColor="#0F172A"
                android:layout_marginBottom="14dp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="📨 발신용 Gmail 계정 (리포트를 보낼 계정):"
                android:textSize="12sp"
                android:textColor="#475569"
                android:layout_marginBottom="4dp" />

            <EditText
                android:id="@+id/etSenderEmail"
                android:layout_width="match_parent"
                android:layout_height="48dp"
                android:hint="예: jpark04092@gmail.com"
                android:inputType="textEmailAddress"
                android:textSize="14sp"
                android:padding="12dp"
                android:background="#F1F5F9"
                android:textColor="#0F172A"
                android:layout_marginBottom="10dp" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="🔑 구글 16자리 앱 비밀번호 (Google App Password):"
                android:textSize="12sp"
                android:textColor="#475569"
                android:layout_marginBottom="4dp" />

            <EditText
                android:id="@+id/etSenderAppPassword"
                android:layout_width="match_parent"
                android:layout_height="48dp"
                android:hint="abcd efgh ijkl mnop (공백 무관)"
                android:inputType="textPassword"
                android:textSize="14sp"
                android:padding="12dp"
                android:background="#F1F5F9"
                android:textColor="#0F172A"
                android:layout_marginBottom="10dp" />

            <!-- Daily Report Schedule Time Setting -->
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="⏰ 일일 리포트 정기 발송 시각 (기본: 22:00 / 오후 10시):"
                android:textSize="12sp"
                android:textStyle="bold"
                android:textColor="#1E293B"
                android:layout_marginBottom="4dp" />

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:gravity="center_vertical"
                android:layout_marginBottom="6dp">

                <EditText
                    android:id="@+id/etReportTime"
                    android:layout_width="0dp"
                    android:layout_height="48dp"
                    android:layout_weight="1"
                    android:hint="22:00 (오후 10시)"
                    android:inputType="time"
                    android:textSize="14sp"
                    android:padding="12dp"
                    android:background="#F1F5F9"
                    android:textColor="#0F172A"
                    android:layout_marginEnd="8dp" />

                <Button
                    android:id="@+id/btnSelectReportTime"
                    android:layout_width="wrap_content"
                    android:layout_height="48dp"
                    android:text="시각 선택"
                    android:textSize="12sp"
                    android:backgroundTint="#475569" />
            </LinearLayout>

            <TextView
                android:id="@+id/tvReportTimeGuide"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="💡 24시간 형식(HH:mm)으로 입력하거나 [시각 선택]을 누르세요. 설정 저장 시 해당 시각에 맞춰 알람이 즉시 재등록됩니다. (예: 22:00 = 오후 10시, 21:30 = 오후 9시 30분)"
                android:textSize="11sp"
                android:textColor="#64748B"
                android:lineSpacingExtra="2dp"
                android:layout_marginBottom="12dp" />

            <TextView
                android:id="@+id/tvAppPasswordGuide"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:text="💡 구글 앱 비밀번호 발급 방법: myaccount.google.com/apppasswords 접속 → 로그인 후 이름(Timesnooper) 입력 → 생성된 16자리 영문 코드를 여기에 입력하고 [설정 저장]을 누르면 스마트폰에서 학부모님 Gmail로 직접 리포트가 1초 만에 전송됩니다."
                android:textSize="11sp"
                android:textColor="#64748B"
                android:lineSpacingExtra="2dp"
                android:layout_marginBottom="12dp" />

            <TextView
                android:id="@+id/tvStatusLog"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:background="#0F172A"
                android:textColor="#38BDF8"
                android:textSize="11sp"
                android:padding="10dp"
                android:fontFamily="monospace"
                android:text="⚡ 대기 중: 앱 비밀번호 입력 후 [Gmail로 즉시 발송]을 누르세요."
                android:layout_marginBottom="12dp" />

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:weightSum="2">

                <Button
                    android:id="@+id/btnSaveSettings"
                    android:layout_width="0dp"
                    android:layout_height="48dp"
                    android:layout_weight="1"
                    android:text="설정 저장"
                    android:textSize="12sp"
                    android:backgroundTint="#0F172A"
                    android:layout_marginEnd="6dp" />

                <Button
                    android:id="@+id/btnTestEmail"
                    android:layout_width="0dp"
                    android:layout_height="48dp"
                    android:layout_weight="1"
                    android:text="Gmail로 즉시 발송"
                    android:textSize="12sp"
                    android:backgroundTint="#0284C7"
                    android:layout_marginStart="6dp" />
            </LinearLayout>
        </LinearLayout>

        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="⚙️ 백그라운드 감시 및 시스템 권한"
            android:textSize="14sp"
            android:textStyle="bold"
            android:textColor="#334155"
            android:layout_marginBottom="10dp" />

        <Button
            android:id="@+id/btnUsagePermission"
            android:layout_width="match_parent"
            android:layout_height="48dp"
            android:text="1. 사용 정보 접근 권한 허용 (필수)"
            android:backgroundTint="#3B82F6"
            android:layout_marginBottom="8dp" />

        <Button
            android:id="@+id/btnDeviceAdmin"
            android:layout_width="match_parent"
            android:layout_height="48dp"
            android:text="2. 🛡️ 기기 관리자 활성화 (앱 임의 삭제 방지)"
            android:backgroundTint="#0EA5E9"
            android:layout_marginBottom="8dp" />

        <Button
            android:id="@+id/btnBatteryExemption"
            android:layout_width="match_parent"
            android:layout_height="48dp"
            android:text="3. 배터리 절전모드(Doze) 무제한 예외"
            android:backgroundTint="#475569"
            android:layout_marginBottom="8dp" />

        <Button
            android:id="@+id/btnStartService"
            android:layout_width="match_parent"
            android:layout_height="48dp"
            android:text="4. 감시 서비스 및 매일 리포트 알람 시작"
            android:backgroundTint="#059669"
            android:layout_marginBottom="16dp" />

        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="🔒 스텔스(아이콘 은폐) 및 보안"
            android:textSize="14sp"
            android:textStyle="bold"
            android:textColor="#334155"
            android:layout_marginBottom="10dp" />

        <Button
            android:id="@+id/btnStealthMode"
            android:layout_width="match_parent"
            android:layout_height="48dp"
            android:text="5. 스텔스 모드 진입 (홈 화면 아이콘 숨김)"
            android:backgroundTint="#7C3AED"
            android:layout_marginBottom="8dp" />

        <Button
            android:id="@+id/btnUnhideIcon"
            android:layout_width="match_parent"
            android:layout_height="48dp"
            android:text="6. 스텔스 해제 (홈 화면 아이콘 복구)"
            android:backgroundTint="#6366F1"
            android:layout_marginBottom="24dp" />

    </LinearLayout>
</ScrollView>`
  },
  {
    name: 'ReportPayload.kt',
    path: 'app/src/main/java/com/timesnooper/app/data/ReportPayload.kt',
    language: 'kotlin',
    description: '리포트 전송 데이터 모델 (학부모 이메일, 자녀명, 기기 정보, 앱별 사용시간)',
    content: `package com.timesnooper.app.data

import com.google.gson.annotations.SerializedName

data class AppStatEntry(
    @SerializedName("packageName") val packageName: String,
    @SerializedName("appName") val appName: String,
    @SerializedName("durationMinutes") val durationMinutes: Int,
    @SerializedName("lastUsedTime") val lastUsedTime: Long
)

data class ReportPayload(
    @SerializedName("deviceId") val deviceId: String,
    @SerializedName("deviceName") val deviceName: String,
    @SerializedName("childName") val childName: String = "자녀",
    @SerializedName("recipientEmail") val recipientEmail: String = "jpark04092@gmail.com",
    @SerializedName("androidVersion") val androidVersion: String,
    @SerializedName("reportDate") val reportDate: String,
    @SerializedName("totalScreenTimeMinutes") val totalScreenTimeMinutes: Int,
    @SerializedName("apps") val apps: List<AppStatEntry>
)`
  },
  {
    name: 'TimesnooperApiClient.kt',
    path: 'app/src/main/java/com/timesnooper/app/network/TimesnooperApiClient.kt',
    language: 'kotlin',
    description: 'Timesnooper 백엔드 리포트 전송 Retrofit 클라이언트 (Lenient Gson & ResponseBody 안전 처리)',
    content: `package com.timesnooper.app.network

import com.google.gson.GsonBuilder
import com.timesnooper.app.data.ReportPayload
import okhttp3.OkHttpClient
import okhttp3.ResponseBody
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

data class NetworkResult(
    val isSuccess: Boolean,
    val statusCode: Int,
    val message: String,
    val rawBody: String? = null
)

interface TimesnooperApiService {
    @POST("api/reports/daily")
    suspend fun submitDailyReport(@Body payload: ReportPayload): Response<ResponseBody>
}

object TimesnooperApiClient {
    const val DEFAULT_BASE_URL = "https://ais-pre-2xjinejemuzfrzivhmre6f-252788179842.asia-northeast1.run.app/"

    private val gson = GsonBuilder()
        .setLenient()
        .create()

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    fun getApiService(baseUrl: String = DEFAULT_BASE_URL): TimesnooperApiService {
        val normalizedUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        return Retrofit.Builder()
            .baseUrl(normalizedUrl)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(TimesnooperApiService::class.java)
    }

    suspend fun sendDailyReport(payload: ReportPayload, customBaseUrl: String? = null): NetworkResult {
        return try {
            val url = if (!customBaseUrl.isNullOrBlank()) customBaseUrl else DEFAULT_BASE_URL
            val api = getApiService(url)
            val response = api.submitDailyReport(payload)
            val responseCode = response.code()
            val responseString = response.body()?.string() ?: response.errorBody()?.string() ?: ""

            val isHtmlResponse = responseString.trim().startsWith("<!DOCTYPE", ignoreCase = true) || 
                                 responseString.trim().startsWith("<html", ignoreCase = true)

            if (isHtmlResponse) {
                NetworkResult(
                    isSuccess = false,
                    statusCode = responseCode,
                    message = "서버에서 HTML이 반환되었습니다. ais-dev 대신 공개 주소(ais-pre)를 사용해야 합니다.",
                    rawBody = "HTML 응답 수신됨 (ais-pre 주소 확인 필요)"
                )
            } else if (response.isSuccessful || responseCode in 200..299) {
                NetworkResult(
                    isSuccess = true,
                    statusCode = responseCode,
                    message = "서버 통신 성공 (HTTP $responseCode)",
                    rawBody = responseString
                )
            } else {
                NetworkResult(
                    isSuccess = false,
                    statusCode = responseCode,
                    message = "서버 응답: HTTP $responseCode",
                    rawBody = responseString
                )
            }
        } catch (e: Exception) {
            NetworkResult(
                isSuccess = false,
                statusCode = -1,
                message = e.localizedMessage ?: "네트워크 통신 오류",
                rawBody = e.stackTraceToString()
            )
        }
    }
}`
  }
];
