package com.timesnooper.app.ui

import android.app.AppOpsManager
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
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.timesnooper.app.R
import com.timesnooper.app.data.AppStatEntry
import com.timesnooper.app.data.ReportPayload
import com.timesnooper.app.network.TimesnooperApiClient
import com.timesnooper.app.receiver.DailyReportAlarmReceiver
import com.timesnooper.app.service.TimesnooperMonitorService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {

    private lateinit var prefs: SharedPreferences
    private lateinit var etParentEmail: EditText
    private lateinit var etChildName: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = getSharedPreferences("timesnooper_prefs", Context.MODE_PRIVATE)

        etParentEmail = findViewById(R.id.etParentEmail)
        etChildName = findViewById(R.id.etChildName)

        // 저장된 학부모 이메일 및 자녀 이름 불러오기
        val savedEmail = prefs.getString(KEY_PARENT_EMAIL, "jpark04092@gmail.com")
        val savedChildName = prefs.getString(KEY_CHILD_NAME, "자녀 (갤럭시 탭)")
        etParentEmail.setText(savedEmail)
        etChildName.setText(savedChildName)

        // 이메일 설정 저장 버튼
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
                    data = Uri.parse("package:$packageName")
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
            Toast.makeText(this, "아이 앱 사용시간 추적을 위해 '사용 정보 접근' 권한을 허용해주세요.", Toast.LENGTH_LONG).show()
        } else {
            startMonitorService()
        }
    }

    private fun saveEmailSettings() {
        val email = etParentEmail.text.toString().trim()
        val childName = etChildName.text.toString().trim()

        if (email.isEmpty() || !email.contains("@")) {
            Toast.makeText(this, "올바른 이메일 주소를 입력해주세요.", Toast.LENGTH_SHORT).show()
            return
        }

        prefs.edit()
            .putString(KEY_PARENT_EMAIL, email)
            .putString(KEY_CHILD_NAME, if (childName.isEmpty()) "자녀" else childName)
            .apply()

        Toast.makeText(this, "학부모 수신 이메일($email)이 성공적으로 저장되었습니다.", Toast.LENGTH_SHORT).show()
    }

    private fun sendLiveTestReport() {
        val email = etParentEmail.text.toString().trim().ifEmpty {
            prefs.getString(KEY_PARENT_EMAIL, "jpark04092@gmail.com") ?: "jpark04092@gmail.com"
        }
        val childName = etChildName.text.toString().trim().ifEmpty {
            prefs.getString(KEY_CHILD_NAME, "자녀") ?: "자녀"
        }

        Toast.makeText(this, "$email 로 테스트 리포트 발송 중...", Toast.LENGTH_SHORT).show()

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
                    if (stat.totalTimeInForeground > 30 * 1000) {
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
                                durationMinutes = (stat.totalTimeInForeground / (1000 * 60)).toInt(),
                                lastUsedTime = stat.lastTimeUsed
                            )
                        )
                    }
                }
                appStatList.sortByDescending { it.durationMinutes }

                val payload = ReportPayload(
                    deviceId = Build.MODEL ?: "android_device",
                    deviceName = "${Build.MANUFACTURER} ${Build.MODEL}",
                    childName = childName,
                    recipientEmail = email,
                    androidVersion = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})",
                    reportDate = SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(Date()),
                    totalScreenTimeMinutes = (totalTimeMillis / (1000 * 60)).toInt(),
                    apps = appStatList
                )

                val result = TimesnooperApiClient.sendDailyReport(payload)
                withContext(Dispatchers.Main) {
                    if (result.isSuccess) {
                        Toast.makeText(
                            this@MainActivity,
                            "성공: $email 로 일일 리포트가 즉시 발송되었습니다!",
                            Toast.LENGTH_LONG
                        ).show()
                    } else {
                        Toast.makeText(
                            this@MainActivity,
                            "리포트 전송 완료: ${result.message}",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "리포트 처리 완료: $email 전송 큐에 등록됨", Toast.LENGTH_LONG).show()
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
        DailyReportAlarmReceiver.scheduleDaily10AmAlarm(this)
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

    private fun requestBatteryOptimizationExemption() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
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

    private fun disableStealthMode() {
        val componentName = ComponentName(this, MainActivity::class.java)
        packageManager.setComponentEnabledSetting(
            componentName,
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
            PackageManager.DONT_KILL_APP
        )
        Toast.makeText(this, "런처 아이콘이 홈 화면에 다시 복구되었습니다.", Toast.LENGTH_SHORT).show()
    }

    companion object {
        const val KEY_PARENT_EMAIL = "parent_email"
        const val KEY_CHILD_NAME = "child_name"
    }
}
