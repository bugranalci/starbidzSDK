import { BaseConnector } from './base'
import type { BidRequest, BidResult } from '@starbidz/shared'

/**
 * Unity Ads Connector
 *
 * Client-side mediation - server only provides config.
 * Actual ad loading happens in the SDK using Unity Game ID + Placement ID.
 */

interface UnityConfig {
  demandSourceId: string
  gameIdAndroid: string
  gameIdIos: string
}

class UnityConnector extends BaseConnector {
  name = 'unity'

  private configs: Map<string, UnityConfig> = new Map()

  /**
   * Load Unity configurations from database
   */
  async loadConfigs(configs: UnityConfig[]): Promise<void> {
    for (const config of configs) {
      this.configs.set(config.demandSourceId, config)
    }
  }

  /**
   * Get bid from Unity
   * In client-side mode, we return config info for SDK to use
   */
  async getBid(request: BidRequest): Promise<BidResult | null> {
    // For client-side mediation, return mock bid
    // Real bidding happens in SDK using DemandAdUnit's externalId (Placement ID)
    return this.getMockBid(request)
  }

  /**
   * Get config for SDK
   */
  getConfig(demandSourceId: string): UnityConfig | undefined {
    return this.configs.get(demandSourceId)
  }

  /**
   * Get Game ID based on platform
   */
  getGameId(demandSourceId: string, platform: 'android' | 'ios'): string | null {
    const config = this.configs.get(demandSourceId)
    if (!config) return null
    return platform === 'ios' ? config.gameIdIos : config.gameIdAndroid
  }

  /**
   * Mock bid for testing
   */
  private getMockBid(request: BidRequest): BidResult {
    const width = request.width || 320
    const height = request.height || 480

    let price: number
    let content: string
    let type: 'html' | 'vast' = 'html'

    if (request.format === 'rewarded') {
      price = 12.0 + Math.random() * 6
      type = 'vast'
      content = this.generateMockVast('Unity Rewarded', width, height)
    } else if (request.format === 'interstitial') {
      price = 6.0 + Math.random() * 4
      type = 'vast'
      content = this.generateMockVast('Unity Interstitial', width, height)
    } else {
      price = 1.8 + Math.random() * 2
      content = `<div style="width:${width}px;height:${height}px;background:linear-gradient(135deg,#00d9ff,#0066ff);display:flex;align-items:center;justify-content:center;color:white;font-family:sans-serif;font-weight:bold;">Unity Banner ${width}x${height}</div>`
    }

    return {
      bidId: this.generateBidId(),
      price,
      source: this.name,
      creative: {
        type,
        content,
        width,
        height,
      },
    }
  }

  /**
   * Generate mock VAST XML
   */
  private generateMockVast(title: string, width: number, height: number): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="3.0">
  <Ad id="unity_mock_${Date.now()}">
    <InLine>
      <AdSystem>Unity Ads Mock</AdSystem>
      <AdTitle>${title}</AdTitle>
      <Impression><![CDATA[https://starbidz.io/imp?source=unity]]></Impression>
      <Creatives>
        <Creative>
          <Linear>
            <Duration>00:00:30</Duration>
            <TrackingEvents>
              <Tracking event="complete"><![CDATA[https://starbidz.io/complete?source=unity]]></Tracking>
            </TrackingEvents>
            <MediaFiles>
              <MediaFile delivery="progressive" type="video/mp4" width="${width}" height="${height}">
                <![CDATA[https://example.com/unity-video.mp4]]>
              </MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
    </InLine>
  </Ad>
</VAST>`
  }
}

export const unityConnector = new UnityConnector()
