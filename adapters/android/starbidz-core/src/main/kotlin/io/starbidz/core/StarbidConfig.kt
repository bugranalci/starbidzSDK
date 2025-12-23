package io.starbidz.core

data class StarbidConfig(
    val appKey: String,
    val serverUrl: String = DEFAULT_SERVER_URL,
    val testMode: Boolean = false,
    val requestTimeoutMs: Long = DEFAULT_TIMEOUT_MS
) {
    companion object {
        const val DEFAULT_SERVER_URL = "https://bid.starbidz.io"
        const val DEFAULT_TIMEOUT_MS = 5000L
    }

    class Builder {
        private var appKey: String = ""
        private var serverUrl: String = DEFAULT_SERVER_URL
        private var testMode: Boolean = false
        private var requestTimeoutMs: Long = DEFAULT_TIMEOUT_MS

        fun appKey(appKey: String) = apply { this.appKey = appKey }
        fun serverUrl(serverUrl: String) = apply { this.serverUrl = serverUrl }
        fun testMode(testMode: Boolean) = apply { this.testMode = testMode }
        fun requestTimeoutMs(timeoutMs: Long) = apply { this.requestTimeoutMs = timeoutMs }

        fun build(): StarbidConfig {
            require(appKey.isNotEmpty()) { "App key is required" }
            return StarbidConfig(
                appKey = appKey,
                serverUrl = serverUrl,
                testMode = testMode,
                requestTimeoutMs = requestTimeoutMs
            )
        }
    }
}
