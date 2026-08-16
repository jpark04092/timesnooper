package com.timesnooper.app.ui

import android.app.AppOpsManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.timesnooper.app.R
import com.timesnooper.app.receiver.DailyReportAlarmReceiver
import com.timesnooper.app.service.TimesnooperMonitorService

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        findViewById<Button>(R.id.btnUsagePermission)?.setOnClickListener {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
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

        // 1. 필수 사용정보 접근 권한 체크 (UsageStats)
        if (!hasUsageStatsPermission()) {
            Toast.makeText(this, "아이 앱 사용시간 추적을 위해 '사용 정보 접근' 권한을 허용해주세요.", Toast.LENGTH_LONG).show()
        } else {
            startMonitorService()
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
        Toast.makeText(this, "Timesnooper 백그라운드 서비스 활성화됨", Toast.LENGTH_SHORT).show()
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
}
