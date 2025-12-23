package io.starbidz.max

import android.annotation.SuppressLint
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
import com.applovin.mediation.adapter.listeners.MaxInterstitialAdapterListener
import io.starbidz.core.StarbidzAd
import io.starbidz.core.Starbidz
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@SuppressLint("SetJavaScriptEnabled")
internal class StarbidInterstitialAd(
    private val context: Context,
    private val ad: StarbidzAd,
    private val listener: MaxInterstitialAdapterListener
) {
    private var isLoaded = false
    private var dialog: Dialog? = null

    fun load() {
        // For interstitials, we just mark as loaded since we'll render on show
        isLoaded = true
        listener.onInterstitialAdLoaded()
    }

    fun show(activity: Activity) {
        if (!isLoaded) {
            listener.onInterstitialAdDisplayFailed(
                com.applovin.mediation.adapter.MaxAdapterError.AD_NOT_READY
            )
            return
        }

        dialog = FullScreenAdDialog(activity, ad, listener)
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

    private class FullScreenAdDialog(
        activity: Activity,
        private val ad: StarbidzAd,
        private val listener: MaxInterstitialAdapterListener
    ) : Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen) {

        private var webView: WebView? = null

        @SuppressLint("SetJavaScriptEnabled")
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
                settings.mediaPlaybackRequiresUserGesture = false

                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        listener.onInterstitialAdDisplayed()
                    }
                }
            }

            container.addView(webView)

            // Close button
            val closeButton = ImageButton(context).apply {
                setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
                setBackgroundColor(Color.TRANSPARENT)
                layoutParams = FrameLayout.LayoutParams(
                    dpToPx(48),
                    dpToPx(48)
                ).apply {
                    marginEnd = dpToPx(16)
                    topMargin = dpToPx(16)
                    gravity = android.view.Gravity.END or android.view.Gravity.TOP
                }
                setOnClickListener {
                    dismiss()
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
                    // For VAST, we'd need a video player - simplified for now
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

        override fun dismiss() {
            super.dismiss()
            webView?.destroy()
            webView = null
            listener.onInterstitialAdHidden()
        }

        override fun onBackPressed() {
            // Track click on back (user engaged)
            CoroutineScope(Dispatchers.IO).launch {
                Starbidz.trackClick(ad.bidId, "")
            }
            super.onBackPressed()
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
