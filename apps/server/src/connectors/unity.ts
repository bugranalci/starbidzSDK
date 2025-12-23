import { BaseConnector } from './base'
import type { BidRequest, BidResult } from '@starbidz/shared'
import { safeDecrypt } from '../lib/crypto'

/**
 * Unity Ads Connector
 *
 * Integrates with Unity Ads for server-to-server bidding.
 * Documentation: https://docs.unity.com/ads/en-us/manual/ServerToServerIntegration
 */

interface UnityConfig {
  organizationId: string
  gameIdAndroid: string
  gameIdIos: string
  apiKey: string | null // Encrypted
}

interface UnityBidRequest {
  bundleId: string
  gameId: string
  placementId: string
  deviceId: string
  platform: 'android' | 'ios'
  osVersion: string
  deviceModel: string
  connectionType: string
  width: number
  height: number
  token?: string
}

interface UnityBidResponse {
  success: boolean
  bid?: {
    bidId: string
    price: number
    currency: string
    creativeId: string
    vastUrl?: string
    trackingUrls?: {
      impression: string[]
      click: string[]
      complete: string[]
    }
  }
  error?: string
}

class UnityConnector extends BaseConnector {
  name = 'unity'

  private configs: Map<string, UnityConfig> = new Map()
  private readonly API_BASE = 'https://auction.unityads.unity3d.com/v6/games'
  private readonly TIMEOUT_MS = 200

  /**
   * Load Unity configurations from database
   */
  async loadConfigs(configs: UnityConfig[]): Promise<void> {
    for (const config of configs) {
      this.configs.set(config.organizationId, config)
    }
  }

  /**
   * Get bid from Unity Ads
   */
  async getBid(request: BidRequest): Promise<BidResult | null> {
    // Test mode - return mock bid
    if (request.test) {
      return this.getMockBid(request)
    }

    const config = this.configs.values().next().value as UnityConfig | undefined
    if (!config) {
      return null
    }

    // Get game ID based on platform
    const gameId = request.device?.os === 'ios'
      ? config.gameIdIos
      : config.gameIdAndroid

    if (!gameId) {
      return null
    }

    try {
      const bidRequest = this.buildBidRequest(request, config, gameId)
      const response = await this.sendBidRequest(bidRequest, config)

      if (!response || !response.success || !response.bid) {
        return null
      }

      return this.parseBidResponse(response, request)
    } catch (error) {
      console.error('Unity bid error:', error)
      return null
    }
  }

  /**
   * Build Unity bid request
   */
  private buildBidRequest(
    request: BidRequest,
    config: UnityConfig,
    gameId: string
  ): UnityBidRequest {
    return {
      bundleId: request.app?.bundle || '',
      gameId,
      placementId: `starbidz_${request.placement_id}`,
      deviceId: request.device?.ifa || '',
      platform: request.device?.os === 'ios' ? 'ios' : 'android',
      osVersion: request.device?.osv || '',
      deviceModel: request.device?.model || '',
      connectionType: request.device?.connectionType || 'wifi',
      width: request.width || 320,
      height: request.height || 480,
    }
  }

  /**
   * Send bid request to Unity
   */
  private async sendBidRequest(
    bidRequest: UnityBidRequest,
    config: UnityConfig
  ): Promise<UnityBidResponse | null> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Add API key if available
      if (config.apiKey) {
        const apiKey = safeDecrypt(config.apiKey)
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`
        }
      }

      const response = await fetch(
        `${this.API_BASE}/${bidRequest.gameId}/requests`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            bundleId: bidRequest.bundleId,
            placementId: bidRequest.placementId,
            deviceInfo: {
              advertisingId: bidRequest.deviceId,
              platform: bidRequest.platform,
              osVersion: bidRequest.osVersion,
              deviceModel: bidRequest.deviceModel,
              connectionType: bidRequest.connectionType,
            },
            adFormat: {
              width: bidRequest.width,
              height: bidRequest.height,
            },
          }),
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        console.warn('Unity bid request timed out')
      }
      return null
    }
  }

  /**
   * Parse Unity bid response
   */
  private parseBidResponse(
    response: UnityBidResponse,
    request: BidRequest
  ): BidResult | null {
    if (!response.bid) return null

    const { bid } = response

    // Generate VAST wrapper if URL provided
    let creative: BidResult['creative']

    if (bid.vastUrl) {
      creative = {
        type: 'vast',
        content: this.generateVastWrapper(bid.vastUrl, bid.trackingUrls),
        width: request.width,
        height: request.height,
      }
    } else {
      // Fallback to HTML creative
      creative = {
        type: 'html',
        content: this.generateHtmlCreative(request),
        width: request.width,
        height: request.height,
      }
    }

    return {
      bidId: bid.bidId,
      price: bid.price,
      source: this.name,
      creative,
      nurl: bid.trackingUrls?.impression?.[0],
    }
  }

  /**
   * Generate VAST wrapper for Unity video
   */
  private generateVastWrapper(
    vastUrl: string,
    trackingUrls?: UnityBidResponse['bid']['trackingUrls']
  ): string {
    const impressionTags = trackingUrls?.impression
      ?.map(url => `<Impression><![CDATA[${url}]]></Impression>`)
      .join('\n      ') || ''

    return `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="3.0">
  <Ad id="unity_${Date.now()}">
    <Wrapper>
      <AdSystem>Unity Ads</AdSystem>
      ${impressionTags}
      <VASTAdTagURI><![CDATA[${vastUrl}]]></VASTAdTagURI>
    </Wrapper>
  </Ad>
</VAST>`
  }

  /**
   * Generate HTML creative fallback
   */
  private generateHtmlCreative(request: BidRequest): string {
    const width = request.width || 320
    const height = request.height || 480

    return `<div style="width:${width}px;height:${height}px;background:linear-gradient(135deg,#00d9ff,#0066ff);display:flex;align-items:center;justify-content:center;color:white;font-family:sans-serif;font-weight:bold;">Unity Ad</div>`
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
