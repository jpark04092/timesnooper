package com.timesnooper.app.network

import com.google.gson.GsonBuilder
import com.timesnooper.app.data.ReportPayload
import okhttp3.OkHttpClient
import okhttp3.ResponseBody
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

data class NetworkResult(
    val isSuccess: Boolean,
    val statusCode: Int,
    val message: String,
    val rawBody: String? = null
)

interface TimesnooperApiService {
    @POST("api/reports/daily")
    suspend fun submitDailyReport(@Body payload: ReportPayload): Response<ResponseBody>
}

object TimesnooperApiClient {
    // Timesnooper Backend Server Endpoint
    const val DEFAULT_BASE_URL = "https://ais-dev-2xjinejemuzfrzivhmre6f-252788179842.asia-northeast1.run.app/"

    private val gson = GsonBuilder()
        .setLenient()
        .create()

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    fun getApiService(baseUrl: String = DEFAULT_BASE_URL): TimesnooperApiService {
        val normalizedUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        return Retrofit.Builder()
            .baseUrl(normalizedUrl)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(TimesnooperApiService::class.java)
    }

    suspend fun sendDailyReport(payload: ReportPayload, customBaseUrl: String? = null): NetworkResult {
        return try {
            val url = if (!customBaseUrl.isNullOrBlank()) customBaseUrl else DEFAULT_BASE_URL
            val api = getApiService(url)
            val response = api.submitDailyReport(payload)
            val responseCode = response.code()
            val responseString = response.body()?.string() ?: response.errorBody()?.string() ?: ""

            if (response.isSuccessful || responseCode in 200..299) {
                NetworkResult(
                    isSuccess = true,
                    statusCode = responseCode,
                    message = "리포트 전송 성공 (HTTP $responseCode)",
                    rawBody = responseString
                )
            } else {
                NetworkResult(
                    isSuccess = false,
                    statusCode = responseCode,
                    message = "서버 응답: HTTP $responseCode",
                    rawBody = responseString
                )
            }
        } catch (e: Exception) {
            NetworkResult(
                isSuccess = false,
                statusCode = -1,
                message = e.localizedMessage ?: "네트워크 통신 오류",
                rawBody = e.stackTraceToString()
            )
        }
    }
}
