import Foundation
import UIKit
import StarbidCore

// MARK: - AdMob Protocol Definitions
// Note: In production, import GoogleMobileAds and remove these definitions

public protocol GADCustomEventBannerDelegate: AnyObject {
    func customEventBanner(_ customEvent: GADCustomEventBanner, didReceiveAd view: UIView)
    func customEventBanner(_ customEvent: GADCustomEventBanner, didFailAd error: Error?)
    func customEventBannerWasClicked(_ customEvent: GADCustomEventBanner)
    func customEventBannerWillPresentModal(_ customEvent: GADCustomEventBanner)
    func customEventBannerWillDismissModal(_ customEvent: GADCustomEventBanner)
    func customEventBannerDidDismissModal(_ customEvent: GADCustomEventBanner)
}

public protocol GADCustomEventInterstitialDelegate: AnyObject {
    func customEventInterstitialDidReceiveAd(_ customEvent: GADCustomEventInterstitial)
    func customEventInterstitial(_ customEvent: GADCustomEventInterstitial, didFailAd error: Error?)
    func customEventInterstitialWasClicked(_ customEvent: GADCustomEventInterstitial)
    func customEventInterstitialWillPresent(_ customEvent: GADCustomEventInterstitial)
    func customEventInterstitialWillDismiss(_ customEvent: GADCustomEventInterstitial)
    func customEventInterstitialDidDismiss(_ customEvent: GADCustomEventInterstitial)
}

public protocol GADCustomEventBanner: AnyObject {
    var delegate: GADCustomEventBannerDelegate? { get set }
    func requestAd(_ adSize: GADAdSize, parameter serverParameter: String?, label serverLabel: String?, request: GADCustomEventRequest)
}

public protocol GADCustomEventInterstitial: AnyObject {
    var delegate: GADCustomEventInterstitialDelegate? { get set }
    func requestAd(withParameter serverParameter: String?, label serverLabel: String?, request: GADCustomEventRequest)
    func present(fromRootViewController rootViewController: UIViewController)
}

public struct GADAdSize {
    public let width: CGFloat
    public let height: CGFloat

    public static let banner = GADAdSize(width: 320, height: 50)
    public static let mediumRectangle = GADAdSize(width: 300, height: 250)
    public static let leaderboard = GADAdSize(width: 728, height: 90)
}

public class GADCustomEventRequest: NSObject {
    public var userHasLocation: Bool = false
    public var userLatitude: CGFloat = 0
    public var userLongitude: CGFloat = 0
    public var userLocationAccuracyInMeters: CGFloat = 0
    public var userLocationDescription: String?
    public var isTesting: Bool = false
}

// MARK: - Starbidz Custom Event Base

public class StarbidCustomEvent: NSObject {

    public static let adapterVersion = "1.0.0"
    public static let sdkVersion = "1.0.0"

    // Parameter keys for server configuration
    public static let paramAppKey = "app_key"
    public static let paramPlacementId = "placement_id"
    public static let paramServerUrl = "server_url"
    public static let paramTestMode = "test_mode"

    // Parse server parameters from AdMob configuration
    public static func parseServerParameters(_ serverParameter: String?) -> [String: String] {
        guard let params = serverParameter, !params.isEmpty else {
            return [:]
        }

        var result: [String: String] = [:]

        // Try JSON parsing first
        if let data = params.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            for (key, value) in json {
                result[key] = String(describing: value)
            }
            return result
        }

        // Fallback to key=value&key=value format
        let pairs = params.split(separator: "&")
        for pair in pairs {
            let keyValue = pair.split(separator: "=", maxSplits: 1)
            if keyValue.count == 2 {
                result[String(keyValue[0])] = String(keyValue[1])
            }
        }

        return result
    }

    // Initialize SDK if needed
    public static func initializeSDK(params: [String: String]) {
        guard let appKey = params[paramAppKey], !appKey.isEmpty else {
            return
        }

        if !Starbidz.shared.isInitialized {
            var builder = StarbidConfigBuilder().appKey(appKey)

            if let serverUrl = params[paramServerUrl], !serverUrl.isEmpty {
                builder = builder.serverUrl(serverUrl)
            }

            if let testMode = params[paramTestMode], testMode.lowercased() == "true" {
                builder = builder.testMode(true)
            }

            let config = builder.build()
            Starbidz.shared.initialize(config: config)
        }
    }
}
