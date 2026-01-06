plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    `maven-publish`
}

android {
    namespace = "com.starbidz.sdk"
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
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.okhttp)
    implementation(libs.moshi)
    implementation(libs.moshi.kotlin)
    implementation(libs.coroutines.core)
    implementation(libs.coroutines.android)
}

afterEvaluate {
    publishing {
        publications {
            create<MavenPublication>("release") {
                from(components["release"])

                groupId = "com.github.bugranalci"
                artifactId = "starbidzSDK"
                version = project.property("STARBIDZ_VERSION").toString()

                pom {
                    name.set("Starbidz SDK")
                    description.set("Client-side ad mediation SDK for mobile apps")
                    url.set("https://github.com/bugranalci/starbidzSDK")

                    licenses {
                        license {
                            name.set("MIT License")
                            url.set("https://opensource.org/licenses/MIT")
                        }
                    }

                    developers {
                        developer {
                            id.set("starbidz")
                            name.set("Starbidz Team")
                            email.set("dev@starbidz.io")
                        }
                    }

                    scm {
                        connection.set("scm:git:github.com/bugranalci/starbidzSDK.git")
                        developerConnection.set("scm:git:ssh://github.com/bugranalci/starbidzSDK.git")
                        url.set("https://github.com/bugranalci/starbidzSDK/tree/main")
                    }
                }
            }
        }
    }
}
