import { Elysia } from 'elysia'
import { prisma } from '../lib/db'
import { getRedis } from '../lib/redis'

interface AppInfo {
  id: string
  publisherId: string
  bundleId: string
  isActive: boolean
}

// Cache app keys in memory for 5 minutes
const appCache = new Map<string, { app: AppInfo; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function getAppByKey(appKey: string): Promise<AppInfo | null> {
  // Check memory cache first
  const cached = appCache.get(appKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.app
  }

  // Check Redis cache
  const redis = getRedis()
  if (redis) {
    try {
      const cachedApp = await redis.get<AppInfo>(`app:${appKey}`)
      if (cachedApp) {
        appCache.set(appKey, { app: cachedApp, expiresAt: Date.now() + CACHE_TTL_MS })
        return cachedApp
      }
    } catch {
      // Redis error, continue to DB
    }
  }

  // Query database
  const app = await prisma.app.findUnique({
    where: { appKey },
    select: {
      id: true,
      publisherId: true,
      bundleId: true,
      isActive: true,
    },
  })

  if (!app) return null

  // Cache the result
  appCache.set(appKey, { app, expiresAt: Date.now() + CACHE_TTL_MS })

  if (redis) {
    try {
      await redis.set(`app:${appKey}`, app, { ex: 300 }) // 5 minutes
    } catch {
      // Redis error, ignore
    }
  }

  return app
}

export const authMiddleware = new Elysia({ name: 'auth' })
  .derive(async ({ body, set, request }) => {
    // Only apply to bid requests
    if (!request.url.includes('/v1/bid')) {
      return {}
    }

    const bidBody = body as { app_key?: string } | undefined

    if (!bidBody?.app_key) {
      set.status = 401
      return { authError: 'Missing app_key' }
    }

    const app = await getAppByKey(bidBody.app_key)

    if (!app) {
      set.status = 401
      return { authError: 'Invalid app_key' }
    }

    if (!app.isActive) {
      set.status = 403
      return { authError: 'App is inactive' }
    }

    return { app }
  })
