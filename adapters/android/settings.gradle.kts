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

rootProject.name = "starbidz-android"

include(":starbidz-core")
include(":starbidz-max")
include(":starbidz-admob")
include(":starbidz-levelplay")
