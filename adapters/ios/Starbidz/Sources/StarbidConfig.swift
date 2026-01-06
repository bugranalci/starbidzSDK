import Foundation

public struct StarbidConfig {
    public let appKey: String
    public let serverUrl: String
    public let testMode: Bool
    public let requestTimeoutMs: TimeInterval

    public static let defaultServerUrl = "https://bid.starbidz.io"
    public static let defaultTimeoutMs: TimeInterval = 5000

    public init(
        appKey: String,
        serverUrl: String = StarbidConfig.defaultServerUrl,
        testMode: Bool = false,
        requestTimeoutMs: TimeInterval = StarbidConfig.defaultTimeoutMs
    ) {
        self.appKey = appKey
        self.serverUrl = serverUrl
        self.testMode = testMode
        self.requestTimeoutMs = requestTimeoutMs
    }
}

public class StarbidConfigBuilder {
    private var appKey: String = ""
    private var serverUrl: String = StarbidConfig.defaultServerUrl
    private var testMode: Bool = false
    private var requestTimeoutMs: TimeInterval = StarbidConfig.defaultTimeoutMs

    public init() {}

    public func appKey(_ appKey: String) -> StarbidConfigBuilder {
        self.appKey = appKey
        return self
    }

    public func serverUrl(_ serverUrl: String) -> StarbidConfigBuilder {
        self.serverUrl = serverUrl
        return self
    }

    public func testMode(_ testMode: Bool) -> StarbidConfigBuilder {
        self.testMode = testMode
        return self
    }

    public func requestTimeoutMs(_ timeoutMs: TimeInterval) -> StarbidConfigBuilder {
        self.requestTimeoutMs = timeoutMs
        return self
    }

    public func build() -> StarbidConfig {
        precondition(!appKey.isEmpty, "App key is required")
        return StarbidConfig(
            appKey: appKey,
            serverUrl: serverUrl,
            testMode: testMode,
            requestTimeoutMs: requestTimeoutMs
        )
    }
}
