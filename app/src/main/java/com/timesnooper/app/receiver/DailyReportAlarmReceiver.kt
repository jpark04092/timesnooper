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
        Log.i("Timesnooper", "Daily 10:00 AM Alarm Fired! Initiating Report Dispatch.")

        // WorkManager를 통한 신뢰성 있는 백그라운드 리포트 작업 예약 (네트워크 대기)
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val reportWorkRequest = OneTimeWorkRequestBuilder<SendDailyReportWorker>()
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context).enqueue(reportWorkRequest)

        // 내일 오전 10시 알람 재등록 (영구 반복)
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

                // 현재 시간이 이미 오전 10시를 넘었다면 내일 10시로 세팅
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

            Log.i("Timesnooper", "Next Daily 10:00 AM Alarm scheduled for: ${Date(calendar.timeInMillis)}")
        }
    }
}
