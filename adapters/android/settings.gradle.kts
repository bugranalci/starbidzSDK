pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://artifacts.applovin.com/android") }
    }
}

rootProject.name = "starbidzSDK"

// Main SDK module
include(":starbidz")

// MAX Adapter module (required for AppLovin MAX integration)
include(":starbidz-max")

// Optional adapter modules (for integrating Starbidz into other mediation platforms)
// Uncomment if needed:
// include(":starbidz-admob")
// include(":starbidz-levelplay")
