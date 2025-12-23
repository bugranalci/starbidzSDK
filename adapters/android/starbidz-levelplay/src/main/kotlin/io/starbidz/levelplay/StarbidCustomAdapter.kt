package io.starbidz.levelplay

import android.app.Activity
import android.content.Context
import com.ironsource.mediationsdk.adunit.adapter.BaseAdapter
import com.ironsource.mediationsdk.adunit.adapter.listener.NetworkInitializationListener
import com.ironsource.mediationsdk.adunit.adapter.utility.AdData
import com.ironsource.mediationsdk.adunit.adapter.utility.AdapterConfig
import io.starbidz.core.StarbidConfig
import io.starbidz.core.Starbidz

class StarbidCustomAdapter : BaseAdapter() {

    companion object {
        const val ADAPTER_VERSION = "1.0.0"
        const val SDK_VERSION = "1.0.0"
        const val NETWORK_NAME = "Starbidz"

        const val PARAM_APP_KEY = "appKey"
        const val PARAM_PLACEMENT_ID = "placementId"
        const val PARAM_SERVER_URL = "serverUrl"
    }

    override fun getNetworkSDKVersion(): String = SDK_VERSION

    override fun getAdapterVersion(): String = ADAPTER_VERSION

    override fun init(
        config: AdapterConfig,
        context: Context,
        listener: NetworkInitializationListener?
    ) {
        val appKey = config.settings[PARAM_APP_KEY] as? String
        val serverUrl = config.settings[PARAM_SERVER_URL] as? String

        if (appKey.isNullOrEmpty()) {
            listener?.onInitFailed("Missing appKey parameter")
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

        listener?.onInitSuccess()
    }
}
