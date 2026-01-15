import { BaseConnector } from './base'
import type { BidRequest, BidResult } from '@starbidz/shared'

/**
 * Fyber (DT Exchange) Connector
 *
 * Client-side mediation - server provides ad unit config based on auction.
 * SDK uses the returned Fyber Spot ID to load ads via Fyber SDK.
 */

interface FyberAdUnit {
  id: string
  name: string
  externalId: string  // Fyber Spot ID (Placement ID)
  format: string      // BANNER, INTERSTITIAL, REWARDED
  bidFloor: number    // Floor price = bid price
  platform: string    // ANDROID, IOS, BOTH
  width: number | null
  height: number | null
  isActive: boolean
}

interface FyberConfig {
  demandSourceId: string
  appIdAndroid: string
  appIdIos: string
  adUnits: FyberAdUnit[]
}

class FyberConnector extends BaseConnector {
  name = 'fyber'

  private configs: Map<string, FyberConfig> = new Map()
  // Flat list of all ad units for quick lookup
  private allAdUnits: FyberAdUnit[] = []

  /**
   * Load Fyber configurations from database
   */
  async loadConfigs(configs: FyberConfig[]): Promise<void> {
    this.configs.clear()
    this.allAdUnits = []

    for (const config of configs) {
      this.configs.set(config.demandSourceId, config)
      // Add all ad units to flat list
      this.allAdUnits.push(...config.adUnits)
    }

    console.log(`[Fyber] Loaded ${this.allAdUnits.length} ad units from ${configs.length} account(s)`)
  }

  /**
   * Get bid from Fyber
   * Returns the best matching ad unit based on format and floor price
   */
  async getBid(request: BidRequest): Promise<BidResult | null> {
    // Find matching ad units based on format and platform
    const matchingUnits = this.findMatchingUnits(request)

    if (matchingUnits.length === 0) {
      console.log(`[Fyber] No matching ad units for format=${request.format}`)
      return null
    }

    // Sort by floor price descending (highest bid wins)
    matchingUnits.sort((a, b) => b.bidFloor - a.bidFloor)

    // Return the highest floor price unit as bid
    const bestUnit = matchingUnits[0]

    // Find the app IDs for this unit
    const appIds = this.getAppIdsForUnit(bestUnit)

    console.log(`[Fyber] Bidding with unit "${bestUnit.name}" at $${bestUnit.bidFloor}`)

    return {
      bidId: this.generateBidId(),
      price: bestUnit.bidFloor,
      source: this.name,
      creative: {
        type: 'fyber',
        content: JSON.stringify({
          spotId: bestUnit.externalId,
          appIdAndroid: appIds?.appIdAndroid,
          appIdIos: appIds?.appIdIos,
          adUnitId: bestUnit.id,
          adUnitName: bestUnit.name,
        }),
        width: bestUnit.width || request.width || 320,
        height: bestUnit.height || request.height || 50,
      },
    }
  }

  /**
   * Find ad units matching the request format and platform
   */
  private findMatchingUnits(request: BidRequest): FyberAdUnit[] {
    const requestFormat = request.format.toUpperCase()
    const requestPlatform = this.detectPlatform(request)

    return this.allAdUnits.filter(unit => {
      // Check format match
      if (unit.format !== requestFormat) {
        return false
      }

      // Check platform match
      if (unit.platform !== 'BOTH' && unit.platform !== requestPlatform) {
        return false
      }

      // Check if unit is active
      if (!unit.isActive) {
        return false
      }

      // For banner, optionally check size match
      if (requestFormat === 'BANNER' && request.width && request.height) {
        // If unit has specific size, check match
        if (unit.width && unit.height) {
          const widthMatch = unit.width === request.width
          const heightMatch = unit.height === request.height
          if (!widthMatch || !heightMatch) {
            return false
          }
        }
      }

      return true
    })
  }

  /**
   * Detect platform from request
   */
  private detectPlatform(request: BidRequest): string {
    const os = request.device?.os?.toLowerCase() || ''
    if (os.includes('android')) {
      return 'ANDROID'
    }
    if (os.includes('ios') || os.includes('iphone') || os.includes('ipad')) {
      return 'IOS'
    }
    return 'BOTH' // Default - match any
  }

  /**
   * Get app IDs for a given ad unit
   */
  private getAppIdsForUnit(unit: FyberAdUnit): { appIdAndroid: string; appIdIos: string } | null {
    for (const config of this.configs.values()) {
      if (config.adUnits.some(u => u.id === unit.id)) {
        return {
          appIdAndroid: config.appIdAndroid,
          appIdIos: config.appIdIos,
        }
      }
    }
    return null
  }

  /**
   * Get config for SDK (for debugging/info)
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
   * Get all loaded ad units (for debugging)
   */
  getAllAdUnits(): FyberAdUnit[] {
    return [...this.allAdUnits]
  }
}

export const fyberConnector = new FyberConnector()
