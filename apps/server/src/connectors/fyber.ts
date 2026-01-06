import { BaseConnector } from './base'
import type { BidRequest, BidResult } from '@starbidz/shared'

/**
 * Fyber (DT Exchange) Connector
 *
 * Client-side mediation - server only provides config.
 * Actual ad loading happens in the SDK using Fyber App ID + Spot ID.
 */

interface FyberConfig {
  demandSourceId: string
  appIdAndroid: string
  appIdIos: string
}

class FyberConnector extends BaseConnector {
  name = 'fyber'

  private configs: Map<string, FyberConfig> = new Map()

  /**
   * Load Fyber configurations from database
   */
  async loadConfigs(configs: FyberConfig[]): Promise<void> {
    for (const config of configs) {
      this.configs.set(config.demandSourceId, config)
    }
  }

  /**
   * Get bid from Fyber
   * In client-side mode, we return config info for SDK to use
   */
  async getBid(request: BidRequest): Promise<BidResult | null> {
    // For client-side mediation, return mock bid
    // Real bidding happens in SDK using DemandAdUnit's externalId (Spot ID)
    return this.getMockBid(request)
  }

  /**
   * Get config for SDK
   */
  getConfig(demandSourceId: string): FyberConfig | undefined {
    return this.configs.get(demandSourceId)
  }

  /**
   * Get App ID based on platform
   */
  getAppId(demandSourceId: string, platform: 'android' | 'ios'): string | null {
    const config = this.configs.get(demandSourceId)
    if (!config) return null
    return platform === 'ios' ? config.appIdIos : config.appIdAndroid
  }

  /**
   * Mock bid for testing
   */
  private getMockBid(request: BidRequest): BidResult {
    const width = request.width || 320
    const height = request.height || 50

    let price: number
    let content: string
    let type: 'html' | 'vast' = 'html'

    if (request.format === 'rewarded') {
      price = 8.0 + Math.random() * 4
      type = 'vast'
      content = this.generateMockVast('Fyber Rewarded', width, height)
    } else if (request.format === 'interstitial') {
      price = 4.0 + Math.random() * 3
      type = 'vast'
      content = this.generateMockVast('Fyber Interstitial', width, height)
    } else {
      price = 1.5 + Math.random() * 1.5
      content = `<div style="width:${width}px;height:${height}px;background:linear-gradient(135deg,#ff6b00,#ff9500);display:flex;align-items:center;justify-content:center;color:white;font-family:sans-serif;font-weight:bold;">Fyber Banner ${width}x${height}</div>`
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
  <Ad id="fyber_mock_${Date.now()}">
    <InLine>
      <AdSystem>Fyber Mock</AdSystem>
      <AdTitle>${title}</AdTitle>
      <Impression><![CDATA[https://starbidz.io/imp?source=fyber]]></Impression>
      <Creatives>
        <Creative>
          <Linear>
            <Duration>00:00:15</Duration>
            <TrackingEvents>
              <Tracking event="complete"><![CDATA[https://starbidz.io/complete?source=fyber]]></Tracking>
            </TrackingEvents>
            <MediaFiles>
              <MediaFile delivery="progressive" type="video/mp4" width="${width}" height="${height}">
                <![CDATA[https://example.com/fyber-video.mp4]]>
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

export const fyberConnector = new FyberConnector()
