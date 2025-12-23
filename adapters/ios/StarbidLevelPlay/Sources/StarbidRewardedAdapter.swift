import Foundation
import UIKit
import WebKit
import StarbidCore

public class StarbidRewardedAdapter: NSObject {

    public weak var delegate: ISRewardedVideoAdDelegate?

    private var ad: StarbidAd?
    private var isLoaded = false
    private var config: ISAdapterConfig?

    public override init() {
        super.init()
    }

    public func loadAd(config: ISAdapterConfig, delegate: ISRewardedVideoAdDelegate) {
        self.config = config
        self.delegate = delegate

        StarbidCustomAdapter.initializeSDK(config: config)

        guard let placementId = config.getString(StarbidCustomAdapter.paramPlacementId), !placementId.isEmpty else {
            delegate.adDidFailToLoadWithError("Missing placementId in configuration")
            return
        }

        Starbidz.shared.requestBid(
            placementId: placementId,
            format: .rewarded
        ) { [weak self] result in
            guard let self = self else { return }

            DispatchQueue.main.async {
                switch result {
                case .success(let ad):
                    self.ad = ad
                    self.isLoaded = true
                    self.delegate?.adDidLoad()

                case .error(let message, _):
                    self.delegate?.adDidFailToLoadWithError(message)

                case .noBid:
                    self.delegate?.adDidFailToLoadWithError("No fill")
                }
            }
        }
    }

    public func isAdAvailable() -> Bool {
        return isLoaded && ad != nil
    }

    public func showAd(from viewController: UIViewController) {
        guard isLoaded, let ad = ad else {
            delegate?.adDidFailToShowWithError("Ad not ready")
            return
        }

        let adViewController = LevelPlayRewardedViewController(ad: ad)
        adViewController.modalPresentationStyle = .fullScreen
        adViewController.delegate = self

        delegate?.adDidOpen()

        viewController.present(adViewController, animated: true) { [weak self] in
            self?.delegate?.adDidShow()
            Starbidz.shared.trackImpression(bidId: ad.bidId, placementId: "")
        }
    }
}

// MARK: - LevelPlayRewardedViewControllerDelegate

extension StarbidRewardedAdapter: LevelPlayRewardedViewControllerDelegate {

    func rewardedDidClick(bidId: String) {
        delegate?.adDidClick()
        Starbidz.shared.trackClick(bidId: bidId, placementId: "")
    }

    func rewardedDidComplete(bidId: String) {
        delegate?.adRewarded()
        Starbidz.shared.trackComplete(bidId: bidId, placementId: "")
    }

    func rewardedDidClose() {
        delegate?.adDidClose()
        isLoaded = false
    }
}

// MARK: - Rewarded View Controller

protocol LevelPlayRewardedViewControllerDelegate: AnyObject {
    func rewardedDidClick(bidId: String)
    func rewardedDidComplete(bidId: String)
    func rewardedDidClose()
}

class LevelPlayRewardedViewController: UIViewController {

    private let ad: StarbidAd
    weak var delegate: LevelPlayRewardedViewControllerDelegate?

    private var webView: WKWebView?
    private var closeButton: UIButton?
    private var countdownLabel: UILabel?
    private var timer: Timer?
    private var secondsRemaining = 5
    private var rewardGranted = false
    private var canClose = false

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
        setupCountdownLabel()
        setupCloseButton()
        loadContent()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        startCountdown()
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

    private func setupCountdownLabel() {
        countdownLabel = UILabel()
        countdownLabel?.textColor = .white
        countdownLabel?.font = .systemFont(ofSize: 14, weight: .medium)
        countdownLabel?.backgroundColor = UIColor.black.withAlphaComponent(0.5)
        countdownLabel?.layer.cornerRadius = 8
        countdownLabel?.clipsToBounds = true
        countdownLabel?.textAlignment = .center
        countdownLabel?.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(countdownLabel!)

        NSLayoutConstraint.activate([
            countdownLabel!.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            countdownLabel!.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            countdownLabel!.widthAnchor.constraint(greaterThanOrEqualToConstant: 100),
            countdownLabel!.heightAnchor.constraint(equalToConstant: 32)
        ])
    }

    private func setupCloseButton() {
        closeButton = UIButton(type: .system)
        closeButton?.setTitle("✕", for: .normal)
        closeButton?.setTitleColor(.white, for: .normal)
        closeButton?.titleLabel?.font = .systemFont(ofSize: 24, weight: .bold)
        closeButton?.backgroundColor = UIColor.black.withAlphaComponent(0.5)
        closeButton?.layer.cornerRadius = 20
        closeButton?.translatesAutoresizingMaskIntoConstraints = false
        closeButton?.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)
        closeButton?.isHidden = true

        view.addSubview(closeButton!)

        NSLayoutConstraint.activate([
            closeButton!.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            closeButton!.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            closeButton!.widthAnchor.constraint(equalToConstant: 40),
            closeButton!.heightAnchor.constraint(equalToConstant: 40)
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

    private func startCountdown() {
        updateCountdownLabel()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.tick()
        }
    }

    private func tick() {
        secondsRemaining -= 1
        updateCountdownLabel()

        if secondsRemaining <= 0 {
            timer?.invalidate()
            timer = nil
            canClose = true
            countdownLabel?.isHidden = true
            closeButton?.isHidden = false
            grantReward()
        }
    }

    private func updateCountdownLabel() {
        countdownLabel?.text = "  Close in \(secondsRemaining)s  "
    }

    private func grantReward() {
        guard !rewardGranted else { return }
        rewardGranted = true
        delegate?.rewardedDidComplete(bidId: ad.bidId)
    }

    @objc private func closeTapped() {
        guard canClose else { return }
        dismiss(animated: true) { [weak self] in
            self?.delegate?.rewardedDidClose()
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

    deinit {
        timer?.invalidate()
    }
}

extension LevelPlayRewardedViewController: WKNavigationDelegate {

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {

        if navigationAction.navigationType == .linkActivated {
            delegate?.rewardedDidClick(bidId: ad.bidId)

            if let url = navigationAction.request.url {
                UIApplication.shared.open(url)
            }

            decisionHandler(.cancel)
            return
        }

        decisionHandler(.allow)
    }
}
