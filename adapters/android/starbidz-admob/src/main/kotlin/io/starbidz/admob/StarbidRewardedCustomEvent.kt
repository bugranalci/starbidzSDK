package io.starbidz.admob

import android.app.Activity
import android.app.Dialog
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.ViewGroup
import android.view.Window
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.TextView
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.mediation.MediationAdLoadCallback
import com.google.android.gms.ads.mediation.MediationRewardedAd
import com.google.android.gms.ads.mediation.MediationRewardedAdCallback
import com.google.android.gms.ads.mediation.MediationRewardedAdConfiguration
import com.google.android.gms.ads.rewarded.RewardItem
import io.starbidz.core.AdFormat
import io.starbidz.core.AdResult
import io.starbidz.core.StarbidzAd
import io.starbidz.core.Starbidz
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class StarbidRewardedCustomEvent : MediationRewardedAd {

    private var context: Context? = null
    private var adCallback: MediationRewardedAdCallback? = null
    private var ad: StarbidzAd? = null
    private var isLoaded = false

    fun loadAd(
        configuration: MediationRewardedAdConfiguration,
        callback: MediationAdLoadCallback<MediationRewardedAd, MediationRewardedAdCallback>
    ) {
        context = configuration.context
        val serverParams = configuration.serverParameters
        val placementId = serverParams.getString(StarbidCustomEvent.PARAM_PLACEMENT_ID)

        if (placementId.isNullOrEmpty()) {
            callback.onFailure(AdError(1, "Missing placement_id", "io.starbidz"))
            return
        }

        CoroutineScope(Dispatchers.Main).launch {
            when (val result = Starbidz.requestBid(context!!, placementId, AdFormat.REWARDED)) {
                is AdResult.Success -> {
                    ad = result.ad
                    isLoaded = true
                    adCallback = callback.onSuccess(this@StarbidRewardedCustomEvent)
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

        val dialog = RewardedAdDialog(activity, ad!!, adCallback)
        dialog.show()

        CoroutineScope(Dispatchers.IO).launch {
            Starbidz.trackImpression(ad!!.bidId, "")
        }
    }

    private class RewardedAdDialog(
        activity: Activity,
        private val ad: StarbidzAd,
        private val callback: MediationRewardedAdCallback?
    ) : Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen) {

        private var webView: WebView? = null
        private var closeButton: ImageButton? = null
        private var countdownText: TextView? = null
        private var rewardGranted = false
        private var canClose = false
        private val handler = Handler(Looper.getMainLooper())
        private var secondsRemaining = 5

        private val countdownRunnable = object : Runnable {
            override fun run() {
                if (secondsRemaining > 0) {
                    countdownText?.text = "Close in ${secondsRemaining}s"
                    secondsRemaining--
                    handler.postDelayed(this, 1000)
                } else {
                    countdownText?.visibility = android.view.View.GONE
                    closeButton?.visibility = android.view.View.VISIBLE
                    canClose = true
                    grantReward()
                }
            }
        }

        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)
            requestWindowFeature(Window.FEATURE_NO_TITLE)
            setCancelable(false)

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
                        handler.post(countdownRunnable)
                    }
                }
            }

            container.addView(webView)

            countdownText = TextView(context).apply {
                setTextColor(Color.WHITE)
                textSize = 14f
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    marginEnd = dpToPx(16)
                    topMargin = dpToPx(16)
                    gravity = android.view.Gravity.END or android.view.Gravity.TOP
                }
            }
            container.addView(countdownText)

            closeButton = ImageButton(context).apply {
                setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
                setBackgroundColor(Color.TRANSPARENT)
                visibility = android.view.View.GONE
                layoutParams = FrameLayout.LayoutParams(
                    dpToPx(48), dpToPx(48)
                ).apply {
                    marginEnd = dpToPx(16)
                    topMargin = dpToPx(16)
                    gravity = android.view.Gravity.END or android.view.Gravity.TOP
                }
                setOnClickListener { if (canClose) dismiss() }
            }
            container.addView(closeButton)

            setContentView(container)
            loadContent()
        }

        private fun grantReward() {
            if (!rewardGranted) {
                rewardGranted = true
                callback?.onUserEarnedReward(object : RewardItem {
                    override fun getType(): String = "coins"
                    override fun getAmount(): Int = 1
                })

                CoroutineScope(Dispatchers.IO).launch {
                    Starbidz.trackComplete(ad.bidId, "")
                }
            }
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
            handler.removeCallbacks(countdownRunnable)
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
