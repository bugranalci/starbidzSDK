/**
 * Analytics Query Functions
 *
 * Pre-built queries for common analytics use cases.
 * These map to Tinybird pipes for efficient querying.
 */

import { tinybird } from './tinybird'

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

/**
 * Get daily statistics for a date range
 */
export async function getDailyStats(params: {
  appKey?: string
  startDate: string
  endDate: string
}): Promise<DailyStats[]> {
  return tinybird.query<DailyStats>('daily_stats', {
    app_key: params.appKey || '',
    start_date: params.startDate,
    end_date: params.endDate,
  })
}

/**
 * Get statistics by demand source
 */
export async function getDemandSourceStats(params: {
  appKey?: string
  startDate: string
  endDate: string
}): Promise<DemandSourceStats[]> {
  return tinybird.query<DemandSourceStats>('demand_source_stats', {
    app_key: params.appKey || '',
    start_date: params.startDate,
    end_date: params.endDate,
  })
}

/**
 * Get statistics by country
 */
export async function getCountryStats(params: {
  appKey?: string
  startDate: string
  endDate: string
  limit?: number
}): Promise<CountryStats[]> {
  return tinybird.query<CountryStats>('country_stats', {
    app_key: params.appKey || '',
    start_date: params.startDate,
    end_date: params.endDate,
    limit: String(params.limit || 20),
  })
}

/**
 * Get statistics by ad format
 */
export async function getFormatStats(params: {
  appKey?: string
  startDate: string
  endDate: string
}): Promise<FormatStats[]> {
  return tinybird.query<FormatStats>('format_stats', {
    app_key: params.appKey || '',
    start_date: params.startDate,
    end_date: params.endDate,
  })
}

/**
 * Get real-time metrics (last hour)
 */
export async function getRealtimeMetrics(appKey?: string): Promise<{
  requests_per_minute: number
  fill_rate: number
  avg_latency_ms: number
  active_demand_sources: number
}> {
  const result = await tinybird.query<{
    requests_per_minute: number
    fill_rate: number
    avg_latency_ms: number
    active_demand_sources: number
  }>('realtime_metrics', {
    app_key: appKey || '',
  })

  return result[0] || {
    requests_per_minute: 0,
    fill_rate: 0,
    avg_latency_ms: 0,
    active_demand_sources: 0,
  }
}
