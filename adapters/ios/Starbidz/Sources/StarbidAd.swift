import Foundation

public struct StarbidAd {
    public let bidId: String
    public let price: Double
    public let currency: String
    public let demandSource: String
    public let creative: Creative
    public let notifyUrl: String?
    public let billingUrl: String?

    public struct Creative {
        public let type: CreativeType
        public let content: String
        public let width: Int?
        public let height: Int?
    }

    public enum CreativeType: String {
        case html
        case vast
        case image
    }
}

public enum AdFormat: String {
    case banner
    case interstitial
    case rewarded
}

public enum AdResult {
    case success(StarbidAd)
    case error(String, Int)
    case noBid

    public var ad: StarbidAd? {
        if case .success(let ad) = self {
            return ad
        }
        return nil
    }

    public var isSuccess: Bool {
        if case .success = self {
            return true
        }
        return false
    }
}
