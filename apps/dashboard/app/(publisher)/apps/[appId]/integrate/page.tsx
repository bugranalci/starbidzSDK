import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CodeBlock } from '@/components/code-block'
import { CopyableCode } from '@/components/copy-button'

export default async function IntegrationGuidePage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { appId } = await params
  const user = await getOrCreateUser()

  if (!user?.publisher) {
    return <div>Loading...</div>
  }

  const app = await prisma.app.findFirst({
    where: {
      id: appId,
      publisherId: user.publisher.id,
    },
    include: {
      adUnits: true,
    },
  })

  if (!app) {
    notFound()
  }

  const serverUrl = process.env.NEXT_PUBLIC_BID_SERVER_URL || 'https://bid.starbidz.io'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/apps/${app.id}`}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back to App
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Integration Guide</h1>
        <p className="text-gray-500">
          Follow these steps to integrate Starbidz SDK into {app.name}
        </p>
      </div>

      {/* App Credentials */}
      <Card>
        <CardHeader>
          <CardTitle>Your App Credentials</CardTitle>
          <CardDescription>
            Use these credentials to initialize the SDK in your app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">App Key</label>
            <CopyableCode className="mt-1">{app.appKey}</CopyableCode>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Server URL</label>
            <CopyableCode className="mt-1">{serverUrl}</CopyableCode>
          </div>

          {app.adUnits.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500">Placement IDs</label>
              <div className="mt-1 space-y-2">
                {app.adUnits.map((unit) => (
                  <div key={unit.id} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="text-sm">{unit.name} ({unit.format})</span>
                    <code className="text-sm font-mono">{unit.placementId}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Selection */}
      <Tabs defaultValue="android" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="android">Android</TabsTrigger>
          <TabsTrigger value="ios">iOS</TabsTrigger>
        </TabsList>

        {/* Android Integration */}
        <TabsContent value="android" className="space-y-6">
          <AndroidIntegrationGuide app={app} serverUrl={serverUrl} />
        </TabsContent>

        {/* iOS Integration */}
        <TabsContent value="ios" className="space-y-6">
          <IOSIntegrationGuide app={app} serverUrl={serverUrl} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AndroidIntegrationGuide({ app, serverUrl }: { app: any; serverUrl: string }) {
  return (
    <Tabs defaultValue="max" className="space-y-6">
      <TabsList>
        <TabsTrigger value="max">AppLovin MAX</TabsTrigger>
        <TabsTrigger value="admob">AdMob</TabsTrigger>
        <TabsTrigger value="levelplay">LevelPlay</TabsTrigger>
      </TabsList>

      {/* AppLovin MAX */}
      <TabsContent value="max" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Add Dependencies</CardTitle>
            <CardDescription>Add the Starbidz SDK and MAX adapter to your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Add the following to your app-level <code className="bg-gray-100 px-1 rounded">build.gradle</code> file:
            </p>
            <CodeBlock language="groovy">{`dependencies {
    // AppLovin MAX SDK
    implementation 'com.applovin:applovin-sdk:12.4.0'

    // Starbidz SDK & MAX Adapter
    implementation 'io.starbidz:starbidz-core:1.0.0'
    implementation 'io.starbidz:starbidz-max:1.0.0'
}`}</CodeBlock>

            <p className="text-sm text-gray-600">
              Add the Starbidz Maven repository to your project-level <code className="bg-gray-100 px-1 rounded">build.gradle</code>:
            </p>
            <CodeBlock language="groovy">{`allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://artifacts.applovin.com/android' }
        maven { url 'https://maven.starbidz.io/releases' }
    }
}`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure AndroidManifest.xml</CardTitle>
            <CardDescription>Add required permissions and meta-data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock language="xml">{`<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Required Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application>
        <!-- AppLovin SDK Key -->
        <meta-data
            android:name="applovin.sdk.key"
            android:value="YOUR_APPLOVIN_SDK_KEY" />
    </application>
</manifest>`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Configure MAX Dashboard</CardTitle>
            <CardDescription>Set up Starbidz as a custom network in MAX</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</span>
                <div>
                  <p className="font-medium">Go to MAX Dashboard → Mediation → Manage → Networks</p>
                  <p className="text-sm text-gray-500">Click "Click here to add a Custom Network"</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">2</span>
                <div>
                  <p className="font-medium">Configure Network Settings</p>
                  <div className="mt-2 bg-gray-50 p-3 rounded space-y-2 text-sm">
                    <p><strong>Network Name:</strong> Starbidz</p>
                    <p><strong>Android Adapter Class:</strong></p>
                    <code className="block bg-gray-100 p-2 rounded">io.starbidz.max.StarbidMediationAdapter</code>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">3</span>
                <div>
                  <p className="font-medium">Add Custom Parameters</p>
                  <div className="mt-2 bg-gray-50 p-3 rounded text-sm">
                    <p className="mb-2">In the ad unit settings, add these custom parameters:</p>
                    <CodeBlock language="json">{`{
  "app_key": "${app.appKey}",
  "placement_id": "${app.adUnits[0]?.placementId || 'YOUR_PLACEMENT_ID'}",
  "server_url": "${serverUrl}"
}`}</CodeBlock>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: Initialize SDK</CardTitle>
            <CardDescription>Initialize MAX SDK in your Application class</CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock language="kotlin">{`class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // Initialize AppLovin MAX SDK
        AppLovinSdk.getInstance(this).mediationProvider = "max"
        AppLovinSdk.initializeSdk(this) { config ->
            // SDK is initialized, start loading ads
        }
    }
}`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 5: Load & Show Banner Ads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock language="kotlin">{`class BannerActivity : AppCompatActivity() {
    private lateinit var adView: MaxAdView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        adView = MaxAdView("YOUR_AD_UNIT_ID", this)
        adView.setListener(object : MaxAdViewAdListener {
            override fun onAdLoaded(ad: MaxAd) {
                Log.d("Banner", "Ad loaded")
            }

            override fun onAdDisplayed(ad: MaxAd) {}
            override fun onAdHidden(ad: MaxAd) {}
            override fun onAdClicked(ad: MaxAd) {}
            override fun onAdLoadFailed(adUnitId: String, error: MaxError) {
                Log.e("Banner", "Failed to load: \${error.message}")
            }
            override fun onAdDisplayFailed(ad: MaxAd, error: MaxError) {}
        })

        // Set banner size (320x50)
        val width = ViewGroup.LayoutParams.MATCH_PARENT
        val heightPx = resources.getDimensionPixelSize(R.dimen.banner_height)
        adView.layoutParams = FrameLayout.LayoutParams(width, heightPx)

        // Add to layout and load
        bannerContainer.addView(adView)
        adView.loadAd()
    }

    override fun onDestroy() {
        super.onDestroy()
        adView.destroy()
    }
}`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 6: Load & Show Interstitial Ads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock language="kotlin">{`class InterstitialActivity : AppCompatActivity(), MaxAdListener {
    private lateinit var interstitialAd: MaxInterstitialAd
    private var retryAttempt = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        interstitialAd = MaxInterstitialAd("YOUR_AD_UNIT_ID", this)
        interstitialAd.setListener(this)

        // Load the first ad
        interstitialAd.loadAd()
    }

    override fun onAdLoaded(ad: MaxAd) {
        retryAttempt = 0
        Log.d("Interstitial", "Ad loaded and ready to show")
    }

    override fun onAdLoadFailed(adUnitId: String, error: MaxError) {
        // Retry with exponential backoff
        retryAttempt++
        val delayMs = TimeUnit.SECONDS.toMillis(2.0.pow(min(6, retryAttempt)).toLong())
        Handler(Looper.getMainLooper()).postDelayed({ interstitialAd.loadAd() }, delayMs)
    }

    override fun onAdDisplayed(ad: MaxAd) {}
    override fun onAdHidden(ad: MaxAd) {
        // Pre-load next ad
        interstitialAd.loadAd()
    }
    override fun onAdClicked(ad: MaxAd) {}
    override fun onAdDisplayFailed(ad: MaxAd, error: MaxError) {
        interstitialAd.loadAd()
    }

    // Call this when you want to show the ad
    private fun showInterstitial() {
        if (interstitialAd.isReady) {
            interstitialAd.showAd()
        }
    }
}`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 7: Load & Show Rewarded Ads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock language="kotlin">{`class RewardedActivity : AppCompatActivity(), MaxRewardedAdListener {
    private lateinit var rewardedAd: MaxRewardedAd
    private var retryAttempt = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        rewardedAd = MaxRewardedAd.getInstance("YOUR_AD_UNIT_ID", this)
        rewardedAd.setListener(this)

        // Load the first ad
        rewardedAd.loadAd()
    }

    override fun onAdLoaded(ad: MaxAd) {
        retryAttempt = 0
        Log.d("Rewarded", "Ad loaded and ready")
    }

    override fun onAdLoadFailed(adUnitId: String, error: MaxError) {
        retryAttempt++
        val delayMs = TimeUnit.SECONDS.toMillis(2.0.pow(min(6, retryAttempt)).toLong())
        Handler(Looper.getMainLooper()).postDelayed({ rewardedAd.loadAd() }, delayMs)
    }

    override fun onAdDisplayed(ad: MaxAd) {}
    override fun onAdHidden(ad: MaxAd) {
        rewardedAd.loadAd()
    }
    override fun onAdClicked(ad: MaxAd) {}
    override fun onAdDisplayFailed(ad: MaxAd, error: MaxError) {
        rewardedAd.loadAd()
    }

    override fun onUserRewarded(ad: MaxAd, reward: MaxReward) {
        // User completed the video, grant reward
        Log.d("Rewarded", "User earned: \${reward.amount} \${reward.label}")
        grantReward(reward.amount)
    }

    // Call this when you want to show the ad
    private fun showRewardedAd() {
        if (rewardedAd.isReady) {
            rewardedAd.showAd()
        }
    }
}`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 8: Testing</CardTitle>
            <CardDescription>Verify your integration is working correctly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Enable test mode in MAX Dashboard during development to see test ads.
              </AlertDescription>
            </Alert>
            <div className="space-y-2 text-sm">
              <p>✓ Check Logcat for "Starbidz" logs</p>
              <p>✓ Verify ads are loading and displaying</p>
              <p>✓ Confirm impressions appear in your Starbidz dashboard</p>
              <p>✓ Test all ad formats (Banner, Interstitial, Rewarded)</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* AdMob */}
      <TabsContent value="admob" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Add Dependencies</CardTitle>
            <CardDescription>Add the Starbidz SDK and AdMob adapter to your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock language="groovy">{`dependencies {
    // Google Mobile Ads SDK
    implementation 'com.google.android.gms:play-services-ads:23.0.0'

    // Starbidz SDK & AdMob Adapter
    implementation 'io.starbidz:starbidz-core:1.0.0'
    implementation 'io.starbidz:starbidz-admob:1.0.0'
}`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure AndroidManifest.xml</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="xml">{`<manifest>
    <application>
        <!-- AdMob App ID -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
    </application>
</manifest>`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Configure AdMob Dashboard</CardTitle>
            <CardDescription>Set up Starbidz as a custom event in AdMob</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</span>
                <div>
                  <p className="font-medium">Go to AdMob → Mediation → Create Mediation Group</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">2</span>
                <div>
                  <p className="font-medium">Add Custom Event</p>
                  <p className="text-sm text-gray-500">Select "Add Custom Event" under Ad Sources</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">3</span>
                <div>
                  <p className="font-medium">Configure Custom Event Classes</p>
                  <div className="mt-2 bg-gray-50 p-3 rounded space-y-2 text-sm">
                    <p><strong>Banner Class Name:</strong></p>
                    <code className="block bg-gray-100 p-2 rounded mb-2">io.starbidz.admob.StarbidBannerCustomEvent</code>
                    <p><strong>Interstitial Class Name:</strong></p>
                    <code className="block bg-gray-100 p-2 rounded mb-2">io.starbidz.admob.StarbidInterstitialCustomEvent</code>
                    <p><strong>Rewarded Class Name:</strong></p>
                    <code className="block bg-gray-100 p-2 rounded">io.starbidz.admob.StarbidRewardedCustomEvent</code>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">4</span>
                <div>
                  <p className="font-medium">Set Custom Event Parameters</p>
                  <CodeBlock language="json">{`{
  "app_key": "${app.appKey}",
  "placement_id": "${app.adUnits[0]?.placementId || 'YOUR_PLACEMENT_ID'}",
  "server_url": "${serverUrl}"
}`}</CodeBlock>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: Initialize Mobile Ads SDK</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="kotlin">{`class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        MobileAds.initialize(this) { initializationStatus ->
            // SDK initialized
            val statusMap = initializationStatus.adapterStatusMap
            for ((adapter, status) in statusMap) {
                Log.d("AdMob", "Adapter: $adapter, Status: \${status.initializationState}")
            }
        }
    }
}`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 5: Load & Show Ads</CardTitle>
            <CardDescription>Use standard AdMob APIs - Starbidz ads will be served through mediation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Use the standard Google Mobile Ads SDK APIs. When Starbidz wins the mediation auction,
              our adapter will automatically serve the ad.
            </p>
            <CodeBlock language="kotlin">{`// Banner Example
val adView = AdView(this)
adView.adUnitId = "YOUR_ADMOB_AD_UNIT_ID"
adView.setAdSize(AdSize.BANNER)
adView.loadAd(AdRequest.Builder().build())

// Interstitial Example
InterstitialAd.load(
    this,
    "YOUR_ADMOB_AD_UNIT_ID",
    AdRequest.Builder().build(),
    object : InterstitialAdLoadCallback() {
        override fun onAdLoaded(ad: InterstitialAd) {
            ad.show(this@MainActivity)
        }
    }
)

// Rewarded Example
RewardedAd.load(
    this,
    "YOUR_ADMOB_AD_UNIT_ID",
    AdRequest.Builder().build(),
    object : RewardedAdLoadCallback() {
        override fun onAdLoaded(ad: RewardedAd) {
            ad.show(this@MainActivity) { reward ->
                Log.d("Reward", "User earned: \${reward.amount}")
            }
        }
    }
)`}</CodeBlock>
          </CardContent>
        </Card>
      </TabsContent>

      {/* LevelPlay */}
      <TabsContent value="levelplay" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Add Dependencies</CardTitle>
            <CardDescription>Add the Starbidz SDK and LevelPlay adapter to your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock language="groovy">{`dependencies {
    // ironSource LevelPlay SDK
    implementation 'com.ironsource.sdk:mediationsdk:7.9.0'

    // Starbidz SDK & LevelPlay Adapter
    implementation 'io.starbidz:starbidz-core:1.0.0'
    implementation 'io.starbidz:starbidz-levelplay:1.0.0'
}`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure LevelPlay Dashboard</CardTitle>
            <CardDescription>Set up Starbidz as a custom adapter in LevelPlay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</span>
                <div>
                  <p className="font-medium">Go to LevelPlay → Setup → SDK Networks</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">2</span>
                <div>
                  <p className="font-medium">Click "Manage Networks" → "Custom Adapter"</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">3</span>
                <div>
                  <p className="font-medium">Configure Custom Adapter</p>
                  <div className="mt-2 bg-gray-50 p-3 rounded space-y-2 text-sm">
                    <p><strong>Network Key:</strong> <code className="bg-gray-100 px-1">Starbidz</code></p>
                    <p><strong>Android Adapter Class:</strong></p>
                    <code className="block bg-gray-100 p-2 rounded">io.starbidz.levelplay.StarbidCustomAdapter</code>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">4</span>
                <div>
                  <p className="font-medium">Set Instance Parameters (JSON)</p>
                  <CodeBlock language="json">{`{
  "appKey": "${app.appKey}",
  "placementId": "${app.adUnits[0]?.placementId || 'YOUR_PLACEMENT_ID'}",
  "serverUrl": "${serverUrl}"
}`}</CodeBlock>
                  <Alert className="mt-2">
                    <AlertDescription>
                      Note: LevelPlay uses camelCase for parameter keys (appKey, placementId, serverUrl)
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Initialize LevelPlay SDK</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="kotlin">{`class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // Initialize ironSource
        IronSource.init(
            this,
            "YOUR_IRONSOURCE_APP_KEY",
            IronSource.AD_UNIT.REWARDED_VIDEO,
            IronSource.AD_UNIT.INTERSTITIAL,
            IronSource.AD_UNIT.BANNER
        )
    }
}`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: Implement Ad Formats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Use standard LevelPlay APIs. Starbidz will participate in mediation automatically.
            </p>
            <CodeBlock language="kotlin">{`// Rewarded Video
IronSource.setRewardedVideoListener(object : RewardedVideoListener {
    override fun onRewardedVideoAdOpened() {}
    override fun onRewardedVideoAdClosed() {}
    override fun onRewardedVideoAvailabilityChanged(available: Boolean) {
        if (available) {
            IronSource.showRewardedVideo()
        }
    }
    override fun onRewardedVideoAdRewarded(placement: Placement) {
        Log.d("Reward", "User rewarded: \${placement.rewardAmount}")
    }
    override fun onRewardedVideoAdShowFailed(error: IronSourceError) {}
    override fun onRewardedVideoAdClicked(placement: Placement) {}
    override fun onRewardedVideoAdStarted() {}
    override fun onRewardedVideoAdEnded() {}
})

// Interstitial
IronSource.setInterstitialListener(object : InterstitialListener {
    override fun onInterstitialAdReady() {
        IronSource.showInterstitial()
    }
    override fun onInterstitialAdLoadFailed(error: IronSourceError) {}
    override fun onInterstitialAdOpened() {}
    override fun onInterstitialAdClosed() {}
    override fun onInterstitialAdShowSucceeded() {}
    override fun onInterstitialAdShowFailed(error: IronSourceError) {}
    override fun onInterstitialAdClicked() {}
})
IronSource.loadInterstitial()

// Banner
val bannerLayout = IronSourceBannerLayout(this)
bannerLayout.setBannerListener(object : BannerListener {
    override fun onBannerAdLoaded() {}
    override fun onBannerAdLoadFailed(error: IronSourceError) {}
    override fun onBannerAdClicked() {}
    override fun onBannerAdScreenPresented() {}
    override fun onBannerAdScreenDismissed() {}
    override fun onBannerAdLeftApplication() {}
})
IronSource.loadBanner(bannerLayout, ISBannerSize.BANNER)`}</CodeBlock>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function IOSIntegrationGuide({ app, serverUrl }: { app: any; serverUrl: string }) {
  return (
    <Tabs defaultValue="max" className="space-y-6">
      <TabsList>
        <TabsTrigger value="max">AppLovin MAX</TabsTrigger>
        <TabsTrigger value="admob">AdMob</TabsTrigger>
        <TabsTrigger value="levelplay">LevelPlay</TabsTrigger>
      </TabsList>

      {/* AppLovin MAX iOS */}
      <TabsContent value="max" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Add Dependencies</CardTitle>
            <CardDescription>Add Starbidz SDK via CocoaPods or Swift Package Manager</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm font-medium">Option A: CocoaPods</p>
            <CodeBlock language="ruby">{`# Podfile
platform :ios, '12.0'
use_frameworks!

target 'YourApp' do
  # AppLovin MAX
  pod 'AppLovinSDK'

  # Starbidz SDK & MAX Adapter
  pod 'StarbidCore'
  pod 'StarbidMAX'
end`}</CodeBlock>

            <p className="text-sm font-medium mt-4">Option B: Swift Package Manager</p>
            <CodeBlock language="swift">{`// Package.swift or via Xcode:
// File → Add Package Dependencies
// URL: https://github.com/starbidz/starbidz-ios-sdk

dependencies: [
    .package(url: "https://github.com/starbidz/starbidz-ios-sdk", from: "1.0.0")
]`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure Info.plist</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="xml">{`<key>AppLovinSdkKey</key>
<string>YOUR_APPLOVIN_SDK_KEY</string>

<!-- App Transport Security (if needed) -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>

<!-- SKAdNetwork IDs -->
<key>SKAdNetworkItems</key>
<array>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>starbidz.skadnetwork</string>
    </dict>
</array>`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Configure MAX Dashboard</CardTitle>
            <CardDescription>Set up Starbidz as a custom network in MAX</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</span>
                <div>
                  <p className="font-medium">Go to MAX Dashboard → Mediation → Networks</p>
                  <p className="text-sm text-gray-500">Add a Custom Network for iOS</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">2</span>
                <div>
                  <p className="font-medium">iOS Adapter Class Name</p>
                  <code className="block bg-gray-100 p-2 rounded mt-1">StarbidMediationAdapter</code>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">3</span>
                <div>
                  <p className="font-medium">Custom Parameters</p>
                  <CodeBlock language="json">{`{
  "app_key": "${app.appKey}",
  "placement_id": "${app.adUnits[0]?.placementId || 'YOUR_PLACEMENT_ID'}",
  "server_url": "${serverUrl}"
}`}</CodeBlock>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: Initialize SDK</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="swift">{`import AppLovinSDK

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // Initialize AppLovin MAX
        ALSdk.shared().mediationProvider = "max"
        ALSdk.shared().initializeSdk { configuration in
            // SDK initialized, start loading ads
        }

        return true
    }
}`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 5: Load & Show Banner Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="swift">{`import AppLovinSDK

class BannerViewController: UIViewController, MAAdViewAdDelegate {
    var adView: MAAdView!

    override func viewDidLoad() {
        super.viewDidLoad()

        adView = MAAdView(adUnitIdentifier: "YOUR_AD_UNIT_ID")
        adView.delegate = self

        // Set frame
        let height: CGFloat = 50
        let width = view.bounds.width
        adView.frame = CGRect(x: 0, y: view.bounds.height - height, width: width, height: height)

        view.addSubview(adView)
        adView.loadAd()
    }

    // MARK: - MAAdViewAdDelegate
    func didLoad(_ ad: MAAd) {
        print("Banner loaded")
    }

    func didFailToLoadAd(forAdUnitIdentifier adUnitIdentifier: String, withError error: MAError) {
        print("Failed to load banner: \\(error.message)")
    }

    func didDisplay(_ ad: MAAd) {}
    func didHide(_ ad: MAAd) {}
    func didClick(_ ad: MAAd) {}
    func didFail(toDisplay ad: MAAd, withError error: MAError) {}
}`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 6: Load & Show Interstitial Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="swift">{`import AppLovinSDK

class InterstitialViewController: UIViewController, MAAdDelegate {
    var interstitialAd: MAInterstitialAd!
    var retryAttempt = 0

    override func viewDidLoad() {
        super.viewDidLoad()

        interstitialAd = MAInterstitialAd(adUnitIdentifier: "YOUR_AD_UNIT_ID")
        interstitialAd.delegate = self
        interstitialAd.load()
    }

    func showInterstitial() {
        if interstitialAd.isReady {
            interstitialAd.show()
        }
    }

    // MARK: - MAAdDelegate
    func didLoad(_ ad: MAAd) {
        retryAttempt = 0
        print("Interstitial loaded")
    }

    func didFailToLoadAd(forAdUnitIdentifier adUnitIdentifier: String, withError error: MAError) {
        retryAttempt += 1
        let delay = pow(2.0, min(6.0, Double(retryAttempt)))
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            self.interstitialAd.load()
        }
    }

    func didDisplay(_ ad: MAAd) {}
    func didHide(_ ad: MAAd) {
        interstitialAd.load() // Pre-load next ad
    }
    func didClick(_ ad: MAAd) {}
    func didFail(toDisplay ad: MAAd, withError error: MAError) {
        interstitialAd.load()
    }
}`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 7: Load & Show Rewarded Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="swift">{`import AppLovinSDK

class RewardedViewController: UIViewController, MARewardedAdDelegate {
    var rewardedAd: MARewardedAd!
    var retryAttempt = 0

    override func viewDidLoad() {
        super.viewDidLoad()

        rewardedAd = MARewardedAd.shared(withAdUnitIdentifier: "YOUR_AD_UNIT_ID")
        rewardedAd.delegate = self
        rewardedAd.load()
    }

    func showRewardedAd() {
        if rewardedAd.isReady {
            rewardedAd.show()
        }
    }

    // MARK: - MARewardedAdDelegate
    func didLoad(_ ad: MAAd) {
        retryAttempt = 0
    }

    func didFailToLoadAd(forAdUnitIdentifier adUnitIdentifier: String, withError error: MAError) {
        retryAttempt += 1
        let delay = pow(2.0, min(6.0, Double(retryAttempt)))
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            self.rewardedAd.load()
        }
    }

    func didDisplay(_ ad: MAAd) {}
    func didHide(_ ad: MAAd) {
        rewardedAd.load()
    }
    func didClick(_ ad: MAAd) {}
    func didFail(toDisplay ad: MAAd, withError error: MAError) {
        rewardedAd.load()
    }

    func didRewardUser(for ad: MAAd, with reward: MAReward) {
        print("User earned \\(reward.amount) \\(reward.label)")
        grantReward(amount: reward.amount)
    }
}`}</CodeBlock>
          </CardContent>
        </Card>
      </TabsContent>

      {/* AdMob iOS */}
      <TabsContent value="admob" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Add Dependencies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock language="ruby">{`# Podfile
platform :ios, '12.0'
use_frameworks!

target 'YourApp' do
  # Google Mobile Ads SDK
  pod 'Google-Mobile-Ads-SDK'

  # Starbidz SDK & AdMob Adapter
  pod 'StarbidCore'
  pod 'StarbidAdMob'
end`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure Info.plist</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="xml">{`<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX</string>

<key>SKAdNetworkItems</key>
<array>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>cstr6suwn9.skadnetwork</string>
    </dict>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>starbidz.skadnetwork</string>
    </dict>
</array>`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Configure AdMob Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</span>
                <p className="font-medium">Create Mediation Group in AdMob</p>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">2</span>
                <div>
                  <p className="font-medium">Add Custom Event with Class Names:</p>
                  <div className="mt-2 bg-gray-50 p-3 rounded space-y-2 text-sm">
                    <p><strong>Banner:</strong> <code>StarbidBannerCustomEvent</code></p>
                    <p><strong>Interstitial:</strong> <code>StarbidInterstitialCustomEvent</code></p>
                    <p><strong>Rewarded:</strong> <code>StarbidRewardedCustomEvent</code></p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">3</span>
                <div>
                  <p className="font-medium">Custom Parameters:</p>
                  <CodeBlock language="json">{`{
  "app_key": "${app.appKey}",
  "placement_id": "${app.adUnits[0]?.placementId || 'YOUR_PLACEMENT_ID'}",
  "server_url": "${serverUrl}"
}`}</CodeBlock>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: Initialize & Load Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="swift">{`import GoogleMobileAds

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        GADMobileAds.sharedInstance().start(completionHandler: nil)
        return true
    }
}

// Banner
class BannerVC: UIViewController, GADBannerViewDelegate {
    var bannerView: GADBannerView!

    override func viewDidLoad() {
        super.viewDidLoad()
        bannerView = GADBannerView(adSize: GADAdSizeBanner)
        bannerView.adUnitID = "YOUR_AD_UNIT_ID"
        bannerView.rootViewController = self
        bannerView.delegate = self
        bannerView.load(GADRequest())
    }
}

// Interstitial
GADInterstitialAd.load(withAdUnitID: "YOUR_AD_UNIT_ID", request: GADRequest()) { ad, error in
    if let ad = ad {
        ad.present(fromRootViewController: self)
    }
}

// Rewarded
GADRewardedAd.load(withAdUnitID: "YOUR_AD_UNIT_ID", request: GADRequest()) { ad, error in
    if let ad = ad {
        ad.present(fromRootViewController: self) {
            let reward = ad.adReward
            print("User earned \\(reward.amount) \\(reward.type)")
        }
    }
}`}</CodeBlock>
          </CardContent>
        </Card>
      </TabsContent>

      {/* LevelPlay iOS */}
      <TabsContent value="levelplay" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Add Dependencies</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="ruby">{`# Podfile
platform :ios, '12.0'
use_frameworks!

target 'YourApp' do
  # ironSource LevelPlay SDK
  pod 'IronSourceSDK'

  # Starbidz SDK & LevelPlay Adapter
  pod 'StarbidCore'
  pod 'StarbidLevelPlay'
end`}</CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Configure LevelPlay Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</span>
                <p className="font-medium">Go to LevelPlay → Setup → SDK Networks</p>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">2</span>
                <div>
                  <p className="font-medium">Add Custom Adapter</p>
                  <div className="mt-2 bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Network Key:</strong> Starbidz</p>
                    <p><strong>iOS Adapter Class:</strong> <code>StarbidCustomAdapter</code></p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">3</span>
                <div>
                  <p className="font-medium">Instance Parameters:</p>
                  <CodeBlock language="json">{`{
  "appKey": "${app.appKey}",
  "placementId": "${app.adUnits[0]?.placementId || 'YOUR_PLACEMENT_ID'}",
  "serverUrl": "${serverUrl}"
}`}</CodeBlock>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Initialize & Load Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="swift">{`import IronSource

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        IronSource.initWithAppKey("YOUR_IRONSOURCE_APP_KEY", adUnits: [IS_REWARDED_VIDEO, IS_INTERSTITIAL, IS_BANNER])
        return true
    }
}

// Rewarded Video
class RewardedVC: UIViewController, ISRewardedVideoDelegate {
    override func viewDidLoad() {
        super.viewDidLoad()
        IronSource.setRewardedVideoDelegate(self)
    }

    func rewardedVideoHasChangedAvailability(_ available: Bool) {
        if available {
            IronSource.showRewardedVideo(with: self)
        }
    }

    func didReceiveReward(forPlacement placementInfo: ISPlacementInfo!) {
        print("Reward: \\(placementInfo.rewardAmount) \\(placementInfo.rewardName)")
    }
}

// Interstitial
IronSource.setInterstitialDelegate(self)
IronSource.loadInterstitial()
// When ready:
IronSource.showInterstitial(with: self)

// Banner
let bannerView = ISBannerView()
IronSource.loadBanner(with: self, size: ISBannerSize.init(description: "BANNER"))`}</CodeBlock>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

