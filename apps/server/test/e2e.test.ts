/**
 * End-to-End Bid Flow Tests
 *
 * Tests the complete bid flow: SDK Request → Server → Demand Sources → Response
 *
 * Run with: bun test test/e2e.test.ts
 */

import { describe, test, expect, beforeAll } from 'bun:test'

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:8080'

interface BidRequest {
  app_key: string
  placement_id: string
  format: 'banner' | 'interstitial' | 'rewarded'
  width?: number
  height?: number
  device?: {
    os: string
    osv: string
    make: string
    model: string
    ifa?: string
    connectionType: string
  }
  app?: {
    bundle: string
    version: string
    name: string
  }
  test: boolean
}

interface BidResponse {
  success: boolean
  bid?: {
    id: string
    price: number
    currency: string
    demand_source: string
    creative: {
      type: 'html' | 'vast' | 'image'
      content: string
      width?: number
      height?: number
    }
    nurl?: string
    burl?: string
  }
  error?: string
  latency_ms?: number
}

const testDevice = {
  os: 'android',
  osv: '14',
  make: 'Google',
  model: 'Pixel 8',
  ifa: 'test-advertising-id-12345',
  connectionType: 'wifi',
}

const testApp = {
  bundle: 'com.test.app',
  version: '1.0.0',
  name: 'Test App',
}

async function sendBidRequest(request: BidRequest): Promise<BidResponse> {
  const response = await fetch(`${SERVER_URL}/v1/bid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  return response.json()
}

describe('E2E Bid Flow Tests', () => {
  beforeAll(async () => {
    // Check if server is running
    try {
      const health = await fetch(`${SERVER_URL}/health`)
      if (!health.ok) {
        throw new Error('Server not healthy')
      }
    } catch (error) {
      console.error('Server not running. Start with: bun run dev')
      process.exit(1)
    }
  })

  describe('Health Check', () => {
    test('server should be healthy', async () => {
      const response = await fetch(`${SERVER_URL}/health`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('ok')
    })
  })

  describe('Banner Ads', () => {
    test('should return bid for 320x50 banner', async () => {
      const response = await sendBidRequest({
        app_key: 'sbz_test_app_key',
        placement_id: 'sbz_test_banner',
        format: 'banner',
        width: 320,
        height: 50,
        device: testDevice,
        app: testApp,
        test: true,
      })

      expect(response.success).toBe(true)
      expect(response.bid).toBeDefined()
      expect(response.bid!.price).toBeGreaterThan(0)
      expect(response.bid!.creative.type).toBe('html')
      expect(response.bid!.creative.width).toBe(320)
      expect(response.bid!.creative.height).toBe(50)
    })

    test('should return bid for 300x250 MREC', async () => {
      const response = await sendBidRequest({
        app_key: 'sbz_test_app_key',
        placement_id: 'sbz_test_mrec',
        format: 'banner',
        width: 300,
        height: 250,
        device: testDevice,
        app: testApp,
        test: true,
      })

      expect(response.success).toBe(true)
      expect(response.bid).toBeDefined()
      expect(response.bid!.creative.width).toBe(300)
      expect(response.bid!.creative.height).toBe(250)
    })
  })

  describe('Interstitial Ads', () => {
    test('should return VAST creative for interstitial', async () => {
      const response = await sendBidRequest({
        app_key: 'sbz_test_app_key',
        placement_id: 'sbz_test_interstitial',
        format: 'interstitial',
        device: testDevice,
        app: testApp,
        test: true,
      })

      expect(response.success).toBe(true)
      expect(response.bid).toBeDefined()
      expect(response.bid!.price).toBeGreaterThan(0)
      expect(response.bid!.creative.type).toBe('vast')
      expect(response.bid!.creative.content).toContain('<VAST')
    })
  })

  describe('Rewarded Ads', () => {
    test('should return highest price for rewarded', async () => {
      const response = await sendBidRequest({
        app_key: 'sbz_test_app_key',
        placement_id: 'sbz_test_rewarded',
        format: 'rewarded',
        device: testDevice,
        app: testApp,
        test: true,
      })

      expect(response.success).toBe(true)
      expect(response.bid).toBeDefined()
      // Rewarded typically has higher eCPM
      expect(response.bid!.price).toBeGreaterThan(5)
      expect(response.bid!.creative.type).toBe('vast')
    })
  })

  describe('Demand Source Selection', () => {
    test('should include demand_source in response', async () => {
      const response = await sendBidRequest({
        app_key: 'sbz_test_app_key',
        placement_id: 'sbz_test_banner',
        format: 'banner',
        width: 320,
        height: 50,
        device: testDevice,
        app: testApp,
        test: true,
      })

      expect(response.success).toBe(true)
      expect(response.bid!.demand_source).toBeDefined()
      expect(['gam', 'unity', 'fyber', 'ortb']).toContain(response.bid!.demand_source)
    })
  })

  describe('Latency', () => {
    test('should respond within 300ms', async () => {
      const start = Date.now()

      await sendBidRequest({
        app_key: 'sbz_test_app_key',
        placement_id: 'sbz_test_banner',
        format: 'banner',
        width: 320,
        height: 50,
        device: testDevice,
        app: testApp,
        test: true,
      })

      const latency = Date.now() - start
      expect(latency).toBeLessThan(300)
    })
  })

  describe('Error Handling', () => {
    test('should handle missing app_key', async () => {
      const response = await fetch(`${SERVER_URL}/v1/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_id: 'test',
          format: 'banner',
          test: true,
        }),
      })

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    test('should handle invalid format', async () => {
      const response = await fetch(`${SERVER_URL}/v1/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_key: 'sbz_test',
          placement_id: 'test',
          format: 'invalid_format',
          test: true,
        }),
      })

      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('Event Tracking', () => {
    test('should accept impression event', async () => {
      const response = await fetch(`${SERVER_URL}/v1/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'impression',
          bid_id: 'test_bid_123',
          placement_id: 'sbz_test_banner',
          timestamp: Date.now(),
        }),
      })

      expect(response.status).toBe(200)
    })

    test('should accept click event', async () => {
      const response = await fetch(`${SERVER_URL}/v1/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'click',
          bid_id: 'test_bid_123',
          placement_id: 'sbz_test_banner',
          timestamp: Date.now(),
        }),
      })

      expect(response.status).toBe(200)
    })
  })
})

// Quick manual test runner
if (import.meta.main) {
  console.log('Running quick E2E test...\n')

  const response = await sendBidRequest({
    app_key: 'sbz_test_app_key',
    placement_id: 'sbz_test_banner',
    format: 'banner',
    width: 320,
    height: 50,
    device: testDevice,
    app: testApp,
    test: true,
  })

  console.log('Bid Response:')
  console.log(JSON.stringify(response, null, 2))

  if (response.success && response.bid) {
    console.log('\n✅ E2E Test PASSED')
    console.log(`   Price: $${response.bid.price.toFixed(2)} CPM`)
    console.log(`   Source: ${response.bid.demand_source}`)
    console.log(`   Creative: ${response.bid.creative.type}`)
  } else {
    console.log('\n❌ E2E Test FAILED')
    console.log(`   Error: ${response.error}`)
  }
}
