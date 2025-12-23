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

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { company: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [publishers, total] = await Promise.all([
      prisma.publisher.findMany({
        where,
        include: {
          apps: true,
          _count: { select: { apps: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.publisher.count({ where }),
    ])

    return NextResponse.json({
      data: publishers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

const createPublisherSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  company: z.string().nullable().optional(),
  webhookUrl: z.string().url().nullable().optional(),
})

export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const data = createPublisherSchema.parse(body)

    // Check if publisher with email already exists
    const existing = await prisma.publisher.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Publisher with this email already exists' },
        { status: 409 }
      )
    }

    // Generate API key
    const apiKey = `stb_${crypto.randomBytes(24).toString('hex')}`

    const publisher = await prisma.publisher.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company,
        webhookUrl: data.webhookUrl,
        apiKey,
      },
      include: {
        _count: { select: { apps: true } },
      },
    })

    return NextResponse.json(publisher)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Create publisher error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
