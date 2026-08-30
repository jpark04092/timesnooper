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
import com.timesnooper.app.receiver.TimesnooperAdminReceiver
import com.timesnooper.app.service.TimesnooperMonitorService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

import android.content.ClipData
import android.content.ClipboardManager
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    companion object {
        const val KEY_PARENT_EMAIL = "parent_email"
        const val KEY_CHILD_NAME = "child_name"
        const val KEY_SENDER_EMAIL = "sender_email"
        const val KEY_SENDER_APP_PASSWORD = "sender_app_password"
        const val KEY_REPORT_TIME = "report_time"
        const val KEY_REPORT_HOUR = "report_hour"
        const val KEY_REPORT_MINUTE = "report_minute"
        const val KEY_ADMIN_PASSWORD = "admin_password"
        const val KEY_USAGE_LIMIT_ENABLED = "usage_limit_enabled"
        const val KEY_USAGE_LIMIT_MINUTES = "usage_limit_minutes"
        const val KEY_LAST_LIMIT_ALERT_DATE = "last_limit_alert_date"
        const val LAUNCHER_ALIAS_CLASS = "com.timesnooper.app.ui.LauncherAlias"
    }

    private lateinit var prefs: SharedPreferences
    private lateinit var scrollViewMain: android.widget.ScrollView
    private lateinit var layoutLockOverlay: android.widget.LinearLayout
    private lateinit var tvLockTitle: TextView
    private lateinit var tvLockSubtitle: TextView
    private lateinit var tvLockInputLabel1: TextView
    private lateinit var etLockPasswordInput: EditText
    private lateinit var tvLockInputLabel2: TextView
    private lateinit var etLockPasswordConfirm: EditText
    private lateinit var tvLockError: TextView
    private lateinit var btnLockSubmit: Button
    private lateinit var btnLockExit: Button

    private lateinit var etAdminPassword: EditText
    private lateinit var etParentEmail: EditText
    private lateinit var etChildName: EditText
    private lateinit var etSenderEmail: EditText
    private lateinit var etSenderAppPassword: EditText
    private lateinit var etReportTime: EditText
    private lateinit var cbUsageLimitEnabled: android.widget.CheckBox
    private lateinit var llUsageLimitContainer: android.widget.LinearLayout
    private lateinit var etUsageLimitMinutes: EditText
    private lateinit var tvStatusLog: TextView

    private var isAuthenticated = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = getSharedPreferences("timesnooper_prefs", Context.MODE_PRIVATE)

        scrollViewMain = findViewById(R.id.scrollViewMain)
        layoutLockOverlay = findViewById(R.id.layoutLockOverlay)
        tvLockTitle = findViewById(R.id.tvLockTitle)
        tvLockSubtitle = findViewById(R.id.tvLockSubtitle)
        tvLockInputLabel1 = findViewById(R.id.tvLockInputLabel1)
        etLockPasswordInput = findViewById(R.id.etLockPasswordInput)
        tvLockInputLabel2 = findViewById(R.id.tvLockInputLabel2)
        etLockPasswordConfirm = findViewById(R.id.etLockPasswordConfirm)
        tvLockError = findViewById(R.id.tvLockError)
        btnLockSubmit = findViewById(R.id.btnLockSubmit)
        btnLockExit = findViewById(R.id.btnLockExit)

        etAdminPassword = findViewById(R.id.etAdminPassword)
        etParentEmail = findViewById(R.id.etParentEmail)
        etChildName = findViewById(R.id.etChildName)
        etSenderEmail = findViewById(R.id.etSenderEmail)
        etSenderAppPassword = findViewById(R.id.etSenderAppPassword)
        etReportTime = findViewById(R.id.etReportTime)
        cbUsageLimitEnabled = findViewById(R.id.cbUsageLimitEnabled)
        llUsageLimitContainer = findViewById(R.id.llUsageLimitContainer)
        etUsageLimitMinutes = findViewById(R.id.etUsageLimitMinutes)
        tvStatusLog = findViewById(R.id.tvStatusLog)

        // 저장된 설정값 불러오기
        val savedAdminPassword = prefs.getString(KEY_ADMIN_PASSWORD, "") ?: ""
        val savedParentEmail = prefs.getString(KEY_PARENT_EMAIL, "jpark04092@gmail.com")
        val savedChildName = prefs.getString(KEY_CHILD_NAME, "자녀 (갤럭시 탭)")
        val savedSenderEmail = prefs.getString(KEY_SENDER_EMAIL, "jpark04092@gmail.com")
        val savedPassword = prefs.getString(KEY_SENDER_APP_PASSWORD, "")
        val savedReportTime = prefs.getString(KEY_REPORT_TIME, "22:00") ?: "22:00"
        val savedLimitEnabled = prefs.getBoolean(KEY_USAGE_LIMIT_ENABLED, false)
        val savedLimitMinutes = prefs.getInt(KEY_USAGE_LIMIT_MINUTES, 120)

        etAdminPassword.setText(savedAdminPassword)
        etParentEmail.setText(savedParentEmail)
        etChildName.setText(savedChildName)
        etSenderEmail.setText(savedSenderEmail)
        etSenderAppPassword.setText(savedPassword)
        etReportTime.setText(savedReportTime)
        cbUsageLimitEnabled.isChecked = savedLimitEnabled
        etUsageLimitMinutes.setText(savedLimitMinutes.toString())
        llUsageLimitContainer.visibility = if (savedLimitEnabled) android.view.View.VISIBLE else android.view.View.GONE

        cbUsageLimitEnabled.setOnCheckedChangeListener { _, isChecked ->
            llUsageLimitContainer.visibility = if (isChecked) android.view.View.VISIBLE else android.view.View.GONE
        }

        // 빠른 프리셋 버튼 연결
        findViewById<Button>(R.id.btnPreset1Hour)?.setOnClickListener { etUsageLimitMinutes.setText("60") }
        findViewById<Button>(R.id.btnPreset1Point5Hour)?.setOnClickListener { etUsageLimitMinutes.setText("90") }
        findViewById<Button>(R.id.btnPreset2Hour)?.setOnClickListener { etUsageLimitMinutes.setText("120") }
        findViewById<Button>(R.id.btnPreset3Hour)?.setOnClickListener { etUsageLimitMinutes.setText("180") }

        // 1. 관리자 전용 비밀번호 인증 / 초기 등록 화면 구동
        setupAdminLock(savedInstanceState)

        // 시각 선택 다이얼로그 바인딩
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
                true // 24시간 형식
            ).show()
        }

        findViewById<Button>(R.id.btnSelectReportTime)?.setOnClickListener {
            timePickerAction()
        }

        etReportTime.setOnClickListener {
            timePickerAction()
        }

        // 이메일 및 시각 설정 저장 버튼
        findViewById<Button>(R.id.btnSaveSettings)?.setOnClickListener {
            saveEmailSettings()
        }

        // 테스트 메일 즉시 발송 버튼
        findViewById<Button>(R.id.btnTestEmail)?.setOnClickListener {
            sendLiveTestReport()
        }

        // 설정 백업 및 복원 버튼
        findViewById<Button>(R.id.btnBackupSettings)?.setOnClickListener {
            backupSettingsToClipboard()
        }

        findViewById<Button>(R.id.btnRestoreSettings)?.setOnClickListener {
            restoreSettingsFromClipboard()
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

        findViewById<Button>(R.id.btnDeviceAdmin)?.setOnClickListener {
            requestDeviceAdminPermission()
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

        // 필수 사용정보 접근 권한 체크 (UsageStats)
        if (!hasUsageStatsPermission()) {
            tvStatusLog.text = "⚠️ 주의: '사용 정보 접근 권한'이 허용되지 않았습니다. 1번 버튼을 눌러 허용해주세요."
            Toast.makeText(this, "아이 앱 사용시간 추적을 위해 '사용 정보 접근' 권한을 허용해주세요.", Toast.LENGTH_LONG).show()
        } else {
            tvStatusLog.text = "🟢 권한 승인됨: 언제든 [테스트 메일 발송] 버튼을 눌러 발송을 테스트하세요."
            startMonitorService()
        }
    }

    private fun setupAdminLock(savedInstanceState: Bundle?) {
        if (savedInstanceState != null) {
            isAuthenticated = savedInstanceState.getBoolean("is_authenticated", false)
        }

        if (isAuthenticated) {
            unlockUi()
            return
        }

        val savedPassword = prefs.getString(KEY_ADMIN_PASSWORD, "") ?: ""
        val isFirstSetup = savedPassword.isEmpty()

        if (isFirstSetup) {
            // 최초 설치 모드: 관리자 비밀번호 신규 등록 UI
            tvLockTitle.text = "🔑 관리자 비밀번호 초기 설정"
            tvLockSubtitle.text = "자녀의 임의 접근 및 설정 변경을 방지하기 위해 관리자(학부모) 전용 비밀번호를 설정해주세요.\n(기기 화면 잠금번호와 별개로 설정됩니다)"
            tvLockInputLabel1.text = "새 관리자 비밀번호 (4자리 이상):"
            etLockPasswordInput.hint = "비밀번호 입력 (숫자 PIN 또는 영문)"
            tvLockInputLabel2.visibility = android.view.View.VISIBLE
            etLockPasswordConfirm.visibility = android.view.View.VISIBLE
            btnLockSubmit.text = "비밀번호 설정 및 시작"
            btnLockExit.visibility = android.view.View.GONE
            tvLockError.visibility = android.view.View.GONE

            btnLockSubmit.setOnClickListener {
                val p1 = etLockPasswordInput.text.toString().trim()
                val p2 = etLockPasswordConfirm.text.toString().trim()

                if (p1.length < 4) {
                    tvLockError.text = "⚠️ 비밀번호는 최소 4자리 이상으로 설정해주세요."
                    tvLockError.visibility = android.view.View.VISIBLE
                    return@setOnClickListener
                }
                if (p1 != p2) {
                    tvLockError.text = "⚠️ 비밀번호 확인이 일치하지 않습니다. 다시 입력해주세요."
                    tvLockError.visibility = android.view.View.VISIBLE
                    return@setOnClickListener
                }

                prefs.edit().putString(KEY_ADMIN_PASSWORD, p1).apply()
                etAdminPassword.setText(p1)
                isAuthenticated = true
                Toast.makeText(this, "🛡️ 관리자 비밀번호가 안전하게 설정되었습니다.", Toast.LENGTH_SHORT).show()
                unlockUi()
            }
        } else {
            // 앱 실행 / 재진입 모드: 관리자 비밀번호 인증 요구 UI
            tvLockTitle.text = "🔒 관리자 비밀번호 인증"
            tvLockSubtitle.text = "Timesnooper 설정에 진입하려면 설정한 관리자 비밀번호를 입력해주세요."
            tvLockInputLabel1.text = "관리자 비밀번호:"
            etLockPasswordInput.hint = "비밀번호 입력"
            tvLockInputLabel2.visibility = android.view.View.GONE
            etLockPasswordConfirm.visibility = android.view.View.GONE
            btnLockSubmit.text = "인증 및 설정 열기"
            btnLockExit.visibility = android.view.View.VISIBLE
            tvLockError.visibility = android.view.View.GONE

            btnLockSubmit.setOnClickListener {
                val inputPass = etLockPasswordInput.text.toString().trim()
                val currentSavedPass = prefs.getString(KEY_ADMIN_PASSWORD, "") ?: ""

                if (inputPass == currentSavedPass && inputPass.isNotEmpty()) {
                    isAuthenticated = true
                    Toast.makeText(this, "🔓 관리자 인증 완료", Toast.LENGTH_SHORT).show()
                    unlockUi()
                } else {
                    tvLockError.text = "❌ 비밀번호가 일치하지 않습니다. 다시 입력해주세요."
                    tvLockError.visibility = android.view.View.VISIBLE
                    etLockPasswordInput.setText("")
                }
            }

            btnLockExit.setOnClickListener {
                finish()
            }
        }
    }

    private fun unlockUi() {
        layoutLockOverlay.visibility = android.view.View.GONE
        scrollViewMain.visibility = android.view.View.VISIBLE
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putBoolean("is_authenticated", isAuthenticated)
    }

    private fun saveEmailSettings() {
        val adminPassword = etAdminPassword.text.toString().trim()
        val parentEmail = etParentEmail.text.toString().trim()
        val childName = etChildName.text.toString().trim()
        val senderEmail = etSenderEmail.text.toString().trim()
        val appPassword = etSenderAppPassword.text.toString().trim()
        val reportTimeStr = etReportTime.text.toString().trim().ifEmpty { "22:00" }

        if (adminPassword.isNotEmpty() && adminPassword.length < 4) {
            Toast.makeText(this, "관리자 비밀번호는 최소 4자리 이상이어야 합니다.", Toast.LENGTH_SHORT).show()
            return
        }

        if (parentEmail.isEmpty() || !parentEmail.contains("@")) {
            Toast.makeText(this, "수신할 학부모 이메일 주소를 올바르게 입력해주세요.", Toast.LENGTH_SHORT).show()
            return
        }

        // 시각 파싱 검증 (HH:mm 형식)
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

        val isLimitEnabled = cbUsageLimitEnabled.isChecked
        val limitMinutesStr = etUsageLimitMinutes.text.toString().trim()
        val limitMinutes = limitMinutesStr.toIntOrNull() ?: 120

        if (isLimitEnabled && limitMinutes <= 0) {
            Toast.makeText(this, "일일 사용 한도 시간은 최소 1분 이상으로 입력해주세요.", Toast.LENGTH_SHORT).show()
            return
        }

        val formattedTime = String.format(Locale.KOREA, "%02d:%02d", targetHour, targetMinute)
        etReportTime.setText(formattedTime)

        val editor = prefs.edit()
            .putString(KEY_PARENT_EMAIL, parentEmail)
            .putString(KEY_CHILD_NAME, if (childName.isEmpty()) "자녀" else childName)
            .putString(KEY_SENDER_EMAIL, if (senderEmail.isEmpty()) parentEmail else senderEmail)
            .putString(KEY_SENDER_APP_PASSWORD, appPassword)
            .putString(KEY_REPORT_TIME, formattedTime)
            .putInt(KEY_REPORT_HOUR, targetHour)
            .putInt(KEY_REPORT_MINUTE, targetMinute)
            .putBoolean(KEY_USAGE_LIMIT_ENABLED, isLimitEnabled)
            .putInt(KEY_USAGE_LIMIT_MINUTES, limitMinutes)

        if (adminPassword.isNotEmpty()) {
            editor.putString(KEY_ADMIN_PASSWORD, adminPassword)
        }
        editor.apply()

        // 변경된 발송 시각으로 알람 매니저 즉시 재설정
        DailyReportAlarmReceiver.scheduleDailyAlarm(this)

        // 한도 초과 알림이 켜진 경우 백그라운드 서비스에 즉시 검사 요청
        if (isLimitEnabled) {
            val serviceCheckIntent = Intent(this, TimesnooperMonitorService::class.java).apply {
                action = TimesnooperMonitorService.ACTION_CHECK_LIMIT_NOW
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceCheckIntent)
            } else {
                startService(serviceCheckIntent)
            }
        }

        val amPm = if (targetHour < 12) "오전" else "오후"
        val displayH = if (targetHour % 12 == 0) 12 else targetHour % 12
        val displayTime = "$amPm ${displayH}시 ${targetMinute}분 ($formattedTime)"
        val limitStatusStr = if (isLimitEnabled) " / 한도: ${limitMinutes}분 초과시 즉시알림 ON" else ""

        tvStatusLog.text = "💾 설정 저장 완료 (수신처: $parentEmail, 정기 발송: 매일 $displayTime$limitStatusStr)"
        Toast.makeText(this, "설정 저장 완료: 매일 $displayTime 에 리포트가 발송됩니다.$limitStatusStr", Toast.LENGTH_LONG).show()
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
            // 1. 런처 별칭(LauncherAlias)만 비활성화하여 런처(홈/앱 서랍)에서 아이콘 완전 제거
            val aliasComponent = ComponentName(this, LAUNCHER_ALIAS_CLASS)
            packageManager.setComponentEnabledSetting(
                aliasComponent,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            )

            // 2. MainActivity 자체는 활성화 상태 유지 (시크릿 다이얼 *#*#8463#*#* 이나 브로드캐스트로 언제든 정상 호출 가능)
            val mainComponent = ComponentName(this, MainActivity::class.java)
            packageManager.setComponentEnabledSetting(
                mainComponent,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )

            Toast.makeText(
                this,
                "스텔스 모드 가동: 런처 아이콘이 숨겨집니다.\n다시 열기: 다이얼 *#*#8463#*#* 또는 ADB",
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

    private fun backupSettingsToClipboard() {
        try {
            val json = JSONObject().apply {
                put("app", "timesnooper")
                put("version", 1)
                put(KEY_ADMIN_PASSWORD, etAdminPassword.text.toString().trim())
                put(KEY_PARENT_EMAIL, etParentEmail.text.toString().trim())
                put(KEY_CHILD_NAME, etChildName.text.toString().trim())
                put(KEY_SENDER_EMAIL, etSenderEmail.text.toString().trim())
                put(KEY_SENDER_APP_PASSWORD, etSenderAppPassword.text.toString().trim())
                put(KEY_REPORT_TIME, etReportTime.text.toString().trim().ifEmpty { "22:00" })
                put(KEY_USAGE_LIMIT_ENABLED, cbUsageLimitEnabled.isChecked)
                put(KEY_USAGE_LIMIT_MINUTES, etUsageLimitMinutes.text.toString().trim().toIntOrNull() ?: 120)
            }

            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("Timesnooper Settings Backup", json.toString(2))
            clipboard.setPrimaryClip(clip)

            AlertDialog.Builder(this)
                .setTitle("💾 설정 백업 완료")
                .setMessage("모든 설정(관리자 PIN, Gmail 앱 비밀번호, 알람 시각 등)이 클립보드에 복사되었습니다.\n\n안전한 메모장이나 학부모님의 카카오톡/메모 앱에 붙여넣어 보관해두시면, 언제든 1초 만에 복원하실 수 있습니다.")
                .setPositiveButton("확인", null)
                .show()

            Toast.makeText(this, "📋 설정 백업 데이터가 클립보드에 복사되었습니다.", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(this, "백업 오류: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun restoreSettingsFromClipboard() {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        var clipboardText = ""
        if (clipboard.hasPrimaryClip() && (clipboard.primaryClip?.itemCount ?: 0) > 0) {
            clipboardText = clipboard.primaryClip?.getItemAt(0)?.text?.toString() ?: ""
        }

        val input = EditText(this).apply {
            hint = "백업된 JSON 텍스트 붙여넣기"
            if (clipboardText.contains("timesnooper") && clipboardText.contains("{")) {
                setText(clipboardText)
            }
            setPadding(32, 24, 32, 24)
            textSize = 12f
        }

        AlertDialog.Builder(this)
            .setTitle("📥 설정 복원")
            .setMessage("백업해둔 설정 JSON 텍스트를 아래에 붙여넣고 [복원]을 누르세요.")
            .setView(input)
            .setPositiveButton("복원") { _, _ ->
                val text = input.text.toString().trim()
                if (text.isEmpty()) {
                    Toast.makeText(this, "복원할 설정 데이터가 입력되지 않았습니다.", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                try {
                    val json = JSONObject(text)
                    val adminPass = json.optString(KEY_ADMIN_PASSWORD, "")
                    val parentEmail = json.optString(KEY_PARENT_EMAIL, "")
                    val childName = json.optString(KEY_CHILD_NAME, "자녀")
                    val senderEmail = json.optString(KEY_SENDER_EMAIL, "")
                    val appPassword = json.optString(KEY_SENDER_APP_PASSWORD, "")
                    val reportTime = json.optString(KEY_REPORT_TIME, "22:00")
                    val limitEnabled = json.optBoolean(KEY_USAGE_LIMIT_ENABLED, false)
                    val limitMinutes = json.optInt(KEY_USAGE_LIMIT_MINUTES, 120)

                    if (adminPass.isNotEmpty()) etAdminPassword.setText(adminPass)
                    if (parentEmail.isNotEmpty()) etParentEmail.setText(parentEmail)
                    if (childName.isNotEmpty()) etChildName.setText(childName)
                    if (senderEmail.isNotEmpty()) etSenderEmail.setText(senderEmail)
                    if (appPassword.isNotEmpty()) etSenderAppPassword.setText(appPassword)
                    if (reportTime.isNotEmpty()) etReportTime.setText(reportTime)
                    cbUsageLimitEnabled.isChecked = limitEnabled
                    etUsageLimitMinutes.setText(limitMinutes.toString())
                    llUsageLimitContainer.visibility = if (limitEnabled) android.view.View.VISIBLE else android.view.View.GONE

                    saveEmailSettings()
                    Toast.makeText(this, "🎉 설정이 성공적으로 복원 및 저장되었습니다!", Toast.LENGTH_LONG).show()
                } catch (e: Exception) {
                    AlertDialog.Builder(this)
                        .setTitle("복원 실패")
                        .setMessage("올바른 Timesnooper 백업 형식이 아닙니다.\n오류: ${e.message}")
                        .setPositiveButton("확인", null)
                        .show()
                }
            }
            .setNegativeButton("취소", null)
            .show()
    }
}
