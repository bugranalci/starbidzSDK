import { PrismaClient } from '@prisma/client'
import { gamConnector } from './gam'
import { unityConnector } from './unity'
import { fyberConnector } from './fyber'
import { ortbConnector } from './ortb'
import type { Connector } from './base'

/**
 * Connector Manager
 *
 * Loads demand source configurations from database and initializes connectors.
 * Handles periodic config refresh and connector lifecycle.
 */

interface ConnectorStatus {
  name: string
  isActive: boolean
  configCount: number
  lastRefresh: Date | null
}

class ConnectorManager {
  private prisma: PrismaClient | null = null
  private refreshInterval: ReturnType<typeof setInterval> | null = null
  private lastRefresh: Date | null = null
  private initialized = false

  // All available connectors
  private connectors: Map<string, Connector> = new Map([
    ['gam', gamConnector],
    ['unity', unityConnector],
    ['fyber', fyberConnector],
    ['ortb', ortbConnector],
  ])

  // Active connectors (only those with valid configs)
  private activeConnectors: Set<string> = new Set()

  /**
   * Initialize the connector manager
   * Loads configs from database and starts periodic refresh
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('ConnectorManager already initialized')
      return
    }

    try {
      // Initialize Prisma client
      this.prisma = new PrismaClient()
      await this.prisma.$connect()

      // Load initial configs
      await this.loadAllConfigs()

      // Start periodic refresh (every 5 minutes)
      this.refreshInterval = setInterval(() => {
        this.loadAllConfigs().catch(console.error)
      }, 5 * 60 * 1000)

      this.initialized = true
      console.log('ConnectorManager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize ConnectorManager:', error)
      // Continue without database - connectors will use test mode
      this.initialized = true
    }
  }

  /**
   * Load all demand source configurations from database
   */
  async loadAllConfigs(): Promise<void> {
    if (!this.prisma) {
      console.warn('Prisma client not available, skipping config load')
      return
    }

    try {
      // Load all active demand sources with their configs
      const demandSources = await this.prisma.demandSource.findMany({
        where: { isActive: true },
        include: {
          gamConfig: true,
          unityConfig: true,
          fyberConfig: true,
          ortbConfig: true,
        },
      })

      // Reset active connectors
      this.activeConnectors.clear()

      // Group configs by type
      const gamConfigs: Array<{ networkCode: string; credentials: string | null }> = []
      const unityConfigs: Array<{
        organizationId: string
        gameIdAndroid: string
        gameIdIos: string
        apiKey: string | null
      }> = []
      const fyberConfigs: Array<{ appId: string; securityToken: string }> = []
      const ortbConfigs: Array<{
        id: string
        name: string
        endpoint: string
        seatId: string | null
        authHeader: string | null
        authValue: string | null
        timeout: number
        bannerEnabled: boolean
        bannerFloor: number
        interstitialEnabled: boolean
        interstitialFloor: number
        rewardedEnabled: boolean
        rewardedFloor: number
      }> = []

      for (const source of demandSources) {
        switch (source.type) {
          case 'GAM':
            if (source.gamConfig) {
              gamConfigs.push({
                networkCode: source.gamConfig.networkCode,
                credentials: source.gamConfig.credentials,
              })
              this.activeConnectors.add('gam')
            }
            break

          case 'UNITY':
            if (source.unityConfig) {
              unityConfigs.push({
                organizationId: source.unityConfig.organizationId,
                gameIdAndroid: source.unityConfig.gameIdAndroid,
                gameIdIos: source.unityConfig.gameIdIos,
                apiKey: source.unityConfig.apiKey,
              })
              this.activeConnectors.add('unity')
            }
            break

          case 'FYBER':
            if (source.fyberConfig) {
              fyberConfigs.push({
                appId: source.fyberConfig.appId,
                securityToken: source.fyberConfig.securityToken,
              })
              this.activeConnectors.add('fyber')
            }
            break

          case 'ORTB':
            if (source.ortbConfig) {
              ortbConfigs.push({
                id: source.id,
                name: source.name,
                endpoint: source.ortbConfig.endpoint,
                seatId: source.ortbConfig.seatId,
                authHeader: source.ortbConfig.authHeader,
                authValue: source.ortbConfig.authValue,
                timeout: source.ortbConfig.timeout,
                bannerEnabled: source.ortbConfig.bannerEnabled,
                bannerFloor: source.ortbConfig.bannerFloor,
                interstitialEnabled: source.ortbConfig.interstitialEnabled,
                interstitialFloor: source.ortbConfig.interstitialFloor,
                rewardedEnabled: source.ortbConfig.rewardedEnabled,
                rewardedFloor: source.ortbConfig.rewardedFloor,
              })
              this.activeConnectors.add('ortb')
            }
            break
        }
      }

      // Load configs into each connector
      if (gamConfigs.length > 0) {
        await gamConnector.loadConfigs(gamConfigs)
        console.log(`Loaded ${gamConfigs.length} GAM config(s)`)
      }

      if (unityConfigs.length > 0) {
        await unityConnector.loadConfigs(unityConfigs)
        console.log(`Loaded ${unityConfigs.length} Unity config(s)`)
      }

      if (fyberConfigs.length > 0) {
        await fyberConnector.loadConfigs(fyberConfigs)
        console.log(`Loaded ${fyberConfigs.length} Fyber config(s)`)
      }

      if (ortbConfigs.length > 0) {
        await ortbConnector.loadConfigs(ortbConfigs)
        console.log(`Loaded ${ortbConfigs.length} ORTB config(s)`)
      }

      this.lastRefresh = new Date()
      console.log(`Connector configs refreshed. Active connectors: ${Array.from(this.activeConnectors).join(', ') || 'none'}`)
    } catch (error) {
      console.error('Failed to load connector configs:', error)
    }
  }

  /**
   * Get all active connectors for bidding
   */
  getActiveConnectors(): Connector[] {
    const active: Connector[] = []
    for (const [name, connector] of this.connectors) {
      // In test mode (no database) or if connector is active
      if (!this.prisma || this.activeConnectors.has(name)) {
        active.push(connector)
      }
    }
    return active
  }

  /**
   * Get connector by name
   */
  getConnector(name: string): Connector | undefined {
    return this.connectors.get(name)
  }

  /**
   * Get status of all connectors
   */
  getStatus(): ConnectorStatus[] {
    const statuses: ConnectorStatus[] = []
    for (const [name] of this.connectors) {
      statuses.push({
        name,
        isActive: this.activeConnectors.has(name) || !this.prisma,
        configCount: this.activeConnectors.has(name) ? 1 : 0, // Simplified
        lastRefresh: this.lastRefresh,
      })
    }
    return statuses
  }

  /**
   * Refresh configs manually
   */
  async refresh(): Promise<void> {
    await this.loadAllConfigs()
  }

  /**
   * Shutdown the connector manager
   */
  async shutdown(): Promise<void> {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
    if (this.prisma) {
      await this.prisma.$disconnect()
      this.prisma = null
    }
    this.initialized = false
    console.log('ConnectorManager shutdown complete')
  }
}

export const connectorManager = new ConnectorManager()
