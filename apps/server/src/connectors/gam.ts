import { BaseConnector } from './base'
import type { BidRequest, BidResult } from '@starbidz/shared'

/**
 * Google Ad Manager (GAM) Connector
 *
 * Client-side mediation - server provides ad unit config based on auction.
 * SDK uses the returned GAM ad unit path to load ads via Google Mobile Ads SDK.
 */

interface GamAdUnit {
  id: string
  name: string
  externalId: string  // GAM ad unit path: /network_code/ad_unit_path
  format: string      // BANNER, INTERSTITIAL, REWARDED
  bidFloor: number    // Floor price = bid price
  platform: string    // ANDROID, IOS, BOTH
  width: number | null
  height: number | null
  isActive: boolean
}

interface GamConfig {
  demandSourceId: string
  networkCode: string | null
  adUnits: GamAdUnit[]
}

class GamConnector extends BaseConnector {
  name = 'gam'

  private configs: Map<string, GamConfig> = new Map()
  // Flat list of all ad units for quick lookup
  private allAdUnits: GamAdUnit[] = []

  /**
   * Load GAM configurations from database
   */
  async loadConfigs(configs: GamConfig[]): Promise<void> {
    this.configs.clear()
    this.allAdUnits = []

    for (const config of configs) {
      this.configs.set(config.demandSourceId, config)
      // Add all ad units to flat list
      this.allAdUnits.push(...config.adUnits)
    }

    console.log(`[GAM] Loaded ${this.allAdUnits.length} ad units from ${configs.length} account(s)`)
  }

  /**
   * Get bid from GAM
   * Returns the best matching ad unit based on format and floor price
   */
  async getBid(request: BidRequest): Promise<BidResult | null> {
    // Find matching ad units based on format and platform
    const matchingUnits = this.findMatchingUnits(request)

    if (matchingUnits.length === 0) {
      console.log(`[GAM] No matching ad units for format=${request.format}`)
      return null
    }

    // Sort by floor price descending (highest bid wins)
    matchingUnits.sort((a, b) => b.bidFloor - a.bidFloor)

    // Return the highest floor price unit as bid
    const bestUnit = matchingUnits[0]

    // Find the network code for this unit
    const networkCode = this.getNetworkCodeForUnit(bestUnit)

    console.log(`[GAM] Bidding with unit "${bestUnit.name}" at $${bestUnit.bidFloor}`)

    return {
      bidId: this.generateBidId(),
      price: bestUnit.bidFloor,
      source: this.name,
      creative: {
        type: 'gam',
        content: JSON.stringify({
          adUnitPath: bestUnit.externalId,
          networkCode: networkCode,
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
  private findMatchingUnits(request: BidRequest): GamAdUnit[] {
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
          // Allow some flexibility in size matching
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
   * Get network code for a given ad unit
   */
  private getNetworkCodeForUnit(unit: GamAdUnit): string | null {
    for (const config of this.configs.values()) {
      if (config.adUnits.some(u => u.id === unit.id)) {
        return config.networkCode
      }
    }
    return null
  }

  /**
   * Get config for SDK (for debugging/info)
   */
  getConfig(demandSourceId: string): GamConfig | undefined {
    return this.configs.get(demandSourceId)
  }

  /**
   * Get all loaded ad units (for debugging)
   */
  getAllAdUnits(): GamAdUnit[] {
    return [...this.allAdUnits]
  }
}

export const gamConnector = new GamConnector()
