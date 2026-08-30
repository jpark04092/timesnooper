plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.timesnooper.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.timesnooper.app"
        minSdk = 26 // Android 8.0 Oreo (구형 태블릿 및 안드로이드 12/13/14 완벽 지원)
        targetSdk = 34
        versionCode = 2
        versionName = "1.0.1"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        create("timesnooperSigning") {
            storeFile = file("keystore/timesnooper.keystore")
            storePassword = "timesnooper123"
            keyAlias = "timesnooper"
            keyPassword = "timesnooper123"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("timesnooperSigning")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isDebuggable = true
            signingConfig = signingConfigs.getByName("timesnooperSigning")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.gson)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.coroutines.android)
}
