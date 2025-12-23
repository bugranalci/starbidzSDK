import Foundation
import UIKit
import StarbidCore

// MARK: - IronSource/LevelPlay Protocol Definitions
// Note: In production, import IronSourceSDK and remove these definitions

public protocol ISAdapterDataProtocol {
    func getString(_ key: String) -> String?
    func getInt(_ key: String) -> Int?
    func getBool(_ key: String) -> Bool
}

public class ISAdapterConfig: NSObject, ISAdapterDataProtocol {
    private var data: [String: Any] = [:]

    public init(data: [String: Any]) {
        self.data = data
        super.init()
    }

    public func getString(_ key: String) -> String? {
        return data[key] as? String
    }

    public func getInt(_ key: String) -> Int? {
        return data[key] as? Int
    }

    public func getBool(_ key: String) -> Bool {
        return data[key] as? Bool ?? false
    }
}

public protocol ISBannerAdDelegate: AnyObject {
    func adDidLoad(_ adView: UIView)
    func adDidFailToLoadWithError(_ error: String)
    func adDidShow()
    func adDidClick()
}

public protocol ISInterstitialAdDelegate: AnyObject {
    func adDidLoad()
    func adDidFailToLoadWithError(_ error: String)
    func adDidOpen()
    func adDidShow()
    func adDidClick()
    func adDidClose()
    func adDidFailToShowWithError(_ error: String)
}

public protocol ISRewardedVideoAdDelegate: AnyObject {
    func adDidLoad()
    func adDidFailToLoadWithError(_ error: String)
    func adDidOpen()
    func adDidShow()
    func adDidClick()
    func adDidClose()
    func adDidFailToShowWithError(_ error: String)
    func adRewarded()
}

// MARK: - Starbidz Custom Adapter

public class StarbidCustomAdapter: NSObject {

    public static let adapterVersion = "1.0.0"
    public static let sdkVersion = "1.0.0"

    // Parameter keys for server configuration
    public static let paramAppKey = "appKey"
    public static let paramPlacementId = "placementId"
    public static let paramServerUrl = "serverUrl"
    public static let paramTestMode = "testMode"

    public override init() {
        super.init()
    }

    // Initialize SDK from adapter config
    public static func initializeSDK(config: ISAdapterConfig) {
        guard let appKey = config.getString(paramAppKey), !appKey.isEmpty else {
            return
        }

        if !Starbidz.shared.isInitialized {
            var builder = StarbidConfigBuilder().appKey(appKey)

            if let serverUrl = config.getString(paramServerUrl), !serverUrl.isEmpty {
                builder = builder.serverUrl(serverUrl)
            }

            if config.getBool(paramTestMode) {
                builder = builder.testMode(true)
            }

            let config = builder.build()
            Starbidz.shared.initialize(config: config)
        }
    }

    // Parse server parameters from JSON string
    public static func parseConfig(from jsonString: String?) -> ISAdapterConfig {
        guard let params = jsonString, !params.isEmpty else {
            return ISAdapterConfig(data: [:])
        }

        if let data = params.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            return ISAdapterConfig(data: json)
        }

        return ISAdapterConfig(data: [:])
    }
}
