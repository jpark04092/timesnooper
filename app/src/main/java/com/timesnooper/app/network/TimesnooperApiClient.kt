package com.timesnooper.app.network

import com.timesnooper.app.data.ReportPayload
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

interface TimesnooperApiService {
    @POST("api/reports/daily")
    suspend fun submitDailyReport(@Body payload: ReportPayload): Response<Map<String, Any>>
}

object TimesnooperApiClient {
    // Timesnooper Backend Server Endpoint
    private const val BASE_URL = "https://ais-dev-2xjinejemuzfrzivhmre6f-252788179842.asia-northeast1.run.app/"

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    private val api: TimesnooperApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(TimesnooperApiService::class.java)
    }

    suspend fun sendDailyReport(payload: ReportPayload): Response<Map<String, Any>> {
        return api.submitDailyReport(payload)
    }
}
