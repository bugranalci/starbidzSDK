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

    const key = `ratelimit:${ip}`

    try {
      const current = await redis.incr(key)

      // Set expiry on first request
      if (current === 1) {
        await redis.expire(key, Math.ceil(defaultConfig.windowMs / 1000))
      }

      // Check if over limit
      if (current > defaultConfig.maxRequests) {
        set.status = 429
        set.headers['Retry-After'] = String(Math.ceil(defaultConfig.windowMs / 1000))
        return { rateLimitError: 'Too many requests' }
      }

      // Add rate limit headers
      set.headers['X-RateLimit-Limit'] = String(defaultConfig.maxRequests)
      set.headers['X-RateLimit-Remaining'] = String(Math.max(0, defaultConfig.maxRequests - current))
      set.headers['X-RateLimit-Reset'] = String(Math.ceil(Date.now() / 1000) + Math.ceil(defaultConfig.windowMs / 1000))

      return {}
    } catch (error) {
      // On Redis error, allow the request through
      console.error('Rate limit error:', error)
      return {}
    }
  })
