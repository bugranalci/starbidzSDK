Pod::Spec.new do |s|
  s.name             = 'StarbidMAX'
  s.version          = '1.0.0'
  s.summary          = 'AppLovin MAX adapter for Starbidz SDK'
  s.description      = <<-DESC
    Starbidz MAX adapter integrates Starbidz server-side bidding with AppLovin MAX mediation.
  DESC

  s.homepage         = 'https://github.com/AjoPay/Starbidz-SDK-iOS'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'Starbidz' => 'dev@starbidz.io' }
  s.source           = { :git => 'https://github.com/AjoPay/Starbidz-SDK-iOS.git', :tag => s.version.to_s }

  s.ios.deployment_target = '12.0'
  s.swift_version = '5.0'

  s.source_files = 'StarbidMAX/Sources/**/*.swift'

  s.dependency 'StarbidCore', '~> 1.0'
  s.dependency 'AppLovinSDK', '>= 12.0.0'

  s.frameworks = 'Foundation', 'UIKit'
end
