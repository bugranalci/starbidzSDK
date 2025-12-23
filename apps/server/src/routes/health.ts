import { Elysia } from 'elysia'
import { connectorManager } from '../connectors/manager'

export const healthRoutes = new Elysia()
  .get('/health', () => {
    const connectorStatus = connectorManager.getStatus()
    const activeCount = connectorStatus.filter(c => c.isActive).length

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      connectors: {
        total: connectorStatus.length,
        active: activeCount
      }
    }
  })
  .get('/health/connectors', () => {
    return {
      connectors: connectorManager.getStatus(),
      timestamp: new Date().toISOString()
    }
  })
  .post('/health/connectors/refresh', async () => {
    await connectorManager.refresh()
    return {
      success: true,
      connectors: connectorManager.getStatus(),
      timestamp: new Date().toISOString()
    }
  })
  .get('/', () => ({
    name: 'Starbidz Bid Server',
    version: '1.0.0',
    docs: '/swagger'
  }))
