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

const createAdUnitSchema = z.object({
  externalId: z.string().min(1),
  format: z.enum(['BANNER', 'INTERSTITIAL', 'REWARDED']),
  bidFloor: z.number().min(0),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
})

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
        externalId: data.externalId,
        format: data.format,
        bidFloor: data.bidFloor,
        width: data.format === 'BANNER' ? data.width : null,
        height: data.format === 'BANNER' ? data.height : null,
      },
    })

    return NextResponse.json(adUnit)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create demand ad unit error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
