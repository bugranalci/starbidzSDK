import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { encrypt, isEncryptionConfigured } from '@/lib/crypto'

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

/**
 * Encrypt sensitive credential fields before storing
 */
function encryptCredentialField(type: string, fieldName: string, value: unknown): unknown {
  if (!value || typeof value !== 'string') return value
  if (!isEncryptionConfigured()) return value

  const sensitiveFields: Record<string, string[]> = {
    GAM: ['credentials'],
    UNITY: ['apiKey'],
    FYBER: ['securityToken'],
    ORTB: ['authValue'],
  }

  if (sensitiveFields[type]?.includes(fieldName)) {
    return encrypt(value)
  }

  return value
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const demandSource = await prisma.demandSource.findUnique({
      where: { id },
      include: {
        gamConfig: true,
        unityConfig: true,
        fyberConfig: true,
        ortbConfig: true,
        adUnits: true,
      },
    })

    if (!demandSource) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Mask sensitive credentials before returning
    return NextResponse.json(maskCredentials(demandSource as unknown as Record<string, unknown>))
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

const updateDemandSourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  priority: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const data = updateDemandSourceSchema.parse(body)

    const existing = await prisma.demandSource.findUnique({
      where: { id },
      include: {
        gamConfig: true,
        unityConfig: true,
        fyberConfig: true,
        ortbConfig: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Update the demand source
    const updated = await prisma.demandSource.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        gamConfig: true,
        unityConfig: true,
        fyberConfig: true,
        ortbConfig: true,
      },
    })

    // Update config if provided (with encryption for sensitive fields)
    if (data.config) {
      const configData = data.config as Record<string, unknown>

      // Encrypt sensitive fields before updating
      const encryptedConfig: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(configData)) {
        encryptedConfig[key] = encryptCredentialField(existing.type, key, value)
      }

      if (existing.type === 'GAM' && existing.gamConfig) {
        await prisma.gamConfig.update({
          where: { id: existing.gamConfig.id },
          data: encryptedConfig as any,
        })
      } else if (existing.type === 'UNITY' && existing.unityConfig) {
        await prisma.unityConfig.update({
          where: { id: existing.unityConfig.id },
          data: encryptedConfig as any,
        })
      } else if (existing.type === 'FYBER' && existing.fyberConfig) {
        await prisma.fyberConfig.update({
          where: { id: existing.fyberConfig.id },
          data: encryptedConfig as any,
        })
      } else if (existing.type === 'ORTB' && existing.ortbConfig) {
        await prisma.ortbConfig.update({
          where: { id: existing.ortbConfig.id },
          data: encryptedConfig as any,
        })
      }
    }

    // Return masked credentials
    return NextResponse.json(maskCredentials(updated as unknown as Record<string, unknown>))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Update demand source error:', error)
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

    const existing = await prisma.demandSource.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.demandSource.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Delete demand source error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
