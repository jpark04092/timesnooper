package com.timesnooper.app.ui

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
import android.text.InputType
import android.view.View
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.timesnooper.app.R
import com.timesnooper.app.data.AppStatEntry
import com.timesnooper.app.data.ReportPayload
import com.timesnooper.app.network.DirectEmailSender
import com.timesnooper.app.receiver.DailyReportAlarmReceiver
import com.timesnooper.app.receiver.TimesnooperAdminReceiver
import com.timesnooper.app.service.TimesnooperAccessibilityService
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
        const val KEY_ADMIN_PIN = "admin_master_pin"
        const val DEFAULT_ADMIN_PIN = "0000"
        const val LAUNCHER_ALIAS_CLASS = "com.timesnooper.app.ui.LauncherAlias"

        const val EXTRA_FROM_MODEL_TAP = "extra_from_model_tap"
        const val EXTRA_PROMPT_PIN = "extra_prompt_pin"
    }

    private lateinit var prefs: SharedPreferences
    private lateinit var tvDeviceModelInfo: TextView
    private lateinit var cardDeviceModel: View
    private lateinit var etCurrentAdminPin: EditText
    private lateinit var etNewAdminPin: EditText
    private lateinit var etConfirmAdminPin: EditText
    private lateinit var btnChangeAdminPin: Button

    private lateinit var etParentEmail: EditText
    private lateinit var etChildName: EditText
    private lateinit var etSenderEmail: EditText
    private lateinit var etSenderAppPassword: EditText
    private lateinit var etReportTime: EditText
    private lateinit var tvStatusLog: TextView

    private var isAuthenticated = false
    private var modelTapCountInApp = 0
    private var lastModelTapTime = 0L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = getSharedPreferences("timesnooper_prefs", Context.MODE_PRIVATE)

        // View bindings
        tvDeviceModelInfo = findViewById(R.id.tvDeviceModelInfo)
        cardDeviceModel = findViewById(R.id.cardDeviceModel)
        etCurrentAdminPin = findViewById(R.id.etCurrentAdminPin)
        etNewAdminPin = findViewById(R.id.etNewAdminPin)
        etConfirmAdminPin = findViewById(R.id.etConfirmAdminPin)
        btnChangeAdminPin = findViewById(R.id.btnChangeAdminPin)

        etParentEmail = findViewById(R.id.etParentEmail)
        etChildName = findViewById(R.id.etChildName)
        etSenderEmail = findViewById(R.id.etSenderEmail)
        etSenderAppPassword = findViewById(R.id.etSenderAppPassword)
        etReportTime = findViewById(R.id.etReportTime)
        tvStatusLog = findViewById(R.id.tvStatusLog)

        // 1. 기기 모델명 표시 및 7회 연타 시뮬레이터
        val manufacturer = Build.MANUFACTURER?.replaceFirstChar { it.uppercase() } ?: "Android"
        val model = Build.MODEL ?: "Device"
        val androidVer = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})"
        tvDeviceModelInfo.text = "현재 기기 모델: $manufacturer $model ($androidVer)"

        cardDeviceModel.setOnClickListener {
            handleInAppModelTap()
        }

        // 2. 저장된 데이터 불러오기
        val savedParentEmail = prefs.getString(KEY_PARENT_EMAIL, "jpark04092@gmail.com")
        val savedChildName = prefs.getString(KEY_CHILD_NAME, "자녀 ($model)")
        val savedSenderEmail = prefs.getString(KEY_SENDER_EMAIL, "jpark04092@gmail.com")
        val savedPassword = prefs.getString(KEY_SENDER_APP_PASSWORD, "")
        val savedReportTime = prefs.getString(KEY_REPORT_TIME, "22:00") ?: "22:00"

        etParentEmail.setText(savedParentEmail)
        etChildName.setText(savedChildName)
        etSenderEmail.setText(savedSenderEmail)
        etSenderAppPassword.setText(savedPassword)
        etReportTime.setText(savedReportTime)

        // 3. 관리자 마스터 비밀번호 변경 버튼 리스너
        btnChangeAdminPin.setOnClickListener {
            handleChangeAdminPin()
        }

        // 4. 발송 시각 선택 다이얼로그 바인딩
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
                    Toast.makeText(this, "선택된 발송 시각: $amPm ${displayH}시 ${minute}분 ($formatted)", Toast.LENGTH_SHORT).show()
                },
                initHour,
                initMinute,
                true
            ).show()
        }

        findViewById<Button>(R.id.btnSelectReportTime)?.setOnClickListener {
            timePickerAction()
        }

        etReportTime.setOnClickListener {
            timePickerAction()
        }

        // 5. 이메일 및 시각 설정 저장
        findViewById<Button>(R.id.btnSaveSettings)?.setOnClickListener {
            saveEmailSettings()
        }

        // 6. 테스트 메일 즉시 발송
        findViewById<Button>(R.id.btnTestEmail)?.setOnClickListener {
            sendLiveTestReport()
        }

        // 7. 접근성 서비스 허용 (설정 > 모델 7회 연타 스텔스 해제)
        findViewById<Button>(R.id.btnAccessibilityPermission)?.setOnClickListener {
            try {
                val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                startActivity(intent)
                Toast.makeText(
                    this,
                    "[설치된 서비스/다운로드한 앱] 에서 'Timesnooper 모델명 7회 연타' 서비스를 '사용'으로 켜주세요.",
                    Toast.LENGTH_LONG
                ).show()
            } catch (e: Exception) {
                Toast.makeText(this, "접근성 설정 열기 실패: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }

        // 8. 사용 정보 접근 권한
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
                    Toast.makeText(this, "설정 > 사용 정보 접근에서 Timesnooper를 허용해주세요.", Toast.LENGTH_LONG).show()
                }
            }
            Toast.makeText(this, "목록에서 'Timesnooper'를 찾아 '허용'을 켜주세요.", Toast.LENGTH_LONG).show()
        }

        // 9. 기기 관리자 활성화
        findViewById<Button>(R.id.btnDeviceAdmin)?.setOnClickListener {
            requestDeviceAdminPermission()
        }

        // 10. 배터리 절전 예외
        findViewById<Button>(R.id.btnBatteryExemption)?.setOnClickListener {
            requestBatteryOptimizationExemption()
        }

        // 11. 서비스 시작
        findViewById<Button>(R.id.btnStartService)?.setOnClickListener {
            startMonitorService()
        }

        // 12. 스텔스 모드
        findViewById<Button>(R.id.btnStealthMode)?.setOnClickListener {
            enableStealthMode()
        }

        // 13. 스텔스 해제
        findViewById<Button>(R.id.btnUnhideIcon)?.setOnClickListener {
            disableStealthMode()
        }

        // 초기 관리자 PIN 인증 체크 (자녀가 설정창에 무단 접근하는 것을 방지)
        val fromModelTap = intent?.getBooleanExtra(EXTRA_FROM_MODEL_TAP, false) ?: false
        val promptPin = intent?.getBooleanExtra(EXTRA_PROMPT_PIN, false) ?: false

        if (fromModelTap || promptPin || !isAuthenticated) {
            promptAdminPinVerification()
        }

        // 사용 정보 권한 체크
        if (!hasUsageStatsPermission()) {
            tvStatusLog.text = "⚠️ 주의: '사용 정보 접근 권한'이 허용되지 않았습니다. 1번 버튼을 눌러 허용해주세요."
        } else {
            tvStatusLog.text = "🟢 권한 승인됨: 언제든 [Gmail로 즉시 발송]을 눌러 테스트할 수 있습니다."
            startMonitorService()
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        val fromModelTap = intent?.getBooleanExtra(EXTRA_FROM_MODEL_TAP, false) ?: false
        val promptPin = intent?.getBooleanExtra(EXTRA_PROMPT_PIN, false) ?: false
        if (fromModelTap || promptPin) {
            promptAdminPinVerification()
        }
    }

    /**
     * 관리자 PIN 인증 다이얼로그 (초기값: 0000)
     * 자녀의 화면 잠금 PIN과 분리된 학부모 전용 마스터 비밀번호로 설정 화면을 보호합니다.
     */
    private fun promptAdminPinVerification() {
        val savedPin = prefs.getString(KEY_ADMIN_PIN, DEFAULT_ADMIN_PIN) ?: DEFAULT_ADMIN_PIN

        val pinInput = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_VARIATION_PASSWORD
            hint = "관리자 4~8자리 PIN (초기: 0000)"
            textSize = 16f
            setPadding(48, 32, 48, 32)
        }

        val dialog = AlertDialog.Builder(this)
            .setTitle("🔐 Timesnooper 관리자 인증")
            .setMessage("자녀의 무단 설정을 방지하기 위해 관리자 PIN을 입력하세요.\n(초기 비밀번호: $DEFAULT_ADMIN_PIN)")
            .setView(pinInput)
            .setCancelable(false)
            .setPositiveButton("확인", null)
            .setNegativeButton("닫기") { _, _ ->
                if (!isAuthenticated) {
                    finish()
                }
            }
            .create()

        dialog.setOnShowListener {
            val button = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            button.setOnClickListener {
                val input = pinInput.text.toString().trim()
                if (input == savedPin) {
                    isAuthenticated = true
                    Toast.makeText(this, "✅ 관리자 인증 완료: 설정창이 활성화되었습니다.", Toast.LENGTH_SHORT).show()
                    dialog.dismiss()
                } else {
                    Toast.makeText(this, "❌ 비밀번호가 일치하지 않습니다. (초기값: 0000)", Toast.LENGTH_SHORT).show()
                    pinInput.setText("")
                }
            }
        }

        dialog.show()
    }

    /**
     * 관리자 PIN 변경 처리
     */
    private fun handleChangeAdminPin() {
        val currentPinInput = etCurrentAdminPin.text.toString().trim()
        val newPinInput = etNewAdminPin.text.toString().trim()
        val confirmPinInput = etConfirmAdminPin.text.toString().trim()
        val savedPin = prefs.getString(KEY_ADMIN_PIN, DEFAULT_ADMIN_PIN) ?: DEFAULT_ADMIN_PIN

        if (currentPinInput != savedPin) {
            Toast.makeText(this, "현재 관리자 비밀번호가 일치하지 않습니다. (초기값: 0000)", Toast.LENGTH_SHORT).show()
            etCurrentAdminPin.requestFocus()
            return
        }

        if (newPinInput.length < 4 || newPinInput.length > 8) {
            Toast.makeText(this, "새 관리자 비밀번호는 4~8자리 숫자로 설정해주세요.", Toast.LENGTH_SHORT).show()
            etNewAdminPin.requestFocus()
            return
        }

        if (newPinInput != confirmPinInput) {
            Toast.makeText(this, "새 비밀번호와 확인 입력이 일치하지 않습니다.", Toast.LENGTH_SHORT).show()
            etConfirmAdminPin.requestFocus()
            return
        }

        prefs.edit().putString(KEY_ADMIN_PIN, newPinInput).apply()
        etCurrentAdminPin.setText("")
        etNewAdminPin.setText("")
        etConfirmAdminPin.setText("")

        Toast.makeText(this, "🎉 관리자 마스터 비밀번호가 성공적으로 변경되었습니다! (새 PIN: $newPinInput)", Toast.LENGTH_LONG).show()
    }

    /**
     * 앱 내 모델 카드 7회 연타 시뮬레이터
     */
    private fun handleInAppModelTap() {
        val now = System.currentTimeMillis()
        if (now - lastModelTapTime > 2500L) {
            modelTapCountInApp = 0
        }
        lastModelTapTime = now
        modelTapCountInApp++

        when (modelTapCountInApp) {
            4 -> Toast.makeText(this, "스텔스 해제 연타 테스트: 3회 남음", Toast.LENGTH_SHORT).show()
            5 -> Toast.makeText(this, "스텔스 해제 연타 테스트: 2회 남음", Toast.LENGTH_SHORT).show()
            6 -> Toast.makeText(this, "스텔스 해제 연타 테스트: 1회 남음!", Toast.LENGTH_SHORT).show()
            7 -> {
                modelTapCountInApp = 0
                Toast.makeText(this, "🔑 기기 설정 > 모델명 7회 연타와 동일하게 작동합니다. PIN을 확인하세요.", Toast.LENGTH_SHORT).show()
                promptAdminPinVerification()
            }
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

        DailyReportAlarmReceiver.scheduleDailyAlarm(this)

        val amPm = if (targetHour < 12) "오전" else "오후"
        val displayH = if (targetHour % 12 == 0) 12 else targetHour % 12
        val displayTime = "$amPm ${displayH}시 ${targetMinute}분 ($formattedTime)"

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
                .setMessage("스마트폰에서 학부모님의 Gmail($parentEmail)로 직접 이메일을 발송하기 위해 발신용 16자리 앱 비밀번호가 필요합니다.\n\n" +
                        "1. myaccount.google.com/apppasswords 접속\n" +
                        "2. 앱 이름(Timesnooper) 입력 후 16자리 비밀번호 발급\n" +
                        "3. 앱 비밀번호 칸에 입력 후 [설정 저장]을 누르세요.")
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
                    deviceName = "${Build.MANUFACTURER} ${Build.MODEL}",
                    childName = childName,
                    recipientEmail = parentEmail,
                    androidVersion = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})",
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
            Toast.makeText(this, "기기 관리자 설정 열기 실패: ${e.message}", Toast.LENGTH_SHORT).show()
        }
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
                "스텔스 모드 가동: 런처 아이콘이 숨겨집니다.\n간편 해제: 설정 > 모델명 7회 연타 (또는 *#*#8463#*#*)",
                Toast.LENGTH_LONG
            ).show()
            finish()
        } catch (e: Exception) {
            Toast.makeText(this, "스텔스 설정 오류: ${e.message}", Toast.LENGTH_SHORT).show()
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
            Toast.makeText(this, "복구 오류: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
}
