import Foundation
import UIKit
import WebKit
import StarbidCore

public class StarbidBannerAdapter: NSObject {

    public weak var delegate: ISBannerAdDelegate?

    private var webView: WKWebView?
    private var containerView: UIView?
    private var ad: StarbidAd?
    private var config: ISAdapterConfig?

    public override init() {
        super.init()
    }

    public func loadAd(config: ISAdapterConfig, size: CGSize, delegate: ISBannerAdDelegate) {
        self.config = config
        self.delegate = delegate

        StarbidCustomAdapter.initializeSDK(config: config)

        guard let placementId = config.getString(StarbidCustomAdapter.paramPlacementId), !placementId.isEmpty else {
            delegate.adDidFailToLoadWithError("Missing placementId in configuration")
            return
        }

        let width = Int(size.width)
        let height = Int(size.height)

        Starbidz.shared.requestBid(
            placementId: placementId,
            format: .banner,
            width: width,
            height: height
        ) { [weak self] result in
            guard let self = self else { return }

            DispatchQueue.main.async {
                switch result {
                case .success(let ad):
                    self.ad = ad
                    self.createBannerView(ad: ad, size: size)

                case .error(let message, _):
                    self.delegate?.adDidFailToLoadWithError(message)

                case .noBid:
                    self.delegate?.adDidFailToLoadWithError("No fill")
                }
            }
        }
    }

    private func createBannerView(ad: StarbidAd, size: CGSize) {
        containerView = UIView(frame: CGRect(origin: .zero, size: size))
        containerView?.backgroundColor = .clear

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true

        webView = WKWebView(frame: containerView!.bounds, configuration: config)
        webView?.navigationDelegate = self
        webView?.scrollView.isScrollEnabled = false
        webView?.isOpaque = false
        webView?.backgroundColor = .clear
        webView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]

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
            delegate?.adDidFailToLoadWithError("VAST not supported for banner")
        }
    }

    public func destroyAd() {
        webView?.stopLoading()
        webView?.removeFromSuperview()
        webView = nil
        containerView?.removeFromSuperview()
        containerView = nil
        ad = nil
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

// MARK: - WKNavigationDelegate

extension StarbidBannerAdapter: WKNavigationDelegate {

    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard let container = containerView else { return }
        delegate?.adDidLoad(container)
        delegate?.adDidShow()

        if let ad = ad {
            Starbidz.shared.trackImpression(bidId: ad.bidId, placementId: "")
        }
    }

    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        delegate?.adDidFailToLoadWithError(error.localizedDescription)
    }

    public func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {

        if navigationAction.navigationType == .linkActivated {
            delegate?.adDidClick()

            if let ad = ad {
                Starbidz.shared.trackClick(bidId: ad.bidId, placementId: "")
            }

            if let url = navigationAction.request.url {
                UIApplication.shared.open(url)
            }

            decisionHandler(.cancel)
            return
        }

        decisionHandler(.allow)
    }
}
