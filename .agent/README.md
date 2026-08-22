# 🛡️ Timesnooper Project Context Index

> **Agent Cowork Quick Reference**: 이 문서는 AI Agent와의 협업 시 토큰 소모를 최소화하고, 프로젝트의 핵심 구조와 비즈니스 로직을 즉시 파악할 수 있도록 압축 정리된 인덱스입니다.

---

## 📌 1. 프로젝트 한눈에 보기 (Executive Summary)
- **프로젝트명**: `timesnooper`
- **목적**: 아동 기기(스마트폰/태블릿)의 앱 사용시간 백그라운드 무중단 추적, Device Owner(ADB) 기반 앱 무단 삭제 방지, 스텔스 모드(런처 숨김/비상 다이얼 복구), 매일 정기 시각(기본 22:00 KST) 학부모 Gmail 데일리 리포트 자동 발송(기기 직발송 + 서버 발송).
- **기술 스택**:
  - **Server/Backend**: Node.js, Express (`server.ts`), Google GenAI (`gemini-3.7-flash`), Nodemailer, TSX/Vite
  - **Frontend Dashboard**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion
  - **Android Native App**: Kotlin (minSdk 26, targetSdk 34), Jetpack WorkManager, UsageStatsManager, DevicePolicyManager, SSLSocket SMTP Direct Dispatcher
  - **CI/CD**: GitHub Actions (`.github/workflows/build-apk.yml`, Java 17 + Gradle v4)

---

## 🗂️ 2. .agent 가이드 문서 목차
자세한 정보가 필요할 때 아래 문서를 선택적으로 참조하세요:

| 파일명 | 내용 | 용도 |
| :--- | :--- | :--- |
| [`file_structure.md`](./file_structure.md) | 전체 디렉토리 구조 및 파일별 역할 상세 매핑 | 파일 위치 탐색 및 모듈 식별 |
| [`architecture.md`](./architecture.md) | 3계층 아키텍처, 안드로이드 3대 보안/추적 원리, 시퀀스 흐름 | 시스템 구조 및 라이프사이클 분석 |
| [`api_and_data_models.md`](./api_and_data_models.md) | Express REST API 명세, TS 인터페이스, ADB 명령어, SharedPreferences 키 | 기능 개발, API 연동, 기기 제어 |

---

## ⚡ 3. 핵심 아키텍처 3대 원리 (Cheat Sheet)
1. **무중단 백그라운드 상주**:
   - `TimesnooperMonitorService`: `FOREGROUND_SERVICE_SPECIAL_USE`, `START_STICKY`, `onTaskRemoved` 시 `AlarmManager`를 통한 1초 내 자가 부활.
   - 15분 주기 `UsageStatsManager` 폴링 & 로컬 캐싱.
2. **재부팅 및 캐시 정리 후 부활**:
   - `BootReceiver` (우선순위 999): `BOOT_COMPLETED`, `LOCKED_BOOT_COMPLETED`, `QUICKBOOT_POWERON` 수신 후 포그라운드 서비스 및 데일리 알람 복구.
3. **앱 삭제 절대 방지 (Device Owner)**:
   - ADB 명령 `dpm set-device-owner`로 등록된 `TimesnooperAdminReceiver`가 `DevicePolicyManager`를 통해 OS 설정의 '앱 삭제' 버튼을 비활성화.
4. **이중 메일 발송 파이프라인**:
   - **방법 A (기기 직접 발송)**: `DirectEmailSender`가 안드로이드 기기에서 `smtp.gmail.com:465` SSL 소켓으로 학부모 Gmail로 직발송 (서버 다운 시에도 100% 동작).
   - **방법 B (서버 API 발송)**: `TimesnooperApiClient` -> Express `/api/reports/daily` -> Gemini AI 코멘트 생성 -> Nodemailer 발송.

---

## 🚀 4. 빌드 및 실행 명령어
- **웹/서버 개발 서버**: `bun run dev` 또는 `npm run dev` (Express + Vite 통합 실행, 포트: `3000`)
- **웹/서버 빌드**: `bun run build` (Vite build + esbuild `server.ts` 번들링 -> `dist/server.cjs`)
- **타입스크립트 린트**: `bun run lint` (`tsc --noEmit`)
- **안드로이드 APK 빌드 (Local)**: `./gradlew assembleDebug`
- **안드로이드 APK CI 빌드 (GitHub Actions)**: Push 또는 `workflow_dispatch` 실행 -> `release/timesnooper-debug.apk` 자동 커밋
- **Device Owner ADB 활성화**:
  ```bash
  adb shell dpm set-device-owner com.timesnooper.app/.receiver.TimesnooperAdminReceiver
  adb shell pm grant com.timesnooper.app android.permission.PACKAGE_USAGE_STATS
  adb shell dumpsys deviceidle whitelist +com.timesnooper.app
  ```
- **스텔스 모드 복구 (비상 다이얼 또는 ADB)**:
  - 다이얼: `*#*#8463#*#*`
  - ADB: `adb shell am broadcast -a com.timesnooper.app.ACTION_UNHIDE_ICON -p com.timesnooper.app`

