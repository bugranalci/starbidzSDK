import { BaseConnector } from './base'
import type { BidRequest, BidResult } from '@starbidz/shared'
import { safeDecrypt } from '../lib/crypto'
import { createHmac } from 'crypto'

/**
 * Fyber (DT Exchange) Connector
 *
 * Integrates with Fyber/Digital Turbine Exchange for programmatic demand.
 * Documentation: https://developer.digitalturbine.com/
 */

interface FyberConfig {
  appId: string
  securityToken: string // Encrypted
}

interface FyberBidRequest {
  appId: string
  deviceId: string
  ip: string
  timestamp: number
  signature: string
  // Ad request params
  format: string
  placementId: string
  width: number
  height: number
  os: string
  osVersion: string
  deviceModel: string
  connectionType: string
  country?: string
}

interface FyberBidResponse {
  code: number
  message: string
  ads?: Array<{
    ad_id: string
    ad_format: string
    payout: number
    currency: string
    creative_type: string
    creative_url?: string
    click_url?: string
    impression_url?: string
    vast_xml?: string
  }>
}

class FyberConnector extends BaseConnector {
  name = 'fyber'

  private configs: Map<string, FyberConfig> = new Map()
  private readonly API_BASE = 'https://api.fyber.com/feed/v1/offers'
  private readonly TIMEOUT_MS = 200

  /**
   * Load Fyber configurations from database
   */
  async loadConfigs(configs: FyberConfig[]): Promise<void> {
    for (const config of configs) {
      this.configs.set(config.appId, config)
    }
  }

  /**
   * Get bid from Fyber
   */
  async getBid(request: BidRequest): Promise<BidResult | null> {
    // Test mode - return mock bid
    if (request.test) {
      return this.getMockBid(request)
    }

    const config = this.configs.values().next().value as FyberConfig | undefined
    if (!config) {
      return null
    }

    try {
      const bidRequest = this.buildBidRequest(request, config)
      const response = await this.sendBidRequest(bidRequest)

      if (!response || response.code !== 200 || !response.ads?.length) {
        return null
      }

      return this.parseBidResponse(response, request)
    } catch (error) {
      console.error('Fyber bid error:', error)
      return null
    }
  }

  /**
   * Build Fyber bid request with signature
   */
  private buildBidRequest(request: BidRequest, config: FyberConfig): FyberBidRequest {
    const timestamp = Math.floor(Date.now() / 1000)

    // Decrypt security token
    const securityToken = safeDecrypt(config.securityToken) || ''

    // Build signature
    const signatureParams = [
      `appid=${config.appId}`,
      `device_id=${request.device?.ifa || ''}`,
      `format=${this.mapFormat(request.format)}`,
      `timestamp=${timestamp}`,
    ].sort().join('&')

    const signature = this.generateSignature(signatureParams, securityToken)

    return {
      appId: config.appId,
      deviceId: request.device?.ifa || '',
      ip: '', // Would be filled from request headers
      timestamp,
      signature,
      format: this.mapFormat(request.format),
      placementId: request.placement_id,
      width: request.width || 320,
      height: request.height || 50,
      os: request.device?.os || 'android',
      osVersion: request.device?.osv || '',
      deviceModel: request.device?.model || '',
      connectionType: request.device?.connectionType || 'wifi',
      country: request.geo?.country,
    }
  }

  /**
   * Generate HMAC-SHA1 signature
   */
  private generateSignature(params: string, securityToken: string): string {
    const hmac = createHmac('sha1', securityToken)
    hmac.update(params)
    return hmac.digest('hex')
  }

  /**
   * Map ad format to Fyber format
   */
  private mapFormat(format?: string): string {
    switch (format) {
      case 'rewarded':
        return 'video'
      case 'interstitial':
        return 'interstitial'
      default:
        return 'banner'
    }
  }

  /**
   * Send bid request to Fyber
   */
  private async sendBidRequest(bidRequest: FyberBidRequest): Promise<FyberBidResponse | null> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS)

    try {
      const params = new URLSearchParams({
        appid: bidRequest.appId,
        device_id: bidRequest.deviceId,
        format: bidRequest.format,
        timestamp: bidRequest.timestamp.toString(),
        hashkey: bidRequest.signature,
        os: bidRequest.os,
        os_version: bidRequest.osVersion,
        device: bidRequest.deviceModel,
        connection_type: bidRequest.connectionType,
        ad_width: bidRequest.width.toString(),
        ad_height: bidRequest.height.toString(),
      })

      if (bidRequest.country) {
        params.set('country', bidRequest.country)
      }

      const response = await fetch(`${this.API_BASE}?${params}`, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        console.warn('Fyber bid request timed out')
      }
      return null
    }
  }

  /**
   * Parse Fyber bid response
   */
  private parseBidResponse(response: FyberBidResponse, request: BidRequest): BidResult | null {
    if (!response.ads?.length) return null

    // Get highest paying ad
    const ads = [...response.ads].sort((a, b) => b.payout - a.payout)
    const bestAd = ads[0]

    let creative: BidResult['creative']

    if (bestAd.vast_xml) {
      creative = {
        type: 'vast',
        content: bestAd.vast_xml,
        width: request.width,
        height: request.height,
      }
    } else if (bestAd.creative_url) {
      // Image or HTML creative
      creative = {
        type: bestAd.creative_type === 'image' ? 'image' : 'html',
        content: bestAd.creative_url,
        width: request.width,
        height: request.height,
      }
    } else {
      return null
    }

    return {
      bidId: bestAd.ad_id,
      price: bestAd.payout,
      source: this.name,
      creative,
      nurl: bestAd.impression_url,
    }
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
