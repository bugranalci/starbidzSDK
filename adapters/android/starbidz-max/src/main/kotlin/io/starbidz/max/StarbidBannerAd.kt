package io.starbidz.max

import android.annotation.SuppressLint
import android.content.Context
import android.view.View
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import com.applovin.mediation.adapter.listeners.MaxAdViewAdapterListener
import io.starbidz.core.StarbidzAd
import io.starbidz.core.Starbidz
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@SuppressLint("SetJavaScriptEnabled")
internal class StarbidBannerAd(
    private val context: Context,
    private val ad: StarbidzAd,
    private val width: Int,
    private val height: Int,
    private val listener: MaxAdViewAdapterListener
) {
    private var webView: WebView? = null
    private var container: FrameLayout? = null

    fun load() {
        container = FrameLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                dpToPx(width),
                dpToPx(height)
            )
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
                    listener.onAdViewAdLoaded(container!!)

                    // Track impression
                    CoroutineScope(Dispatchers.IO).launch {
                        Starbidz.trackImpression(ad.bidId, "")
                    }
                }

                override fun onReceivedError(
                    view: WebView?,
                    errorCode: Int,
                    description: String?,
                    failingUrl: String?
                ) {
                    listener.onAdViewAdDisplayFailed(
                        com.applovin.mediation.adapter.MaxAdapterError(
                            errorCode,
                            description ?: "WebView error"
                        )
                    )
                }
            }
        }

        container?.addView(webView)

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
            StarbidzAd.CreativeType.IMAGE -> {
                val imgHtml = """
                    <html>
                    <body style="margin:0;padding:0;">
                    <img src="${ad.creative.content}" style="width:100%;height:100%;object-fit:contain;"/>
                    </body>
                    </html>
                """.trimIndent()
                webView?.loadDataWithBaseURL(null, imgHtml, "text/html", "UTF-8", null)
            }
            else -> {
                listener.onAdViewAdDisplayFailed(
                    com.applovin.mediation.adapter.MaxAdapterError.INTERNAL_ERROR
                )
            }
        }
    }

    fun getView(): View? = container

    fun destroy() {
        webView?.destroy()
        webView = null
        container?.removeAllViews()
        container = null
    }

    private fun wrapHtml(content: String): String {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    html, body { width: 100%; height: 100%; overflow: hidden; }
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
