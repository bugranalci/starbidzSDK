import type { BidRequest, BidResult } from '@starbidz/shared'

export interface Connector {
  name: string
  getBid(request: BidRequest): Promise<BidResult | null>
}

export abstract class BaseConnector implements Connector {
  abstract name: string

  abstract getBid(request: BidRequest): Promise<BidResult | null>

  protected generateBidId(): string {
    return `bid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}
