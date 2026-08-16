package com.timesnooper.app.data

import com.google.gson.annotations.SerializedName

data class AppStatEntry(
    @SerializedName("packageName") val packageName: String,
    @SerializedName("appName") val appName: String,
    @SerializedName("durationMinutes") val durationMinutes: Int,
    @SerializedName("lastUsedTime") val lastUsedTime: Long
)

data class ReportPayload(
    @SerializedName("deviceId") val deviceId: String,
    @SerializedName("deviceName") val deviceName: String,
    @SerializedName("childName") val childName: String = "자녀",
    @SerializedName("recipientEmail") val recipientEmail: String = "jpark04092@gmail.com",
    @SerializedName("androidVersion") val androidVersion: String,
    @SerializedName("reportDate") val reportDate: String,
    @SerializedName("totalScreenTimeMinutes") val totalScreenTimeMinutes: Int,
    @SerializedName("apps") val apps: List<AppStatEntry>
)
