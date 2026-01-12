Pod::Spec.new do |s|
  s.name             = 'StarbidCore'
  s.version          = '1.0.0'
  s.summary          = 'Core SDK for Starbidz ad mediation platform'
  s.description      = <<-DESC
    Starbidz Core SDK provides server-side ad bidding capabilities for iOS apps.
    This is the core module required by all Starbidz adapters.
  DESC

  s.homepage         = 'https://github.com/bugranalci/starbidzSDK'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'Starbidz' => 'dev@starbidz.io' }
  s.source           = { :git => 'https://github.com/bugranalci/starbidzSDK.git', :tag => s.version.to_s }

  s.ios.deployment_target = '12.0'
  s.swift_version = '5.0'

  s.source_files = 'adapters/ios/StarbidCore/Sources/**/*.swift'

  s.frameworks = 'Foundation', 'UIKit'
end
