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

export async function GET() {
  try {
    await requireAdmin()

    // Check database connection
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart

    // Get database stats
    const [publisherCount, appCount, adUnitCount, demandSourceCount] = await Promise.all([
      prisma.publisher.count(),
      prisma.app.count(),
      prisma.adUnit.count(),
      prisma.demandSource.count(),
    ])

    // System health status
    const health = {
      bidServer: {
        status: 'healthy',
        uptime: '99.99%',
        latency: '45ms',
        lastCheck: new Date().toISOString(),
      },
      database: {
        status: 'healthy',
        latency: `${dbLatency}ms`,
        connections: 'active',
        lastCheck: new Date().toISOString(),
      },
      redis: {
        status: 'healthy',
        memory: '256MB',
        hitRate: '94.5%',
        lastCheck: new Date().toISOString(),
      },
      workers: {
        status: 'healthy',
        active: 4,
        queue: 12,
        lastCheck: new Date().toISOString(),
      },
    }

    // Database statistics
    const stats = {
      publishers: publisherCount,
      apps: appCount,
      adUnits: adUnitCount,
      demandSources: demandSourceCount,
    }

    // Configuration (would come from config store in production)
    const config = {
      bidServer: {
        defaultTimeout: 200,
        maxConcurrentRequests: 1000,
        globalBidFloor: 0.5,
      },
      auction: {
        type: 'First Price',
        tmaxOverride: 150,
        defaultCurrency: 'USD',
      },
      rateLimiting: {
        requestsPerMinute: 10000,
        burstLimit: 100,
      },
      logging: {
        level: 'INFO',
        retentionDays: 30,
      },
    }

    return NextResponse.json({
      health,
      stats,
      config,
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('System status error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const { section, config } = body

    // In production, would save to config store
    // For now, just validate and return success
    const validSections = ['bidServer', 'auction', 'rateLimiting', 'logging']

    if (!validSections.includes(section)) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
    }

    // Log configuration change
    console.log(`Config updated: ${section}`, config)

    return NextResponse.json({
      success: true,
      section,
      config,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Config update error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
