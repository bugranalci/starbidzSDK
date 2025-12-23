import Foundation
import UIKit
import WebKit
import StarbidCore

public class StarbidBannerCustomEvent: NSObject, GADCustomEventBanner {

    public weak var delegate: GADCustomEventBannerDelegate?

    private var webView: WKWebView?
    private var containerView: UIView?
    private var ad: StarbidAd?

    public override init() {
        super.init()
    }

    public func requestAd(_ adSize: GADAdSize, parameter serverParameter: String?, label serverLabel: String?, request: GADCustomEventRequest) {

        let params = StarbidCustomEvent.parseServerParameters(serverParameter)
        StarbidCustomEvent.initializeSDK(params: params)

        guard let placementId = params[StarbidCustomEvent.paramPlacementId], !placementId.isEmpty else {
            let error = NSError(
                domain: "io.starbidz.admob",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "Missing placement_id in server parameters"]
            )
            delegate?.customEventBanner(self, didFailAd: error)
            return
        }

        let width = Int(adSize.width)
        let height = Int(adSize.height)

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
                    self.createBannerView(ad: ad, width: width, height: height)

                case .error(let message, _):
                    let error = NSError(
                        domain: "io.starbidz.admob",
                        code: 2,
                        userInfo: [NSLocalizedDescriptionKey: message]
                    )
                    self.delegate?.customEventBanner(self, didFailAd: error)

                case .noBid:
                    let error = NSError(
                        domain: "io.starbidz.admob",
                        code: 204,
                        userInfo: [NSLocalizedDescriptionKey: "No fill"]
                    )
                    self.delegate?.customEventBanner(self, didFailAd: error)
                }
            }
        }
    }

    private func createBannerView(ad: StarbidAd, width: Int, height: Int) {
        containerView = UIView(frame: CGRect(x: 0, y: 0, width: width, height: height))
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
            let error = NSError(
                domain: "io.starbidz.admob",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "VAST not supported for banner"]
            )
            delegate?.customEventBanner(self, didFailAd: error)
        }
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

extension StarbidBannerCustomEvent: WKNavigationDelegate {

    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard let container = containerView else { return }
        delegate?.customEventBanner(self, didReceiveAd: container)

        if let ad = ad {
            Starbidz.shared.trackImpression(bidId: ad.bidId, placementId: "")
        }
    }

    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        delegate?.customEventBanner(self, didFailAd: error)
    }

    public func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {

        if navigationAction.navigationType == .linkActivated {
            delegate?.customEventBannerWasClicked(self)

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
