package io.starbidz.levelplay

import android.app.Activity
import android.view.View
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import com.ironsource.mediationsdk.ISBannerSize
import com.ironsource.mediationsdk.adunit.adapter.BaseBanner
import com.ironsource.mediationsdk.adunit.adapter.listener.BannerAdListener
import com.ironsource.mediationsdk.adunit.adapter.utility.AdData
import io.starbidz.core.AdFormat
import io.starbidz.core.AdResult
import io.starbidz.core.StarbidzAd
import io.starbidz.core.Starbidz
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class StarbidBannerAdapter : BaseBanner<BannerAdListener>() {

    private var webView: WebView? = null
    private var container: FrameLayout? = null
    private var ad: StarbidzAd? = null

    override fun loadAd(
        adData: AdData,
        activity: Activity,
        bannerSize: ISBannerSize,
        listener: BannerAdListener
    ) {
        val placementId = adData.getString(StarbidCustomAdapter.PARAM_PLACEMENT_ID)

        if (placementId.isNullOrEmpty()) {
            listener.onAdLoadFailed("INVALID_CONFIGURATION", "Missing placementId")
            return
        }

        val width = bannerSize.width
        val height = bannerSize.height

        CoroutineScope(Dispatchers.Main).launch {
            when (val result = Starbidz.requestBid(activity, placementId, AdFormat.BANNER, width, height)) {
                is AdResult.Success -> {
                    ad = result.ad
                    createBannerView(activity, result.ad, width, height, listener)
                }
                is AdResult.Error -> {
                    listener.onAdLoadFailed("NO_FILL", result.message)
                }
                is AdResult.NoBid -> {
                    listener.onAdLoadFailed("NO_FILL", "No bid")
                }
            }
        }
    }

    private fun createBannerView(
        activity: Activity,
        ad: StarbidzAd,
        width: Int,
        height: Int,
        listener: BannerAdListener
    ) {
        container = FrameLayout(activity).apply {
            layoutParams = FrameLayout.LayoutParams(
                dpToPx(activity, width),
                dpToPx(activity, height)
            )
        }

        webView = WebView(activity).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true

            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    listener.onAdLoaded(container!!)
                    listener.onAdShown()

                    CoroutineScope(Dispatchers.IO).launch {
                        Starbidz.trackImpression(ad.bidId, "")
                    }
                }
            }
        }

        container?.addView(webView)

        when (ad.creative.type) {
            StarbidzAd.CreativeType.HTML -> {
                webView?.loadDataWithBaseURL(null, wrapHtml(ad.creative.content), "text/html", "UTF-8", null)
            }
            StarbidzAd.CreativeType.IMAGE -> {
                val imgHtml = """
                    <html><body style="margin:0;padding:0;">
                    <img src="${ad.creative.content}" style="width:100%;height:100%;object-fit:contain;"/>
                    </body></html>
                """.trimIndent()
                webView?.loadDataWithBaseURL(null, imgHtml, "text/html", "UTF-8", null)
            }
            else -> {
                listener.onAdLoadFailed("INTERNAL_ERROR", "Unsupported creative type")
            }
        }
    }

    override fun destroyAd(adData: AdData) {
        webView?.destroy()
        webView = null
        container?.removeAllViews()
        container = null
        ad = null
    }

    private fun wrapHtml(content: String) = """
        <!DOCTYPE html><html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>* { margin: 0; padding: 0; }</style>
        </head><body>$content</body></html>
    """.trimIndent()

    private fun dpToPx(activity: Activity, dp: Int): Int {
        return (dp * activity.resources.displayMetrics.density).toInt()
    }
}
