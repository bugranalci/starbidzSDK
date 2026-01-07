"use client"

import { useState, useEffect } from "react"

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

// Mock data for admin reports
const overviewStats = {
  totalRevenue: 125430.50,
  totalImpressions: 15234567,
  totalRequests: 18456789,
  avgFillRate: 82.5,
  avgEcpm: 8.23,
  clicks: 456789,
  dau: 125000,
}

const demandSourceStats = [
  { name: "Google AdMob", impressions: 5234567, revenue: 45230.50, ecpm: 8.64, fillRate: 85.2 },
  { name: "Unity Ads", impressions: 3456789, revenue: 28450.30, ecpm: 8.23, fillRate: 78.5 },
  { name: "Fyber", impressions: 2345678, revenue: 19870.40, ecpm: 8.47, fillRate: 82.1 },
  { name: "OpenRTB DSPs", impressions: 4197533, revenue: 31879.30, ecpm: 7.59, fillRate: 84.3 },
]

const publisherStats = [
  { name: "GameStudio Inc", apps: 5, impressions: 4234567, revenue: 35230.50, netRevenue: 28184.40, ecpm: 8.32, status: "active" },
  { name: "AppMakers Ltd", apps: 3, impressions: 3456789, revenue: 28450.30, netRevenue: 22760.24, ecpm: 8.23, status: "active" },
  { name: "MobileGames Co", apps: 8, impressions: 2345678, revenue: 19870.40, netRevenue: 15896.32, ecpm: 8.47, status: "active" },
  { name: "CasualPlay", apps: 2, impressions: 1897533, revenue: 15879.30, netRevenue: 12703.44, ecpm: 8.36, status: "active" },
  { name: "IndieDev Studio", apps: 1, impressions: 1300000, revenue: 10000.00, netRevenue: 8000.00, ecpm: 7.69, status: "inactive" },
]

const dailyData = [
  { date: "Jan 1", revenue: 4200, impressions: 520000 },
  { date: "Jan 2", revenue: 4500, impressions: 550000 },
  { date: "Jan 3", revenue: 4100, impressions: 510000 },
  { date: "Jan 4", revenue: 4800, impressions: 580000 },
  { date: "Jan 5", revenue: 5200, impressions: 620000 },
  { date: "Jan 6", revenue: 4900, impressions: 590000 },
  { date: "Jan 7", revenue: 5100, impressions: 610000 },
]

const datePresets = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last_7_days' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Custom', value: 'custom' },
]

const breakdownOptions = [
  { label: 'Date', value: 'date' },
  { label: 'Publisher', value: 'publisher' },
  { label: 'App', value: 'app' },
  { label: 'Platform', value: 'platform' },
  { label: 'Country', value: 'country' },
  { label: 'Ad Format', value: 'ad_format' },
]

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState("last_7_days")
  const [activeTab, setActiveTab] = useState("overview")
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [selectedPublisher, setSelectedPublisher] = useState("")
  const [selectedApp, setSelectedApp] = useState("")
  const [selectedBreakdown, setSelectedBreakdown] = useState("date")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")

  useEffect(() => {
    fetchPublishers()
  }, [])

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

  const selectedPublisherData = publishers.find(p => p.id === selectedPublisher)
  const maxRevenue = Math.max(...dailyData.map(d => d.revenue))

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'demand', label: 'Demand Sources' },
    { id: 'publishers', label: 'Publishers' },
    { id: 'formats', label: 'Ad Formats' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports</h1>
          <p className="text-gray-400">Platform-wide analytics and reporting</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors text-sm">
            Export CSV
          </button>
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors text-sm">
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

          {/* Breakdown */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Breakdown</label>
            <select
              value={selectedBreakdown}
              onChange={(e) => setSelectedBreakdown(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
            >
              {breakdownOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-gray-900">
                  {opt.label}
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
          <p className="text-sm text-gray-400 mb-1">Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">${(overviewStats.totalRevenue / 1000).toFixed(1)}K</p>
          <p className="text-xs text-emerald-400/70 mt-1">↑ +12.3%</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
          <p className="text-sm text-gray-400 mb-1">Impressions</p>
          <p className="text-2xl font-bold text-blue-400">{(overviewStats.totalImpressions / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-blue-400/70 mt-1">↑ +8.7%</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
          <p className="text-sm text-gray-400 mb-1">eCPM</p>
          <p className="text-2xl font-bold text-violet-400">${overviewStats.avgEcpm}</p>
          <p className="text-xs text-violet-400/70 mt-1">↑ +3.2%</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
          <p className="text-sm text-gray-400 mb-1">Fill Rate</p>
          <p className="text-2xl font-bold text-amber-400">{overviewStats.avgFillRate}%</p>
          <p className="text-xs text-red-400/70 mt-1">↓ -0.5%</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
          <p className="text-sm text-gray-400 mb-1">Requests</p>
          <p className="text-2xl font-bold text-cyan-400">{(overviewStats.totalRequests / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-cyan-400/70 mt-1">↑ +5.1%</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
          <p className="text-sm text-gray-400 mb-1">Clicks</p>
          <p className="text-2xl font-bold text-pink-400">{(overviewStats.clicks / 1000).toFixed(0)}K</p>
          <p className="text-xs text-pink-400/70 mt-1">↑ +4.2%</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
          <p className="text-sm text-gray-400 mb-1">DAU</p>
          <p className="text-2xl font-bold text-teal-400">{(overviewStats.dau / 1000).toFixed(0)}K</p>
          <p className="text-xs text-teal-400/70 mt-1">↑ +2.8%</p>
        </div>
      </div>

      {/* Tabs */}
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
                  {dailyData.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-sm transition-all hover:from-violet-500 hover:to-violet-300"
                        style={{ height: `${(day.revenue / maxRevenue) * 200}px` }}
                        title={`$${day.revenue.toLocaleString()}`}
                      />
                      <span className="text-xs text-gray-400">{day.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform & Format Split */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Revenue by Platform</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-white">iOS</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">$68,986</p>
                        <p className="text-xs text-gray-400">55%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-white">Android</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">$56,444</p>
                        <p className="text-xs text-gray-400">45%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Revenue by Ad Format</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 text-xs rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">REWARDED</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">$55,640</p>
                        <p className="text-xs text-gray-400">$19.19 eCPM</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">INTERSTITIAL</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">$45,230</p>
                        <p className="text-xs text-gray-400">$11.03 eCPM</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400 border border-green-500/30">BANNER</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">$24,560</p>
                        <p className="text-xs text-gray-400">$3.00 eCPM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Demand Sources Tab */}
          {activeTab === 'demand' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Demand Source Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Source</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Impressions</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Revenue</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">eCPM</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Fill Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {demandSourceStats.map((source) => {
                      const totalRevenue = demandSourceStats.reduce((acc, s) => acc + s.revenue, 0)
                      const share = ((source.revenue / totalRevenue) * 100).toFixed(1)
                      return (
                        <tr key={source.name} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-medium text-white">{source.name}</td>
                          <td className="px-4 py-4 text-right text-gray-300">{source.impressions.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right text-emerald-400 font-medium">${source.revenue.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right text-gray-300">${source.ecpm}</td>
                          <td className="px-4 py-4 text-right text-gray-300">{source.fillRate}%</td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-violet-500 rounded-full"
                                  style={{ width: `${share}%` }}
                                />
                              </div>
                              <span className="text-gray-400 text-sm">{share}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/20 bg-white/5">
                      <td className="px-4 py-3 font-bold text-white">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        {demandSourceStats.reduce((acc, s) => acc + s.impressions, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-400">
                        ${demandSourceStats.reduce((acc, s) => acc + s.revenue, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        ${(demandSourceStats.reduce((acc, s) => acc + s.revenue, 0) / demandSourceStats.reduce((acc, s) => acc + s.impressions, 0) * 1000).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        {(demandSourceStats.reduce((acc, s) => acc + s.fillRate, 0) / demandSourceStats.length).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Publishers Tab */}
          {activeTab === 'publishers' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Publisher Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Publisher</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Apps</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Impressions</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Gross Revenue</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Net Revenue</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">eCPM</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {publisherStats.map((pub) => (
                      <tr key={pub.name} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 font-medium text-white">{pub.name}</td>
                        <td className="px-4 py-4 text-right text-gray-300">{pub.apps}</td>
                        <td className="px-4 py-4 text-right text-gray-300">{pub.impressions.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right text-gray-300">${pub.revenue.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right text-emerald-400 font-medium">${pub.netRevenue.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right text-gray-300">${pub.ecpm}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            pub.status === 'active'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {pub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/20 bg-white/5">
                      <td className="px-4 py-3 font-bold text-white">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        {publisherStats.reduce((acc, p) => acc + p.apps, 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        {publisherStats.reduce((acc, p) => acc + p.impressions, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        ${publisherStats.reduce((acc, p) => acc + p.revenue, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-400">
                        ${publisherStats.reduce((acc, p) => acc + p.netRevenue, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Ad Formats Tab */}
          {activeTab === 'formats' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Performance by Ad Format</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: 'Banner', impressions: '8.2M', revenue: '$24,560', ecpm: '$3.00', fill: '92%', color: 'green' },
                  { name: 'Interstitial', impressions: '4.1M', revenue: '$45,230', ecpm: '$11.03', fill: '85%', color: 'blue' },
                  { name: 'Rewarded', impressions: '2.9M', revenue: '$55,640', ecpm: '$19.19', fill: '78%', color: 'amber' },
                ].map((format) => (
                  <div key={format.name} className="p-6 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white text-lg">{format.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded bg-${format.color}-500/20 text-${format.color}-400 border border-${format.color}-500/30`}>
                        {format.name.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Impressions</span>
                        <span className="font-medium text-white">{format.impressions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Revenue</span>
                        <span className="font-medium text-emerald-400">{format.revenue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">eCPM</span>
                        <span className="font-medium text-violet-400">{format.ecpm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fill Rate</span>
                        <span className="font-medium text-white">{format.fill}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
