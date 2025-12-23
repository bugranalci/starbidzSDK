import { NextResponse } from 'next/server'
import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateAppKey } from '@/lib/utils'
import { z } from 'zod'

const createAppSchema = z.object({
  name: z.string().min(1).max(100),
  bundleId: z.string().min(1).max(200),
  platform: z.enum(['ANDROID', 'IOS', 'BOTH']),
  mediation: z.enum(['MAX', 'ADMOB', 'LEVELPLAY']),
  storeUrl: z.string().url().nullable().optional(),
})

export async function GET() {
  try {
    const user = await getOrCreateUser()
    if (!user?.publisher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apps = await prisma.app.findMany({
      where: { publisherId: user.publisher.id },
      include: { _count: { select: { adUnits: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(apps)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    if (!user?.publisher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = createAppSchema.parse(body)

    const app = await prisma.app.create({
      data: {
        ...data,
        publisherId: user.publisher.id,
        appKey: generateAppKey(),
      },
    })

    return NextResponse.json(app)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create app error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
