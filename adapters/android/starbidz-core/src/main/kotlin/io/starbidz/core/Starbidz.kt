package io.starbidz.core

import android.content.Context

object Starbidz {
    private var config: StarbidConfig? = null
    private var client: StarbidzClient? = null

    @Volatile
    private var isInitialized = false

    fun initialize(context: Context, config: StarbidConfig) {
        if (isInitialized) return

        synchronized(this) {
            if (isInitialized) return

            this.config = config
            this.client = StarbidzClient(config)
            isInitialized = true
        }
    }

    fun isInitialized(): Boolean = isInitialized

    fun getConfig(): StarbidConfig {
        checkInitialized()
        return config!!
    }

    internal fun getClient(): StarbidzClient {
        checkInitialized()
        return client!!
    }

    suspend fun requestBid(
        context: Context,
        placementId: String,
        format: AdFormat,
        width: Int? = null,
        height: Int? = null
    ): AdResult {
        checkInitialized()
        return client!!.requestBid(context, placementId, format, width, height)
    }

    suspend fun trackImpression(bidId: String, placementId: String) {
        client?.trackEvent("impression", bidId, placementId)
    }

    suspend fun trackClick(bidId: String, placementId: String) {
        client?.trackEvent("click", bidId, placementId)
    }

    suspend fun trackComplete(bidId: String, placementId: String) {
        client?.trackEvent("complete", bidId, placementId)
    }

    private fun checkInitialized() {
        if (!isInitialized) {
            throw IllegalStateException("Starbidz SDK is not initialized. Call Starbidz.initialize() first.")
        }
    }
}
