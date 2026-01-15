import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

async function isAdmin() {
  const { userId } = await auth()
  if (!userId) return false

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  return user?.role === 'ADMIN'
}

// Unity Placement ID validation: alphanumeric with underscores
const unityPlacementIdRegex = /^[a-zA-Z0-9_]+$/

const createAdUnitSchema = z.object({
  name: z.string().min(1).max(100),
  externalId: z.string().min(1).max(255).regex(unityPlacementIdRegex, {
    message: 'Invalid Unity Placement ID format. Use alphanumeric characters and underscores only.',
  }),
  format: z.enum(['BANNER', 'INTERSTITIAL', 'REWARDED']),
  bidFloor: z.number().min(0.01).max(999.99),
  platform: z.enum(['ANDROID', 'IOS', 'BOTH']).default('BOTH'),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
})

// GET - List ad units for a Unity source
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const adUnits = await prisma.demandAdUnit.findMany({
      where: { demandSourceId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(adUnits)
  } catch (error) {
    console.error('List Unity ad units error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST - Create new ad unit
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify demand source exists
    const source = await prisma.demandSource.findUnique({
      where: { id, type: 'UNITY' },
    })

    if (!source) {
      return NextResponse.json({ error: 'Demand source not found' }, { status: 404 })
    }

    const body = await req.json()
    const data = createAdUnitSchema.parse(body)

    const adUnit = await prisma.demandAdUnit.create({
      data: {
        demandSourceId: id,
        name: data.name,
        externalId: data.externalId,
        format: data.format,
        bidFloor: data.bidFloor,
        platform: data.platform,
        width: data.format === 'BANNER' ? data.width : null,
        height: data.format === 'BANNER' ? data.height : null,
      },
    })

    return NextResponse.json(adUnit)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
    console.error('Create Unity ad unit error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
