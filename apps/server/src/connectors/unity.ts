import { BaseConnector } from './base'
import type { BidRequest, BidResult } from '@starbidz/shared'

/**
 * Unity Ads Connector
 *
 * Client-side mediation - server provides ad unit config based on auction.
 * SDK uses the returned Unity Placement ID to load ads via Unity Ads SDK.
 */

interface UnityAdUnit {
  id: string
  name: string
  externalId: string  // Unity Placement ID
  format: string      // BANNER, INTERSTITIAL, REWARDED
  bidFloor: number    // Floor price = bid price
  platform: string    // ANDROID, IOS, BOTH
  width: number | null
  height: number | null
  isActive: boolean
}

interface UnityConfig {
  demandSourceId: string
  gameIdAndroid: string
  gameIdIos: string
  adUnits: UnityAdUnit[]
}

class UnityConnector extends BaseConnector {
  name = 'unity'

  private configs: Map<string, UnityConfig> = new Map()
  // Flat list of all ad units for quick lookup
  private allAdUnits: UnityAdUnit[] = []

  /**
   * Load Unity configurations from database
   */
  async loadConfigs(configs: UnityConfig[]): Promise<void> {
    this.configs.clear()
    this.allAdUnits = []

    for (const config of configs) {
      this.configs.set(config.demandSourceId, config)
      // Add all ad units to flat list
      this.allAdUnits.push(...config.adUnits)
    }

    console.log(`[Unity] Loaded ${this.allAdUnits.length} ad units from ${configs.length} account(s)`)
  }

  /**
   * Get bid from Unity
   * Returns the best matching ad unit based on format and floor price
   */
  async getBid(request: BidRequest): Promise<BidResult | null> {
    // Find matching ad units based on format and platform
    const matchingUnits = this.findMatchingUnits(request)

    if (matchingUnits.length === 0) {
      console.log(`[Unity] No matching ad units for format=${request.format}`)
      return null
    }

    // Sort by floor price descending (highest bid wins)
    matchingUnits.sort((a, b) => b.bidFloor - a.bidFloor)

    // Return the highest floor price unit as bid
    const bestUnit = matchingUnits[0]

    // Find the game IDs for this unit
    const gameIds = this.getGameIdsForUnit(bestUnit)

    console.log(`[Unity] Bidding with unit "${bestUnit.name}" at $${bestUnit.bidFloor}`)

    return {
      bidId: this.generateBidId(),
      price: bestUnit.bidFloor,
      source: this.name,
      creative: {
        type: 'unity',
        content: JSON.stringify({
          placementId: bestUnit.externalId,
          gameIdAndroid: gameIds?.gameIdAndroid,
          gameIdIos: gameIds?.gameIdIos,
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
  private findMatchingUnits(request: BidRequest): UnityAdUnit[] {
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
   * Get game IDs for a given ad unit
   */
  private getGameIdsForUnit(unit: UnityAdUnit): { gameIdAndroid: string; gameIdIos: string } | null {
    for (const config of this.configs.values()) {
      if (config.adUnits.some(u => u.id === unit.id)) {
        return {
          gameIdAndroid: config.gameIdAndroid,
          gameIdIos: config.gameIdIos,
        }
      }
    }
    return null
  }

  /**
   * Get config for SDK (for debugging/info)
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
   * Get all loaded ad units (for debugging)
   */
  getAllAdUnits(): UnityAdUnit[] {
    return [...this.allAdUnits]
  }
}

export const unityConnector = new UnityConnector()
