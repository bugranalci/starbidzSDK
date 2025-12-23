import { Elysia, t } from 'elysia'
import { trackImpression, trackClick, trackComplete, trackWin } from '../tracking'

const EventRequestSchema = t.Object({
  event_type: t.Union([
    t.Literal('impression'),
    t.Literal('click'),
    t.Literal('complete'),
    t.Literal('win')
  ]),
  bid_id: t.String(),
  placement_id: t.String(),
  app_key: t.Optional(t.String()),
  demand_source: t.Optional(t.String()),
  price: t.Optional(t.Number()),
  country: t.Optional(t.String()),
  timestamp: t.Number()
})

export const eventRoutes = new Elysia({ prefix: '/v1' })
  .post('/events', async ({ body }) => {
    try {
      const { event_type, placement_id, app_key, demand_source, price, country } = body

      // Track event based on type
      switch (event_type) {
        case 'impression':
          await trackImpression({
            placementId: placement_id,
            appKey: app_key || 'unknown',
            demandSource: demand_source,
            bidPrice: price,
            country,
          })
          break

        case 'click':
          await trackClick({
            placementId: placement_id,
            appKey: app_key || 'unknown',
            demandSource: demand_source,
          })
          break

        case 'complete':
          await trackComplete({
            placementId: placement_id,
            appKey: app_key || 'unknown',
            demandSource: demand_source,
          })
          break

        case 'win':
          if (demand_source && price !== undefined) {
            await trackWin({
              placementId: placement_id,
              appKey: app_key || 'unknown',
              demandSource: demand_source,
              winPrice: price,
            })
          }
          break
      }

      return { success: true }
    } catch (error) {
      console.error('Event error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    body: EventRequestSchema,
    detail: {
      summary: 'Track ad event',
      description: 'Track impression, click, win, or completion events',
      tags: ['Events']
    }
  })
