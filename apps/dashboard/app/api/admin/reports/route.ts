import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

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
    const groupBy = searchParams.get('groupBy') || 'day'

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

    // Get platform-wide stats
    const [
      totalPublishers,
      activePublishers,
      totalApps,
      totalAdUnits,
      demandSources,
      recentBidRequests,
    ] = await Promise.all([
      prisma.publisher.count(),
      prisma.publisher.count({ where: { isActive: true } }),
      prisma.app.count(),
      prisma.adUnit.count(),
      prisma.demandSource.findMany({
        where: { isActive: true },
        select: { id: true, name: true, type: true },
      }),
      // Get recent bid request logs if available
      prisma.bidRequest.count({
        where: { createdAt: { gte: startDate } },
      }).catch(() => 0), // If table doesn't exist, return 0
    ])

    // Get revenue by demand source (mock data for now, would need a revenue tracking table)
    const demandSourceStats = demandSources.map((source) => ({
      id: source.id,
      name: source.name,
      type: source.type,
      impressions: Math.floor(Math.random() * 1000000) + 100000,
      revenue: Math.random() * 50000 + 10000,
      ecpm: Math.random() * 10 + 3,
      fillRate: Math.random() * 30 + 70,
    }))

    // Aggregate totals
    const totals = demandSourceStats.reduce(
      (acc, stat) => ({
        impressions: acc.impressions + stat.impressions,
        revenue: acc.revenue + stat.revenue,
      }),
      { impressions: 0, revenue: 0 }
    )

    // Generate daily breakdown (mock data)
    const dailyStats = []
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        impressions: Math.floor(Math.random() * 50000) + 10000,
        revenue: Math.random() * 2000 + 500,
        requests: Math.floor(Math.random() * 60000) + 15000,
      })
    }

    return NextResponse.json({
      overview: {
        totalPublishers,
        activePublishers,
        totalApps,
        totalAdUnits,
        totalImpressions: totals.impressions,
        totalRevenue: totals.revenue,
        avgEcpm: totals.impressions > 0 ? (totals.revenue / totals.impressions) * 1000 : 0,
        avgFillRate: demandSourceStats.reduce((acc, s) => acc + s.fillRate, 0) / demandSourceStats.length,
      },
      demandSources: demandSourceStats,
      daily: dailyStats,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
