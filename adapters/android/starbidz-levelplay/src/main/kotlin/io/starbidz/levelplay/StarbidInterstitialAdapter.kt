package io.starbidz.levelplay

import android.app.Activity
import android.app.Dialog
import android.graphics.Color
import android.os.Bundle
import android.view.ViewGroup
import android.view.Window
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
import com.ironsource.mediationsdk.adunit.adapter.BaseInterstitial
import com.ironsource.mediationsdk.adunit.adapter.listener.InterstitialAdListener
import com.ironsource.mediationsdk.adunit.adapter.utility.AdData
import io.starbidz.core.AdFormat
import io.starbidz.core.AdResult
import io.starbidz.core.StarbidzAd
import io.starbidz.core.Starbidz
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class StarbidInterstitialAdapter : BaseInterstitial<InterstitialAdListener>() {

    private var ad: StarbidzAd? = null
    private var isLoaded = false
    private var listener: InterstitialAdListener? = null

    override fun loadAd(adData: AdData, activity: Activity, listener: InterstitialAdListener) {
        this.listener = listener
        val placementId = adData.getString(StarbidCustomAdapter.PARAM_PLACEMENT_ID)

        if (placementId.isNullOrEmpty()) {
            listener.onAdLoadFailed("INVALID_CONFIGURATION", "Missing placementId")
            return
        }

        CoroutineScope(Dispatchers.Main).launch {
            when (val result = Starbidz.requestBid(activity, placementId, AdFormat.INTERSTITIAL)) {
                is AdResult.Success -> {
                    ad = result.ad
                    isLoaded = true
                    listener.onAdLoaded()
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

    override fun showAd(adData: AdData, listener: InterstitialAdListener) {
        if (!isLoaded || ad == null) {
            listener.onAdShowFailed("AD_NOT_READY", "Ad not loaded")
            return
        }

        // Note: LevelPlay should provide Activity context
        // For now we'll use the application context workaround
    }

    fun showAd(activity: Activity) {
        if (!isLoaded || ad == null) {
            listener?.onAdShowFailed("AD_NOT_READY", "Ad not loaded")
            return
        }

        val dialog = FullScreenAdDialog(activity, ad!!, listener)
        dialog.show()

        CoroutineScope(Dispatchers.IO).launch {
            Starbidz.trackImpression(ad!!.bidId, "")
        }
    }

    override fun isAdAvailable(adData: AdData): Boolean = isLoaded && ad != null

    private class FullScreenAdDialog(
        activity: Activity,
        private val ad: StarbidzAd,
        private val listener: InterstitialAdListener?
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
                        listener?.onAdOpened()
                        listener?.onAdShown()
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
            listener?.onAdClosed()
        }

        private fun wrapHtml(content: String) = """
            <!DOCTYPE html><html><head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>* { margin: 0; } html, body { height: 100%; background: #000; }</style>
            </head><body>$content</body></html>
        """.trimIndent()

        private fun dpToPx(dp: Int) = (dp * context.resources.displayMetrics.density).toInt()
    }
}
