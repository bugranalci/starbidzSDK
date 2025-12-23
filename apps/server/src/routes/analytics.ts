import { Elysia, t } from 'elysia'
import {
  getDailyStats,
  getDemandSourceStats,
  getCountryStats,
  getFormatStats,
  getRealtimeMetrics,
} from '../tracking/queries'
import { tinybird } from '../tracking'

const DateRangeSchema = t.Object({
  start_date: t.String({ format: 'date' }),
  end_date: t.String({ format: 'date' }),
  app_key: t.Optional(t.String()),
})

export const analyticsRoutes = new Elysia({ prefix: '/v1/analytics' })
  // Health check for analytics
  .get('/status', () => {
    return {
      configured: tinybird.isConfigured(),
      message: tinybird.isConfigured()
        ? 'Analytics ready'
        : 'TINYBIRD_API_KEY not configured',
    }
  }, {
    detail: {
      summary: 'Analytics status',
      description: 'Check if analytics (Tinybird) is configured',
      tags: ['Analytics']
    }
  })

  // Daily statistics
  .get('/daily', async ({ query }) => {
    try {
      const stats = await getDailyStats({
        appKey: query.app_key,
        startDate: query.start_date,
        endDate: query.end_date,
      })
      return { success: true, data: stats }
    } catch (error) {
      console.error('Analytics error:', error)
      return { success: false, error: 'Failed to fetch analytics', data: [] }
    }
  }, {
    query: DateRangeSchema,
    detail: {
      summary: 'Daily statistics',
      description: 'Get daily aggregated statistics for a date range',
      tags: ['Analytics']
    }
  })

  // Demand source breakdown
  .get('/demand-sources', async ({ query }) => {
    try {
      const stats = await getDemandSourceStats({
        appKey: query.app_key,
        startDate: query.start_date,
        endDate: query.end_date,
      })
      return { success: true, data: stats }
    } catch (error) {
      console.error('Analytics error:', error)
      return { success: false, error: 'Failed to fetch analytics', data: [] }
    }
  }, {
    query: DateRangeSchema,
    detail: {
      summary: 'Demand source statistics',
      description: 'Get statistics broken down by demand source',
      tags: ['Analytics']
    }
  })

  // Country breakdown
  .get('/countries', async ({ query }) => {
    try {
      const stats = await getCountryStats({
        appKey: query.app_key,
        startDate: query.start_date,
        endDate: query.end_date,
        limit: 20,
      })
      return { success: true, data: stats }
    } catch (error) {
      console.error('Analytics error:', error)
      return { success: false, error: 'Failed to fetch analytics', data: [] }
    }
  }, {
    query: DateRangeSchema,
    detail: {
      summary: 'Country statistics',
      description: 'Get statistics broken down by country',
      tags: ['Analytics']
    }
  })

  // Format breakdown
  .get('/formats', async ({ query }) => {
    try {
      const stats = await getFormatStats({
        appKey: query.app_key,
        startDate: query.start_date,
        endDate: query.end_date,
      })
      return { success: true, data: stats }
    } catch (error) {
      console.error('Analytics error:', error)
      return { success: false, error: 'Failed to fetch analytics', data: [] }
    }
  }, {
    query: DateRangeSchema,
    detail: {
      summary: 'Format statistics',
      description: 'Get statistics broken down by ad format',
      tags: ['Analytics']
    }
  })

  // Real-time metrics
  .get('/realtime', async ({ query }) => {
    try {
      const metrics = await getRealtimeMetrics(query.app_key)
      return { success: true, data: metrics }
    } catch (error) {
      console.error('Analytics error:', error)
      return {
        success: false,
        error: 'Failed to fetch analytics',
        data: {
          requests_per_minute: 0,
          fill_rate: 0,
          avg_latency_ms: 0,
          active_demand_sources: 0,
        }
      }
    }
  }, {
    query: t.Object({
      app_key: t.Optional(t.String()),
    }),
    detail: {
      summary: 'Real-time metrics',
      description: 'Get real-time metrics for the last hour',
      tags: ['Analytics']
    }
  })
