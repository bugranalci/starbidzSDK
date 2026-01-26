# Starbidz SDK ProGuard rules for consumers

# Keep AppLovin MAX Adapter (CRITICAL - MAX discovers adapters by reflection)
-keep class com.applovin.mediation.adapters.StarbidMediationAdapter { *; }
-keep class io.starbidz.max.** { *; }

# Keep Starbidz public API
-keep class com.starbidz.sdk.Starbidz { *; }
-keep class com.starbidz.sdk.StarbidConfig { *; }
-keep class com.starbidz.sdk.StarbidConfig$Builder { *; }
-keep class com.starbidz.sdk.StarbidzAd { *; }
-keep class com.starbidz.sdk.StarbidzAd$* { *; }
-keep class com.starbidz.sdk.AdFormat { *; }
-keep class com.starbidz.sdk.AdResult { *; }
-keep class com.starbidz.sdk.AdResult$* { *; }

# Keep Moshi annotations
-keepclassmembers class * {
    @com.squareup.moshi.* <methods>;
}
-keep @com.squareup.moshi.JsonQualifier @interface *

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase
