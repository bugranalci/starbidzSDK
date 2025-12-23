import { BaseConnector } from './base'
import type { BidRequest, BidResult } from '@starbidz/shared'
import { safeDecryptJson } from '../lib/crypto'

/**
 * Google Ad Manager (GAM/MCM) Connector
 *
 * Integrates with Google Ad Manager for programmatic demand.
 * Uses the Ad Manager API for real-time bidding.
 *
 * Documentation: https://developers.google.com/ad-manager/api
 */

interface GamServiceAccount {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
}

interface GamConfig {
  networkCode: string
  credentials: string | null // Encrypted JSON
}

interface GamAdUnit {
  id: string
  name: string
  adUnitCode: string
}

interface AccessToken {
  token: string
  expiresAt: number
}

class GamConnector extends BaseConnector {
  name = 'gam'

  private configs: Map<string, GamConfig> = new Map()
  private accessTokens: Map<string, AccessToken> = new Map()

  /**
   * Load GAM configurations from database
   */
  async loadConfigs(configs: GamConfig[]): Promise<void> {
    for (const config of configs) {
      this.configs.set(config.networkCode, config)
    }
  }

  /**
   * Get OAuth2 access token for GAM API
   */
  private async getAccessToken(config: GamConfig): Promise<string | null> {
    if (!config.credentials) return null

    // Check cached token
    const cached = this.accessTokens.get(config.networkCode)
    if (cached && cached.expiresAt > Date.now() + 60000) {
      return cached.token
    }

    // Decrypt service account credentials
    const credentials = safeDecryptJson<GamServiceAccount>(config.credentials)
    if (!credentials || !credentials.private_key) {
      console.error('GAM: Invalid service account credentials')
      return null
    }

    try {
      // Create JWT for service account authentication
      const jwt = await this.createServiceAccountJwt(credentials)

      // Exchange JWT for access token
      const response = await fetch(credentials.token_uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      })

      if (!response.ok) {
        console.error('GAM: Failed to get access token:', await response.text())
        return null
      }

      const data = await response.json()

      // Cache token
      this.accessTokens.set(config.networkCode, {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
      })

      return data.access_token
    } catch (error) {
      console.error('GAM: Token exchange error:', error)
      return null
    }
  }

  /**
   * Create JWT for service account authentication
   */
  private async createServiceAccountJwt(credentials: GamServiceAccount): Promise<string> {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/dfp',
      aud: credentials.token_uri,
      iat: now,
      exp: now + 3600,
    }

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload))
    const signatureInput = `${encodedHeader}.${encodedPayload}`

    // Sign with RSA-SHA256
    const signature = await this.signWithRsa(signatureInput, credentials.private_key)

    return `${signatureInput}.${signature}`
  }

  /**
   * Base64URL encode
   */
  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * Sign data with RSA private key
   */
  private async signWithRsa(data: string, privateKey: string): Promise<string> {
    const crypto = await import('crypto')
    const sign = crypto.createSign('RSA-SHA256')
    sign.update(data)
    const signature = sign.sign(privateKey, 'base64')
    return signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  /**
   * Get bid from GAM
   */
  async getBid(request: BidRequest): Promise<BidResult | null> {
    // Test mode - return mock bid
    if (request.test) {
      return this.getMockBid(request)
    }

    // Get first available config (in production, would select based on app)
    const config = this.configs.values().next().value as GamConfig | undefined
    if (!config) {
      return null
    }

    const accessToken = await this.getAccessToken(config)
    if (!accessToken) {
      return null
    }

    try {
      // Build GAM ad request
      const adRequest = this.buildGamAdRequest(request, config)

      // Call GAM API
      const response = await fetch(
        `https://securepubads.g.doubleclick.net/gampad/ads?${adRequest}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        return null
      }

      // Parse GAM response
      return this.parseGamResponse(await response.text(), request)
    } catch (error) {
      console.error('GAM bid error:', error)
      return null
    }
  }

  /**
   * Build GAM ad request parameters
   */
  private buildGamAdRequest(request: BidRequest, config: GamConfig): string {
    const params = new URLSearchParams()

    // Network code
    params.set('iu', `/${config.networkCode}/starbidz_${request.placement_id}`)

    // Ad size
    if (request.format === 'banner') {
      params.set('sz', `${request.width || 320}x${request.height || 50}`)
    } else if (request.format === 'interstitial') {
      params.set('sz', '320x480|480x320')
    } else if (request.format === 'rewarded') {
      params.set('sz', '320x480')
      params.set('vpos', 'preroll')
    }

    // Targeting
    params.set('cust_params', this.buildCustomParams(request))

    // Output format
    params.set('output', 'vast')
    params.set('impl', 's')
    params.set('gdfp_req', '1')
    params.set('env', 'vp')
    params.set('unviewed_position_start', '1')

    // App info
    params.set('url', request.app?.bundle || '')
    params.set('an', request.app?.name || '')

    // Device info
    if (request.device?.ifa) {
      params.set('rdid', request.device.ifa)
      params.set('idtype', request.device.os === 'ios' ? 'idfa' : 'adid')
      params.set('is_lat', request.device.lmt ? '1' : '0')
    }

    return params.toString()
  }

  /**
   * Build custom targeting parameters
   */
  private buildCustomParams(request: BidRequest): string {
    const params: string[] = []

    if (request.geo?.country) {
      params.push(`country=${request.geo.country}`)
    }
    if (request.device?.os) {
      params.push(`os=${request.device.os}`)
    }
    if (request.format) {
      params.push(`format=${request.format}`)
    }

    return encodeURIComponent(params.join('&'))
  }

  /**
   * Parse GAM VAST response
   */
  private parseGamResponse(vastXml: string, request: BidRequest): BidResult | null {
    // Check for no-ad response
    if (!vastXml || vastXml.includes('VAST version="2.0"><Error>') || vastXml.includes('<Error><![CDATA[')) {
      return null
    }

    // Extract price from extensions or use floor price
    const priceMatch = vastXml.match(/Price>([0-9.]+)<\/Price/i)
    const price = priceMatch ? parseFloat(priceMatch[1]) : this.getFloorPrice(request.format)

    // Extract creative URL
    const mediaFileMatch = vastXml.match(/MediaFile[^>]*>([^<]+)<\/MediaFile/i)
    const creativeUrl = mediaFileMatch ? mediaFileMatch[1].trim() : ''

    return {
      bidId: this.generateBidId(),
      price,
      source: this.name,
      creative: {
        type: 'vast',
        content: vastXml,
        width: request.width,
        height: request.height,
      },
    }
  }

  /**
   * Get floor price by format
   */
  private getFloorPrice(format?: string): number {
    switch (format) {
      case 'rewarded':
        return 10.0
      case 'interstitial':
        return 5.0
      default:
        return 2.0
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
