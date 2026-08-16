package com.timesnooper.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.timesnooper.app.service.TimesnooperMonitorService

/**
 * 기기 부팅 (BOOT_COMPLETED), 업데이트 (MY_PACKAGE_REPLACED), 
 * 전원 켬 (QUICKBOOT) 시 백그라운드 서비스를 자동 시작합니다.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.i("Timesnooper", "BootReceiver triggered with action: $action")

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_LOCKED_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.timesnooper.app.RESTART_SERVICE"
        ) {
            // 1. 디바이스 정책 재검증 (삭제 방지)
            TimesnooperAdminReceiver.enforceProtectionPolicies(context)

            // 2. 오전 10시 알람 스케줄러 보장
            DailyReportAlarmReceiver.scheduleDaily10AmAlarm(context)

            // 3. 백그라운드 모니터 서비스 실행
            val serviceIntent = Intent(context, TimesnooperMonitorService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        }
    }
}
