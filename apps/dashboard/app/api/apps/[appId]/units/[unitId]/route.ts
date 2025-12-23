import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateAdUnitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ appId: string; unitId: string }> }
) {
  try {
    const { appId, unitId } = await params
    const user = await getOrCreateUser()
    if (!user?.publisher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adUnit = await prisma.adUnit.findFirst({
      where: {
        id: unitId,
        appId,
        app: { publisherId: user.publisher.id },
      },
    })

    if (!adUnit) {
      return NextResponse.json({ error: 'Ad unit not found' }, { status: 404 })
    }

    return NextResponse.json(adUnit)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ appId: string; unitId: string }> }
) {
  try {
    const { appId, unitId } = await params
    const user = await getOrCreateUser()
    if (!user?.publisher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ad unit belongs to publisher's app
    const existing = await prisma.adUnit.findFirst({
      where: {
        id: unitId,
        appId,
        app: { publisherId: user.publisher.id },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Ad unit not found' }, { status: 404 })
    }

    const body = await req.json()
    const data = updateAdUnitSchema.parse(body)

    const adUnit = await prisma.adUnit.update({
      where: { id: unitId },
      data,
    })

    return NextResponse.json(adUnit)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Update ad unit error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ appId: string; unitId: string }> }
) {
  try {
    const { appId, unitId } = await params
    const user = await getOrCreateUser()
    if (!user?.publisher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ad unit belongs to publisher's app
    const existing = await prisma.adUnit.findFirst({
      where: {
        id: unitId,
        appId,
        app: { publisherId: user.publisher.id },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Ad unit not found' }, { status: 404 })
    }

    await prisma.adUnit.delete({
      where: { id: unitId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete ad unit error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
