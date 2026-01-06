import { BaseConnector } from './base'
import type { BidRequest, BidResult } from '@starbidz/shared'

/**
 * Google Ad Manager (GAM) Connector
 *
 * Client-side mediation - server only provides config.
 * Actual ad loading happens in the SDK using GAM Ad Unit paths.
 */

interface GamConfig {
  demandSourceId: string
  networkCode: string | null
}

class GamConnector extends BaseConnector {
  name = 'gam'

  private configs: Map<string, GamConfig> = new Map()

  /**
   * Load GAM configurations from database
   */
  async loadConfigs(configs: GamConfig[]): Promise<void> {
    for (const config of configs) {
      this.configs.set(config.demandSourceId, config)
    }
  }

  /**
   * Get bid from GAM
   * In client-side mode, we return config info for SDK to use
   */
  async getBid(request: BidRequest): Promise<BidResult | null> {
    // For client-side mediation, return mock bid
    // Real bidding happens in SDK using DemandAdUnit's externalId (GAM path)
    return this.getMockBid(request)
  }

  /**
   * Get config for SDK
   */
  getConfig(demandSourceId: string): GamConfig | undefined {
    return this.configs.get(demandSourceId)
  }

  /**
   * Mock bid for testing
   */
  private getMockBid(request: BidRequest): BidResult {
    const width = request.width || 320
    const height = request.height || 50

    let price: number
    let content: string

    if (request.format === 'rewarded') {
      price = 10.0 + Math.random() * 5
      content = this.generateMockVast('GAM Rewarded', width, height)
    } else if (request.format === 'interstitial') {
      price = 5.0 + Math.random() * 3
      content = this.generateMockVast('GAM Interstitial', width, height)
    } else {
      price = 2.0 + Math.random() * 2
      content = `<div style="width:${width}px;height:${height}px;background:linear-gradient(135deg,#4285f4,#34a853);display:flex;align-items:center;justify-content:center;color:white;font-family:sans-serif;font-weight:bold;">GAM Banner ${width}x${height}</div>`
    }

    return {
      bidId: this.generateBidId(),
      price,
      source: this.name,
      creative: {
        type: request.format === 'banner' ? 'html' : 'vast',
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
  <Ad id="gam_mock_${Date.now()}">
    <InLine>
      <AdSystem>GAM Mock</AdSystem>
      <AdTitle>${title}</AdTitle>
      <Impression><![CDATA[https://starbidz.io/imp?source=gam]]></Impression>
      <Creatives>
        <Creative>
          <Linear>
            <Duration>00:00:15</Duration>
            <MediaFiles>
              <MediaFile delivery="progressive" type="video/mp4" width="${width}" height="${height}">
                <![CDATA[https://example.com/video.mp4]]>
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

export const gamConnector = new GamConnector()
