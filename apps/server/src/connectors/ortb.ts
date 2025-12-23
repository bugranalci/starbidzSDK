import { BaseConnector } from './base'
import type { BidRequest, BidResult } from '@starbidz/shared'
import { safeDecrypt } from '../lib/crypto'

// OpenRTB 2.5 Request/Response Types
interface OpenRTBRequest {
  id: string
  imp: OpenRTBImpression[]
  site?: OpenRTBSite
  app?: OpenRTBApp
  device: OpenRTBDevice
  user?: OpenRTBUser
  test?: number
  at?: number // Auction type: 1 = First Price, 2 = Second Price
  tmax?: number // Maximum time in ms for bid response
  cur?: string[]
}

interface OpenRTBImpression {
  id: string
  banner?: OpenRTBBanner
  video?: OpenRTBVideo
  bidfloor?: number
  bidfloorcur?: string
  secure?: number
}

interface OpenRTBBanner {
  w: number
  h: number
  format?: Array<{ w: number; h: number }>
  pos?: number
}

interface OpenRTBVideo {
  mimes: string[]
  minduration?: number
  maxduration?: number
  protocols?: number[]
  w?: number
  h?: number
  linearity?: number
  placement?: number
}

interface OpenRTBSite {
  id?: string
  name?: string
  domain?: string
  page?: string
}

interface OpenRTBApp {
  id?: string
  name?: string
  bundle?: string
  storeurl?: string
  ver?: string
}

interface OpenRTBDevice {
  ua?: string
  ip?: string
  geo?: OpenRTBGeo
  dnt?: number
  lmt?: number
  devicetype?: number
  make?: string
  model?: string
  os?: string
  osv?: string
  ifa?: string
  connectiontype?: number
}

interface OpenRTBGeo {
  lat?: number
  lon?: number
  country?: string
  region?: string
  city?: string
}

interface OpenRTBUser {
  id?: string
  consent?: string
}

interface OpenRTBResponse {
  id: string
  seatbid?: OpenRTBSeatBid[]
  bidid?: string
  cur?: string
  nbr?: number // No-bid reason
}

interface OpenRTBSeatBid {
  bid: OpenRTBBid[]
  seat?: string
}

interface OpenRTBBid {
  id: string
  impid: string
  price: number
  adid?: string
  nurl?: string
  burl?: string
  adm?: string // Creative markup (HTML/VAST)
  adomain?: string[]
  crid?: string
  w?: number
  h?: number
}

// DSP Configuration
interface DSPConfig {
  id: string
  name: string
  endpoint: string
  seatId?: string
  authHeader?: string
  authValue?: string // Decrypted at runtime
  timeout: number
  enabled: boolean
  bidFloors: {
    banner: number
    interstitial: number
    rewarded: number
  }
}

// Database config format
interface OrtbDbConfig {
  id: string
  name: string
  endpoint: string
  seatId: string | null
  authHeader: string | null
  authValue: string | null // Encrypted
  timeout: number
  bannerEnabled: boolean
  bannerFloor: number
  interstitialEnabled: boolean
  interstitialFloor: number
  rewardedEnabled: boolean
  rewardedFloor: number
}

class OrtbConnector extends BaseConnector {
  name = 'ortb'

  private dspConfigs: DSPConfig[] = []
  private readonly TIMEOUT_MS = 200

  constructor() {
    super()
    this.loadFromEnvironment()
  }

  /**
   * Load DSP configs from environment variables (fallback)
   */
  private loadFromEnvironment() {
    const dspEndpoint = process.env.ORTB_DSP_ENDPOINT
    if (dspEndpoint) {
      this.dspConfigs.push({
        id: 'env_dsp',
        name: 'Environment DSP',
        endpoint: dspEndpoint,
        seatId: process.env.ORTB_DSP_SEAT_ID,
        authHeader: process.env.ORTB_DSP_AUTH_HEADER,
        authValue: process.env.ORTB_DSP_AUTH_VALUE,
        timeout: parseInt(process.env.ORTB_DSP_TIMEOUT || '150'),
        enabled: true,
        bidFloors: {
          banner: parseFloat(process.env.ORTB_FLOOR_BANNER || '1.0'),
          interstitial: parseFloat(process.env.ORTB_FLOOR_INTERSTITIAL || '5.0'),
          rewarded: parseFloat(process.env.ORTB_FLOOR_REWARDED || '8.0')
        }
      })
    }
  }

  /**
   * Load ORTB DSP configurations from database
   */
  async loadConfigs(configs: OrtbDbConfig[]): Promise<void> {
    // Clear existing database configs (keep env configs)
    this.dspConfigs = this.dspConfigs.filter(c => c.id === 'env_dsp')

    for (const config of configs) {
      // Decrypt auth value if present
      const authValue = config.authValue ? safeDecrypt(config.authValue) : undefined

      this.dspConfigs.push({
        id: config.id,
        name: config.name,
        endpoint: config.endpoint,
        seatId: config.seatId || undefined,
        authHeader: config.authHeader || undefined,
        authValue: authValue || undefined,
        timeout: config.timeout || this.TIMEOUT_MS,
        enabled: config.bannerEnabled || config.interstitialEnabled || config.rewardedEnabled,
        bidFloors: {
          banner: config.bannerFloor,
          interstitial: config.interstitialFloor,
          rewarded: config.rewardedFloor
        }
      })
    }
  }

  async getBid(request: BidRequest): Promise<BidResult | null> {
    // Test mode: return mock bid
    if (request.test) {
      return this.getMockBid(request)
    }

    // No DSPs configured
    if (this.dspConfigs.length === 0) {
      return null
    }

    // Query all enabled DSPs in parallel
    const bidPromises = this.dspConfigs
      .filter(dsp => dsp.enabled)
      .map(dsp => this.queryDSP(dsp, request))

    const results = await Promise.allSettled(bidPromises)

    // Collect successful bids
    const bids = results
      .filter((r): r is PromiseFulfilledResult<BidResult | null> =>
        r.status === 'fulfilled' && r.value !== null
      )
      .map(r => r.value!)
      .filter(bid => bid.price > 0)

    if (bids.length === 0) {
      return null
    }

    // Return highest bid
    bids.sort((a, b) => b.price - a.price)
    return bids[0]
  }

  private async queryDSP(dsp: DSPConfig, request: BidRequest): Promise<BidResult | null> {
    const ortbRequest = this.buildOpenRTBRequest(request, dsp)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), dsp.timeout)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-openrtb-version': '2.5'
      }

      if (dsp.authHeader && dsp.authValue) {
        headers[dsp.authHeader] = dsp.authValue
      }

      const response = await fetch(dsp.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(ortbRequest),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return null
      }

      const ortbResponse: OpenRTBResponse = await response.json()
      return this.parseOpenRTBResponse(ortbResponse, request, dsp)
    } catch (error) {
      // Timeout or network error - return null (no bid)
      return null
    }
  }

  private buildOpenRTBRequest(request: BidRequest, dsp: DSPConfig): OpenRTBRequest {
    const requestId = this.generateBidId()
    const impressionId = `imp_${Date.now()}`

    // Determine bid floor based on format
    let bidFloor = dsp.bidFloors.banner
    if (request.format === 'interstitial') {
      bidFloor = dsp.bidFloors.interstitial
    } else if (request.format === 'rewarded') {
      bidFloor = dsp.bidFloors.rewarded
    }

    const ortbRequest: OpenRTBRequest = {
      id: requestId,
      imp: [this.buildImpression(request, impressionId, bidFloor)],
      app: {
        id: request.app_key,
        name: request.app?.name,
        bundle: request.app?.bundle,
        ver: request.app?.version
      },
      device: this.buildDevice(request),
      at: 1, // First-price auction
      tmax: dsp.timeout,
      cur: ['USD']
    }

    if (request.user?.consent) {
      ortbRequest.user = {
        consent: request.user.consent
      }
    }

    return ortbRequest
  }

  private buildImpression(request: BidRequest, id: string, bidFloor: number): OpenRTBImpression {
    const imp: OpenRTBImpression = {
      id,
      bidfloor: bidFloor,
      bidfloorcur: 'USD',
      secure: 1
    }

    if (request.format === 'banner') {
      imp.banner = {
        w: request.width || 320,
        h: request.height || 50,
        pos: 0 // Unknown position
      }
    } else if (request.format === 'interstitial') {
      // Interstitial can be banner or video
      imp.banner = {
        w: 320,
        h: 480,
        pos: 7 // Fullscreen
      }
      imp.video = {
        mimes: ['video/mp4', 'video/webm'],
        minduration: 5,
        maxduration: 30,
        protocols: [2, 3, 5, 6], // VAST 2.0, 3.0
        w: 320,
        h: 480,
        linearity: 1,
        placement: 5 // Interstitial
      }
    } else if (request.format === 'rewarded') {
      imp.video = {
        mimes: ['video/mp4', 'video/webm'],
        minduration: 15,
        maxduration: 30,
        protocols: [2, 3, 5, 6],
        w: 320,
        h: 480,
        linearity: 1,
        placement: 5
      }
    }

    return imp
  }

  private buildDevice(request: BidRequest): OpenRTBDevice {
    const device: OpenRTBDevice = {
      os: request.device?.os,
      osv: request.device?.osv,
      make: request.device?.make,
      model: request.device?.model,
      ifa: request.device?.ifa,
      lmt: request.device?.lmt ? 1 : 0,
      devicetype: request.device?.os === 'ios' ? 1 : 4 // 1=Mobile/Tablet, 4=Phone
    }

    // Map connection type
    if (request.device?.connectionType) {
      const connType = request.device.connectionType.toLowerCase()
      if (connType === 'wifi') {
        device.connectiontype = 2
      } else if (connType === 'cellular' || connType === '4g' || connType === '5g') {
        device.connectiontype = 4
      } else if (connType === '3g') {
        device.connectiontype = 3
      }
    }

    if (request.geo) {
      device.geo = {
        country: request.geo.country,
        region: request.geo.region,
        city: request.geo.city
      }
    }

    return device
  }

  private parseOpenRTBResponse(
    response: OpenRTBResponse,
    request: BidRequest,
    dsp: DSPConfig
  ): BidResult | null {
    // Check for no-bid
    if (!response.seatbid || response.seatbid.length === 0) {
      return null
    }

    // Get the first (highest) bid from all seats
    const allBids: OpenRTBBid[] = []
    for (const seatbid of response.seatbid) {
      allBids.push(...seatbid.bid)
    }

    if (allBids.length === 0) {
      return null
    }

    // Sort by price and get highest
    allBids.sort((a, b) => b.price - a.price)
    const winningBid = allBids[0]

    // Determine creative type
    let creativeType: 'html' | 'vast' | 'image' = 'html'
    let creativeContent = winningBid.adm || ''

    if (creativeContent.includes('VAST') || creativeContent.includes('<?xml')) {
      creativeType = 'vast'
    } else if (
      creativeContent.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)/i) ||
      creativeContent.startsWith('data:image/')
    ) {
      creativeType = 'image'
    }

    return {
      bidId: winningBid.id,
      price: winningBid.price,
      source: `${this.name}_${dsp.id}`,
      creative: {
        type: creativeType,
        content: creativeContent,
        width: winningBid.w || request.width,
        height: winningBid.h || request.height
      },
      nurl: winningBid.nurl,
      burl: winningBid.burl
    }
  }

  private getMockBid(request: BidRequest): BidResult {
    const width = request.width || 320
    const height = request.height || 50

    let content: string
    let price: number

    if (request.format === 'rewarded') {
      price = 8.0 + Math.random() * 4 // $8-12 CPM
      content = `
        <div style="width:100%;height:100%;background:linear-gradient(135deg,#9c27b0,#673ab7);
          display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:sans-serif;">
          <div style="font-size:48px;margin-bottom:20px;">🎁</div>
          <div style="font-size:24px;font-weight:bold;">OpenRTB Rewarded Ad</div>
          <div style="margin-top:10px;opacity:0.8;">Watch to earn rewards</div>
        </div>
      `
    } else if (request.format === 'interstitial') {
      price = 5.0 + Math.random() * 3 // $5-8 CPM
      content = `
        <div style="width:100%;height:100%;background:linear-gradient(135deg,#673ab7,#3f51b5);
          display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:sans-serif;">
          <div style="font-size:36px;font-weight:bold;">OpenRTB Interstitial</div>
          <div style="margin-top:10px;font-size:18px;opacity:0.8;">Full-screen advertisement</div>
        </div>
      `
    } else {
      price = 2.0 + Math.random() * 2 // $2-4 CPM
      content = `
        <div style="width:${width}px;height:${height}px;background:linear-gradient(90deg,#9c27b0,#673ab7);
          display:flex;align-items:center;justify-content:center;color:white;font-family:sans-serif;font-weight:bold;">
          OpenRTB Banner ${width}x${height}
        </div>
      `
    }

    return {
      bidId: this.generateBidId(),
      price,
      source: this.name,
      creative: {
        type: 'html',
        content,
        width,
        height
      }
    }
  }

  // Method to add DSP at runtime (for database-loaded configs)
  addDSP(config: DSPConfig) {
    this.dspConfigs.push(config)
  }

  // Method to remove DSP
  removeDSP(id: string) {
    this.dspConfigs = this.dspConfigs.filter(d => d.id !== id)
  }

  // Method to get current DSP configs
  getDSPs(): DSPConfig[] {
    return [...this.dspConfigs]
  }
}

export const ortbConnector = new OrtbConnector()
