# Starbidz SDK Integration Guide

## Android Integration

### Step 1: Add JitPack repository

Add JitPack to your root `build.gradle` or `settings.gradle`:

```gradle
// settings.gradle.kts
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
    }
}
```

Or in `build.gradle`:

```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }
    }
}
```

### Step 2: Add dependency

Add the Starbidz SDK dependency to your app's `build.gradle`:

```gradle
dependencies {
    implementation 'com.github.bugranalci:starbidzSDK:1.0.0'
}
```

### Step 3: Initialize SDK

Initialize the SDK in your Application class or main Activity:

```kotlin
import com.starbidz.sdk.Starbidz
import com.starbidz.sdk.StarbidConfig

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        val config = StarbidConfig.Builder()
            .appKey("YOUR_APP_KEY")
            .testMode(BuildConfig.DEBUG)
            .build()

        Starbidz.initialize(this, config)
    }
}
```

### Step 4: Request ads

```kotlin
import com.starbidz.sdk.Starbidz
import com.starbidz.sdk.AdFormat
import com.starbidz.sdk.AdResult
import kotlinx.coroutines.launch

// In a coroutine scope
lifecycleScope.launch {
    when (val result = Starbidz.requestBid(
        context = this@MainActivity,
        placementId = "your_placement_id",
        format = AdFormat.BANNER,
        width = 320,
        height = 50
    )) {
        is AdResult.Success -> {
            val ad = result.ad
            // Use ad.creative.content to display the ad
            println("Ad received: ${ad.demandSource}, price: ${ad.price}")
        }
        is AdResult.NoBid -> {
            println("No ad available")
        }
        is AdResult.Error -> {
            println("Error: ${result.message}")
        }
    }
}
```

### Supported Ad Formats

- `AdFormat.BANNER` - Banner ads (320x50, 300x250, etc.)
- `AdFormat.INTERSTITIAL` - Full-screen interstitial ads
- `AdFormat.REWARDED` - Rewarded video ads

---

## iOS Integration

### Step 1: Add CocoaPods dependency

Add Starbidz to your `Podfile`:

```ruby
platform :ios, '11.0'

target 'YourApp' do
  use_frameworks!

  pod 'Starbidz', '~> 1.0.0'
end
```

Then run:

```bash
pod install
```

### Step 2: Initialize SDK

Initialize the SDK in your `AppDelegate`:

```swift
import Starbidz

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        let config = StarbidConfig(
            appKey: "YOUR_APP_KEY",
            testMode: true // Set to false in production
        )

        Starbidz.shared.initialize(config: config)

        return true
    }
}
```

Or using the builder pattern:

```swift
let config = StarbidConfigBuilder()
    .appKey("YOUR_APP_KEY")
    .testMode(true)
    .build()

Starbidz.shared.initialize(config: config)
```

### Step 3: Request ads

```swift
import Starbidz

Starbidz.shared.requestBid(
    placementId: "your_placement_id",
    format: .banner,
    width: 320,
    height: 50
) { result in
    switch result {
    case .success(let ad):
        // Use ad.creative.content to display the ad
        print("Ad received: \(ad.demandSource), price: \(ad.price)")

    case .noBid:
        print("No ad available")

    case .error(let message, let code):
        print("Error: \(message), code: \(code)")
    }
}
```

### Supported Ad Formats

- `.banner` - Banner ads
- `.interstitial` - Full-screen interstitial ads
- `.rewarded` - Rewarded video ads

---

## Configuration Options

| Option | Android | iOS | Description |
|--------|---------|-----|-------------|
| `appKey` | Required | Required | Your Starbidz app key |
| `serverUrl` | Optional | Optional | Custom server URL (default: https://bid.starbidz.io) |
| `testMode` | Optional | Optional | Enable test mode (default: false) |
| `requestTimeoutMs` | Optional | Optional | Request timeout in milliseconds (default: 5000) |

---

## Event Tracking

Track ad events for analytics:

### Android

```kotlin
lifecycleScope.launch {
    // Track impression
    Starbidz.trackImpression(bidId = ad.bidId, placementId = "your_placement_id")

    // Track click
    Starbidz.trackClick(bidId = ad.bidId, placementId = "your_placement_id")

    // Track completion (for rewarded ads)
    Starbidz.trackComplete(bidId = ad.bidId, placementId = "your_placement_id")
}
```

### iOS

```swift
// Track impression
Starbidz.shared.trackImpression(bidId: ad.bidId, placementId: "your_placement_id")

// Track click
Starbidz.shared.trackClick(bidId: ad.bidId, placementId: "your_placement_id")

// Track completion (for rewarded ads)
Starbidz.shared.trackComplete(bidId: ad.bidId, placementId: "your_placement_id")
```

---

## Minimum Requirements

| Platform | Minimum Version |
|----------|-----------------|
| Android  | API 21 (Android 5.0 Lollipop) |
| iOS      | iOS 11.0 |

---

## Support

For support, please contact: dev@starbidz.io

GitHub Issues: https://github.com/bugranalci/starbidzSDK/issues
