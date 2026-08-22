package com.timesnooper.app.network

import android.util.Base64
import com.timesnooper.app.data.ReportPayload
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.io.PrintWriter
import java.nio.charset.StandardCharsets
import java.text.SimpleDateFormat
import java.util.*
import javax.net.ssl.SSLSocket
import javax.net.ssl.SSLSocketFactory

object DirectEmailSender {

    data class SendResult(
        val isSuccess: Boolean,
        val message: String,
        val errorDetail: String? = null
    )

    fun sendReportViaDirectSmtp(
        payload: ReportPayload,
        smtpHost: String = "smtp.gmail.com",
        smtpPort: Int = 465,
        senderEmail: String,
        senderAppPassword: String
    ): SendResult {
        if (senderEmail.isBlank() || senderAppPassword.isBlank()) {
            return SendResult(
                isSuccess = false,
                message = "발신용 Gmail 주소와 구글 16자리 앱 비밀번호가 필요합니다."
            )
        }

        val cleanPassword = senderAppPassword.replace(" ", "").trim()

        val rawRecipients = payload.recipientEmail
        val recipientList = rawRecipients
            .split(Regex("[,; \\r\\n\\t]+"))
            .map { it.trim().replace("<", "").replace(">", "") }
            .filter { it.isNotEmpty() && it.contains("@") }
            .distinct()

        if (recipientList.isEmpty()) {
            return SendResult(
                isSuccess = false,
                message = "유효한 수신자 이메일 주소가 없습니다 (입력값: $rawRecipients)."
            )
        }

        var socket: SSLSocket? = null
        var reader: BufferedReader? = null
        var writer: PrintWriter? = null

        try {
            val sslFactory = SSLSocketFactory.getDefault() as SSLSocketFactory
            socket = sslFactory.createSocket(smtpHost, smtpPort) as SSLSocket
            socket.soTimeout = 15000 // 15 seconds

            reader = BufferedReader(InputStreamReader(socket.inputStream, StandardCharsets.UTF_8))
            writer = PrintWriter(OutputStreamWriter(socket.outputStream, StandardCharsets.UTF_8), true)

            fun readResponse(): String {
                val sb = StringBuilder()
                var line = reader.readLine() ?: throw Exception("서버로부터 응답이 없습니다.")
                sb.append(line)
                // Multi-line SMTP response: "250-..." vs "250 ..."
                while (line.length >= 4 && line[3] == '-') {
                    line = reader.readLine() ?: break
                    sb.append("\n").append(line)
                }
                return sb.toString()
            }

            fun sendCommand(cmd: String, expectedCodePrefix: String): String {
                writer.print(cmd + "\r\n")
                writer.flush()
                val resp = readResponse()
                if (!resp.startsWith(expectedCodePrefix)) {
                    throw Exception("SMTP 명령 오류 ($cmd) -> 서버 응답: $resp")
                }
                return resp
            }

            // 1. Initial greeting
            val greeting = readResponse()
            if (!greeting.startsWith("220")) {
                throw Exception("서버 연결 실패: $greeting")
            }

            // 2. EHLO
            sendCommand("EHLO localhost", "250")

            // 3. AUTH LOGIN
            sendCommand("AUTH LOGIN", "334")

            // Send base64 username
            val encodedUser = Base64.encodeToString(senderEmail.toByteArray(StandardCharsets.UTF_8), Base64.NO_WRAP)
            sendCommand(encodedUser, "334")

            // Send base64 password
            val encodedPass = Base64.encodeToString(cleanPassword.toByteArray(StandardCharsets.UTF_8), Base64.NO_WRAP)
            val authResp = sendCommand(encodedPass, "235")

            // 4. MAIL FROM
            sendCommand("MAIL FROM:<$senderEmail>", "250")

            // 5. RCPT TO for all recipients
            for (rcpt in recipientList) {
                sendCommand("RCPT TO:<$rcpt>", "250")
            }

            // 6. DATA
            sendCommand("DATA", "354")

            // Build MIME message
            val subjectText = "[Timesnooper] ${payload.childName} 기기 일일 스크린타임 보고서 (${payload.reportDate})"
            val encodedSubject = "=?UTF-8?B?" + Base64.encodeToString(subjectText.toByteArray(StandardCharsets.UTF_8), Base64.NO_WRAP) + "?="

            val totalHours = payload.totalScreenTimeMinutes / 60
            val totalMins = payload.totalScreenTimeMinutes % 60
            val totalDurationFormatted = if (totalHours > 0) "${totalHours}시간 ${totalMins}분" else "${totalMins}분"

            val timeFormat = SimpleDateFormat("HH:mm", Locale.KOREA)
            val appsHtml = StringBuilder()
            val totalMinsCount = if (payload.totalScreenTimeMinutes > 0) payload.totalScreenTimeMinutes else 1

            for ((index, app) in payload.apps.withIndex()) {
                val appH = app.durationMinutes / 60
                val appM = app.durationMinutes % 60
                val appDurationStr = if (appH > 0) "${appH}시간 ${appM}분" else "${appM}분"
                val percent = Math.min(100, Math.max(1, (app.durationMinutes * 100) / totalMinsCount))
                val lastUsedStr = if (app.lastUsedTime > 0) timeFormat.format(Date(app.lastUsedTime)) else "-"

                appsHtml.append("""
                    <tr style="border-bottom: 1px solid #E2E8F0;">
                        <td style="padding: 10px 12px; font-weight: bold; color: #1E293B;">${index + 1}. ${app.appName}</td>
                        <td style="padding: 10px 12px; color: #0284C7; font-weight: bold; text-align: right;">$appDurationStr</td>
                        <td style="padding: 10px 12px; text-align: center;">
                            <div style="background: #E2E8F0; border-radius: 6px; height: 10px; width: 100px; display: inline-block; overflow: hidden;">
                                <div style="background: #0284C7; height: 10px; width: ${percent}%;"></div>
                            </div>
                            <span style="font-size: 11px; color: #64748B; margin-left: 6px;">${percent}%</span>
                        </td>
                        <td style="padding: 10px 12px; color: #64748B; text-align: right; font-size: 12px;">$lastUsedStr</td>
                    </tr>
                """.trimIndent())
            }

            val htmlBody = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Timesnooper 일일 리포트</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden;">
                        <div style="background: #0F172A; padding: 24px; color: #FFFFFF; text-align: center;">
                            <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px;">🛡️ Timesnooper 일일 자녀 안심 리포트</h1>
                            <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8;">${payload.childName} 기기 스크린타임 사용 분석 (${payload.reportDate})</p>
                        </div>
                        <div style="padding: 24px;">
                            <div style="background: #F1F5F9; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                    <tr>
                                        <td style="color: #64748B; padding: 4px 0;">대상 기기:</td>
                                        <td style="font-weight: bold; color: #0F172A; text-align: right; padding: 4px 0;">${payload.deviceName}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748B; padding: 4px 0;">자녀 별칭:</td>
                                        <td style="font-weight: bold; color: #0F172A; text-align: right; padding: 4px 0;">${payload.childName}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #64748B; padding: 4px 0;">안드로이드:</td>
                                        <td style="color: #0F172A; text-align: right; padding: 4px 0;">${payload.androidVersion}</td>
                                    </tr>
                                    <tr style="border-top: 1px solid #CBD5E1;">
                                        <td style="color: #0F172A; font-weight: bold; padding: 8px 0 4px 0; font-size: 15px;">총 사용시간:</td>
                                        <td style="font-weight: bold; color: #0284C7; text-align: right; padding: 8px 0 4px 0; font-size: 16px;">$totalDurationFormatted</td>
                                    </tr>
                                </table>
                            </div>

                            <h3 style="font-size: 15px; color: #0F172A; margin: 0 0 12px 0;">📱 앱별 사용시간 분석 (${payload.apps.size}개 앱)</h3>
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead>
                                    <tr style="background: #F8FAFC; border-bottom: 2px solid #CBD5E1; color: #475569;">
                                        <th style="padding: 8px 12px; text-align: left;">앱 이름</th>
                                        <th style="padding: 8px 12px; text-align: right;">사용 시간</th>
                                        <th style="padding: 8px 12px; text-align: center;">비율</th>
                                        <th style="padding: 8px 12px; text-align: right;">최근 실행</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    $appsHtml
                                </tbody>
                            </table>

                            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; text-align: center;">
                                본 보고서는 Timesnooper 백그라운드 서비스에 의해 기기에서 직접 생성 및 전송되었습니다.<br>
                                발송 시각: ${SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.KOREA).format(Date())}
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            """.trimIndent()

            val messageHeaders = StringBuilder()
            messageHeaders.append("From: Timesnooper Service <$senderEmail>\r\n")
            val toHeaderFormatted = recipientList.joinToString(", ") { "<$it>" }
            messageHeaders.append("To: $toHeaderFormatted\r\n")
            messageHeaders.append("Subject: $encodedSubject\r\n")
            messageHeaders.append("MIME-Version: 1.0\r\n")
            messageHeaders.append("Content-Type: text/html; charset=UTF-8\r\n")
            messageHeaders.append("Content-Transfer-Encoding: base64\r\n")
            messageHeaders.append("\r\n")

            val base64Html = Base64.encodeToString(htmlBody.toByteArray(StandardCharsets.UTF_8), Base64.DEFAULT)

            writer.print(messageHeaders.toString())
            writer.print(base64Html)
            writer.print("\r\n.\r\n")
            writer.flush()

            val dataResp = readResponse()
            if (!dataResp.startsWith("250")) {
                throw Exception("데이터 전송 거부: $dataResp")
            }

            // 7. QUIT
            try {
                sendCommand("QUIT", "221")
            } catch (e: Exception) {
                // Ignore QUIT error if email already accepted
            }

            return SendResult(
                isSuccess = true,
                message = "Gmail(${recipientList.joinToString(", ")})로 리포트가 직접 전송되었습니다!"
            )
        } catch (e: Exception) {
            val errMsg = e.localizedMessage ?: e.message ?: "알 수 없는 전송 에러"
            val tip = if (errMsg.contains("535") || errMsg.contains("Authentication")) {
                "구글 계정 인증 실패: 구글 계정 2단계 인증 후 생성한 16자리 '앱 비밀번호'를 입력해야 합니다."
            } else {
                errMsg
            }
            return SendResult(
                isSuccess = false,
                message = tip,
                errorDetail = e.stackTraceToString()
            )
        } finally {
            try {
                writer?.close()
                reader?.close()
                socket?.close()
            } catch (e: Exception) {
                // Ignore close errors
            }
        }
    }
}
