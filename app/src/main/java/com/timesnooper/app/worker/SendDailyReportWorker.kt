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
                if (stat.totalTimeInForeground > 60 * 1000) { // 1분 이상 사용된 앱만
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
                apps = appStatList
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
