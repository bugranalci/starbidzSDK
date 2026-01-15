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

const updateAdUnitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  externalId: z.string().min(1).max(255).regex(unityPlacementIdRegex, {
    message: 'Invalid Unity Placement ID format. Use alphanumeric characters and underscores only.',
  }).optional(),
  format: z.enum(['BANNER', 'INTERSTITIAL', 'REWARDED']).optional(),
  bidFloor: z.number().min(0.01).max(999.99).optional(),
  platform: z.enum(['ANDROID', 'IOS', 'BOTH']).optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
})

// GET - Get single ad unit
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, unitId } = await params

    const adUnit = await prisma.demandAdUnit.findFirst({
      where: {
        id: unitId,
        demandSourceId: id,
      },
    })

    if (!adUnit) {
      return NextResponse.json({ error: 'Ad unit not found' }, { status: 404 })
    }

    return NextResponse.json(adUnit)
  } catch (error) {
    console.error('Get Unity ad unit error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PUT - Update ad unit
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, unitId } = await params

    // Verify ad unit exists and belongs to this demand source
    const existing = await prisma.demandAdUnit.findFirst({
      where: {
        id: unitId,
        demandSourceId: id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Ad unit not found' }, { status: 404 })
    }

    const body = await req.json()
    const data = updateAdUnitSchema.parse(body)

    // If format is not BANNER, clear width/height
    const format = data.format || existing.format
    const updateData: Record<string, unknown> = { ...data }
    if (format !== 'BANNER') {
      updateData.width = null
      updateData.height = null
    }

    const adUnit = await prisma.demandAdUnit.update({
      where: { id: unitId },
      data: updateData,
    })

    return NextResponse.json(adUnit)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
    console.error('Update Unity ad unit error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE - Delete ad unit
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, unitId } = await params

    // Verify ad unit exists and belongs to this demand source
    const existing = await prisma.demandAdUnit.findFirst({
      where: {
        id: unitId,
        demandSourceId: id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Ad unit not found' }, { status: 404 })
    }

    await prisma.demandAdUnit.delete({
      where: { id: unitId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete Unity ad unit error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
