import { connectorManager } from '../connectors/manager'
import type { BidRequest, BidResult, AuctionResult } from '@starbidz/shared'
import { DEFAULT_BID_TIMEOUT_MS } from '@starbidz/shared'

class AuctionEngine {
  private readonly TIMEOUT_MS = DEFAULT_BID_TIMEOUT_MS

  async runAuction(request: BidRequest): Promise<AuctionResult> {
    const startTime = Date.now()

    // Get active connectors from manager
    const connectors = connectorManager.getActiveConnectors()

    // Query all demand sources in parallel with timeout
    const bidPromises = connectors.map(connector =>
      this.withTimeout(connector.getBid(request), connector.name)
    )

    const results = await Promise.allSettled(bidPromises)

    // Collect successful bids
    const bids = results
      .filter((r): r is PromiseFulfilledResult<BidResult | null> =>
        r.status === 'fulfilled' && r.value !== null
      )
      .map(r => r.value as BidResult)
      .filter(bid => bid.price > 0)

    // Sort by price descending (highest bid wins)
    bids.sort((a, b) => b.price - a.price)

    const latency = Date.now() - startTime

    if (bids.length === 0) {
      return { winner: null, allBids: [], latency }
    }

    return {
      winner: bids[0],
      allBids: bids.map(b => ({ source: b.source, price: b.price })),
      latency
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    source: string
  ): Promise<T | null> {
    try {
      return await Promise.race([
        promise,
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error(`${source} timeout`)), this.TIMEOUT_MS)
        )
      ])
    } catch (error) {
      console.warn(`Connector ${source} failed:`, error)
      return null
    }
  }
}

export const auctionEngine = new AuctionEngine()
