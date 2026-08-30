package com.timesnooper.app.service

import android.app.*
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.timesnooper.app.data.TelemetryRepository
import com.timesnooper.app.receiver.DailyReportAlarmReceiver
import com.timesnooper.app.worker.SendDailyReportWorker
import java.text.SimpleDateFormat
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

        // 10분 주기 주기적 백그라운드 사용량 캐싱 및 한도 초과 검사 루프
        executor.scheduleWithFixedDelay({
            collectAndBufferUsageStats()
            checkUsageLimitAndTriggerAlert()
        }, 1, 10, TimeUnit.MINUTES)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_CHECK_LIMIT_NOW) {
            executor.execute {
                checkUsageLimitAndTriggerAlert()
            }
        }
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

    private fun checkUsageLimitAndTriggerAlert() {
        try {
            val prefs = getSharedPreferences("timesnooper_prefs", Context.MODE_PRIVATE)
            val limitEnabled = prefs.getBoolean("usage_limit_enabled", false)
            val limitMinutes = prefs.getInt("usage_limit_minutes", 120)

            if (!limitEnabled || limitMinutes <= 0) {
                return
            }

            val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val calendar = Calendar.getInstance()
            val now = calendar.timeInMillis
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val todayStart = calendar.timeInMillis

            val statsMap = usageStatsManager.queryAndAggregateUsageStats(todayStart, now)
            var totalForegroundMillis = 0L
            for ((_, stat) in statsMap) {
                totalForegroundMillis += stat.totalTimeInForeground
            }

            val totalMinutes = (totalForegroundMillis / (1000 * 60)).toInt()
            val todayDateStr = SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(Date())
            val lastAlertDate = prefs.getString("last_limit_alert_date", "") ?: ""

            if (totalMinutes >= limitMinutes && lastAlertDate != todayDateStr) {
                Log.i("Timesnooper", "🚨 [한도 초과 감지] 오늘 사용량: ${totalMinutes}분 (한도: ${limitMinutes}분). 학부모에게 즉시 메일 발송 트리거!")

                // 당일 중복 발송 방지를 위해 오늘 날짜 기록
                prefs.edit().putString("last_limit_alert_date", todayDateStr).apply()

                val constraints = Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()

                val inputData = Data.Builder()
                    .putBoolean(SendDailyReportWorker.KEY_IS_THRESHOLD_ALERT, true)
                    .putInt(SendDailyReportWorker.KEY_THRESHOLD_MINUTES, limitMinutes)
                    .build()

                val workRequest = OneTimeWorkRequestBuilder<SendDailyReportWorker>()
                    .setConstraints(constraints)
                    .setInputData(inputData)
                    .build()

                WorkManager.getInstance(applicationContext).enqueue(workRequest)
            }
        } catch (e: Exception) {
            Log.e("Timesnooper", "Error in checkUsageLimitAndTriggerAlert", e)
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

    companion object {
        const val ACTION_CHECK_LIMIT_NOW = "com.timesnooper.app.ACTION_CHECK_LIMIT_NOW"
    }
}
