package io.starbidz.core

data class StarbidzAd(
    val bidId: String,
    val price: Double,
    val currency: String,
    val demandSource: String,
    val creative: Creative,
    val notifyUrl: String? = null,
    val billingUrl: String? = null
) {
    data class Creative(
        val type: CreativeType,
        val content: String,
        val width: Int? = null,
        val height: Int? = null
    )

    enum class CreativeType {
        HTML, VAST, IMAGE
    }
}

enum class AdFormat {
    BANNER,
    INTERSTITIAL,
    REWARDED
}

sealed class AdResult {
    data class Success(val ad: StarbidzAd) : AdResult()
    data class Error(val message: String, val code: Int = -1) : AdResult()
    data object NoBid : AdResult()
}
