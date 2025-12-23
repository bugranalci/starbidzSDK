import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

async function getPublisher() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { publisher: true },
  })

  if (!user?.publisher) {
    throw new Error('Publisher not found')
  }

  return user.publisher
}

export async function GET(req: Request) {
  try {
    const publisher = await getPublisher()

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30d'
    const appId = searchParams.get('appId')
    const format = searchParams.get('format')

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
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get publisher's apps
    const apps = await prisma.app.findMany({
      where: {
        publisherId: publisher.id,
        ...(appId && { id: appId }),
      },
      include: {
        adUnits: true,
      },
    })

    // Generate mock stats for each app (would come from analytics table in production)
    const appStats = apps.map((app) => ({
      appId: app.id,
      appName: app.name,
      platform: app.platform,
      impressions: Math.floor(Math.random() * 100000) + 10000,
      revenue: Math.random() * 5000 + 500,
      ecpm: Math.random() * 10 + 3,
      fillRate: Math.random() * 20 + 75,
      adUnits: app.adUnits.length,
    }))

    // Aggregate by format
    const formatStats = [
      {
        format: 'BANNER',
        impressions: Math.floor(Math.random() * 50000) + 5000,
        revenue: Math.random() * 1000 + 200,
        ecpm: Math.random() * 3 + 1,
      },
      {
        format: 'INTERSTITIAL',
        impressions: Math.floor(Math.random() * 30000) + 3000,
        revenue: Math.random() * 2000 + 500,
        ecpm: Math.random() * 10 + 5,
      },
      {
        format: 'REWARDED',
        impressions: Math.floor(Math.random() * 20000) + 2000,
        revenue: Math.random() * 3000 + 800,
        ecpm: Math.random() * 15 + 10,
      },
    ]

    // Apply format filter if specified
    const filteredFormatStats = format
      ? formatStats.filter((f) => f.format === format)
      : formatStats

    // Generate daily breakdown
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const dailyStats = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        impressions: Math.floor(Math.random() * 5000) + 500,
        revenue: Math.random() * 200 + 50,
        requests: Math.floor(Math.random() * 6000) + 800,
      })
    }

    // Calculate totals
    const totals = {
      impressions: appStats.reduce((acc, app) => acc + app.impressions, 0),
      revenue: appStats.reduce((acc, app) => acc + app.revenue, 0),
      apps: apps.length,
      adUnits: apps.reduce((acc, app) => acc + app.adUnits.length, 0),
    }

    return NextResponse.json({
      overview: {
        ...totals,
        avgEcpm: totals.impressions > 0 ? (totals.revenue / totals.impressions) * 1000 : 0,
        avgFillRate: appStats.reduce((acc, app) => acc + app.fillRate, 0) / appStats.length || 0,
      },
      apps: appStats,
      formats: filteredFormatStats,
      daily: dailyStats,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Publisher not found') {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Publisher reports error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
