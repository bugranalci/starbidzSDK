import { Elysia, t } from 'elysia'
import { auctionEngine } from '../auction/engine'
import { trackBidRequest, trackBidResponse } from '../tracking'

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
      }).catch(console.error)

      const result = await auctionEngine.runAuction(body)
      const latencyMs = Date.now() - startTime

      if (result.winner) {
        // Track successful bid response
        trackBidResponse({
          placementId: body.placement_id,
          appKey: body.app_key,
          requestId,
          demandSource: result.winner.source,
          bidPrice: result.winner.price,
          latencyMs,
          format: body.format,
        }).catch(console.error)

        return {
          success: true,
          bid: {
            id: result.winner.bidId,
            price: result.winner.price,
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
