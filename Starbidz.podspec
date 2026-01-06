Pod::Spec.new do |s|
  s.name             = 'Starbidz'
  s.version          = '1.0.0'
  s.summary          = 'Client-side ad mediation SDK for iOS apps'

  s.description      = <<-DESC
    Starbidz SDK provides client-side ad mediation capabilities for iOS apps.
    Easily integrate multiple ad networks and maximize your ad revenue.

    Features:
    - Simple integration with single pod
    - Support for banner, interstitial, and rewarded ads
    - Real-time bidding support
    - Automatic ad network optimization
  DESC

  s.homepage         = 'https://github.com/bugranalci/starbidzSDK'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'Starbidz' => 'dev@starbidz.io' }
  s.source           = { :git => 'https://github.com/bugranalci/starbidzSDK.git', :tag => s.version.to_s }

  # Platform support - iOS 11.0 minimum for broader device support
  s.ios.deployment_target = '11.0'
  s.swift_version = '5.0'

  # Source files location
  s.source_files = 'adapters/ios/Starbidz/Sources/**/*.swift'

  # Required frameworks
  s.frameworks = 'Foundation', 'UIKit'

  # Optional frameworks for enhanced functionality
  s.weak_frameworks = 'AdSupport', 'AppTrackingTransparency'

  # Module name
  s.module_name = 'Starbidz'
end
