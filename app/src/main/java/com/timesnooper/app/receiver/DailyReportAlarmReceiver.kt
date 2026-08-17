package com.timesnooper.app.receiver

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
        Log.i("Timesnooper", "Daily Report Alarm Fired (Scheduled Time: $reportTimeStr)! Initiating Report Dispatch.")

        // WorkManager를 통한 신뢰성 있는 백그라운드 리포트 작업 예약 (네트워크 대기)
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val reportWorkRequest = OneTimeWorkRequestBuilder<SendDailyReportWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context).enqueue(reportWorkRequest)

        // 다음 날 지정 시각 알람 재등록 (영구 반복)
        scheduleDailyAlarm(context)
    }

    companion object {
        const val PREFS_NAME = "timesnooper_prefs"
        const val KEY_REPORT_TIME = "report_time"
        const val KEY_REPORT_HOUR = "report_hour"
        const val KEY_REPORT_MINUTE = "report_minute"
        const val DEFAULT_HOUR = 22 // 기본: 오후 10시 (22:00)
        const val DEFAULT_MINUTE = 0

        /**
         * 사용자가 설정한 시각(기본 22:00 / 오후 10시)에 맞춰 일일 리포트 알람을 스케줄링합니다.
         */
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

                // 현재 시각이 이미 오늘 발송 시각을 넘겼다면 내일 해당 시각으로 세팅
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
            Log.i("Timesnooper", "Next Daily Alarm scheduled for: ${Date(calendar.timeInMillis)} [$formattedTime]")
        }

        /**
         * 이전 버전 호환성을 위한 래퍼 함수
         */
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

