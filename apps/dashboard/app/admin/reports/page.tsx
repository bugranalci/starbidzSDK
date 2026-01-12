"use client"

import { useState, useEffect, useCallback } from "react"

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
  platform: string
}

interface DailyStats {
  date: string
  requests: number
  responses: number
  impressions: number
  clicks: number
  revenue: number
  fill_rate: number
  ctr: number
}

interface DemandSourceStats {
  demand_source: string
  requests: number
  wins: number
  impressions: number
  revenue: number
  avg_bid: number
  win_rate: number
}

interface CountryStats {
  country: string
  requests: number
  impressions: number
  revenue: number
  fill_rate: number
}

interface FormatStats {
  format: string
  requests: number
  impressions: number
  revenue: number
  avg_cpm: number
}

function Badge({ variant, children }: { variant: "success" | "destructive" | "outline" | "secondary"; children: React.ReactNode }) {
  const variants = {
    success: "bg-green-500/20 text-green-300 border border-green-500/30",
    destructive: "bg-red-500/20 text-red-300 border border-red-500/30",
    outline: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    secondary: "bg-gray-500/20 text-gray-300 border border-gray-500/30",
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${variants[variant]}`}>
      {children}
    </span>
  )
}

const datePresets = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last_7_days' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Custom', value: 'custom' },
]

function getDateRange(preset: string): { start: string; end: string } {
  const today = new Date()
  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  switch (preset) {
    case 'today':
      return { start: formatDate(today), end: formatDate(today) }
    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { start: formatDate(yesterday), end: formatDate(yesterday) }
    }
    case 'last_7_days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 7)
      return { start: formatDate(start), end: formatDate(today) }
    }
    case 'last_30_days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 30)
      return { start: formatDate(start), end: formatDate(today) }
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start: formatDate(start), end: formatDate(today) }
    }
    default:
      return { start: '2025-01-01', end: formatDate(today) }
  }
}

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState("last_7_days")
  const [activeTab, setActiveTab] = useState("overview")
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [selectedPublisher, setSelectedPublisher] = useState("")
  const [selectedApp, setSelectedApp] = useState("")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Analytics data
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [demandStats, setDemandStats] = useState<DemandSourceStats[]>([])
  const [countryStats, setCountryStats] = useState<CountryStats[]>([])
  const [formatStats, setFormatStats] = useState<FormatStats[]>([])

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true)
    const { start, end } = dateRange === 'custom'
      ? { start: customStartDate, end: customEndDate }
      : getDateRange(dateRange)

    if (!start || !end) {
      setIsLoading(false)
      return
    }

    const baseParams = new URLSearchParams({
      start_date: start,
      end_date: end,
    })

    if (selectedPublisher) baseParams.set('publisher_id', selectedPublisher)
    if (selectedApp) baseParams.set('app_key', selectedApp)

    try {
      const [dailyRes, demandRes, countryRes, formatRes] = await Promise.all([
        fetch(`/api/analytics?type=daily&${baseParams}`),
        fetch(`/api/analytics?type=demand_sources&${baseParams}`),
        fetch(`/api/analytics?type=countries&${baseParams}`),
        fetch(`/api/analytics?type=formats&${baseParams}`),
      ])

      const [daily, demand, country, format] = await Promise.all([
        dailyRes.json(),
        demandRes.json(),
        countryRes.json(),
        formatRes.json(),
      ])

      setDailyStats(daily.data || [])
      setDemandStats(demand.data || [])
      setCountryStats(country.data || [])
      setFormatStats(format.data || [])
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [dateRange, customStartDate, customEndDate, selectedPublisher, selectedApp])

  useEffect(() => {
    fetchPublishers()
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  useEffect(() => {
    if (selectedPublisher) {
      fetchApps(selectedPublisher)
      setSelectedApp("")
    } else {
      setApps([])
      setSelectedApp("")
    }
  }, [selectedPublisher])

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

  // Calculate totals
  const totals = dailyStats.reduce(
    (acc, day) => ({
      requests: acc.requests + day.requests,
      impressions: acc.impressions + day.impressions,
      clicks: acc.clicks + day.clicks,
      revenue: acc.revenue + day.revenue,
    }),
    { requests: 0, impressions: 0, clicks: 0, revenue: 0 }
  )

  const avgFillRate = totals.requests > 0 ? (totals.impressions / totals.requests) * 100 : 0
  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  const avgEcpm = totals.impressions > 0 ? (totals.revenue / totals.impressions) * 1000 : 0

  const selectedPublisherData = publishers.find(p => p.id === selectedPublisher)
  const maxRevenue = Math.max(...dailyStats.map(d => d.revenue), 1)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'demand', label: 'Demand Sources' },
    { id: 'countries', label: 'Countries' },
    { id: 'formats', label: 'Ad Formats' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports</h1>
          <p className="text-gray-400">Platform-wide analytics powered by Tinybird</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors text-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
            >
              {datePresets.map((preset) => (
                <option key={preset.value} value={preset.value} className="bg-gray-900">
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Publisher Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Publisher</label>
            <select
              value={selectedPublisher}
              onChange={(e) => setSelectedPublisher(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
            >
              <option value="" className="bg-gray-900">All Publishers</option>
              {publishers.map((pub) => (
                <option key={pub.id} value={pub.id} className="bg-gray-900">
                  {pub.company || pub.name || pub.user.email}
                </option>
              ))}
            </select>
          </div>

          {/* App Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">App</label>
            <select
              value={selectedApp}
              onChange={(e) => setSelectedApp(e.target.value)}
              disabled={!selectedPublisher}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500 disabled:opacity-50"
            >
              <option value="" className="bg-gray-900">All Apps</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id} className="bg-gray-900">
                  {app.name} ({app.platform})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          {dateRange === "custom" && (
            <div className="flex gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Start</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">End</label>
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

        {selectedPublisher && selectedPublisherData && (
          <div className="mt-4 p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
            <span className="text-violet-300 text-sm">
              Viewing data for: <strong>{selectedPublisherData.company || selectedPublisherData.name}</strong>
              {' '}(Margin: {((selectedPublisherData.margin || 0.20) * 100).toFixed(0)}%)
            </span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
          <span className="ml-3 text-gray-400">Loading analytics...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
              <p className="text-sm text-gray-400 mb-1">Revenue</p>
              <p className="text-2xl font-bold text-emerald-400">${totals.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
              <p className="text-sm text-gray-400 mb-1">Impressions</p>
              <p className="text-2xl font-bold text-blue-400">{totals.impressions.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
              <p className="text-sm text-gray-400 mb-1">eCPM</p>
              <p className="text-2xl font-bold text-violet-400">${avgEcpm.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
              <p className="text-sm text-gray-400 mb-1">Fill Rate</p>
              <p className="text-2xl font-bold text-amber-400">{avgFillRate.toFixed(1)}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
              <p className="text-sm text-gray-400 mb-1">Requests</p>
              <p className="text-2xl font-bold text-cyan-400">{totals.requests.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
              <p className="text-sm text-gray-400 mb-1">CTR</p>
              <p className="text-2xl font-bold text-pink-400">{avgCtr.toFixed(2)}%</p>
            </div>
          </div>

          {/* No Data State */}
          {dailyStats.length === 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-12 text-center">
              <h3 className="text-lg font-medium text-white mb-2">No data available</h3>
              <p className="text-gray-400">
                No analytics data found for the selected date range. Data will appear here once ads start serving.
              </p>
            </div>
          )}

          {/* Tabs */}
          {dailyStats.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
              <div className="border-b border-white/10 px-4">
                <div className="flex gap-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                        activeTab === tab.id
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Revenue Chart */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
                      <div className="h-64 flex items-end gap-2">
                        {dailyStats.slice(-14).map((day, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div
                              className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-sm transition-all hover:from-violet-500 hover:to-violet-300"
                              style={{ height: `${(day.revenue / maxRevenue) * 200}px` }}
                              title={`$${day.revenue.toFixed(2)}`}
                            />
                            <span className="text-xs text-gray-400">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Daily Data Table */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Daily Breakdown</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Requests</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Impressions</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Clicks</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Revenue</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Fill Rate</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">CTR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {dailyStats.map((day) => (
                              <tr key={day.date} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-4 font-medium text-white">{new Date(day.date).toLocaleDateString()}</td>
                                <td className="px-4 py-4 text-right text-gray-300">{day.requests.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-gray-300">{day.impressions.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-gray-300">{day.clicks.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-emerald-400 font-medium">${day.revenue.toFixed(2)}</td>
                                <td className="px-4 py-4 text-right text-gray-300">{day.fill_rate.toFixed(1)}%</td>
                                <td className="px-4 py-4 text-right text-gray-300">{day.ctr.toFixed(2)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Demand Sources Tab */}
                {activeTab === 'demand' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Demand Source Performance</h3>
                    {demandStats.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No demand source data available</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Source</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Requests</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Wins</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Impressions</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Revenue</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Avg Bid</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Win Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {demandStats.map((source) => (
                              <tr key={source.demand_source} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-4 font-medium text-white">{source.demand_source}</td>
                                <td className="px-4 py-4 text-right text-gray-300">{source.requests.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-gray-300">{source.wins.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-gray-300">{source.impressions.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-emerald-400 font-medium">${source.revenue.toFixed(2)}</td>
                                <td className="px-4 py-4 text-right text-gray-300">${source.avg_bid.toFixed(2)}</td>
                                <td className="px-4 py-4 text-right text-gray-300">{source.win_rate.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Countries Tab */}
                {activeTab === 'countries' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Performance by Country</h3>
                    {countryStats.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No country data available</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Country</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Requests</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Impressions</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Revenue</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Fill Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {countryStats.map((country) => (
                              <tr key={country.country} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-4 font-medium text-white">{country.country}</td>
                                <td className="px-4 py-4 text-right text-gray-300">{country.requests.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-gray-300">{country.impressions.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-emerald-400 font-medium">${country.revenue.toFixed(2)}</td>
                                <td className="px-4 py-4 text-right text-gray-300">{country.fill_rate.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Ad Formats Tab */}
                {activeTab === 'formats' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Performance by Ad Format</h3>
                    {formatStats.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No format data available</p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-3">
                        {formatStats.map((format) => {
                          const colorMap: Record<string, string> = {
                            BANNER: 'green',
                            INTERSTITIAL: 'blue',
                            REWARDED: 'amber',
                          }
                          const color = colorMap[format.format] || 'gray'
                          return (
                            <div key={format.format} className="p-6 bg-white/5 rounded-xl border border-white/10">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-white text-lg">{format.format}</h4>
                                <Badge variant="secondary">{format.format}</Badge>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Requests</span>
                                  <span className="font-medium text-white">{format.requests.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Impressions</span>
                                  <span className="font-medium text-white">{format.impressions.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Revenue</span>
                                  <span className="font-medium text-emerald-400">${format.revenue.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">eCPM</span>
                                  <span className="font-medium text-violet-400">${format.avg_cpm.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
