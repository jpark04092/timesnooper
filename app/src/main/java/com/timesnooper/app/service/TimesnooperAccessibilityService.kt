package com.timesnooper.app.service

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast
import com.timesnooper.app.ui.MainActivity

/**
 * Timesnooper Accessibility Service
 * 
 * [스텔스 해제 초간편 기능]:
 * 안드로이드 표준 [설정] > [태블릿 정보 / 휴대전화 정보] 메뉴의 "모델(Model)" 항목을
 * 7회 연속 연타하면 스텔스 모드를 즉시 해제하고 관리자 PIN 입력창을 띄웁니다.
 * 
 * 모든 안드로이드 기기(삼성 갤럭시 탭, 스마트폰, LG, 샤오미, 레노버 등)의
 * 공용 표준 시스템 항목인 "모델/Model" 텍스트를 감지합니다.
 */
class TimesnooperAccessibilityService : AccessibilityService() {

    private var tapCount = 0
    private var lastTapTimestamp = 0L
    private val resetHandler = Handler(Looper.getMainLooper())
    private val resetRunnable = Runnable {
        tapCount = 0
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        if (event.eventType == AccessibilityEvent.TYPE_VIEW_CLICKED) {
            val sourceNode = event.source ?: return
            checkNodeAndParentsForModelTrigger(sourceNode)
        }
    }

    private fun checkNodeAndParentsForModelTrigger(node: AccessibilityNodeInfo) {
        try {
            var isModelItem = false

            // 1. 노드 자체 텍스트 확인
            val nodeText = node.text?.toString() ?: ""
            val nodeDesc = node.contentDescription?.toString() ?: ""
            
            if (isModelKeyword(nodeText) || isModelKeyword(nodeDesc)) {
                isModelItem = true
            }

            // 2. 자식 노드 검색 (리스트 아이템 내부의 서브 텍스트)
            if (!isModelItem && node.childCount > 0) {
                for (i in 0 until node.childCount) {
                    val child = node.getChild(i) ?: continue
                    val childText = child.text?.toString() ?: ""
                    val childDesc = child.contentDescription?.toString() ?: ""
                    if (isModelKeyword(childText) || isModelKeyword(childDesc)) {
                        isModelItem = true
                        child.recycle()
                        break
                    }
                    child.recycle()
                }
            }

            // 3. 부모 노드 검색 (텍스트 뷰 클릭 시 상위 컨테이너 검사)
            if (!isModelItem) {
                var parent = node.parent
                var depth = 0
                while (parent != null && depth < 2) {
                    for (i in 0 until parent.childCount) {
                        val sibling = parent.getChild(i) ?: continue
                        val sibText = sibling.text?.toString() ?: ""
                        if (isModelKeyword(sibText)) {
                            isModelItem = true
                            sibling.recycle()
                            break
                        }
                        sibling.recycle()
                    }
                    if (isModelItem) break
                    parent = parent.parent
                    depth++
                }
            }

            if (isModelItem) {
                handleModelItemTapped()
            }
        } catch (e: Exception) {
            Log.e("Timesnooper", "Error analyzing accessibility node", e)
        } finally {
            try {
                node.recycle()
            } catch (ignored: Exception) {}
        }
    }

    private fun isModelKeyword(text: String): Boolean {
        if (text.isEmpty()) return false
        val clean = text.trim().lowercase()
        return clean.contains("모델") ||
               clean.contains("model") ||
               clean.contains("기기 모델") ||
               clean.contains("모델명") ||
               clean.contains("모델 이름") ||
               clean.contains("model name") ||
               clean.contains("model number")
    }

    private fun handleModelItemTapped() {
        val now = System.currentTimeMillis()
        if (now - lastTapTimestamp > 3000L) {
            tapCount = 0
        }
        lastTapTimestamp = now
        tapCount++

        resetHandler.removeCallbacks(resetRunnable)
        resetHandler.postDelayed(resetRunnable, 3500L)

        Log.d("Timesnooper", "Model item tapped: $tapCount / 7")

        when (tapCount) {
            4 -> {
                Toast.makeText(applicationContext, "Timesnooper 관리자 모드 진입까지 3회 남음", Toast.LENGTH_SHORT).show()
            }
            5 -> {
                Toast.makeText(applicationContext, "Timesnooper 관리자 모드 진입까지 2회 남음", Toast.LENGTH_SHORT).show()
            }
            6 -> {
                Toast.makeText(applicationContext, "Timesnooper 관리자 모드 진입까지 1회 남음!", Toast.LENGTH_SHORT).show()
            }
            7 -> {
                tapCount = 0
                resetHandler.removeCallbacks(resetRunnable)
                triggerStealthUnlockAndAdminPrompt()
            }
        }
    }

    private fun triggerStealthUnlockAndAdminPrompt() {
        try {
            // 1. 런처 아이콘 및 MainActivity 활성화
            val aliasComponent = ComponentName(this, "com.timesnooper.app.ui.LauncherAlias")
            val mainComponent = ComponentName(this, MainActivity::class.java)

            packageManager.setComponentEnabledSetting(
                aliasComponent,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )
            packageManager.setComponentEnabledSetting(
                mainComponent,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )

            Toast.makeText(applicationContext, "🔑 Timesnooper 관리자 잠금 해제: PIN을 입력하세요.", Toast.LENGTH_LONG).show()

            // 2. MainActivity 실행 및 관리자 PIN 인증창 띄우기 플래그 전달
            val intent = Intent(this, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                putExtra(MainActivity.EXTRA_FROM_MODEL_TAP, true)
                putExtra(MainActivity.EXTRA_PROMPT_PIN, true)
            }
            startActivity(intent)
        } catch (e: Exception) {
            Log.e("Timesnooper", "Failed to unlock from accessibility service", e)
        }
    }

    override fun onInterrupt() {
        Log.i("Timesnooper", "AccessibilityService Interrupted")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i("Timesnooper", "TimesnooperAccessibilityService connected! Model 7-tap listener active.")
    }
}
