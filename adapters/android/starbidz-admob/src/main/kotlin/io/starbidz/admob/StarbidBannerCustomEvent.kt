package io.starbidz.admob

import android.content.Context
import android.view.View
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.mediation.MediationAdLoadCallback
import com.google.android.gms.ads.mediation.MediationBannerAd
import com.google.android.gms.ads.mediation.MediationBannerAdCallback
import com.google.android.gms.ads.mediation.MediationBannerAdConfiguration
import io.starbidz.core.AdFormat
import io.starbidz.core.AdResult
import io.starbidz.core.StarbidzAd
import io.starbidz.core.Starbidz
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class StarbidBannerCustomEvent : MediationBannerAd {

    private var context: Context? = null
    private var adCallback: MediationBannerAdCallback? = null
    private var webView: WebView? = null
    private var container: FrameLayout? = null
    private var ad: StarbidzAd? = null

    fun loadAd(
        configuration: MediationBannerAdConfiguration,
        callback: MediationAdLoadCallback<MediationBannerAd, MediationBannerAdCallback>
    ) {
        context = configuration.context
        val serverParams = configuration.serverParameters
        val placementId = serverParams.getString(StarbidCustomEvent.PARAM_PLACEMENT_ID)

        if (placementId.isNullOrEmpty()) {
            callback.onFailure(AdError(1, "Missing placement_id", "io.starbidz"))
            return
        }

        val adSize = configuration.adSize
        val width = adSize.getWidthInPixels(context!!)
        val height = adSize.getHeightInPixels(context!!)

        CoroutineScope(Dispatchers.Main).launch {
            when (val result = Starbidz.requestBid(
                context!!,
                placementId,
                AdFormat.BANNER,
                adSize.width,
                adSize.height
            )) {
                is AdResult.Success -> {
                    ad = result.ad
                    createBannerView(result.ad, width, height)
                    adCallback = callback.onSuccess(this@StarbidBannerCustomEvent)
                }
                is AdResult.Error -> {
                    callback.onFailure(AdError(2, result.message, "io.starbidz"))
                }
                is AdResult.NoBid -> {
                    callback.onFailure(AdError(3, "No fill", "io.starbidz"))
                }
            }
        }
    }

    private fun createBannerView(ad: StarbidzAd, width: Int, height: Int) {
        val ctx = context ?: return

        container = FrameLayout(ctx).apply {
            layoutParams = FrameLayout.LayoutParams(width, height)
        }

        webView = WebView(ctx).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true

            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    adCallback?.reportAdImpression()

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
            else -> {}
        }
    }

    override fun getView(): View = container!!

    private fun wrapHtml(content: String): String {
        return """
            <!DOCTYPE html>
            <html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>* { margin: 0; padding: 0; }</style>
            </head><body>$content</body></html>
        """.trimIndent()
    }
}
