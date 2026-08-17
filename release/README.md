# Timesnooper Android APK Release

이 폴더는 GitHub Actions 워크플로우에 의해 빌드된 최신 안드로이드 설치 파일(.apk)이 자동으로 커밋 및 보관되는 위치입니다.

## 제공되는 파일
- `timesnooper-debug.apk`: 최신 디버그 빌드 APK (테스트 및 즉시 설치용)
- `timesnooper-release.apk`: 최신 릴리즈 빌드 APK

## 스마트폰 / 태블릿 설치 안내
1. GitHub 웹에서 `timesnooper-debug.apk` 파일을 클릭 후 **Download** (또는 View raw)를 눌러 기기로 다운로드합니다.
2. 기기의 '내 파일' 또는 '다운로드' 앱에서 APK 파일을 터치하여 설치합니다.
3. PC에서 ADB로 바로 설치 시:
   ```bash
   adb install -r release/timesnooper-debug.apk
   ```
