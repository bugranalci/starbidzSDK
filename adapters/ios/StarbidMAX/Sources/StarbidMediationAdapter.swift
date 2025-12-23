import Foundation
import UIKit
import StarbidCore

// Note: In a real implementation, this would import AppLovinSDK
// For now, we define the protocols/types needed

public protocol MAAdapterDelegate: AnyObject {
    func didLoad()
    func didFailToLoad(error: Error)
    func didDisplay()
    func didFailToDisplay(error: Error)
    func didClick()
    func didHide()
}

public protocol MARewardedAdapterDelegate: MAAdapterDelegate {
    func didRewardUser()
}

public class StarbidMediationAdapter: NSObject {
    public static let adapterVersion = "1.0.0"
    public static let sdkVersion = "1.0.0"

    private weak var delegate: MAAdapterDelegate?
    private var bannerAd: StarbidBannerAd?
    private var interstitialAd: StarbidInterstitialAd?
    private var rewardedAd: StarbidRewardedAd?

    public override init() {
        super.init()
    }

    public func initialize(
        appKey: String,
        serverUrl: String? = nil,
        testMode: Bool = false,
        completion: @escaping (Bool, String?) -> Void
    ) {
        guard !appKey.isEmpty else {
            completion(false, "Missing app_key parameter")
            return
        }

        if !Starbidz.shared.isInitialized {
            var builder = StarbidConfigBuilder()
                .appKey(appKey)
                .testMode(testMode)

            if let url = serverUrl, !url.isEmpty {
                builder = builder.serverUrl(url)
            }

            let config = builder.build()
            Starbidz.shared.initialize(config: config)
        }

        completion(true, nil)
    }

    // MARK: - Banner Ads

    public func loadBannerAd(
        placementId: String,
        width: Int,
        height: Int,
        delegate: MAAdapterDelegate
    ) {
        self.delegate = delegate

        Starbidz.shared.requestBid(
            placementId: placementId,
            format: .banner,
            width: width,
            height: height
        ) { [weak self] result in
            switch result {
            case .success(let ad):
                self?.bannerAd = StarbidBannerAd(
                    ad: ad,
                    width: width,
                    height: height,
                    delegate: delegate
                )
                self?.bannerAd?.load()

            case .error(let message, _):
                delegate.didFailToLoad(error: NSError(
                    domain: "io.starbidz",
                    code: -1,
                    userInfo: [NSLocalizedDescriptionKey: message]
                ))

            case .noBid:
                delegate.didFailToLoad(error: NSError(
                    domain: "io.starbidz",
                    code: 204,
                    userInfo: [NSLocalizedDescriptionKey: "No bid"]
                ))
            }
        }
    }

    public func getBannerView() -> UIView? {
        return bannerAd?.getView()
    }

    // MARK: - Interstitial Ads

    public func loadInterstitialAd(
        placementId: String,
        delegate: MAAdapterDelegate
    ) {
        self.delegate = delegate

        Starbidz.shared.requestBid(
            placementId: placementId,
            format: .interstitial
        ) { [weak self] result in
            switch result {
            case .success(let ad):
                self?.interstitialAd = StarbidInterstitialAd(ad: ad, delegate: delegate)
                self?.interstitialAd?.load()

            case .error(let message, _):
                delegate.didFailToLoad(error: NSError(
                    domain: "io.starbidz",
                    code: -1,
                    userInfo: [NSLocalizedDescriptionKey: message]
                ))

            case .noBid:
                delegate.didFailToLoad(error: NSError(
                    domain: "io.starbidz",
                    code: 204,
                    userInfo: [NSLocalizedDescriptionKey: "No bid"]
                ))
            }
        }
    }

    public func showInterstitialAd(from viewController: UIViewController) {
        interstitialAd?.show(from: viewController)
    }

    // MARK: - Rewarded Ads

    public func loadRewardedAd(
        placementId: String,
        delegate: MARewardedAdapterDelegate
    ) {
        self.delegate = delegate

        Starbidz.shared.requestBid(
            placementId: placementId,
            format: .rewarded
        ) { [weak self] result in
            switch result {
            case .success(let ad):
                self?.rewardedAd = StarbidRewardedAd(ad: ad, delegate: delegate)
                self?.rewardedAd?.load()

            case .error(let message, _):
                delegate.didFailToLoad(error: NSError(
                    domain: "io.starbidz",
                    code: -1,
                    userInfo: [NSLocalizedDescriptionKey: message]
                ))

            case .noBid:
                delegate.didFailToLoad(error: NSError(
                    domain: "io.starbidz",
                    code: 204,
                    userInfo: [NSLocalizedDescriptionKey: "No bid"]
                ))
            }
        }
    }

    public func showRewardedAd(from viewController: UIViewController) {
        rewardedAd?.show(from: viewController)
    }

    // MARK: - Cleanup

    public func destroy() {
        bannerAd?.destroy()
        interstitialAd?.destroy()
        rewardedAd?.destroy()
        bannerAd = nil
        interstitialAd = nil
        rewardedAd = nil
        delegate = nil
    }
}
