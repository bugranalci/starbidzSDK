# Starbidz MAX Adapter ProGuard rules

# Keep AppLovin MAX Adapter (CRITICAL - MAX discovers adapters by reflection)
-keep class com.applovin.mediation.adapters.StarbidMediationAdapter { *; }
-keep class io.starbidz.max.** { *; }
