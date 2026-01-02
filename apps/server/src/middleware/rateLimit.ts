import { Elysia } from 'elysia'
import { getRedis } from '../lib/redis'
import { DEFAULT_RATE_LIMIT_PER_MINUTE } from '@starbidz/shared'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: DEFAULT_RATE_LIMIT_PER_MINUTE, // 1000 requests per minute
}

// Per-app key limits (can be customized per publisher tier)
const appKeyLimits: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 10000, // 10k requests per minute per app
}

export const rateLimitMiddleware = new Elysia({ name: 'rateLimit' })
  .derive(async ({ request, set }) => {
    const redis = getRedis()

    // If Redis not configured, skip rate limiting
    if (!redis) {
      return {}
    }

    // Only apply to bid requests
    if (!request.url.includes('/v1/bid')) {
      return {}
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    try {
      // 1. IP-based rate limiting (global protection)
      const ipKey = `ratelimit:ip:${ip}`
      const ipCurrent = await redis.incr(ipKey)

      if (ipCurrent === 1) {
        await redis.expire(ipKey, Math.ceil(defaultConfig.windowMs / 1000))
      }

      if (ipCurrent > defaultConfig.maxRequests) {
        set.status = 429
        set.headers['Retry-After'] = String(Math.ceil(defaultConfig.windowMs / 1000))
        return { rateLimitError: 'Too many requests from this IP' }
      }

      // 2. App key based rate limiting (per-publisher isolation)
      // Try to extract app_key from request body
      let appKey: string | null = null
      try {
        const contentType = request.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const body = await request.clone().json()
          appKey = body?.app_key || null
        }
      } catch {
        // Ignore body parsing errors
      }

      if (appKey) {
        const appKeyRateKey = `ratelimit:app:${appKey}`
        const appCurrent = await redis.incr(appKeyRateKey)

        if (appCurrent === 1) {
          await redis.expire(appKeyRateKey, Math.ceil(appKeyLimits.windowMs / 1000))
        }

        if (appCurrent > appKeyLimits.maxRequests) {
          set.status = 429
          set.headers['Retry-After'] = String(Math.ceil(appKeyLimits.windowMs / 1000))
          return { rateLimitError: 'Rate limit exceeded for this app' }
        }

        // Add app-level rate limit headers
        set.headers['X-RateLimit-App-Limit'] = String(appKeyLimits.maxRequests)
        set.headers['X-RateLimit-App-Remaining'] = String(Math.max(0, appKeyLimits.maxRequests - appCurrent))
      }

      // Add IP-level rate limit headers
      set.headers['X-RateLimit-Limit'] = String(defaultConfig.maxRequests)
      set.headers['X-RateLimit-Remaining'] = String(Math.max(0, defaultConfig.maxRequests - ipCurrent))
      set.headers['X-RateLimit-Reset'] = String(Math.ceil(Date.now() / 1000) + Math.ceil(defaultConfig.windowMs / 1000))

      return {}
    } catch (error) {
      // On Redis error, allow the request through
      console.error('Rate limit error:', error)
      return {}
    }
  })
