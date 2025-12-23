package io.starbidz.admob

import android.app.Activity
import android.app.Dialog
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.view.ViewGroup
import android.view.Window
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.mediation.MediationAdLoadCallback
import com.google.android.gms.ads.mediation.MediationInterstitialAd
import com.google.android.gms.ads.mediation.MediationInterstitialAdCallback
import com.google.android.gms.ads.mediation.MediationInterstitialAdConfiguration
import io.starbidz.core.AdFormat
import io.starbidz.core.AdResult
import io.starbidz.core.StarbidzAd
import io.starbidz.core.Starbidz
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class StarbidInterstitialCustomEvent : MediationInterstitialAd {

    private var context: Context? = null
    private var adCallback: MediationInterstitialAdCallback? = null
    private var ad: StarbidzAd? = null
    private var isLoaded = false

    fun loadAd(
        configuration: MediationInterstitialAdConfiguration,
        callback: MediationAdLoadCallback<MediationInterstitialAd, MediationInterstitialAdCallback>
    ) {
        context = configuration.context
        val serverParams = configuration.serverParameters
        val placementId = serverParams.getString(StarbidCustomEvent.PARAM_PLACEMENT_ID)

        if (placementId.isNullOrEmpty()) {
            callback.onFailure(AdError(1, "Missing placement_id", "io.starbidz"))
            return
        }

        CoroutineScope(Dispatchers.Main).launch {
            when (val result = Starbidz.requestBid(context!!, placementId, AdFormat.INTERSTITIAL)) {
                is AdResult.Success -> {
                    ad = result.ad
                    isLoaded = true
                    adCallback = callback.onSuccess(this@StarbidInterstitialCustomEvent)
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

    override fun showAd(context: Context) {
        if (!isLoaded || ad == null) {
            adCallback?.onAdFailedToShow(AdError(4, "Ad not ready", "io.starbidz"))
            return
        }

        val activity = context as? Activity ?: run {
            adCallback?.onAdFailedToShow(AdError(5, "Context is not an Activity", "io.starbidz"))
            return
        }

        val dialog = FullScreenAdDialog(activity, ad!!, adCallback)
        dialog.show()

        CoroutineScope(Dispatchers.IO).launch {
            Starbidz.trackImpression(ad!!.bidId, "")
        }
    }

    private class FullScreenAdDialog(
        activity: Activity,
        private val ad: StarbidzAd,
        private val callback: MediationInterstitialAdCallback?
    ) : Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen) {

        private var webView: WebView? = null

        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)
            requestWindowFeature(Window.FEATURE_NO_TITLE)

            val container = FrameLayout(context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                setBackgroundColor(Color.BLACK)
            }

            webView = WebView(context).apply {
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true

                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        callback?.onAdOpened()
                        callback?.reportAdImpression()
                    }
                }
            }

            container.addView(webView)

            val closeButton = ImageButton(context).apply {
                setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
                setBackgroundColor(Color.TRANSPARENT)
                layoutParams = FrameLayout.LayoutParams(
                    dpToPx(48), dpToPx(48)
                ).apply {
                    marginEnd = dpToPx(16)
                    topMargin = dpToPx(16)
                    gravity = android.view.Gravity.END or android.view.Gravity.TOP
                }
                setOnClickListener { dismiss() }
            }
            container.addView(closeButton)

            setContentView(container)
            loadContent()
        }

        private fun loadContent() {
            when (ad.creative.type) {
                StarbidzAd.CreativeType.HTML -> {
                    webView?.loadDataWithBaseURL(null, wrapHtml(ad.creative.content), "text/html", "UTF-8", null)
                }
                StarbidzAd.CreativeType.VAST -> {
                    webView?.loadUrl(ad.creative.content)
                }
                StarbidzAd.CreativeType.IMAGE -> {
                    val imgHtml = """
                        <html><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;">
                        <img src="${ad.creative.content}" style="max-width:100%;max-height:100%;object-fit:contain;"/>
                        </body></html>
                    """.trimIndent()
                    webView?.loadDataWithBaseURL(null, imgHtml, "text/html", "UTF-8", null)
                }
            }
        }

        override fun dismiss() {
            super.dismiss()
            webView?.destroy()
            callback?.onAdClosed()
        }

        private fun wrapHtml(content: String) = """
            <!DOCTYPE html><html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>* { margin: 0; padding: 0; } html, body { height: 100%; background: #000; }</style>
            </head><body>$content</body></html>
        """.trimIndent()

        private fun dpToPx(dp: Int) = (dp * context.resources.displayMetrics.density).toInt()
    }
}
