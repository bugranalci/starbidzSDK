import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import {
  getDailyStats,
  getDemandSourceStats,
  getFormatStats,
  isAnalyticsConfigured,
} from '@/lib/analytics'

async function requireAdmin() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }

  return user
}

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = now.toISOString().split('T')[0]

    // Get platform-wide stats from database
    const [
      totalPublishers,
      activePublishers,
      totalApps,
      totalAdUnits,
      demandSources,
    ] = await Promise.all([
      prisma.publisher.count(),
      prisma.publisher.count({
        where: {
          apps: { some: { isActive: true } }
        }
      }),
      prisma.app.count(),
      prisma.adUnit.count(),
      prisma.demandSource.findMany({
        where: { isActive: true },
        select: { id: true, name: true, type: true },
      }),
    ])

    // Check if analytics is configured
    const analyticsConfigured = await isAnalyticsConfigured()

    let dailyStats: Array<{
      date: string
      requests: number
      impressions: number
      clicks: number
      revenue: number
      fill_rate: number
    }> = []

    let demandSourceStats: Array<{
      demand_source: string
      requests: number
      wins: number
      impressions: number
      revenue: number
      avg_bid: number
      win_rate: number
    }> = []

    let formatStats: Array<{
      format: string
      requests: number
      impressions: number
      revenue: number
      avg_cpm: number
    }> = []

    if (analyticsConfigured) {
      // Fetch real analytics data from Tinybird
      const [daily, demand, formats] = await Promise.all([
        getDailyStats({ startDate: startDateStr, endDate: endDateStr }),
        getDemandSourceStats({ startDate: startDateStr, endDate: endDateStr }),
        getFormatStats({ startDate: startDateStr, endDate: endDateStr }),
      ])

      dailyStats = daily
      demandSourceStats = demand
      formatStats = formats
    }

    // Calculate totals from real data
    const totalImpressions = dailyStats.reduce((acc, d) => acc + d.impressions, 0)
    const totalRevenue = dailyStats.reduce((acc, d) => acc + d.revenue, 0)
    const totalRequests = dailyStats.reduce((acc, d) => acc + d.requests, 0)
    const avgFillRate = totalRequests > 0 ? (totalImpressions / totalRequests) * 100 : 0

    // Map demand source stats to include database info
    const enrichedDemandSourceStats = demandSources.map((source) => {
      const stats = demandSourceStats.find(
        (s) => s.demand_source.toLowerCase() === source.type.toLowerCase()
      )
      return {
        id: source.id,
        name: source.name,
        type: source.type,
        impressions: stats?.impressions || 0,
        revenue: stats?.revenue || 0,
        ecpm: stats?.impressions ? (stats.revenue / stats.impressions) * 1000 : 0,
        winRate: stats?.win_rate || 0,
      }
    })

    return NextResponse.json({
      overview: {
        totalPublishers,
        activePublishers,
        totalApps,
        totalAdUnits,
        totalImpressions,
        totalRevenue,
        totalRequests,
        avgEcpm: totalImpressions > 0 ? (totalRevenue / totalImpressions) * 1000 : 0,
        avgFillRate,
      },
      demandSources: enrichedDemandSourceStats,
      formats: formatStats,
      daily: dailyStats,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      analyticsConfigured,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
