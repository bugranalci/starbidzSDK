import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { encrypt, isEncryptionConfigured } from '@/lib/crypto'

const gamConfigSchema = z.object({
  networkCode: z.string().min(1),
  credentials: z.string().nullable().optional(),
})

const unityConfigSchema = z.object({
  organizationId: z.string().min(1),
  gameIdAndroid: z.string().min(1),
  gameIdIos: z.string().min(1),
  apiKey: z.string().nullable().optional(),
})

const fyberConfigSchema = z.object({
  appId: z.string().min(1),
  securityToken: z.string().min(1),
})

const ortbConfigSchema = z.object({
  endpoint: z.string().url(),
  seatId: z.string().nullable().optional(),
  authHeader: z.string().nullable().optional(),
  authValue: z.string().nullable().optional(),
  timeout: z.number().min(50).max(500).default(200),
  bannerEnabled: z.boolean().default(true),
  bannerFloor: z.number().min(0).default(1.0),
  interstitialEnabled: z.boolean().default(true),
  interstitialFloor: z.number().min(0).default(5.0),
  rewardedEnabled: z.boolean().default(true),
  rewardedFloor: z.number().min(0).default(8.0),
})

const createDemandSourceSchema = z.object({
  type: z.enum(['GAM', 'UNITY', 'FYBER', 'ORTB']),
  name: z.string().min(1).max(100),
  priority: z.number().min(1).default(1),
  config: z.union([gamConfigSchema, unityConfigSchema, fyberConfigSchema, ortbConfigSchema]),
})

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

export async function GET() {
  try {
    await requireAdmin()

    const demandSources = await prisma.demandSource.findMany({
      include: {
        gamConfig: true,
        unityConfig: true,
        fyberConfig: true,
        ortbConfig: true,
        _count: { select: { adUnits: true } },
      },
      orderBy: { priority: 'asc' },
    })

    // Mask all sensitive credentials before returning
    const maskedSources = demandSources.map((source) =>
      maskCredentials(source as unknown as Record<string, unknown>)
    )

    return NextResponse.json(maskedSources)
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * Encrypt sensitive credential fields before storing
 */
function encryptCredentials(type: string, config: Record<string, unknown>): Record<string, unknown> {
  const encrypted = { ...config }

  // Only encrypt if encryption is configured
  if (!isEncryptionConfigured()) {
    console.warn('ENCRYPTION_KEY not configured - storing credentials in plain text')
    return encrypted
  }

  switch (type) {
    case 'GAM':
      if (encrypted.credentials && typeof encrypted.credentials === 'string') {
        encrypted.credentials = encrypt(encrypted.credentials)
      }
      break
    case 'UNITY':
      if (encrypted.apiKey && typeof encrypted.apiKey === 'string') {
        encrypted.apiKey = encrypt(encrypted.apiKey)
      }
      break
    case 'FYBER':
      if (encrypted.securityToken && typeof encrypted.securityToken === 'string') {
        encrypted.securityToken = encrypt(encrypted.securityToken)
      }
      break
    case 'ORTB':
      if (encrypted.authValue && typeof encrypted.authValue === 'string') {
        encrypted.authValue = encrypt(encrypted.authValue)
      }
      break
  }

  return encrypted
}

/**
 * Mask sensitive fields for API response
 */
function maskCredentials(demandSource: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...demandSource }

  if (masked.gamConfig && typeof masked.gamConfig === 'object') {
    const gamConfig = masked.gamConfig as Record<string, unknown>
    if (gamConfig.credentials) {
      masked.gamConfig = { ...gamConfig, credentials: '***ENCRYPTED***' }
    }
  }

  if (masked.unityConfig && typeof masked.unityConfig === 'object') {
    const unityConfig = masked.unityConfig as Record<string, unknown>
    if (unityConfig.apiKey) {
      masked.unityConfig = { ...unityConfig, apiKey: '***ENCRYPTED***' }
    }
  }

  if (masked.fyberConfig && typeof masked.fyberConfig === 'object') {
    const fyberConfig = masked.fyberConfig as Record<string, unknown>
    if (fyberConfig.securityToken) {
      masked.fyberConfig = { ...fyberConfig, securityToken: '***ENCRYPTED***' }
    }
  }

  if (masked.ortbConfig && typeof masked.ortbConfig === 'object') {
    const ortbConfig = masked.ortbConfig as Record<string, unknown>
    if (ortbConfig.authValue) {
      masked.ortbConfig = { ...ortbConfig, authValue: '***ENCRYPTED***' }
    }
  }

  return masked
}

export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const data = createDemandSourceSchema.parse(body)

    // Encrypt sensitive credentials before storing
    const encryptedConfig = encryptCredentials(data.type, data.config as Record<string, unknown>)

    const demandSource = await prisma.demandSource.create({
      data: {
        type: data.type,
        name: data.name,
        priority: data.priority,
        ...(data.type === 'GAM' && {
          gamConfig: {
            create: gamConfigSchema.parse(encryptedConfig),
          },
        }),
        ...(data.type === 'UNITY' && {
          unityConfig: {
            create: unityConfigSchema.parse(encryptedConfig),
          },
        }),
        ...(data.type === 'FYBER' && {
          fyberConfig: {
            create: fyberConfigSchema.parse(encryptedConfig),
          },
        }),
        ...(data.type === 'ORTB' && {
          ortbConfig: {
            create: ortbConfigSchema.parse(encryptedConfig),
          },
        }),
      },
      include: {
        gamConfig: true,
        unityConfig: true,
        fyberConfig: true,
        ortbConfig: true,
      },
    })

    // Return masked credentials in response
    return NextResponse.json(maskCredentials(demandSource as unknown as Record<string, unknown>))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Create demand source error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
