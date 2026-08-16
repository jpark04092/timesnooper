package com.timesnooper.app.receiver

import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log
import android.widget.Toast
import com.timesnooper.app.ui.MainActivity

/**
 * 스텔스 모드 제어 및 비상 복구 리시버
 * 
 * ADB shell(UID 2000)에서 'pm enable' 시 발생하는 Android OS의 SecurityException을 완벽히 우회하여
 * 앱 프로세스 자체 권한으로 아이콘 활성화/비활성화 및 화면 실행을 수행합니다.
 * 
 * 지원 명령어:
 * 1. 아이콘 복구 및 화면 오픈:
 *    adb shell am broadcast -a com.timesnooper.app.ACTION_UNHIDE_ICON -p com.timesnooper.app
 * 
 * 2. 아이콘 은폐 (스텔스 모드 진입):
 *    adb shell am broadcast -a com.timesnooper.app.ACTION_HIDE_ICON -p com.timesnooper.app
 * 
 * 3. 화면만 즉시 띄우기:
 *    adb shell am broadcast -a com.timesnooper.app.ACTION_LAUNCH_UI -p com.timesnooper.app
 * 
 * 4. 스마트폰 기본 전화 다이얼러 시크릿 코드:
 *    *#*#8463#*#* (*#*#TIME#*#*)
 */
class StealthReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.i("Timesnooper", "StealthReceiver triggered with action: $action")

        val mainActivityComponent = ComponentName(context, MainActivity::class.java)
        val aliasComponent = ComponentName(context, "com.timesnooper.app.ui.LauncherAlias")

        when (action) {
            ACTION_UNHIDE_ICON -> {
                // 1. LauncherAlias 및 MainActivity 모두 즉시 활성화
                context.packageManager.setComponentEnabledSetting(
                    aliasComponent,
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
                )
                context.packageManager.setComponentEnabledSetting(
                    mainActivityComponent,
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
                )
                Toast.makeText(context, "Timesnooper: 런처 아이콘이 복구되었습니다.", Toast.LENGTH_LONG).show()

                // 2. 관리자 설정 화면 자동 실행
                val launchIntent = Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                context.startActivity(launchIntent)
            }

            ACTION_HIDE_ICON -> {
                // 런처 별칭(LauncherAlias)만 비활성화하여 아이콘을 숨김 (MainActivity는 내부 활성화 유지)
                context.packageManager.setComponentEnabledSetting(
                    aliasComponent,
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP
                )
                context.packageManager.setComponentEnabledSetting(
                    mainActivityComponent,
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
                )
                Toast.makeText(context, "Timesnooper: 스텔스 모드가 활성화되었습니다 (아이콘 숨김).", Toast.LENGTH_LONG).show()
            }

            ACTION_LAUNCH_UI, "android.provider.Telephony.SECRET_CODE" -> {
                // 다이얼 코드(*#*#8463#*#*) 또는 화면 팝업 요청
                context.packageManager.setComponentEnabledSetting(
                    mainActivityComponent,
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
                )
                val launchIntent = Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                context.startActivity(launchIntent)
            }
        }
    }

    companion object {
        const val ACTION_UNHIDE_ICON = "com.timesnooper.app.ACTION_UNHIDE_ICON"
        const val ACTION_HIDE_ICON = "com.timesnooper.app.ACTION_HIDE_ICON"
        const val ACTION_LAUNCH_UI = "com.timesnooper.app.ACTION_LAUNCH_UI"
    }
}
