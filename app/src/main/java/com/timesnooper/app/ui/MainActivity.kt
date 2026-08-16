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

import android.widget.TextView
import androidx.appcompat.app.AlertDialog

class MainActivity : AppCompatActivity() {

    companion object {
        const val KEY_PARENT_EMAIL = "parent_email"
        const val KEY_CHILD_NAME = "child_name"
        const val KEY_SENDER_EMAIL = "sender_email"
        const val KEY_SENDER_APP_PASSWORD = "sender_app_password"
    }

    private lateinit var prefs: SharedPreferences
    private lateinit var etParentEmail: EditText
    private lateinit var etChildName: EditText
    private lateinit var etSenderEmail: EditText
    private lateinit var etSenderAppPassword: EditText
    private lateinit var tvStatusLog: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = getSharedPreferences("timesnooper_prefs", Context.MODE_PRIVATE)

        etParentEmail = findViewById(R.id.etParentEmail)
        etChildName = findViewById(R.id.etChildName)
        etSenderEmail = findViewById(R.id.etSenderEmail)
        etSenderAppPassword = findViewById(R.id.etSenderAppPassword)
        tvStatusLog = findViewById(R.id.tvStatusLog)

        // 저장된 학부모 이메일 및 발신 계정 불러오기
        val savedParentEmail = prefs.getString(KEY_PARENT_EMAIL, "jpark04092@gmail.com")
        val savedChildName = prefs.getString(KEY_CHILD_NAME, "자녀 (갤럭시 탭)")
        val savedSenderEmail = prefs.getString(KEY_SENDER_EMAIL, "jpark04092@gmail.com")
        val savedPassword = prefs.getString(KEY_SENDER_APP_PASSWORD, "")

        etParentEmail.setText(savedParentEmail)
        etChildName.setText(savedChildName)
        etSenderEmail.setText(savedSenderEmail)
        etSenderAppPassword.setText(savedPassword)

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

        if (parentEmail.isEmpty() || !parentEmail.contains("@")) {
            Toast.makeText(this, "수신할 학부모 이메일 주소를 올바르게 입력해주세요.", Toast.LENGTH_SHORT).show()
            return
        }

        prefs.edit()
            .putString(KEY_PARENT_EMAIL, parentEmail)
            .putString(KEY_CHILD_NAME, if (childName.isEmpty()) "자녀" else childName)
            .putString(KEY_SENDER_EMAIL, if (senderEmail.isEmpty()) parentEmail else senderEmail)
            .putString(KEY_SENDER_APP_PASSWORD, appPassword)
            .apply()

        tvStatusLog.text = "💾 설정 저장 완료 (수신처: $parentEmail, 발신: ${if (senderEmail.isEmpty()) parentEmail else senderEmail})"
        Toast.makeText(this, "설정이 성공적으로 저장되었습니다.", Toast.LENGTH_SHORT).show()
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
                .setMessage("스마트폰에서 학부모님의 Gmail($parentEmail)로 직접 이메일을 발송하기 위해 발신용 16자리 앱 비밀번호가 필요합니다.\n\n" +
                        "1. myaccount.google.com/apppasswords 접속\n" +
                        "2. 앱 이름(Timesnooper) 입력 후 16자리 비밀번호 발급\n" +
                        "3. 앱 비밀번호 칸에 입력 후 [설정 저장]을 누르세요.\n\n" +
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

                // 앱 목록이 비어있는 경우 (방금 권한 승인하여 10초 이상 기록이 없는 경우) 현재 앱 샘플 추가
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
                    deviceName = "${Build.MANUFACTURER} ${Build.MODEL}",
                    childName = childName,
                    recipientEmail = parentEmail,
                    androidVersion = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})",
                    reportDate = SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(Date()),
                    totalScreenTimeMinutes = (totalTimeMillis / (1000 * 60)).toInt(),
                    apps = appStatList
                )

                val sendResult = com.timesnooper.app.network.DirectEmailSender.sendReportViaDirectSmtp(
                    payload = payload,
                    senderEmail = senderEmail,
                    senderAppPassword = appPassword
                )

                withContext(Dispatchers.Main) {
                    if (sendResult.isSuccess) {
                        tvStatusLog.text = "🎉 [성공] Gmail($parentEmail)로 메일 직접 발송 완료!\n발송 시각: ${SimpleDateFormat("HH:mm:ss", Locale.KOREA).format(Date())}"
                        Toast.makeText(
                            this@MainActivity,
                            "성공: $parentEmail 로 일일 리포트가 성공적으로 발송되었습니다!",
                            Toast.LENGTH_LONG
                        ).show()
                    } else {
                        tvStatusLog.text = "❌ [발송 실패]\n원인: ${sendResult.message}"
                        AlertDialog.Builder(this@MainActivity)
                            .setTitle("Gmail 발송 오류")
                            .setMessage("오류 원인:\n${sendResult.message}\n\n상세:\n${sendResult.errorDetail ?: "없음"}")
                            .setPositiveButton("확인", null)
                            .show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    tvStatusLog.text = "❌ [예외 발생] ${e.localizedMessage ?: e.message}"
                    AlertDialog.Builder(this@MainActivity)
                        .setTitle("발송 예외 발생")
                        .setMessage("오류:\n${e.localizedMessage ?: e.message}")
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
}
