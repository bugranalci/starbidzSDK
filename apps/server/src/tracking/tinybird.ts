/**
 * Tinybird Analytics Client
 *
 * Tinybird provides real-time analytics on top of ClickHouse.
 * Events are sent via HTTP and stored in ClickHouse for fast querying.
 */

interface TinybirdConfig {
  apiKey: string
  apiUrl: string
}

interface EventPayload {
  timestamp: string
  event_type: string
  placement_id: string
  app_key: string
  demand_source: string | null
  bid_price: number | null
  win_price: number | null
  country: string | null
  device_type: string | null
  os: string | null
  os_version: string | null
  app_version: string | null
  format: string | null
  latency_ms: number | null
  request_id: string | null
}

class TinybirdClient {
  private config: TinybirdConfig | null = null
  private eventQueue: EventPayload[] = []
  private flushInterval: ReturnType<typeof setInterval> | null = null
  private readonly BATCH_SIZE = 100
  private readonly FLUSH_INTERVAL_MS = 5000 // 5 seconds

  constructor() {
    this.init()
  }

  private init() {
    const apiKey = process.env.TINYBIRD_API_KEY
    const apiUrl = process.env.TINYBIRD_API_URL || 'https://api.tinybird.co'

    if (!apiKey) {
      console.warn('TINYBIRD_API_KEY not configured - analytics disabled')
      return
    }

    this.config = { apiKey, apiUrl }

    // Start flush interval
    this.flushInterval = setInterval(() => {
      this.flush()
    }, this.FLUSH_INTERVAL_MS)

    console.log('Tinybird analytics initialized')
  }

  /**
   * Send event to Tinybird
   */
  async sendEvent(event: Omit<EventPayload, 'timestamp'>): Promise<void> {
    if (!this.config) return

    const payload: EventPayload = {
      ...event,
      timestamp: new Date().toISOString(),
    }

    this.eventQueue.push(payload)

    // Flush if batch size reached
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      await this.flush()
    }
  }

  /**
   * Flush queued events to Tinybird
   */
  async flush(): Promise<void> {
    if (!this.config || this.eventQueue.length === 0) return

    const events = this.eventQueue.splice(0, this.BATCH_SIZE)

    try {
      // Tinybird expects NDJSON format (newline-delimited JSON)
      const ndjson = events.map(e => JSON.stringify(e)).join('\n')

      const response = await fetch(
        `${this.config.apiUrl}/v0/events?name=ad_events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/x-ndjson',
          },
          body: ndjson,
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error('Tinybird flush error:', error)
        // Put events back in queue for retry
        this.eventQueue.unshift(...events)
      }
    } catch (error) {
      console.error('Tinybird flush error:', error)
      // Put events back in queue for retry
      this.eventQueue.unshift(...events)
    }
  }

  /**
   * Query Tinybird pipe (for reports)
   */
  async query<T = unknown>(pipeName: string, params?: Record<string, string>): Promise<T[]> {
    if (!this.config) {
      return []
    }

    try {
      const searchParams = new URLSearchParams(params)
      const url = `${this.config.apiUrl}/v0/pipes/${pipeName}.json?${searchParams}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Tinybird query error:', error)
        return []
      }

      const result = await response.json()
      return result.data as T[]
    } catch (error) {
      console.error('Tinybird query error:', error)
      return []
    }
  }

  /**
   * Check if Tinybird is configured
   */
  isConfigured(): boolean {
    return this.config !== null
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    await this.flush()
  }
}

// Singleton instance
export const tinybird = new TinybirdClient()
