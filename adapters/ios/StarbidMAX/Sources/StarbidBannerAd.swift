import Foundation
import UIKit
import WebKit
import StarbidCore

internal class StarbidBannerAd: NSObject {
    private let ad: StarbidAd
    private let width: Int
    private let height: Int
    private weak var delegate: MAAdapterDelegate?

    private var webView: WKWebView?
    private var containerView: UIView?

    init(ad: StarbidAd, width: Int, height: Int, delegate: MAAdapterDelegate) {
        self.ad = ad
        self.width = width
        self.height = height
        self.delegate = delegate
        super.init()
    }

    func load() {
        containerView = UIView(frame: CGRect(x: 0, y: 0, width: width, height: height))
        containerView?.backgroundColor = .clear

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        webView = WKWebView(frame: containerView!.bounds, configuration: config)
        webView?.navigationDelegate = self
        webView?.scrollView.isScrollEnabled = false
        webView?.isOpaque = false
        webView?.backgroundColor = .clear

        containerView?.addSubview(webView!)

        switch ad.creative.type {
        case .html:
            let html = wrapHtml(ad.creative.content)
            webView?.loadHTMLString(html, baseURL: nil)

        case .image:
            let imgHtml = """
            <html>
            <body style="margin:0;padding:0;">
            <img src="\(ad.creative.content)" style="width:100%;height:100%;object-fit:contain;"/>
            </body>
            </html>
            """
            webView?.loadHTMLString(imgHtml, baseURL: nil)

        case .vast:
            delegate?.didFailToLoad(error: NSError(
                domain: "io.starbidz",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "VAST not supported for banner"]
            ))
        }
    }

    func getView() -> UIView? {
        return containerView
    }

    func destroy() {
        webView?.stopLoading()
        webView?.removeFromSuperview()
        webView = nil
        containerView?.removeFromSuperview()
        containerView = nil
    }

    private func wrapHtml(_ content: String) -> String {
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
            \(content)
        </body>
        </html>
        """
    }
}

extension StarbidBannerAd: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        delegate?.didLoad()
        Starbidz.shared.trackImpression(bidId: ad.bidId, placementId: "")
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        delegate?.didFailToLoad(error: error)
    }
}
