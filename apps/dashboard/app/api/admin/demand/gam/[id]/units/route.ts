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

// GAM ad unit path validation: /network_code/ad_unit_path
const gamPathRegex = /^\/[\d,]+\/.+$/

const createAdUnitSchema = z.object({
  name: z.string().min(1).max(100),
  externalId: z.string().min(1).max(255).regex(gamPathRegex, {
    message: 'Invalid GAM path format. Expected: /network_code/ad_unit_path',
  }),
  format: z.enum(['BANNER', 'INTERSTITIAL', 'REWARDED']),
  bidFloor: z.number().min(0.01).max(999.99),
  platform: z.enum(['ANDROID', 'IOS', 'BOTH']).default('BOTH'),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
})

// GET - List ad units for a GAM source
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
    console.error('List demand ad units error:', error)
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
      where: { id, type: 'GAM' },
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
    console.error('Create demand ad unit error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
