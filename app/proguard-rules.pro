# Timesnooper Proguard Rules
-keep class com.timesnooper.app.data.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.timesnooper.app.receiver.** { *; }
-keep class com.timesnooper.app.service.** { *; }
-keep class com.timesnooper.app.worker.** { *; }
