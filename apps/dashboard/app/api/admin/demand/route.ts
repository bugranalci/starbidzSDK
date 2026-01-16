import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { encrypt, isEncryptionConfigured } from '@/lib/crypto'

// Simplified schemas for client-side mediation (TopOn style)
const gamConfigSchema = z.object({
  networkCode: z.string().nullable().optional(), // Optional - just for reference
})

const unityConfigSchema = z.object({
  gameIdAndroid: z.string().min(1),
  gameIdIos: z.string().min(1),
  // Report API credentials (optional)
  apiKey: z.string().nullable().optional(),
  organizationCoreId: z.string().nullable().optional(),
  // Auto Create Ad Source credentials (optional)
  keyId: z.string().nullable().optional(),
  secretKey: z.string().nullable().optional(),
})

const fyberConfigSchema = z.object({
  appIdAndroid: z.string().min(1),
  appIdIos: z.string().min(1),
  // Report API credentials (optional)
  publisherId: z.string().nullable().optional(),
  consumerKey: z.string().nullable().optional(),
  consumerSecret: z.string().nullable().optional(),
  // Auto Create Ad Source credentials (optional)
  clientId: z.string().nullable().optional(),
  clientSecret: z.string().nullable().optional(),
})

// ORTB still needs server-side config for programmatic bidding
const ortbConfigSchema = z.object({
  endpoint: z.string().url(),
  seatId: z.string().nullable().optional(),
  authHeader: z.string().nullable().optional(),
  authValue: z.string().nullable().optional(),
  timeout: z.number().min(50).max(500).default(200),
  qps: z.number().min(1).max(10000).default(100),
  bannerEnabled: z.boolean().default(true),
  bannerFloor: z.number().min(0).default(1.0),
  interstitialEnabled: z.boolean().default(true),
  interstitialFloor: z.number().min(0).default(5.0),
  rewardedEnabled: z.boolean().default(true),
  rewardedFloor: z.number().min(0).default(8.0),
})

const baseSchema = z.object({
  type: z.enum(['GAM', 'UNITY', 'FYBER', 'ORTB']),
  name: z.string().min(1).max(100),
  priority: z.number().min(1).default(1),
  config: z.record(z.unknown()), // Validate config separately based on type
})

function validateDemandSource(data: unknown) {
  const base = baseSchema.parse(data)

  // Validate config based on type
  let validatedConfig
  switch (base.type) {
    case 'GAM':
      validatedConfig = gamConfigSchema.parse(base.config)
      break
    case 'UNITY':
      validatedConfig = unityConfigSchema.parse(base.config)
      break
    case 'FYBER':
      validatedConfig = fyberConfigSchema.parse(base.config)
      break
    case 'ORTB':
      validatedConfig = ortbConfigSchema.parse(base.config)
      break
  }

  return { ...base, config: validatedConfig }
}

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

    // Mask sensitive credentials (only ORTB has sensitive data now)
    const maskedSources = demandSources.map((source: typeof demandSources[number]) =>
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

  if (!isEncryptionConfigured()) {
    return encrypted
  }

  // ORTB sensitive credentials
  if (type === 'ORTB') {
    if (encrypted.authValue && typeof encrypted.authValue === 'string') {
      encrypted.authValue = encrypt(encrypted.authValue)
    }
  }

  // Unity sensitive credentials
  if (type === 'UNITY') {
    if (encrypted.apiKey && typeof encrypted.apiKey === 'string') {
      encrypted.apiKey = encrypt(encrypted.apiKey)
    }
    if (encrypted.secretKey && typeof encrypted.secretKey === 'string') {
      encrypted.secretKey = encrypt(encrypted.secretKey)
    }
  }

  // Fyber sensitive credentials
  if (type === 'FYBER') {
    if (encrypted.consumerSecret && typeof encrypted.consumerSecret === 'string') {
      encrypted.consumerSecret = encrypt(encrypted.consumerSecret)
    }
    if (encrypted.clientSecret && typeof encrypted.clientSecret === 'string') {
      encrypted.clientSecret = encrypt(encrypted.clientSecret)
    }
  }

  return encrypted
}

/**
 * Mask sensitive fields for API response
 */
function maskCredentials(demandSource: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...demandSource }

  // ORTB sensitive data
  if (masked.ortbConfig && typeof masked.ortbConfig === 'object') {
    const ortbConfig = masked.ortbConfig as Record<string, unknown>
    if (ortbConfig.authValue) {
      masked.ortbConfig = { ...ortbConfig, authValue: '********' }
    }
  }

  // Unity sensitive data
  if (masked.unityConfig && typeof masked.unityConfig === 'object') {
    const unityConfig = masked.unityConfig as Record<string, unknown>
    const maskedUnityConfig = { ...unityConfig }
    if (maskedUnityConfig.apiKey) {
      maskedUnityConfig.apiKey = '********'
    }
    if (maskedUnityConfig.secretKey) {
      maskedUnityConfig.secretKey = '********'
    }
    masked.unityConfig = maskedUnityConfig
  }

  // Fyber sensitive data
  if (masked.fyberConfig && typeof masked.fyberConfig === 'object') {
    const fyberConfig = masked.fyberConfig as Record<string, unknown>
    const maskedFyberConfig = { ...fyberConfig }
    if (maskedFyberConfig.consumerSecret) {
      maskedFyberConfig.consumerSecret = '********'
    }
    if (maskedFyberConfig.clientSecret) {
      maskedFyberConfig.clientSecret = '********'
    }
    masked.fyberConfig = maskedFyberConfig
  }

  return masked
}

export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    console.log('Received demand source data:', JSON.stringify(body, null, 2))
    const data = validateDemandSource(body)

    // Encrypt sensitive credentials before storing (only ORTB)
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
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Create demand source error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
