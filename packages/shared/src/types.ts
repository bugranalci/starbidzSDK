// ==================== BID REQUEST/RESPONSE ====================

export type AdFormat = 'banner' | 'interstitial' | 'rewarded'
export type Platform = 'android' | 'ios'
export type DemandSource = 'gam' | 'unity' | 'fyber' | 'ortb'
export type CreativeType = 'html' | 'vast' | 'image'

export interface BidRequest {
  app_key: string
  placement_id: string
  format: AdFormat
  width?: number
  height?: number
  device: DeviceInfo
  geo?: GeoInfo
  app: AppInfo
  user?: UserInfo
  test?: boolean
}

export interface DeviceInfo {
  os: Platform
  osv: string
  make: string
  model: string
  ifa: string
  lmt: boolean
  connectionType: string
}

export interface GeoInfo {
  country: string
  region?: string
  city?: string
}

export interface AppInfo {
  bundle: string
  version: string
  name: string
}

export interface UserInfo {
  consent?: string
}

export interface BidResponse {
  success: boolean
  bid?: Bid
  error?: string
}

export interface Bid {
  id: string
  price: number
  currency: string
  demand_source: string
  creative: Creative
  nurl?: string
  burl?: string
}

export interface Creative {
  type: CreativeType
  content: string
  width?: number
  height?: number
}

// ==================== EVENT TRACKING ====================

export type EventType = 'impression' | 'click' | 'complete'

export interface AdEvent {
  event_type: EventType
  bid_id: string
  placement_id: string
  timestamp: number
}

// ==================== AUCTION ====================

export interface AuctionResult {
  winner: BidResult | null
  allBids: Array<{ source: string; price: number }>
  latency: number
}

export interface BidResult {
  bidId: string
  price: number
  source: string
  creative: Creative
  nurl?: string
  burl?: string
}
