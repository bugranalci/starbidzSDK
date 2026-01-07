'use client'

import { useState, useEffect } from 'react'

interface Publisher {
  id: string
  name: string | null
  company: string | null
  margin: number
  user: { email: string }
}

interface App {
  id: string
  name: string
  bundleId: string
  platform: string
}

interface AdUnit {
  id: string
  name: string
  format: string
  placementId: string
}

interface ReportData {
  bidRequests: number
  impressions: number
  fillRate: number
  ecpm: number
  grossRevenue: number
  netRevenue: number
  breakdown: {
    date: string
    bidRequests: number
    impressions: number
    grossRevenue: number
  }[]
  byAdUnit: {
    id: string
    name: string
    format: string
    bidRequests: number
    impressions: number
    fillRate: number
    ecpm: number
    grossRevenue: number
    netRevenue: number
  }[]
}

export default function AdminReportsPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [adUnits, setAdUnits] = useState<AdUnit[]>([])

  const [selectedPublisher, setSelectedPublisher] = useState<string>('')
  const [selectedApp, setSelectedApp] = useState<string>('')
  const [dateRange, setDateRange] = useState('30d')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch publishers on mount
  useEffect(() => {
    fetchPublishers()
  }, [])

  // Fetch apps when publisher changes
  useEffect(() => {
    if (selectedPublisher) {
      fetchApps(selectedPublisher)
      setSelectedApp('')
      setAdUnits([])
    } else {
      setApps([])
      setSelectedApp('')
      setAdUnits([])
    }
  }, [selectedPublisher])

  // Fetch ad units when app changes
  useEffect(() => {
    if (selectedApp) {
      fetchAdUnits(selectedApp)
    } else {
      setAdUnits([])
    }
  }, [selectedApp])

  // Fetch report data when filters change
  useEffect(() => {
    fetchReportData()
  }, [selectedPublisher, selectedApp, dateRange, customStartDate, customEndDate])

  async function fetchPublishers() {
    try {
      const res = await fetch('/api/admin/publishers')
      const data = await res.json()
      setPublishers(data.data || [])
    } catch (err) {
      console.error('Failed to fetch publishers:', err)
    }
  }

  async function fetchApps(publisherId: string) {
    try {
      const res = await fetch(`/api/admin/publishers/${publisherId}`)
      const data = await res.json()
      setApps(data.apps || [])
    } catch (err) {
      console.error('Failed to fetch apps:', err)
    }
  }

  async function fetchAdUnits(appId: string) {
    try {
      // For now, we'll get ad units from the app data
      const app = apps.find(a => a.id === appId)
      if (app) {
        // This would need an API endpoint - using mock for now
        setAdUnits([])
      }
    } catch (err) {
      console.error('Failed to fetch ad units:', err)
    }
  }

  async function fetchReportData() {
    setLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams()
      if (selectedPublisher) params.set('publisherId', selectedPublisher)
      if (selectedApp) params.set('appId', selectedApp)
      params.set('dateRange', dateRange)
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.set('startDate', customStartDate)
        params.set('endDate', customEndDate)
      }

      const res = await fetch(`/api/admin/reports?${params.toString()}`)
      const data = await res.json()
      setReportData(data)
    } catch (err) {
      console.error('Failed to fetch report data:', err)
      // Use mock data for now
      setReportData(generateMockData())
    } finally {
      setLoading(false)
    }
  }

  function generateMockData(): ReportData {
    const margin = selectedPublisher
      ? publishers.find(p => p.id === selectedPublisher)?.margin || 0.20
      : 0.20
    const grossRevenue = Math.random() * 50000 + 10000
    const netRevenue = grossRevenue * (1 - margin)

    return {
      bidRequests: Math.floor(Math.random() * 1000000 + 500000),
      impressions: Math.floor(Math.random() * 800000 + 400000),
      fillRate: Math.random() * 20 + 70,
      ecpm: Math.random() * 5 + 5,
      grossRevenue,
      netRevenue,
      breakdown: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bidRequests: Math.floor(Math.random() * 100000 + 50000),
        impressions: Math.floor(Math.random() * 80000 + 40000),
        grossRevenue: Math.random() * 5000 + 1000,
      })).reverse(),
      byAdUnit: [
        { id: '1', name: 'Banner - Home', format: 'BANNER', bidRequests: 250000, impressions: 200000, fillRate: 80, ecpm: 3.5, grossRevenue: 700, netRevenue: 700 * (1 - margin) },
        { id: '2', name: 'Interstitial - Level Complete', format: 'INTERSTITIAL', bidRequests: 150000, impressions: 120000, fillRate: 80, ecpm: 12, grossRevenue: 1440, netRevenue: 1440 * (1 - margin) },
        { id: '3', name: 'Rewarded - Extra Lives', format: 'REWARDED', bidRequests: 100000, impressions: 85000, fillRate: 85, ecpm: 18, grossRevenue: 1530, netRevenue: 1530 * (1 - margin) },
      ],
    }
  }

  const selectedPublisherData = publishers.find(p => p.id === selectedPublisher)
  const marginPercent = selectedPublisherData ? (selectedPublisherData.margin * 100).toFixed(0) : '20'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports</h1>
          <p className="text-gray-400">Platform-wide analytics and reporting</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Publisher Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Publisher</label>
            <select
              value={selectedPublisher}
              onChange={(e) => setSelectedPublisher(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
            >
              <option value="">All Publishers</option>
              {publishers.map((pub) => (
                <option key={pub.id} value={pub.id} className="bg-gray-900">
                  {pub.company || pub.name || pub.user.email}
                </option>
              ))}
            </select>
          </div>

          {/* App Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">App</label>
            <select
              value={selectedApp}
              onChange={(e) => setSelectedApp(e.target.value)}
              disabled={!selectedPublisher}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500 disabled:opacity-50"
            >
              <option value="">All Apps</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id} className="bg-gray-900">
                  {app.name} ({app.platform})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
            >
              <option value="7d" className="bg-gray-900">Last 7 days</option>
              <option value="30d" className="bg-gray-900">Last 30 days</option>
              <option value="90d" className="bg-gray-900">Last 90 days</option>
              <option value="ytd" className="bg-gray-900">Year to date</option>
              <option value="custom" className="bg-gray-900">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">Start</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">End</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          )}
        </div>

        {selectedPublisher && (
          <div className="mt-4 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg">
            <span className="text-violet-400 text-sm">
              Viewing data for: <strong>{selectedPublisherData?.company || selectedPublisherData?.name}</strong>
              {' '}(Margin: {marginPercent}%)
            </span>
          </div>
        )}
      </div>

      {/* Metrics Overview */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400">Loading...</div>
        </div>
      ) : reportData && (
        <>
          <div className="grid gap-4 md:grid-cols-6">
            {[
              { label: 'Bid Requests', value: reportData.bidRequests.toLocaleString(), color: 'from-blue-500 to-cyan-500' },
              { label: 'Impressions', value: reportData.impressions.toLocaleString(), color: 'from-violet-500 to-purple-500' },
              { label: 'Fill Rate', value: `${reportData.fillRate.toFixed(1)}%`, color: 'from-green-500 to-emerald-500' },
              { label: 'eCPM', value: `$${reportData.ecpm.toFixed(2)}`, color: 'from-orange-500 to-amber-500' },
              { label: 'Gross Revenue', value: `$${reportData.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'from-pink-500 to-rose-500' },
              { label: 'Net Revenue', value: `$${reportData.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'from-teal-500 to-cyan-500' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Breakdown by Ad Unit */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Performance by Ad Unit</h2>
              <p className="text-sm text-gray-400">Detailed metrics for each ad placement</p>
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Ad Unit</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Format</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">Bid Requests</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">Impressions</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">Fill Rate</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">eCPM</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">Gross Revenue</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">Net Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {reportData.byAdUnit.map((unit) => (
                  <tr key={unit.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{unit.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        unit.format === 'BANNER'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : unit.format === 'INTERSTITIAL'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {unit.format}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-300">{unit.bidRequests.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-gray-300">{unit.impressions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-gray-300">{unit.fillRate.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-right text-gray-300">${unit.ecpm.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-white font-medium">
                      ${unit.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-green-400 font-medium">
                      ${unit.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Daily Breakdown */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Daily Breakdown</h2>
              <p className="text-sm text-gray-400">Performance over time</p>
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">Bid Requests</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">Impressions</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">Gross Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {reportData.breakdown.map((day) => (
                  <tr key={day.date} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{day.date}</td>
                    <td className="px-6 py-4 text-right text-gray-300">{day.bidRequests.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-gray-300">{day.impressions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-white font-medium">
                      ${day.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
