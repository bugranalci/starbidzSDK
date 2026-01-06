// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Starbidz",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(
            name: "Starbidz",
            targets: ["Starbidz"]
        ),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "Starbidz",
            dependencies: [],
            path: "adapters/ios/Starbidz/Sources"
        ),
    ]
)
