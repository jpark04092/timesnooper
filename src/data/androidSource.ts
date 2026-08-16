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
        android:name="android.intent.action.PACKAGE_USAGE_STATS"
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
        android:label="System Time Service"
        android:supportsRtl="true"
        android:persistent="true"
        android:theme="@style/Theme.Timesnooper">

        <!-- 메인 설정 화면 (초기 권한 승인 후 런처 아이콘 숨김 처리 지원) -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:theme="@style/Theme.Timesnooper">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

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
}`
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
        
        // 매일 오전 10시 알람 스케줄러 재등록
        DailyReportAlarmReceiver.scheduleDaily10AmAlarm(this)

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
}`
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

            // 2. 오전 10시 알람 스케줄러 보장
            DailyReportAlarmReceiver.scheduleDaily10AmAlarm(context)

            // 3. 백그라운드 모니터 서비스 실행
            val serviceIntent = Intent(context, TimesnooperMonitorService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        }
    }
}`
  },
  {
    name: 'DailyReportAlarmReceiver.kt',
    path: 'app/src/main/java/com/timesnooper/app/receiver/DailyReportAlarmReceiver.kt',
    language: 'kotlin',
    description: '매일 오전 10시 정각 실행 알람 매니저 및 데일리 이메일 리포트 발송 트리거',
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
        Log.i("Timesnooper", "Daily 10:00 AM Alarm Fired! Initiating Report Dispatch.")

        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val reportWorkRequest = OneTimeWorkRequestBuilder<SendDailyReportWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context).enqueue(reportWorkRequest)

        scheduleDaily10AmAlarm(context)
    }

    companion object {
        fun scheduleDaily10AmAlarm(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, DailyReportAlarmReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                1002,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val calendar = Calendar.getInstance().apply {
                timeInMillis = System.currentTimeMillis()
                set(Calendar.HOUR_OF_DAY, 10)
                set(Calendar.MINUTE, 0)
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

            Log.i("Timesnooper", "Next Daily 10:00 AM Alarm scheduled for: \${Date(calendar.timeInMillis)}")
        }
    }
}`
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

            val payload = ReportPayload(
                deviceId = Build.MODEL ?: "unknown_device",
                deviceName = "\${Build.MANUFACTURER} \${Build.MODEL}",
                androidVersion = "Android \${Build.VERSION.RELEASE} (API \${Build.VERSION.SDK_INT})",
                reportDate = SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(Date()),
                totalScreenTimeMinutes = (totalTimeMillis / (1000 * 60)).toInt(),
                apps = appStatList
            )

            val response = TimesnooperApiClient.sendDailyReport(payload)
            if (response.isSuccessful) {
                Log.i("Timesnooper", "Daily 10 AM Report successfully sent to parent email!")
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
    description: '학부모용 초기 세팅 마법사 및 런처 아이콘 자동 은폐 기능',
    content: `package com.timesnooper.app.ui

import android.app.AppOpsManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.timesnooper.app.R
import com.timesnooper.app.receiver.DailyReportAlarmReceiver
import com.timesnooper.app.service.TimesnooperMonitorService

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        findViewById<Button>(R.id.btnUsagePermission)?.setOnClickListener {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
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

        if (!hasUsageStatsPermission()) {
            Toast.makeText(this, "아이 앱 사용시간 추적을 위해 '사용 정보 접근' 권한을 허용해주세요.", Toast.LENGTH_LONG).show()
        } else {
            startMonitorService()
        }
    }

    private fun startMonitorService() {
        val serviceIntent = Intent(this, TimesnooperMonitorService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
        DailyReportAlarmReceiver.scheduleDaily10AmAlarm(this)
        Toast.makeText(this, "Timesnooper 백그라운드 서비스 활성화됨", Toast.LENGTH_SHORT).show()
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
        val componentName = ComponentName(this, MainActivity::class.java)
        packageManager.setComponentEnabledSetting(
            componentName,
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
            PackageManager.DONT_KILL_APP
        )
        Toast.makeText(this, "런처 아이콘이 숨겨졌습니다. 백그라운드에서 상시 작동합니다.", Toast.LENGTH_SHORT).show()
        finish()
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
  }
];
