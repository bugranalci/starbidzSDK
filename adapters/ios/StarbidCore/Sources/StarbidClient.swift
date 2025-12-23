import Foundation
import UIKit

internal class StarbidClient {
    private let config: StarbidConfig
    private let session: URLSession

    init(config: StarbidConfig) {
        self.config = config

        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = config.requestTimeoutMs / 1000
        configuration.timeoutIntervalForResource = config.requestTimeoutMs / 1000
        self.session = URLSession(configuration: configuration)
    }

    func requestBid(
        placementId: String,
        format: AdFormat,
        width: Int? = nil,
        height: Int? = nil,
        completion: @escaping (AdResult) -> Void
    ) {
        let deviceInfo = collectDeviceInfo()
        let appInfo = collectAppInfo()

        let bidRequest: [String: Any] = [
            "app_key": config.appKey,
            "placement_id": placementId,
            "format": format.rawValue,
            "width": width as Any,
            "height": height as Any,
            "device": [
                "os": "ios",
                "osv": deviceInfo.osVersion,
                "make": "Apple",
                "model": deviceInfo.model,
                "ifa": deviceInfo.idfa ?? "",
                "lmt": deviceInfo.idfa == nil,
                "connectionType": deviceInfo.connectionType
            ],
            "app": [
                "bundle": appInfo.bundle,
                "version": appInfo.version,
                "name": appInfo.name
            ],
            "test": config.testMode
        ]

        guard let url = URL(string: "\(config.serverUrl)/v1/bid") else {
            completion(.error("Invalid URL", -1))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: bidRequest)
        } catch {
            completion(.error("JSON encoding error", -1))
            return
        }

        let task = session.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    completion(.error(error.localizedDescription, -1))
                    return
                }

                guard let httpResponse = response as? HTTPURLResponse else {
                    completion(.error("Invalid response", -1))
                    return
                }

                guard httpResponse.statusCode == 200 else {
                    completion(.error("HTTP \(httpResponse.statusCode)", httpResponse.statusCode))
                    return
                }

                guard let data = data else {
                    completion(.error("Empty response", -1))
                    return
                }

                do {
                    guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                        completion(.error("Parse error", -1))
                        return
                    }

                    guard let success = json["success"] as? Bool, success else {
                        completion(.noBid)
                        return
                    }

                    guard let bid = json["bid"] as? [String: Any],
                          let id = bid["id"] as? String,
                          let price = bid["price"] as? Double,
                          let currency = bid["currency"] as? String,
                          let demandSource = bid["demand_source"] as? String,
                          let creative = bid["creative"] as? [String: Any],
                          let creativeTypeStr = creative["type"] as? String,
                          let content = creative["content"] as? String else {
                        completion(.noBid)
                        return
                    }

                    let creativeType: StarbidAd.CreativeType
                    switch creativeTypeStr {
                    case "html": creativeType = .html
                    case "vast": creativeType = .vast
                    case "image": creativeType = .image
                    default: creativeType = .html
                    }

                    let starbidAd = StarbidAd(
                        bidId: id,
                        price: price,
                        currency: currency,
                        demandSource: demandSource,
                        creative: StarbidAd.Creative(
                            type: creativeType,
                            content: content,
                            width: creative["width"] as? Int,
                            height: creative["height"] as? Int
                        ),
                        notifyUrl: bid["nurl"] as? String,
                        billingUrl: bid["burl"] as? String
                    )

                    completion(.success(starbidAd))
                } catch {
                    completion(.error("Parse error: \(error.localizedDescription)", -1))
                }
            }
        }

        task.resume()
    }

    func trackEvent(eventType: String, bidId: String, placementId: String) {
        guard let url = URL(string: "\(config.serverUrl)/v1/events") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let event: [String: Any] = [
            "event_type": eventType,
            "bid_id": bidId,
            "placement_id": placementId,
            "timestamp": Int(Date().timeIntervalSince1970 * 1000)
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: event)
            session.dataTask(with: request).resume()
        } catch {
            // Ignore tracking errors
        }
    }

    private func collectDeviceInfo() -> (osVersion: String, model: String, idfa: String?, connectionType: String) {
        let osVersion = UIDevice.current.systemVersion
        let model = UIDevice.current.model
        let idfa = getIDFA()
        let connectionType = getConnectionType()

        return (osVersion, model, idfa, connectionType)
    }

    private func collectAppInfo() -> (bundle: String, version: String, name: String) {
        let bundle = Bundle.main.bundleIdentifier ?? ""
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        let name = Bundle.main.infoDictionary?["CFBundleDisplayName"] as? String
            ?? Bundle.main.infoDictionary?["CFBundleName"] as? String ?? ""

        return (bundle, version, name)
    }

    private func getIDFA() -> String? {
        // Check if AppTrackingTransparency is available (iOS 14+)
        if #available(iOS 14, *) {
            // Would need to import AppTrackingTransparency
            // For now, return nil to indicate tracking not available
            return nil
        } else {
            // For iOS 13 and below, use ASIdentifierManager
            return nil
        }
    }

    private func getConnectionType() -> String {
        // Simplified - would need Reachability or similar for accurate detection
        return "unknown"
    }
}
