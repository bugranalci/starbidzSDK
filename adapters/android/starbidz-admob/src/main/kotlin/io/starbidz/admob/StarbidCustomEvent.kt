package io.starbidz.admob

import android.content.Context
import com.google.android.gms.ads.mediation.Adapter
import com.google.android.gms.ads.mediation.InitializationCompleteCallback
import com.google.android.gms.ads.mediation.MediationConfiguration
import com.google.android.gms.ads.mediation.VersionInfo
import io.starbidz.core.StarbidConfig
import io.starbidz.core.Starbidz

class StarbidCustomEvent : Adapter() {

    companion object {
        const val ADAPTER_VERSION = "1.0.0"
        const val SDK_VERSION = "1.0.0"

        const val PARAM_APP_KEY = "app_key"
        const val PARAM_PLACEMENT_ID = "placement_id"
        const val PARAM_SERVER_URL = "server_url"
    }

    override fun getVersionInfo(): VersionInfo {
        val versionParts = ADAPTER_VERSION.split(".")
        return VersionInfo(
            versionParts.getOrNull(0)?.toIntOrNull() ?: 0,
            versionParts.getOrNull(1)?.toIntOrNull() ?: 0,
            versionParts.getOrNull(2)?.toIntOrNull() ?: 0
        )
    }

    override fun getSDKVersionInfo(): VersionInfo {
        val versionParts = SDK_VERSION.split(".")
        return VersionInfo(
            versionParts.getOrNull(0)?.toIntOrNull() ?: 0,
            versionParts.getOrNull(1)?.toIntOrNull() ?: 0,
            versionParts.getOrNull(2)?.toIntOrNull() ?: 0
        )
    }

    override fun initialize(
        context: Context,
        initializationCompleteCallback: InitializationCompleteCallback,
        mediationConfigurations: List<MediationConfiguration>
    ) {
        // Find app_key from any configuration
        var appKey: String? = null
        var serverUrl: String? = null

        for (config in mediationConfigurations) {
            val serverParams = config.serverParameters
            appKey = serverParams.getString(PARAM_APP_KEY)
            serverUrl = serverParams.getString(PARAM_SERVER_URL)
            if (!appKey.isNullOrEmpty()) break
        }

        if (appKey.isNullOrEmpty()) {
            initializationCompleteCallback.onInitializationFailed("Missing app_key parameter")
            return
        }

        if (!Starbidz.isInitialized()) {
            val configBuilder = StarbidConfig.Builder()
                .appKey(appKey)

            if (!serverUrl.isNullOrEmpty()) {
                configBuilder.serverUrl(serverUrl)
            }

            Starbidz.initialize(context, configBuilder.build())
        }

        initializationCompleteCallback.onInitializationSucceeded()
    }
}
