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
            path: "StarbidCore/Sources"
        ),
        .target(
            name: "StarbidMAX",
            dependencies: ["StarbidCore"],
            path: "StarbidMAX/Sources"
        ),
        .target(
            name: "StarbidAdMob",
            dependencies: ["StarbidCore"],
            path: "StarbidAdMob/Sources"
        ),
        .target(
            name: "StarbidLevelPlay",
            dependencies: ["StarbidCore"],
            path: "StarbidLevelPlay/Sources"
        ),
    ]
)
