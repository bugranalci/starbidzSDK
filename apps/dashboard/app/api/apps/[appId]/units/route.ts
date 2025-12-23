import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generatePlacementId } from '@/lib/utils'
import { z } from 'zod'

const createAdUnitSchema = z.object({
  name: z.string().min(1).max(100),
  format: z.enum(['BANNER', 'INTERSTITIAL', 'REWARDED']),
  floorPrice: z.number().min(0).optional().default(1.0),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params
    const user = await getOrCreateUser()
    if (!user?.publisher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify app belongs to publisher
    const app = await prisma.app.findFirst({
      where: { id: appId, publisherId: user.publisher.id },
    })

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    const adUnits = await prisma.adUnit.findMany({
      where: { appId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(adUnits)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params
    const user = await getOrCreateUser()
    if (!user?.publisher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify app belongs to publisher
    const app = await prisma.app.findFirst({
      where: { id: appId, publisherId: user.publisher.id },
    })

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    const body = await req.json()
    const data = createAdUnitSchema.parse(body)

    const adUnit = await prisma.adUnit.create({
      data: {
        appId,
        name: data.name,
        format: data.format,
        floorPrice: data.floorPrice,
        placementId: generatePlacementId(),
        width: data.format === 'BANNER' ? data.width : null,
        height: data.format === 'BANNER' ? data.height : null,
      },
    })

    return NextResponse.json(adUnit)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create ad unit error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
