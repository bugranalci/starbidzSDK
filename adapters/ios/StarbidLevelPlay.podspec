Pod::Spec.new do |s|
  s.name             = 'StarbidLevelPlay'
  s.version          = '1.0.0'
  s.summary          = 'ironSource LevelPlay adapter for Starbidz SDK'
  s.description      = <<-DESC
    Starbidz LevelPlay adapter integrates Starbidz server-side bidding with ironSource LevelPlay mediation.
  DESC

  s.homepage         = 'https://github.com/bugranalci/starbidzSDK'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'Starbidz' => 'dev@starbidz.io' }
  s.source           = { :git => 'https://github.com/bugranalci/starbidzSDK.git', :tag => s.version.to_s }

  s.ios.deployment_target = '12.0'
  s.swift_version = '5.0'

  s.source_files = 'adapters/ios/StarbidLevelPlay/Sources/**/*.swift'

  s.dependency 'StarbidCore', '~> 1.0'
  s.dependency 'IronSourceSDK', '>= 7.0.0'

  s.frameworks = 'Foundation', 'UIKit'
end
