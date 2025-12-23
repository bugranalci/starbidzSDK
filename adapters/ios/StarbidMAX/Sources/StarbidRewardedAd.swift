import Foundation
import UIKit
import WebKit
import StarbidCore

internal class StarbidRewardedAd: NSObject {
    private let ad: StarbidAd
    private weak var delegate: MARewardedAdapterDelegate?

    private var isLoaded = false
    private var presentingViewController: UIViewController?

    init(ad: StarbidAd, delegate: MARewardedAdapterDelegate) {
        self.ad = ad
        self.delegate = delegate
        super.init()
    }

    func load() {
        isLoaded = true
        delegate?.didLoad()
    }

    func show(from viewController: UIViewController) {
        guard isLoaded else {
            delegate?.didFailToDisplay(error: NSError(
                domain: "io.starbidz",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "Ad not ready"]
            ))
            return
        }

        presentingViewController = viewController

        let adViewController = RewardedAdViewController(ad: ad, delegate: delegate)
        adViewController.modalPresentationStyle = .fullScreen
        adViewController.onDismiss = { [weak self] in
            self?.delegate?.didHide()
        }

        viewController.present(adViewController, animated: true) {
            Starbidz.shared.trackImpression(bidId: self.ad.bidId, placementId: "")
        }
    }

    func destroy() {
        isLoaded = false
        presentingViewController = nil
    }
}

private class RewardedAdViewController: UIViewController {
    private let ad: StarbidAd
    private weak var delegate: MARewardedAdapterDelegate?
    var onDismiss: (() -> Void)?

    private var webView: WKWebView?
    private var closeButton: UIButton?
    private var countdownLabel: UILabel?
    private var timer: Timer?
    private var secondsRemaining = 5
    private var rewardGranted = false
    private var canClose = false

    init(ad: StarbidAd, delegate: MARewardedAdapterDelegate?) {
        self.ad = ad
        self.delegate = delegate
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
        countdownLabel?.font = .systemFont(ofSize: 14)
        countdownLabel?.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(countdownLabel!)

        NSLayoutConstraint.activate([
            countdownLabel!.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            countdownLabel!.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16)
        ])
    }

    private func setupCloseButton() {
        closeButton = UIButton(type: .system)
        closeButton?.setTitle("X", for: .normal)
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
        countdownLabel?.text = "Close in \(secondsRemaining)s"
    }

    private func grantReward() {
        guard !rewardGranted else { return }
        rewardGranted = true
        delegate?.didRewardUser()
        Starbidz.shared.trackComplete(bidId: ad.bidId, placementId: "")
    }

    @objc private func closeTapped() {
        guard canClose else { return }
        dismiss(animated: true) {
            self.onDismiss?()
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

extension RewardedAdViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        delegate?.didDisplay()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        delegate?.didFailToDisplay(error: error)
    }
}
