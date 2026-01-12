// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Starbidz",
    platforms: [
        .iOS(.v12)
    ],
    products: [
        .library(
            name: "StarbidCore",
            targets: ["StarbidCore"]
        ),
        .library(
            name: "StarbidMAX",
            targets: ["StarbidMAX"]
        ),
        .library(
            name: "StarbidAdMob",
            targets: ["StarbidAdMob"]
        ),
        .library(
            name: "StarbidLevelPlay",
            targets: ["StarbidLevelPlay"]
        ),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "StarbidCore",
            dependencies: [],
            path: "adapters/ios/StarbidCore/Sources"
        ),
        .target(
            name: "StarbidMAX",
            dependencies: ["StarbidCore"],
            path: "adapters/ios/StarbidMAX/Sources"
        ),
        .target(
            name: "StarbidAdMob",
            dependencies: ["StarbidCore"],
            path: "adapters/ios/StarbidAdMob/Sources"
        ),
        .target(
            name: "StarbidLevelPlay",
            dependencies: ["StarbidCore"],
            path: "adapters/ios/StarbidLevelPlay/Sources"
        ),
    ]
)
