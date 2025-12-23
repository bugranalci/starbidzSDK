/**
 * Analytics API Client
 *
 * Fetches analytics data from the bid server's Tinybird endpoints.
 */

const BID_SERVER_URL = process.env.NEXT_PUBLIC_BID_SERVER_URL || 'http://localhost:8080'

export interface DailyStats {
  date: string
  requests: number
  responses: number
  impressions: number
  clicks: number
  revenue: number
  fill_rate: number
  ctr: number
}

export interface DemandSourceStats {
  demand_source: string
  requests: number
  wins: number
  impressions: number
  revenue: number
  avg_bid: number
  win_rate: number
}

export interface CountryStats {
  country: string
  requests: number
  impressions: number
  revenue: number
  fill_rate: number
}

export interface FormatStats {
  format: string
  requests: number
  impressions: number
  revenue: number
  avg_cpm: number
}

export interface RealtimeMetrics {
  requests_per_minute: number
  fill_rate: number
  avg_latency_ms: number
  active_demand_sources: number
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

async function fetchAnalytics<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T | null> {
  try {
    const searchParams = new URLSearchParams(params)
    const url = `${BID_SERVER_URL}/v1/analytics/${endpoint}?${searchParams}`

    const response = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 1 minute
    })

    if (!response.ok) {
      console.error(`Analytics API error: ${response.status}`)
      return null
    }

    const result: ApiResponse<T> = await response.json()
    return result.success ? result.data : null
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return null
  }
}

/**
 * Get daily statistics for a date range
 */
export async function getDailyStats(params: {
  appKey?: string
  startDate: string
  endDate: string
}): Promise<DailyStats[]> {
  const result = await fetchAnalytics<DailyStats[]>('daily', {
    app_key: params.appKey || '',
    start_date: params.startDate,
    end_date: params.endDate,
  })
  return result || []
}

/**
 * Get statistics by demand source
 */
export async function getDemandSourceStats(params: {
  appKey?: string
  startDate: string
  endDate: string
}): Promise<DemandSourceStats[]> {
  const result = await fetchAnalytics<DemandSourceStats[]>('demand-sources', {
    app_key: params.appKey || '',
    start_date: params.startDate,
    end_date: params.endDate,
  })
  return result || []
}

/**
 * Get statistics by country
 */
export async function getCountryStats(params: {
  appKey?: string
  startDate: string
  endDate: string
}): Promise<CountryStats[]> {
  const result = await fetchAnalytics<CountryStats[]>('countries', {
    app_key: params.appKey || '',
    start_date: params.startDate,
    end_date: params.endDate,
  })
  return result || []
}

/**
 * Get statistics by ad format
 */
export async function getFormatStats(params: {
  appKey?: string
  startDate: string
  endDate: string
}): Promise<FormatStats[]> {
  const result = await fetchAnalytics<FormatStats[]>('formats', {
    app_key: params.appKey || '',
    start_date: params.startDate,
    end_date: params.endDate,
  })
  return result || []
}

/**
 * Get real-time metrics
 */
export async function getRealtimeMetrics(
  appKey?: string
): Promise<RealtimeMetrics> {
  const result = await fetchAnalytics<RealtimeMetrics>('realtime', {
    app_key: appKey || '',
  })
  return result || {
    requests_per_minute: 0,
    fill_rate: 0,
    avg_latency_ms: 0,
    active_demand_sources: 0,
  }
}

/**
 * Check if analytics is configured
 */
export async function isAnalyticsConfigured(): Promise<boolean> {
  try {
    const response = await fetch(`${BID_SERVER_URL}/v1/analytics/status`)
    if (!response.ok) return false

    const result = await response.json()
    return result.configured === true
  } catch {
    return false
  }
}

/**
 * Get date range for common periods
 */
export function getDateRange(period: 'today' | '7d' | '30d' | '90d'): {
  startDate: string
  endDate: string
} {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case 'today':
      // Start of today
      break
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case '90d':
      start.setDate(start.getDate() - 90)
      break
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}
