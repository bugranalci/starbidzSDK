package io.starbidz.max

import android.annotation.SuppressLint
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
import com.applovin.mediation.MaxReward
import com.applovin.mediation.adapter.listeners.MaxRewardedAdapterListener
import io.starbidz.core.StarbidzAd
import io.starbidz.core.Starbidz
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@SuppressLint("SetJavaScriptEnabled")
internal class StarbidRewardedAd(
    private val context: Context,
    private val ad: StarbidzAd,
    private val listener: MaxRewardedAdapterListener
) {
    private var isLoaded = false
    private var dialog: Dialog? = null

    fun load() {
        isLoaded = true
        listener.onRewardedAdLoaded()
    }

    fun show(activity: Activity) {
        if (!isLoaded) {
            listener.onRewardedAdDisplayFailed(
                com.applovin.mediation.adapter.MaxAdapterError.AD_NOT_READY
            )
            return
        }

        dialog = RewardedAdDialog(activity, ad, listener)
        dialog?.show()

        // Track impression
        CoroutineScope(Dispatchers.IO).launch {
            Starbidz.trackImpression(ad.bidId, "")
        }
    }

    fun destroy() {
        dialog?.dismiss()
        dialog = null
        isLoaded = false
    }

    private class RewardedAdDialog(
        activity: Activity,
        private val ad: StarbidzAd,
        private val listener: MaxRewardedAdapterListener
    ) : Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen) {

        private var webView: WebView? = null
        private var closeButton: ImageButton? = null
        private var countdownText: TextView? = null
        private var rewardGranted = false
        private var canClose = false
        private val handler = Handler(Looper.getMainLooper())

        private val countdownRunnable = object : Runnable {
            var secondsRemaining = 5

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

        @SuppressLint("SetJavaScriptEnabled")
        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)
            requestWindowFeature(Window.FEATURE_NO_TITLE)
            setCancelable(false) // Prevent back button closing

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
                settings.mediaPlaybackRequiresUserGesture = false

                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        listener.onRewardedAdDisplayed()
                        // Start countdown after ad loads
                        handler.post(countdownRunnable)
                    }
                }
            }

            container.addView(webView)

            // Countdown text (shown first)
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

            // Close button (hidden initially)
            closeButton = ImageButton(context).apply {
                setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
                setBackgroundColor(Color.TRANSPARENT)
                visibility = android.view.View.GONE
                layoutParams = FrameLayout.LayoutParams(
                    dpToPx(48),
                    dpToPx(48)
                ).apply {
                    marginEnd = dpToPx(16)
                    topMargin = dpToPx(16)
                    gravity = android.view.Gravity.END or android.view.Gravity.TOP
                }
                setOnClickListener {
                    if (canClose) {
                        dismiss()
                    }
                }
            }
            container.addView(closeButton)

            setContentView(container)

            // Load content
            when (ad.creative.type) {
                StarbidzAd.CreativeType.HTML -> {
                    webView?.loadDataWithBaseURL(
                        null,
                        wrapHtml(ad.creative.content),
                        "text/html",
                        "UTF-8",
                        null
                    )
                }
                StarbidzAd.CreativeType.VAST -> {
                    webView?.loadUrl(ad.creative.content)
                }
                StarbidzAd.CreativeType.IMAGE -> {
                    val imgHtml = """
                        <html>
                        <body style="margin:0;padding:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;">
                        <img src="${ad.creative.content}" style="max-width:100%;max-height:100%;object-fit:contain;"/>
                        </body>
                        </html>
                    """.trimIndent()
                    webView?.loadDataWithBaseURL(null, imgHtml, "text/html", "UTF-8", null)
                }
            }
        }

        private fun grantReward() {
            if (!rewardGranted) {
                rewardGranted = true
                listener.onUserRewarded(MaxReward.DEFAULT_REWARD)

                // Track completion
                CoroutineScope(Dispatchers.IO).launch {
                    Starbidz.trackComplete(ad.bidId, "")
                }
            }
        }

        override fun dismiss() {
            handler.removeCallbacks(countdownRunnable)
            super.dismiss()
            webView?.destroy()
            webView = null
            listener.onRewardedAdHidden()
        }

        override fun onBackPressed() {
            if (canClose) {
                super.onBackPressed()
            }
            // Don't allow back button until reward is granted
        }

        private fun wrapHtml(content: String): String {
            return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        html, body { width: 100%; height: 100%; background: #000; }
                    </style>
                </head>
                <body>
                    $content
                </body>
                </html>
            """.trimIndent()
        }

        private fun dpToPx(dp: Int): Int {
            return (dp * context.resources.displayMetrics.density).toInt()
        }
    }
}
