import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

async function isAdmin() {
  const { userId } = await auth()
  if (!userId) return false

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  return user?.role === 'ADMIN'
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const source = await prisma.demandSource.findUnique({
      where: { id, type: 'ORTB' },
      include: { ortbConfig: true },
    })

    if (!source || !source.ortbConfig) {
      return NextResponse.json({ error: 'ORTB source not found' }, { status: 404 })
    }

    const config = source.ortbConfig

    // Send a test bid request
    const testBidRequest = {
      id: 'test-' + Date.now(),
      imp: [
        {
          id: '1',
          banner: { w: 320, h: 50 },
          bidfloor: 1.0,
        },
      ],
      site: {
        page: 'https://test.starbidz.io',
      },
      device: {
        ua: 'Starbidz-Test/1.0',
      },
      test: 1,
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (config.authHeader && config.authValue) {
      headers[config.authHeader] = config.authValue
    }

    const startTime = Date.now()

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(testBidRequest),
        signal: AbortSignal.timeout(config.timeout || 5000),
      })

      const latency = Date.now() - startTime

      if (response.ok || response.status === 204) {
        return NextResponse.json({
          success: true,
          latency,
          status: response.status,
          message: response.status === 204 ? 'No bid (expected for test)' : 'Connected successfully',
        })
      } else {
        const text = await response.text().catch(() => '')
        return NextResponse.json({
          success: false,
          error: `HTTP ${response.status}: ${text.slice(0, 200)}`,
          latency,
        })
      }
    } catch (fetchError: any) {
      const latency = Date.now() - startTime
      return NextResponse.json({
        success: false,
        error: fetchError.message || 'Connection failed',
        latency,
      })
    }
  } catch (error) {
    console.error('Test ORTB connection error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
