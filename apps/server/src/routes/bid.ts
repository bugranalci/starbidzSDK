import { Elysia, t } from 'elysia'
import { auctionEngine } from '../auction/engine'
import { trackBidRequest, trackBidResponse } from '../tracking'
import { prisma } from '../lib/db'

// Cache for app/publisher data to avoid repeated DB lookups
const appCache = new Map<string, { publisherId: string; margin: number; expiresAt: number }>()
const CACHE_TTL_MS = 60000 // 1 minute cache

async function getAppWithMargin(appKey: string): Promise<{ publisherId: string; margin: number } | null> {
  // Check cache first
  const cached = appCache.get(appKey)
  if (cached && cached.expiresAt > Date.now()) {
    return { publisherId: cached.publisherId, margin: cached.margin }
  }

  // Fetch from database
  const app = await prisma.app.findUnique({
    where: { appKey },
    include: { publisher: { select: { id: true, margin: true } } }
  })

  if (!app || !app.publisher) {
    return null
  }

  // Cache the result
  appCache.set(appKey, {
    publisherId: app.publisher.id,
    margin: app.publisher.margin,
    expiresAt: Date.now() + CACHE_TTL_MS
  })

  return { publisherId: app.publisher.id, margin: app.publisher.margin }
}

const DeviceSchema = t.Object({
  os: t.Union([t.Literal('android'), t.Literal('ios')]),
  osv: t.String(),
  make: t.String(),
  model: t.String(),
  ifa: t.String(),
  lmt: t.Boolean(),
  connectionType: t.String()
})

const GeoSchema = t.Object({
  country: t.String(),
  region: t.Optional(t.String()),
  city: t.Optional(t.String())
})

const AppSchema = t.Object({
  bundle: t.String(),
  version: t.String(),
  name: t.String()
})

const UserSchema = t.Object({
  consent: t.Optional(t.String())
})

const BidRequestSchema = t.Object({
  app_key: t.String(),
  placement_id: t.String(),
  format: t.Union([
    t.Literal('banner'),
    t.Literal('interstitial'),
    t.Literal('rewarded')
  ]),
  width: t.Optional(t.Number()),
  height: t.Optional(t.Number()),
  device: DeviceSchema,
  geo: t.Optional(GeoSchema),
  app: AppSchema,
  user: t.Optional(UserSchema),
  test: t.Optional(t.Boolean())
})

const CreativeSchema = t.Object({
  type: t.Union([t.Literal('html'), t.Literal('vast'), t.Literal('image')]),
  content: t.String(),
  width: t.Optional(t.Number()),
  height: t.Optional(t.Number())
})

const BidSchema = t.Object({
  id: t.String(),
  price: t.Number(),
  net_price: t.Number(),
  currency: t.String(),
  demand_source: t.String(),
  creative: CreativeSchema,
  nurl: t.Optional(t.String()),
  burl: t.Optional(t.String())
})

const BidResponseSchema = t.Object({
  success: t.Boolean(),
  bid: t.Optional(BidSchema),
  error: t.Optional(t.String())
})

export const bidRoutes = new Elysia({ prefix: '/v1' })
  .post('/bid', async ({ body }) => {
    const startTime = Date.now()
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      // Get publisher margin for this app
      const appData = await getAppWithMargin(body.app_key)
      const margin = appData?.margin ?? 0.20 // Default 20% margin if not found
      const publisherId = appData?.publisherId ?? null

      // Track bid request (async, don't await)
      trackBidRequest({
        placementId: body.placement_id,
        appKey: body.app_key,
        requestId,
        country: body.geo?.country,
        deviceType: body.device.model,
        os: body.device.os,
        osVersion: body.device.osv,
        appVersion: body.app.version,
        format: body.format,
        publisherId,
      }).catch(console.error)

      const result = await auctionEngine.runAuction(body)
      const latencyMs = Date.now() - startTime

      if (result.winner) {
        const grossPrice = result.winner.price
        const netPrice = grossPrice * (1 - margin) // Publisher receives this amount

        // Track successful bid response with margin info
        trackBidResponse({
          placementId: body.placement_id,
          appKey: body.app_key,
          requestId,
          demandSource: result.winner.source,
          bidPrice: grossPrice,
          netPrice,
          margin,
          publisherId,
          latencyMs,
          format: body.format,
        }).catch(console.error)

        return {
          success: true,
          bid: {
            id: result.winner.bidId,
            price: grossPrice,           // Gross price from demand source
            net_price: netPrice,         // Net price after margin (publisher receives)
            currency: 'USD',
            demand_source: result.winner.source,
            creative: result.winner.creative,
            nurl: result.winner.nurl,
            burl: result.winner.burl
          }
        }
      }

      // Track no-bid response
      trackBidResponse({
        placementId: body.placement_id,
        appKey: body.app_key,
        requestId,
        demandSource: null,
        bidPrice: null,
        netPrice: null,
        margin,
        publisherId,
        latencyMs,
        format: body.format,
      }).catch(console.error)

      return { success: false, error: 'No bid' }
    } catch (error) {
      console.error('Bid error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    body: BidRequestSchema,
    response: BidResponseSchema,
    detail: {
      summary: 'Request a bid',
      description: 'Request a bid from all demand sources for the given placement',
      tags: ['Bidding']
    }
  })
