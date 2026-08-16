package com.timesnooper.app.data

import android.app.usage.UsageStats
import android.content.Context
import android.content.SharedPreferences
import android.util.Log

object TelemetryRepository {
    private const val PREF_NAME = "timesnooper_telemetry"
    private const val KEY_LAST_SYNC = "last_sync_timestamp"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    fun saveHourlySnapshot(context: Context, stats: List<UsageStats>) {
        val prefs = getPrefs(context)
        prefs.edit()
            .putLong(KEY_LAST_SYNC, System.currentTimeMillis())
            .putInt("cached_app_count", stats.size)
            .apply()
        Log.d("Timesnooper", "Telemetry snapshot cached successfully. Count: ${stats.size}")
    }

    fun getLastSyncTime(context: Context): Long {
        return getPrefs(context).getLong(KEY_LAST_SYNC, 0L)
    }
}
