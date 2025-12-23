import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'

async function getPublisher() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { publisher: true },
  })

  if (!user?.publisher) {
    throw new Error('Publisher not found')
  }

  return { user, publisher: user.publisher }
}

export async function GET() {
  try {
    const { user, publisher } = await getPublisher()

    return NextResponse.json({
      profile: {
        name: user.name,
        email: user.email,
      },
      company: {
        name: publisher.name,
        companyName: publisher.company,
        email: publisher.email,
      },
      api: {
        apiKey: publisher.apiKey,
        webhookUrl: publisher.webhookUrl,
      },
      billing: {
        paymentMethod: null, // Would come from Stripe or similar
        billingEmail: publisher.email,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Publisher not found') {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

const updateSettingsSchema = z.object({
  section: z.enum(['profile', 'company', 'api', 'billing']),
  data: z.record(z.unknown()),
})

export async function PUT(req: Request) {
  try {
    const { user, publisher } = await getPublisher()
    const body = await req.json()
    const { section, data } = updateSettingsSchema.parse(body)

    switch (section) {
      case 'profile':
        await prisma.user.update({
          where: { id: user.id },
          data: {
            name: data.name as string | undefined,
          },
        })
        break

      case 'company':
        await prisma.publisher.update({
          where: { id: publisher.id },
          data: {
            name: data.name as string | undefined,
            company: data.companyName as string | undefined,
          },
        })
        break

      case 'api':
        if (data.webhookUrl !== undefined) {
          await prisma.publisher.update({
            where: { id: publisher.id },
            data: {
              webhookUrl: data.webhookUrl as string | null,
            },
          })
        }
        break

      case 'billing':
        // Would integrate with Stripe or similar
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'Publisher not found') {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Regenerate API key
export async function POST(req: Request) {
  try {
    const { publisher } = await getPublisher()
    const body = await req.json()

    if (body.action === 'regenerate-api-key') {
      const newApiKey = `stb_${crypto.randomBytes(24).toString('hex')}`

      await prisma.publisher.update({
        where: { id: publisher.id },
        data: { apiKey: newApiKey },
      })

      return NextResponse.json({ apiKey: newApiKey })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Publisher not found') {
      return NextResponse.json({ error: 'Publisher not found' }, { status: 404 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Settings action error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
