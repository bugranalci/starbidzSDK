import Foundation

public final class Starbidz {
    public static let shared = Starbidz()

    private var config: StarbidConfig?
    private var client: StarbidClient?
    private var _isInitialized = false

    private init() {}

    public var isInitialized: Bool {
        return _isInitialized
    }

    public func initialize(config: StarbidConfig) {
        guard !_isInitialized else { return }

        self.config = config
        self.client = StarbidClient(config: config)
        self._isInitialized = true
    }

    public func getConfig() -> StarbidConfig? {
        return config
    }

    public func requestBid(
        placementId: String,
        format: AdFormat,
        width: Int? = nil,
        height: Int? = nil,
        completion: @escaping (AdResult) -> Void
    ) {
        guard _isInitialized, let client = client else {
            completion(.error("Starbidz SDK is not initialized. Call Starbidz.shared.initialize() first.", -1))
            return
        }

        client.requestBid(
            placementId: placementId,
            format: format,
            width: width,
            height: height,
            completion: completion
        )
    }

    public func trackImpression(bidId: String, placementId: String) {
        client?.trackEvent(eventType: "impression", bidId: bidId, placementId: placementId)
    }

    public func trackClick(bidId: String, placementId: String) {
        client?.trackEvent(eventType: "click", bidId: bidId, placementId: placementId)
    }

    public func trackComplete(bidId: String, placementId: String) {
        client?.trackEvent(eventType: "complete", bidId: bidId, placementId: placementId)
    }
}
