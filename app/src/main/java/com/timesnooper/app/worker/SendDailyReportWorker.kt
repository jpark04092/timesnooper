package com.timesnooper.app.worker

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

    companion object {
        const val KEY_IS_THRESHOLD_ALERT = "is_threshold_alert"
        const val KEY_THRESHOLD_MINUTES = "threshold_minutes"
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val isThresholdAlert = inputData.getBoolean(KEY_IS_THRESHOLD_ALERT, false)
            val thresholdMinutes = inputData.getInt(KEY_THRESHOLD_MINUTES, 0)
            Log.i("Timesnooper", "Executing SendDailyReportWorker (isThresholdAlert=$isThresholdAlert, thresholdMinutes=$thresholdMinutes)...")

            val usageStatsManager = applicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val packageManager = applicationContext.packageManager

            val calendar = Calendar.getInstance()
            val endTime = calendar.timeInMillis
            
            // 오늘 00:00:00 기준으로 시작 시각 설정
            val startCal = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            // 만약 자정 직후라 범위가 너무 좁고 정기 리포트인 경우 이전 24시간 범위 fallback
            val startTime = if (!isThresholdAlert && endTime - startCal.timeInMillis < 60 * 60 * 1000L) {
                endTime - (24 * 60 * 60 * 1000L)
            } else {
                startCal.timeInMillis
            }

            val statsMap = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime)
            val appStatList = mutableListOf<AppStatEntry>()
            var totalTimeMillis = 0L

            for ((pkgName, stat) in statsMap) {
                if (stat.totalTimeInForeground > 30 * 1000) { // 30초 이상 사용된 앱
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
                            durationMinutes = Math.max(1, (stat.totalTimeInForeground / (1000 * 60)).toInt()),
                            lastUsedTime = stat.lastTimeUsed
                        )
                    )
                }
            }

            // 사용시간 내림차순 정렬
            appStatList.sortByDescending { it.durationMinutes }

            val prefs = applicationContext.getSharedPreferences("timesnooper_prefs", Context.MODE_PRIVATE)
            val parentEmail = prefs.getString("parent_email", "jpark04092@gmail.com") ?: "jpark04092@gmail.com"
            val childName = prefs.getString("child_name", "자녀") ?: "자녀"
            val senderEmail = prefs.getString("sender_email", parentEmail) ?: parentEmail
            val appPassword = prefs.getString("sender_app_password", "") ?: ""
            val backupSenderEmail = prefs.getString("backup_sender_email", "") ?: ""
            val backupAppPassword = prefs.getString("backup_sender_app_password", "") ?: ""

            val payload = ReportPayload(
                deviceId = Build.MODEL ?: "unknown_device",
                deviceName = "${Build.MANUFACTURER} ${Build.MODEL}",
                childName = childName,
                recipientEmail = parentEmail,
                androidVersion = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})",
                reportDate = SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(Date()),
                totalScreenTimeMinutes = (totalTimeMillis / (1000 * 60)).toInt(),
                apps = appStatList,
                isThresholdAlert = isThresholdAlert,
                thresholdMinutes = thresholdMinutes
            )

            // 1. 1차 주 발송지 시도
            if (appPassword.isNotBlank()) {
                val directResult = com.timesnooper.app.network.DirectEmailSender.sendReportViaDirectSmtp(
                    payload = payload,
                    senderEmail = senderEmail,
                    senderAppPassword = appPassword
                )
                if (directResult.isSuccess) {
                    Log.i("Timesnooper", "Direct Gmail Daily Report successfully sent via primary sender ($senderEmail) to $parentEmail!")
                    return@withContext Result.success()
                } else {
                    Log.w("Timesnooper", "Primary sender failed: ${directResult.message}")
                }
            }

            // 2. 2차 보조 발송지 (Failover) 시도
            if (backupAppPassword.isNotBlank() && backupSenderEmail.isNotBlank()) {
                Log.i("Timesnooper", "Attempting Failover to secondary backup sender: $backupSenderEmail")
                val backupResult = com.timesnooper.app.network.DirectEmailSender.sendReportViaDirectSmtp(
                    payload = payload,
                    senderEmail = backupSenderEmail,
                    senderAppPassword = backupAppPassword
                )
                if (backupResult.isSuccess) {
                    Log.i("Timesnooper", "Direct Gmail Daily Report successfully sent via backup sender ($backupSenderEmail) to $parentEmail!")
                    return@withContext Result.success()
                } else {
                    Log.w("Timesnooper", "Backup sender failed: ${backupResult.message}")
                }
            }

            val result = TimesnooperApiClient.sendDailyReport(payload)
            if (result.isSuccess) {
                Log.i("Timesnooper", "Daily Report successfully sent to parent email ($parentEmail)!")
                Result.success()
            } else {
                Log.w("Timesnooper", "Server report result: ${result.message}")
                Result.success() // avoid infinite retry loop if server returns diagnostic message
            }
        } catch (e: Exception) {
            Log.e("Timesnooper", "Error compiling daily report", e)
            Result.success()
        }
    }
}
