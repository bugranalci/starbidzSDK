package io.starbidz.max

import android.app.Activity
import com.applovin.mediation.MaxAdFormat
import com.applovin.mediation.adapter.MaxAdapter
import com.applovin.mediation.adapter.MaxAdapterError
import com.applovin.mediation.adapter.MaxSignalProvider
import com.applovin.mediation.adapter.listeners.MaxAdViewAdapterListener
import com.applovin.mediation.adapter.listeners.MaxInterstitialAdapterListener
import com.applovin.mediation.adapter.listeners.MaxRewardedAdapterListener
import com.applovin.mediation.adapter.listeners.MaxSignalCollectionListener
import com.applovin.mediation.adapter.parameters.MaxAdapterInitializationParameters
import com.applovin.mediation.adapter.parameters.MaxAdapterParameters
import com.applovin.mediation.adapter.parameters.MaxAdapterResponseParameters
import com.applovin.mediation.adapter.parameters.MaxAdapterSignalCollectionParameters
import com.applovin.sdk.AppLovinSdk
import io.starbidz.core.AdFormat
import io.starbidz.core.AdResult
import io.starbidz.core.StarbidConfig
import io.starbidz.core.Starbidz
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class StarbidMediationAdapter(sdk: AppLovinSdk) : MaxAdapter(sdk), MaxSignalProvider {

    companion object {
        const val ADAPTER_VERSION = "1.0.0"
        const val SDK_VERSION = "1.0.0"

        private const val PARAM_APP_KEY = "app_key"
        private const val PARAM_PLACEMENT_ID = "placement_id"
        private const val PARAM_SERVER_URL = "server_url"
    }

    private val adapterScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var bannerAd: StarbidBannerAd? = null
    private var interstitialAd: StarbidInterstitialAd? = null
    private var rewardedAd: StarbidRewardedAd? = null

    override fun getAdapterVersion(): String = ADAPTER_VERSION

    override fun getSdkVersion(): String = SDK_VERSION

    override fun onDestroy() {
        bannerAd?.destroy()
        interstitialAd?.destroy()
        rewardedAd?.destroy()
        bannerAd = null
        interstitialAd = null
        rewardedAd = null
    }

    override fun initialize(
        parameters: MaxAdapterInitializationParameters,
        activity: Activity?,
        onCompletionListener: OnCompletionListener
    ) {
        val appKey = parameters.serverParameters.getString(PARAM_APP_KEY)
        if (appKey.isNullOrEmpty()) {
            onCompletionListener.onCompletion(
                InitializationStatus.INITIALIZED_FAILURE,
                "Missing app_key parameter"
            )
            return
        }

        val serverUrl = parameters.serverParameters.getString(PARAM_SERVER_URL)
        val context = activity ?: applicationContext

        if (!Starbidz.isInitialized()) {
            val config = StarbidConfig.Builder()
                .appKey(appKey)
                .apply { if (!serverUrl.isNullOrEmpty()) serverUrl(serverUrl) }
                .testMode(parameters.isTesting)
                .build()

            Starbidz.initialize(context, config)
        }

        onCompletionListener.onCompletion(InitializationStatus.INITIALIZED_SUCCESS, null)
    }

    // Signal Provider
    override fun collectSignal(
        parameters: MaxAdapterSignalCollectionParameters,
        activity: Activity?,
        callback: MaxSignalCollectionListener
    ) {
        // For waterfall, we don't need to collect signals
        callback.onSignalCollected("")
    }

    // Banner Ads
    override fun loadAdViewAd(
        parameters: MaxAdapterResponseParameters,
        adFormat: MaxAdFormat,
        activity: Activity?,
        listener: MaxAdViewAdapterListener
    ) {
        val placementId = parameters.thirdPartyAdPlacementId
        if (placementId.isNullOrEmpty()) {
            listener.onAdViewAdLoadFailed(MaxAdapterError.INVALID_CONFIGURATION)
            return
        }

        val context = activity ?: applicationContext

        adapterScope.launch {
            val (width, height) = getAdSize(adFormat)
            when (val result = Starbidz.requestBid(context, placementId, AdFormat.BANNER, width, height)) {
                is AdResult.Success -> {
                    bannerAd = StarbidBannerAd(context, result.ad, width, height, listener)
                    bannerAd?.load()
                }
                is AdResult.Error -> {
                    listener.onAdViewAdLoadFailed(
                        MaxAdapterError(
                            MaxAdapterError.ERROR_CODE_NO_FILL,
                            result.message
                        )
                    )
                }
                is AdResult.NoBid -> {
                    listener.onAdViewAdLoadFailed(MaxAdapterError.NO_FILL)
                }
            }
        }
    }

    // Interstitial Ads
    override fun loadInterstitialAd(
        parameters: MaxAdapterResponseParameters,
        activity: Activity?,
        listener: MaxInterstitialAdapterListener
    ) {
        val placementId = parameters.thirdPartyAdPlacementId
        if (placementId.isNullOrEmpty()) {
            listener.onInterstitialAdLoadFailed(MaxAdapterError.INVALID_CONFIGURATION)
            return
        }

        val context = activity ?: applicationContext

        adapterScope.launch {
            when (val result = Starbidz.requestBid(context, placementId, AdFormat.INTERSTITIAL)) {
                is AdResult.Success -> {
                    interstitialAd = StarbidInterstitialAd(context, result.ad, listener)
                    interstitialAd?.load()
                }
                is AdResult.Error -> {
                    listener.onInterstitialAdLoadFailed(
                        MaxAdapterError(
                            MaxAdapterError.ERROR_CODE_NO_FILL,
                            result.message
                        )
                    )
                }
                is AdResult.NoBid -> {
                    listener.onInterstitialAdLoadFailed(MaxAdapterError.NO_FILL)
                }
            }
        }
    }

    override fun showInterstitialAd(
        parameters: MaxAdapterResponseParameters,
        activity: Activity?,
        listener: MaxInterstitialAdapterListener
    ) {
        if (activity == null) {
            listener.onInterstitialAdDisplayFailed(MaxAdapterError.MISSING_ACTIVITY)
            return
        }

        interstitialAd?.show(activity) ?: run {
            listener.onInterstitialAdDisplayFailed(MaxAdapterError.AD_NOT_READY)
        }
    }

    // Rewarded Ads
    override fun loadRewardedAd(
        parameters: MaxAdapterResponseParameters,
        activity: Activity?,
        listener: MaxRewardedAdapterListener
    ) {
        val placementId = parameters.thirdPartyAdPlacementId
        if (placementId.isNullOrEmpty()) {
            listener.onRewardedAdLoadFailed(MaxAdapterError.INVALID_CONFIGURATION)
            return
        }

        val context = activity ?: applicationContext

        adapterScope.launch {
            when (val result = Starbidz.requestBid(context, placementId, AdFormat.REWARDED)) {
                is AdResult.Success -> {
                    rewardedAd = StarbidRewardedAd(context, result.ad, listener)
                    rewardedAd?.load()
                }
                is AdResult.Error -> {
                    listener.onRewardedAdLoadFailed(
                        MaxAdapterError(
                            MaxAdapterError.ERROR_CODE_NO_FILL,
                            result.message
                        )
                    )
                }
                is AdResult.NoBid -> {
                    listener.onRewardedAdLoadFailed(MaxAdapterError.NO_FILL)
                }
            }
        }
    }

    override fun showRewardedAd(
        parameters: MaxAdapterResponseParameters,
        activity: Activity?,
        listener: MaxRewardedAdapterListener
    ) {
        if (activity == null) {
            listener.onRewardedAdDisplayFailed(MaxAdapterError.MISSING_ACTIVITY)
            return
        }

        rewardedAd?.show(activity) ?: run {
            listener.onRewardedAdDisplayFailed(MaxAdapterError.AD_NOT_READY)
        }
    }

    private fun getAdSize(adFormat: MaxAdFormat): Pair<Int, Int> {
        return when (adFormat) {
            MaxAdFormat.BANNER -> 320 to 50
            MaxAdFormat.MREC -> 300 to 250
            MaxAdFormat.LEADER -> 728 to 90
            else -> 320 to 50
        }
    }
}
