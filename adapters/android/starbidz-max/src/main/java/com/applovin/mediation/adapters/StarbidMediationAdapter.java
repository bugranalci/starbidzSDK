package com.applovin.mediation.adapters;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.applovin.mediation.MaxAdFormat;
import com.applovin.mediation.adapter.MaxAdViewAdapter;
import com.applovin.mediation.adapter.MaxAdapterError;
import com.applovin.mediation.adapter.MaxInterstitialAdapter;
import com.applovin.mediation.adapter.MaxRewardedAdapter;
import com.applovin.mediation.adapter.listeners.MaxAdViewAdapterListener;
import com.applovin.mediation.adapter.listeners.MaxInterstitialAdapterListener;
import com.applovin.mediation.adapter.listeners.MaxRewardedAdapterListener;
import com.applovin.mediation.adapter.parameters.MaxAdapterInitializationParameters;
import com.applovin.mediation.adapter.parameters.MaxAdapterResponseParameters;
import com.applovin.sdk.AppLovinSdk;
import com.starbidz.sdk.AdFormat;
import com.starbidz.sdk.AdResult;
import com.starbidz.sdk.StarbidConfig;
import com.starbidz.sdk.Starbidz;

import io.starbidz.max.StarbidBannerAd;
import io.starbidz.max.StarbidInterstitialAd;
import io.starbidz.max.StarbidRewardedAd;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import kotlin.coroutines.Continuation;
import kotlin.coroutines.CoroutineContext;
import kotlin.coroutines.EmptyCoroutineContext;
import kotlinx.coroutines.BuildersKt;
import kotlinx.coroutines.CoroutineScope;
import kotlinx.coroutines.CoroutineScopeKt;
import kotlinx.coroutines.Dispatchers;

public class StarbidMediationAdapter extends MediationAdapterBase
        implements MaxAdViewAdapter, MaxInterstitialAdapter, MaxRewardedAdapter {

    private static final String ADAPTER_VERSION = "1.0.0";
    private static final String SDK_VERSION = "1.0.0";

    private static final String PARAM_APP_KEY = "app_key";
    private static final String PARAM_SERVER_URL = "server_url";

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private StarbidBannerAd bannerAd;
    private StarbidInterstitialAd interstitialAd;
    private StarbidRewardedAd rewardedAd;

    public StarbidMediationAdapter(AppLovinSdk sdk) {
        super(sdk);
    }

    @Override
    public String getAdapterVersion() {
        return ADAPTER_VERSION;
    }

    @Override
    public String getSdkVersion() {
        return SDK_VERSION;
    }

    @Override
    public void onDestroy() {
        if (bannerAd != null) {
            bannerAd.destroy();
            bannerAd = null;
        }
        if (interstitialAd != null) {
            interstitialAd.destroy();
            interstitialAd = null;
        }
        if (rewardedAd != null) {
            rewardedAd.destroy();
            rewardedAd = null;
        }
        executor.shutdown();
    }

    @Override
    public void initialize(@NonNull MaxAdapterInitializationParameters parameters,
                           @Nullable Activity activity,
                           @NonNull OnCompletionListener onCompletionListener) {
        Bundle serverParams = parameters.getServerParameters();
        String appKey = serverParams.getString(PARAM_APP_KEY);

        if (appKey == null || appKey.isEmpty()) {
            onCompletionListener.onCompletion(InitializationStatus.INITIALIZED_FAILURE,
                    "Missing app_key parameter");
            return;
        }

        String serverUrl = serverParams.getString(PARAM_SERVER_URL);
        Context context = (activity != null) ? activity : getApplicationContext();

        if (!Starbidz.INSTANCE.isInitialized()) {
            StarbidConfig.Builder configBuilder = new StarbidConfig.Builder()
                    .appKey(appKey)
                    .testMode(parameters.isTesting());

            if (serverUrl != null && !serverUrl.isEmpty()) {
                configBuilder.serverUrl(serverUrl);
            }

            Starbidz.INSTANCE.initialize(context, configBuilder.build());
        }

        onCompletionListener.onCompletion(InitializationStatus.INITIALIZED_SUCCESS, null);
    }

    @Override
    public void loadAdViewAd(@NonNull MaxAdapterResponseParameters parameters,
                             @NonNull MaxAdFormat adFormat,
                             @Nullable Activity activity,
                             @NonNull MaxAdViewAdapterListener listener) {
        String placementId = parameters.getThirdPartyAdPlacementId();
        if (placementId == null || placementId.isEmpty()) {
            listener.onAdViewAdLoadFailed(MaxAdapterError.INVALID_CONFIGURATION);
            return;
        }

        Context context = (activity != null) ? activity : getApplicationContext();
        int[] adSize = getAdSize(adFormat);
        int width = adSize[0];
        int height = adSize[1];

        executor.execute(() -> {
            try {
                Object result = BuildersKt.runBlocking(
                        EmptyCoroutineContext.INSTANCE,
                        (scope, cont) -> Starbidz.INSTANCE.requestBid(context, placementId, AdFormat.BANNER, width, height, cont)
                );

                mainHandler.post(() -> {
                    if (result instanceof AdResult.Success) {
                        bannerAd = new StarbidBannerAd(context, ((AdResult.Success) result).getAd(), width, height, listener);
                        bannerAd.load();
                    } else if (result instanceof AdResult.Error) {
                        listener.onAdViewAdLoadFailed(new MaxAdapterError(
                                MaxAdapterError.ERROR_CODE_NO_FILL,
                                ((AdResult.Error) result).getMessage()
                        ));
                    } else {
                        listener.onAdViewAdLoadFailed(MaxAdapterError.NO_FILL);
                    }
                });
            } catch (Exception e) {
                mainHandler.post(() -> listener.onAdViewAdLoadFailed(
                        new MaxAdapterError(MaxAdapterError.ERROR_CODE_INTERNAL_ERROR, e.getMessage())
                ));
            }
        });
    }

    @Override
    public void loadInterstitialAd(@NonNull MaxAdapterResponseParameters parameters,
                                   @Nullable Activity activity,
                                   @NonNull MaxInterstitialAdapterListener listener) {
        String placementId = parameters.getThirdPartyAdPlacementId();
        if (placementId == null || placementId.isEmpty()) {
            listener.onInterstitialAdLoadFailed(MaxAdapterError.INVALID_CONFIGURATION);
            return;
        }

        Context context = (activity != null) ? activity : getApplicationContext();

        executor.execute(() -> {
            try {
                Object result = BuildersKt.runBlocking(
                        EmptyCoroutineContext.INSTANCE,
                        (scope, cont) -> Starbidz.INSTANCE.requestBid(context, placementId, AdFormat.INTERSTITIAL, null, null, cont)
                );

                mainHandler.post(() -> {
                    if (result instanceof AdResult.Success) {
                        interstitialAd = new StarbidInterstitialAd(context, ((AdResult.Success) result).getAd(), listener);
                        interstitialAd.load();
                    } else if (result instanceof AdResult.Error) {
                        listener.onInterstitialAdLoadFailed(new MaxAdapterError(
                                MaxAdapterError.ERROR_CODE_NO_FILL,
                                ((AdResult.Error) result).getMessage()
                        ));
                    } else {
                        listener.onInterstitialAdLoadFailed(MaxAdapterError.NO_FILL);
                    }
                });
            } catch (Exception e) {
                mainHandler.post(() -> listener.onInterstitialAdLoadFailed(
                        new MaxAdapterError(MaxAdapterError.ERROR_CODE_INTERNAL_ERROR, e.getMessage())
                ));
            }
        });
    }

    @Override
    public void showInterstitialAd(@NonNull MaxAdapterResponseParameters parameters,
                                   @Nullable Activity activity,
                                   @NonNull MaxInterstitialAdapterListener listener) {
        if (activity == null) {
            listener.onInterstitialAdDisplayFailed(MaxAdapterError.MISSING_ACTIVITY);
            return;
        }

        if (interstitialAd != null) {
            interstitialAd.show(activity);
        } else {
            listener.onInterstitialAdDisplayFailed(MaxAdapterError.AD_NOT_READY);
        }
    }

    @Override
    public void loadRewardedAd(@NonNull MaxAdapterResponseParameters parameters,
                               @Nullable Activity activity,
                               @NonNull MaxRewardedAdapterListener listener) {
        String placementId = parameters.getThirdPartyAdPlacementId();
        if (placementId == null || placementId.isEmpty()) {
            listener.onRewardedAdLoadFailed(MaxAdapterError.INVALID_CONFIGURATION);
            return;
        }

        Context context = (activity != null) ? activity : getApplicationContext();

        executor.execute(() -> {
            try {
                Object result = BuildersKt.runBlocking(
                        EmptyCoroutineContext.INSTANCE,
                        (scope, cont) -> Starbidz.INSTANCE.requestBid(context, placementId, AdFormat.REWARDED, null, null, cont)
                );

                mainHandler.post(() -> {
                    if (result instanceof AdResult.Success) {
                        rewardedAd = new StarbidRewardedAd(context, ((AdResult.Success) result).getAd(), listener);
                        rewardedAd.load();
                    } else if (result instanceof AdResult.Error) {
                        listener.onRewardedAdLoadFailed(new MaxAdapterError(
                                MaxAdapterError.ERROR_CODE_NO_FILL,
                                ((AdResult.Error) result).getMessage()
                        ));
                    } else {
                        listener.onRewardedAdLoadFailed(MaxAdapterError.NO_FILL);
                    }
                });
            } catch (Exception e) {
                mainHandler.post(() -> listener.onRewardedAdLoadFailed(
                        new MaxAdapterError(MaxAdapterError.ERROR_CODE_INTERNAL_ERROR, e.getMessage())
                ));
            }
        });
    }

    @Override
    public void showRewardedAd(@NonNull MaxAdapterResponseParameters parameters,
                               @Nullable Activity activity,
                               @NonNull MaxRewardedAdapterListener listener) {
        if (activity == null) {
            listener.onRewardedAdDisplayFailed(MaxAdapterError.MISSING_ACTIVITY);
            return;
        }

        if (rewardedAd != null) {
            rewardedAd.show(activity);
        } else {
            listener.onRewardedAdDisplayFailed(MaxAdapterError.AD_NOT_READY);
        }
    }

    private int[] getAdSize(MaxAdFormat adFormat) {
        if (adFormat == MaxAdFormat.BANNER) {
            return new int[]{320, 50};
        } else if (adFormat == MaxAdFormat.MREC) {
            return new int[]{300, 250};
        } else if (adFormat == MaxAdFormat.LEADER) {
            return new int[]{728, 90};
        }
        return new int[]{320, 50};
    }
}
