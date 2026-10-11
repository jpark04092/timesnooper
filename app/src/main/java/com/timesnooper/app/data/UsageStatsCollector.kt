package com.timesnooper.app.data

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.PowerManager
import android.util.Log
import android.view.inputmethod.InputMethodManager
import java.util.*

/**
 * 자녀 안심 모니터링을 위한 정밀 사용 시간(Screen Time) 수집기.
 *
 * 기존 단순 UsageStats.totalTimeInForeground 방식의 문제점을 해결:
 * 1. [측정 기준일 보정]: "현재-24시간"이 아닌 오늘 00:00:00부터 현재까지의 사용량만 엄격하게 측정 (어제 사용량 혼입 방지).
 * 2. [화면 꺼짐(Screen-Off) 배제]: UsageEvents의 SCREEN_NON_INTERACTIVE 감지로 화면 꺼짐 시 시간 누적 즉시 중단.
 * 3. [백그라운드/FGS 배제]: 백그라운드 오디오 재생이나 상주 서비스가 아닌 실제 화면에 표시된(ACTIVITY_RESUMED) 상태만 집계.
 * 4. [시스템/런처/키보드 제외]: 홈 런처, 삼성 키보드, 시스템 UI, Timesnooper 자체 앱을 필터링하고 실제 사용자 실행 가능 앱만 포함.
 * 5. [중복 합산 방지]: 개별 앱 시간 단순 합산으로 인한 시간 뻥튀기를 방지하고 실제 화면 켜짐 시간(True Screen-on Time) 산출.
 */
object UsageStatsCollector {

    data class UsageResult(
        val totalScreenTimeMinutes: Int,
        val apps: List<AppStatEntry>
    )

    /**
     * 오늘 00:00:00 ~ 현재 시각까지의 정확한 화면 사용 시간을 수집합니다.
     */
    fun collectTodayUsage(context: Context): UsageResult {
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val startTime = calendar.timeInMillis
        val endTime = System.currentTimeMillis()

        return collectUsageBetween(context, startTime, endTime)
    }

    /**
     * 특정 구간(startTime ~ endTime)에 대한 정밀 사용 시간을 수집합니다.
     */
    fun collectUsageBetween(context: Context, startTime: Long, endTime: Long): UsageResult {
        val packageManager = context.packageManager
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return UsageResult(0, emptyList())

        // 1. 제외 대상 패키지 식별 (자체 앱, 홈 런처, 키보드, 시스템 UI)
        val ignoredPackages = getIgnoredPackages(context, packageManager)

        // 2. UsageEvents를 통한 정밀 측정 (화면 꺼짐 배제 및 단일 활성 앱 추적)
        val eventStats = queryUsageEventsAccurately(
            context = context,
            usageStatsManager = usageStatsManager,
            startTime = startTime,
            endTime = endTime,
            ignoredPackages = ignoredPackages
        )

        // 3. Fallback: UsageEvents가 비어있거나 권한 직후인 경우 안전하게 필터링된 UsageStats 활용
        val appTimeMap = if (eventStats.appDurations.isEmpty()) {
            queryFallbackUsageStats(usageStatsManager, startTime, endTime, ignoredPackages, packageManager)
        } else {
            eventStats.appDurations
        }

        // 4. 실행 가능한 사용자 앱만 선별하여 AppStatEntry 구성
        val appStatList = mutableListOf<AppStatEntry>()
        for ((pkgName, durationMillis) in appTimeMap) {
            val minutes = (durationMillis / (1000 * 60)).toInt()
            if (minutes < 1) continue // 1분 미만 제외

            // 홈 화면에서 직접 실행 가능한 앱인지 검증 (내부 시스템 서비스 배제)
            val launchIntent = packageManager.getLaunchIntentForPackage(pkgName)
            if (launchIntent == null && !isAllowedUserFacingApp(pkgName)) {
                continue
            }

            val appName = try {
                val appInfo = packageManager.getApplicationInfo(pkgName, 0)
                packageManager.getApplicationLabel(appInfo).toString()
            } catch (e: Exception) {
                pkgName
            }

            val lastUsed = eventStats.appLastUsed[pkgName] ?: endTime

            appStatList.add(
                AppStatEntry(
                    packageName = pkgName,
                    appName = appName,
                    durationMinutes = minutes,
                    lastUsedTime = lastUsed
                )
            )
        }

        // 사용 시간 기준 내림차순 정렬
        appStatList.sortByDescending { it.durationMinutes }

        // 5. 총 스크린타임 계산 (단순 중복 합산이 아닌 실제 화면 켜짐 시간 기준)
        val totalMinutes = if (eventStats.totalScreenOnMillis > 0) {
            (eventStats.totalScreenOnMillis / (1000 * 60)).toInt()
        } else {
            // 이벤트에서 총 스크린온을 못 얻은 경우 합산하되, 하루 경과 시간(endTime - startTime)을 초과하지 않도록 제한
            val maxPossibleMinutes = ((endTime - startTime) / (1000 * 60)).toInt().coerceAtLeast(0)
            val sumMinutes = appStatList.sumOf { it.durationMinutes }
            sumMinutes.coerceAtMost(maxPossibleMinutes)
        }

        return UsageResult(
            totalScreenTimeMinutes = totalMinutes,
            apps = appStatList
        )
    }

    private data class ParsedEventStats(
        val appDurations: Map<String, Long>,
        val appLastUsed: Map<String, Long>,
        val totalScreenOnMillis: Long
    )

    private fun queryUsageEventsAccurately(
        context: Context,
        usageStatsManager: UsageStatsManager,
        startTime: Long,
        endTime: Long,
        ignoredPackages: Set<String>
    ): ParsedEventStats {
        val appDurationMap = mutableMapOf<String, Long>()
        val appLastUsedMap = mutableMapOf<String, Long>()
        var totalScreenOnMillis = 0L

        try {
            val usageEvents = usageStatsManager.queryEvents(startTime, endTime) ?: return ParsedEventStats(emptyMap(), emptyMap(), 0L)
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            var isScreenOn = powerManager?.isInteractive ?: true

            var currentPkg: String? = null
            var currentEventStart: Long = 0L
            var screenOnStart: Long = if (isScreenOn) startTime else 0L

            val event = UsageEvents.Event()
            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(event)
                val eventTime = event.timeStamp
                if (eventTime < startTime || eventTime > endTime) continue

                when (event.eventType) {
                    // 화면 켜짐 이벤트
                    UsageEvents.Event.SCREEN_INTERACTIVE -> {
                        if (!isScreenOn) {
                            isScreenOn = true
                            screenOnStart = eventTime
                        }
                    }

                    // 화면 꺼짐 이벤트 -> 즉시 앱 및 화면 사용시간 측정 중단
                    UsageEvents.Event.SCREEN_NON_INTERACTIVE -> {
                        if (isScreenOn) {
                            if (screenOnStart > 0) {
                                totalScreenOnMillis += (eventTime - screenOnStart).coerceAtLeast(0L)
                                screenOnStart = 0L
                            }
                            if (currentPkg != null && currentEventStart > 0) {
                                val elapsed = (eventTime - currentEventStart).coerceAtLeast(0L)
                                appDurationMap[currentPkg!!] = (appDurationMap[currentPkg!!] ?: 0L) + elapsed
                                appLastUsedMap[currentPkg!!] = eventTime
                                currentPkg = null
                                currentEventStart = 0L
                            }
                            isScreenOn = false
                        }
                    }

                    // 앱이 화면 최상단에 노출됨 (포그라운드 활성)
                    UsageEvents.Event.ACTIVITY_RESUMED -> {
                        val pkg = event.packageName
                        if (isScreenOn) {
                            if (currentPkg != null && currentEventStart > 0) {
                                val elapsed = (eventTime - currentEventStart).coerceAtLeast(0L)
                                appDurationMap[currentPkg!!] = (appDurationMap[currentPkg!!] ?: 0L) + elapsed
                                appLastUsedMap[currentPkg!!] = eventTime
                            }

                            if (pkg != null && !ignoredPackages.contains(pkg)) {
                                currentPkg = pkg
                                currentEventStart = eventTime
                                appLastUsedMap[pkg] = eventTime
                            } else {
                                currentPkg = null
                                currentEventStart = 0L
                            }
                        }
                    }

                    // 앱이 화면에서 벗어남 (일시정지 또는 백그라운드)
                    UsageEvents.Event.ACTIVITY_PAUSED,
                    UsageEvents.Event.ACTIVITY_STOPPED -> {
                        val pkg = event.packageName
                        if (currentPkg != null && currentPkg == pkg && currentEventStart > 0) {
                            val elapsed = (eventTime - currentEventStart).coerceAtLeast(0L)
                            appDurationMap[currentPkg!!] = (appDurationMap[currentPkg!!] ?: 0L) + elapsed
                            appLastUsedMap[currentPkg!!] = eventTime
                            currentPkg = null
                            currentEventStart = 0L
                        }
                    }
                }
            }

            // 루프 종료 시점(현재) 열려있는 마지막 활성 구간 정산
            if (isScreenOn) {
                if (screenOnStart > 0) {
                    totalScreenOnMillis += (endTime - screenOnStart).coerceAtLeast(0L)
                }
                if (currentPkg != null && currentEventStart > 0) {
                    val elapsed = (endTime - currentEventStart).coerceAtLeast(0L)
                    appDurationMap[currentPkg!!] = (appDurationMap[currentPkg!!] ?: 0L) + elapsed
                    appLastUsedMap[currentPkg!!] = endTime
                }
            }
        } catch (e: Exception) {
            Log.e("Timesnooper", "Failed to query UsageEvents accurately", e)
        }

        return ParsedEventStats(appDurationMap, appLastUsedMap, totalScreenOnMillis)
    }

    private fun queryFallbackUsageStats(
        usageStatsManager: UsageStatsManager,
        startTime: Long,
        endTime: Long,
        ignoredPackages: Set<String>,
        packageManager: PackageManager
    ): Map<String, Long> {
        val fallbackMap = mutableMapOf<String, Long>()
        try {
            val statsMap = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime)
            for ((pkg, stat) in statsMap) {
                if (ignoredPackages.contains(pkg)) continue
                if (packageManager.getLaunchIntentForPackage(pkg) == null && !isAllowedUserFacingApp(pkg)) continue
                if (stat.lastTimeUsed < startTime) continue // 오늘 사용되지 않은 앱 제외
                if (stat.totalTimeInForeground > 60 * 1000) {
                    fallbackMap[pkg] = stat.totalTimeInForeground
                }
            }
        } catch (e: Exception) {
            Log.e("Timesnooper", "Fallback usage stats query failed", e)
        }
        return fallbackMap
    }

    private fun getIgnoredPackages(context: Context, pm: PackageManager): Set<String> {
        val ignored = mutableSetOf<String>()

        // 1. Timesnooper 자체 앱
        ignored.add(context.packageName)

        // 2. 안드로이드 핵심 시스템 및 구글 서비스
        ignored.add("android")
        ignored.add("com.android.systemui")
        ignored.add("com.google.android.gms")
        ignored.add("com.google.android.gsf")
        ignored.add("com.google.android.googlequicksearchbox")

        // 3. 홈 화면 런처 앱 감지 (삼성 One UI Home 등)
        try {
            val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
            }
            val homeResolvers = pm.queryIntentActivities(homeIntent, PackageManager.MATCH_DEFAULT_ONLY)
            for (ri in homeResolvers) {
                ri.activityInfo?.packageName?.let { ignored.add(it) }
            }
        } catch (e: Exception) {
            Log.w("Timesnooper", "Failed to query launcher package", e)
        }

        // 4. 활성화된 키보드(IME) 감지 (삼성 키보드 honeyboard 등)
        try {
            val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
            imm?.enabledInputMethodList?.forEach { imi ->
                ignored.add(imi.packageName)
            }
        } catch (e: Exception) {
            Log.w("Timesnooper", "Failed to query keyboard packages", e)
        }

        return ignored
    }

    private fun isAllowedUserFacingApp(pkgName: String): Boolean {
        // 일부 태블릿 브라우저/유튜브/미디어 앱 중 launchIntent 조회가 특수하게 막힌 경우 예외 허용
        return pkgName.contains("youtube") ||
                pkgName.contains("chrome") ||
                pkgName.contains("browser") ||
                pkgName.contains("kakao")
    }
}

