import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const publisher = await prisma.publisher.findUnique({
      where: { id },
      include: {
        apps: {
          include: {
            adUnits: true,
          },
        },
      },
    })

    if (!publisher) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(publisher)
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

const updatePublisherSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  company: z.string().nullable().optional(),
  webhookUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const data = updatePublisherSchema.parse(body)

    const existing = await prisma.publisher.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await prisma.publisher.update({
      where: { id },
      data,
      include: {
        apps: true,
        _count: { select: { apps: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Update publisher error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const existing = await prisma.publisher.findUnique({
      where: { id },
      include: { _count: { select: { apps: true } } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Don't delete if publisher has apps
    if (existing._count.apps > 0) {
      return NextResponse.json(
        { error: 'Cannot delete publisher with active apps' },
        { status: 400 }
      )
    }

    await prisma.publisher.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Delete publisher error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Reset API key
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()

    if (body.action === 'reset-api-key') {
      const existing = await prisma.publisher.findUnique({
        where: { id },
      })

      if (!existing) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      const newApiKey = `stb_${crypto.randomBytes(24).toString('hex')}`

      const updated = await prisma.publisher.update({
        where: { id },
        data: { apiKey: newApiKey },
      })

      return NextResponse.json({ apiKey: updated.apiKey })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Publisher action error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
