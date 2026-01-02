plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    `maven-publish`
}

android {
    namespace = "io.starbidz.levelplay"
    compileSdk = project.property("ANDROID_COMPILE_SDK").toString().toInt()

    defaultConfig {
        minSdk = project.property("ANDROID_MIN_SDK").toString().toInt()

        consumerProguardFiles("consumer-rules.pro")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(project(":starbidz-core"))
    implementation(libs.androidx.core.ktx)
    implementation(libs.coroutines.core)
    implementation(libs.coroutines.android)

    // ironSource LevelPlay SDK
    compileOnly(libs.ironsource.sdk)
}

afterEvaluate {
    publishing {
        publications {
            create<MavenPublication>("release") {
                from(components["release"])

                groupId = project.property("STARBIDZ_GROUP").toString()
                artifactId = "starbidz-levelplay"
                version = project.property("STARBIDZ_VERSION").toString()

                pom {
                    name.set("Starbidz LevelPlay Adapter")
                    description.set("ironSource LevelPlay adapter for Starbidz SDK")
                    url.set("https://github.com/AjoPay/Starbidz-SDK-Android")
                }
            }
        }
    }
}
