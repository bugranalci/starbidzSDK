import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

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

const updateMarginSchema = z.object({
  margin: z.number().min(0).max(1), // 0-1 (0% to 100%)
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { margin } = updateMarginSchema.parse(body)

    const existing = await prisma.publisher.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 })
    }

    const updated = await prisma.publisher.update({
      where: { id },
      data: { margin },
      select: {
        id: true,
        margin: true,
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
    console.error('Update margin error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
