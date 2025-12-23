import Foundation
import UIKit
import WebKit
import StarbidCore

public class StarbidInterstitialCustomEvent: NSObject, GADCustomEventInterstitial {

    public weak var delegate: GADCustomEventInterstitialDelegate?

    private var ad: StarbidAd?
    private var isLoaded = false

    public override init() {
        super.init()
    }

    public func requestAd(withParameter serverParameter: String?, label serverLabel: String?, request: GADCustomEventRequest) {

        let params = StarbidCustomEvent.parseServerParameters(serverParameter)
        StarbidCustomEvent.initializeSDK(params: params)

        guard let placementId = params[StarbidCustomEvent.paramPlacementId], !placementId.isEmpty else {
            let error = NSError(
                domain: "io.starbidz.admob",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "Missing placement_id in server parameters"]
            )
            delegate?.customEventInterstitial(self, didFailAd: error)
            return
        }

        Starbidz.shared.requestBid(
            placementId: placementId,
            format: .interstitial
        ) { [weak self] result in
            guard let self = self else { return }

            DispatchQueue.main.async {
                switch result {
                case .success(let ad):
                    self.ad = ad
                    self.isLoaded = true
                    self.delegate?.customEventInterstitialDidReceiveAd(self)

                case .error(let message, _):
                    let error = NSError(
                        domain: "io.starbidz.admob",
                        code: 2,
                        userInfo: [NSLocalizedDescriptionKey: message]
                    )
                    self.delegate?.customEventInterstitial(self, didFailAd: error)

                case .noBid:
                    let error = NSError(
                        domain: "io.starbidz.admob",
                        code: 204,
                        userInfo: [NSLocalizedDescriptionKey: "No fill"]
                    )
                    self.delegate?.customEventInterstitial(self, didFailAd: error)
                }
            }
        }
    }

    public func present(fromRootViewController rootViewController: UIViewController) {
        guard isLoaded, let ad = ad else {
            let error = NSError(
                domain: "io.starbidz.admob",
                code: 3,
                userInfo: [NSLocalizedDescriptionKey: "Ad not ready"]
            )
            delegate?.customEventInterstitial(self, didFailAd: error)
            return
        }

        let adViewController = InterstitialViewController(ad: ad)
        adViewController.modalPresentationStyle = .fullScreen
        adViewController.delegate = self

        delegate?.customEventInterstitialWillPresent(self)

        rootViewController.present(adViewController, animated: true) { [weak self] in
            guard let self = self else { return }
            Starbidz.shared.trackImpression(bidId: ad.bidId, placementId: "")
        }
    }
}

// MARK: - InterstitialViewControllerDelegate

extension StarbidInterstitialCustomEvent: InterstitialViewControllerDelegate {

    func interstitialDidClick(bidId: String) {
        delegate?.customEventInterstitialWasClicked(self)
        Starbidz.shared.trackClick(bidId: bidId, placementId: "")
    }

    func interstitialWillDismiss() {
        delegate?.customEventInterstitialWillDismiss(self)
    }

    func interstitialDidDismiss() {
        delegate?.customEventInterstitialDidDismiss(self)
        isLoaded = false
    }
}

// MARK: - Interstitial View Controller

protocol InterstitialViewControllerDelegate: AnyObject {
    func interstitialDidClick(bidId: String)
    func interstitialWillDismiss()
    func interstitialDidDismiss()
}

class InterstitialViewController: UIViewController {

    private let ad: StarbidAd
    weak var delegate: InterstitialViewControllerDelegate?

    private var webView: WKWebView?

    init(ad: StarbidAd) {
        self.ad = ad
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        setupWebView()
        setupCloseButton()
        loadContent()
    }

    private func setupWebView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView?.navigationDelegate = self

        view.addSubview(webView!)
    }

    private func setupCloseButton() {
        let closeButton = UIButton(type: .system)
        closeButton.setTitle("✕", for: .normal)
        closeButton.setTitleColor(.white, for: .normal)
        closeButton.titleLabel?.font = .systemFont(ofSize: 24, weight: .bold)
        closeButton.backgroundColor = UIColor.black.withAlphaComponent(0.5)
        closeButton.layer.cornerRadius = 20
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        closeButton.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)

        view.addSubview(closeButton)

        NSLayoutConstraint.activate([
            closeButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            closeButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            closeButton.widthAnchor.constraint(equalToConstant: 40),
            closeButton.heightAnchor.constraint(equalToConstant: 40)
        ])
    }

    private func loadContent() {
        switch ad.creative.type {
        case .html:
            let html = wrapHtml(ad.creative.content)
            webView?.loadHTMLString(html, baseURL: nil)

        case .vast:
            if let url = URL(string: ad.creative.content) {
                webView?.load(URLRequest(url: url))
            }

        case .image:
            let imgHtml = """
            <html>
            <body style="margin:0;padding:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;">
            <img src="\(ad.creative.content)" style="max-width:100%;max-height:100%;object-fit:contain;"/>
            </body>
            </html>
            """
            webView?.loadHTMLString(imgHtml, baseURL: nil)
        }
    }

    @objc private func closeTapped() {
        delegate?.interstitialDidClick(bidId: ad.bidId)
        delegate?.interstitialWillDismiss()
        dismiss(animated: true) { [weak self] in
            self?.delegate?.interstitialDidDismiss()
        }
    }

    private func wrapHtml(_ content: String) -> String {
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
            \(content)
        </body>
        </html>
        """
    }
}

extension InterstitialViewController: WKNavigationDelegate {

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {

        if navigationAction.navigationType == .linkActivated {
            delegate?.interstitialDidClick(bidId: ad.bidId)

            if let url = navigationAction.request.url {
                UIApplication.shared.open(url)
            }

            decisionHandler(.cancel)
            return
        }

        decisionHandler(.allow)
    }
}
