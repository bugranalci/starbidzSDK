/**
 * Event Tracking Module
 *
 * Tracks all ad-related events for analytics and reporting:
 * - BID_REQUEST: When a bid request is received
 * - BID_RESPONSE: When a bid response is sent
 * - WIN: When our bid wins the auction
 * - IMPRESSION: When an ad is displayed
 * - CLICK: When an ad is clicked
 * - COMPLETE: When a rewarded video completes
 */

import { tinybird } from './tinybird'

export type EventType =
  | 'BID_REQUEST'
  | 'BID_RESPONSE'
  | 'WIN'
  | 'IMPRESSION'
  | 'CLICK'
  | 'COMPLETE'

export interface TrackEventParams {
  eventType: EventType
  placementId: string
  appKey: string
  requestId?: string
  demandSource?: string | null
  bidPrice?: number | null
  winPrice?: number | null
  country?: string | null
  deviceType?: string | null
  os?: string | null
  osVersion?: string | null
  appVersion?: string | null
  format?: string | null
  latencyMs?: number | null
}

/**
 * Track an ad event
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  const {
    eventType,
    placementId,
    appKey,
    requestId,
    demandSource,
    bidPrice,
    winPrice,
    country,
    deviceType,
    os,
    osVersion,
    appVersion,
    format,
    latencyMs,
  } = params

  // Send to Tinybird for real-time analytics
  await tinybird.sendEvent({
    event_type: eventType,
    placement_id: placementId,
    app_key: appKey,
    request_id: requestId || null,
    demand_source: demandSource || null,
    bid_price: bidPrice ?? null,
    win_price: winPrice ?? null,
    country: country || null,
    device_type: deviceType || null,
    os: os || null,
    os_version: osVersion || null,
    app_version: appVersion || null,
    format: format || null,
    latency_ms: latencyMs ?? null,
  })
}

/**
 * Track bid request event
 */
export async function trackBidRequest(params: {
  placementId: string
  appKey: string
  requestId: string
  country?: string
  deviceType?: string
  os?: string
  osVersion?: string
  appVersion?: string
  format?: string
}): Promise<void> {
  await trackEvent({
    eventType: 'BID_REQUEST',
    ...params,
  })
}

/**
 * Track bid response event
 */
export async function trackBidResponse(params: {
  placementId: string
  appKey: string
  requestId: string
  demandSource: string | null
  bidPrice: number | null
  latencyMs: number
  format?: string
}): Promise<void> {
  await trackEvent({
    eventType: 'BID_RESPONSE',
    ...params,
  })
}

/**
 * Track win event (when our bid wins)
 */
export async function trackWin(params: {
  placementId: string
  appKey: string
  requestId?: string
  demandSource: string
  winPrice: number
}): Promise<void> {
  await trackEvent({
    eventType: 'WIN',
    ...params,
  })
}

/**
 * Track impression event
 */
export async function trackImpression(params: {
  placementId: string
  appKey: string
  demandSource?: string
  bidPrice?: number
  country?: string
}): Promise<void> {
  await trackEvent({
    eventType: 'IMPRESSION',
    ...params,
  })
}

/**
 * Track click event
 */
export async function trackClick(params: {
  placementId: string
  appKey: string
  demandSource?: string
}): Promise<void> {
  await trackEvent({
    eventType: 'CLICK',
    ...params,
  })
}

/**
 * Track rewarded video complete event
 */
export async function trackComplete(params: {
  placementId: string
  appKey: string
  demandSource?: string
}): Promise<void> {
  await trackEvent({
    eventType: 'COMPLETE',
    ...params,
  })
}

/**
 * Flush pending events (call on shutdown)
 */
export async function flushEvents(): Promise<void> {
  await tinybird.flush()
}
