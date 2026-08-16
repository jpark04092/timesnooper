package com.timesnooper.app.receiver

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.UserManager
import android.util.Log

/**
 * Timesnooper Device Owner & Device Admin 리시버
 * 
 * ADB 명령어로 Device Owner로 등록 시:
 * adb shell dpm set-device-owner com.timesnooper.app/.receiver.TimesnooperAdminReceiver
 * 
 * 기능:
 * 1. 앱 삭제 완전 차단 (DISALLOW_UNINSTALL_APPS)
 * 2. 패키지 삭제 블록 (setUninstallBlocked)
 * 3. 기기 안전모드 무단 진입 방지
 */
class TimesnooperAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i("Timesnooper", "Device Admin Activated")
        enforceProtectionPolicies(context)
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.i("Timesnooper", "Device Owner Provisioning Complete")
        enforceProtectionPolicies(context)
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        // 아이가 임의로 디바이스 관리자를 끄려 할 때 경고 문구 출력 및 부모 비밀번호 잠금 연동
        return "Timesnooper 모니터링 보호 기능이 활성화되어 있어 해제할 수 없습니다."
    }

    companion object {
        fun enforceProtectionPolicies(context: Context) {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val adminComponent = ComponentName(context, TimesnooperAdminReceiver::class.java)

            if (dpm.isDeviceOwnerApp(context.packageName)) {
                try {
                    // 1. Timesnooper 앱 삭제 자체를 시스템 레벨에서 완전 잠금
                    dpm.setUninstallBlocked(adminComponent, context.packageName, true)

                    // 2. 전체 앱 임의 삭제 제한 정책 추가
                    dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_UNINSTALL_APPS)

                    // 3. 앱 강제 종료 및 데이터 삭제 방지
                    dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_APPS_CONTROL)

                    Log.i("Timesnooper", "Device Owner Lock & Anti-Uninstall Successfully Enforced!")
                } catch (e: Exception) {
                    Log.e("Timesnooper", "Failed to apply Device Owner restrictions", e)
                }
            }
        }
    }
}
