import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

const TINYBIRD_API_URL = process.env.TINYBIRD_API_URL || 'https://api.us-east.aws.tinybird.co'
const TINYBIRD_API_KEY = process.env.TINYBIRD_API_KEY

interface TinybirdResponse<T> {
  data: T[]
  meta: { name: string; type: string }[]
  rows: number
  statistics: { elapsed: number; rows_read: number; bytes_read: number }
}

async function queryTinybird<T>(pipe: string, params: Record<string, string> = {}): Promise<T[]> {
  if (!TINYBIRD_API_KEY) {
    console.warn('TINYBIRD_API_KEY not set')
    return []
  }

  const searchParams = new URLSearchParams(params)
  const url = `${TINYBIRD_API_URL}/v0/pipes/${pipe}.json?${searchParams.toString()}`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TINYBIRD_API_KEY}`,
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      console.error(`Tinybird error: ${response.status} ${response.statusText}`)
      return []
    }

    const result: TinybirdResponse<T> = await response.json()
    return result.data
  } catch (error) {
    console.error('Tinybird query failed:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'daily'
  const startDate = searchParams.get('start_date') || '2025-01-01'
  const endDate = searchParams.get('end_date') || '2025-12-31'
  const publisherId = searchParams.get('publisher_id') || ''
  const appKey = searchParams.get('app_key') || ''

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { publisher: true },
  })

  const isAdmin = user?.role === 'ADMIN'

  // Build params
  const params: Record<string, string> = {
    start_date: startDate,
    end_date: endDate,
  }

  // Non-admins can only see their own data
  if (!isAdmin && user?.publisher) {
    params.publisher_id = user.publisher.id
  } else if (publisherId) {
    params.publisher_id = publisherId
  }

  if (appKey) {
    params.app_key = appKey
  }

  let data: unknown[] = []

  switch (type) {
    case 'daily':
      data = await queryTinybird('daily_stats', params)
      break
    case 'demand_sources':
      data = await queryTinybird('demand_source_stats', params)
      break
    case 'countries':
      data = await queryTinybird('country_stats', params)
      break
    case 'formats':
      data = await queryTinybird('format_stats', params)
      break
    case 'publisher':
      if (params.publisher_id) {
        data = await queryTinybird('publisher_stats', params)
      }
      break
    default:
      data = await queryTinybird('daily_stats', params)
  }

  return NextResponse.json({ success: true, data })
}
