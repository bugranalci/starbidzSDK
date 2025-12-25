import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateAppSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  storeUrl: z.string().url().nullable().optional(),
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

    const app = await prisma.app.findFirst({
      where: {
        id: appId,
        publisherId: user.publisher.id,
      },
      include: {
        adUnits: true,
      },
    })

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    return NextResponse.json(app)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(
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
    const existing = await prisma.app.findFirst({
      where: {
        id: appId,
        publisherId: user.publisher.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    const body = await req.json()
    const data = updateAppSchema.parse(body)

    const app = await prisma.app.update({
      where: { id: appId },
      data,
    })

    return NextResponse.json(app)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Update app error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
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
    const existing = await prisma.app.findFirst({
      where: {
        id: appId,
        publisherId: user.publisher.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    await prisma.app.delete({
      where: { id: appId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete app error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
