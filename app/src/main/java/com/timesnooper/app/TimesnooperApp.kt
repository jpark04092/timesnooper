package com.timesnooper.app

import android.app.Application
import android.util.Log

class TimesnooperApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Log.i("Timesnooper", "TimesnooperApp Application Instance Initialized.")
    }
}
