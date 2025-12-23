import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { bidRoutes } from './routes/bid'
import { healthRoutes } from './routes/health'
import { eventRoutes } from './routes/events'
import { analyticsRoutes } from './routes/analytics'
import { authMiddleware } from './middleware/auth'
import { rateLimitMiddleware } from './middleware/rateLimit'
import { flushEvents } from './tracking'
import { connectorManager } from './connectors/manager'

// Initialize connector manager (loads configs from database)
await connectorManager.initialize()

const app = new Elysia()
  .use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://dashboard.starbidz.io', 'https://starbidz.io']
      : true,
    methods: ['GET', 'POST'],
    credentials: true
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'Starbidz Bid Server',
        version: '1.0.0',
        description: 'Ad bidding server for Starbidz SDK'
      }
    }
  }))
  // Apply middleware
  .use(rateLimitMiddleware)
  .use(authMiddleware)
  // Routes
  .use(healthRoutes)
  .use(bidRoutes)
  .use(eventRoutes)
  .use(analyticsRoutes)
  // Error handler for middleware errors
  .onBeforeHandle(({ authError, rateLimitError, set }) => {
    if (rateLimitError) {
      set.status = 429
      return { success: false, error: rateLimitError }
    }
    if (authError) {
      return { success: false, error: authError }
    }
  })
  .listen(process.env.PORT || 8080)

console.log(`🚀 Starbidz server running at http://${app.server?.hostname}:${app.server?.port}`)
console.log(`📚 Swagger docs at http://${app.server?.hostname}:${app.server?.port}/swagger`)

// Graceful shutdown - flush pending analytics events and close connections
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...')
  await Promise.all([
    flushEvents(),
    connectorManager.shutdown()
  ])
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...')
  await Promise.all([
    flushEvents(),
    connectorManager.shutdown()
  ])
  process.exit(0)
})

export type App = typeof app
