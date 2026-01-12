"use client"

import { useState } from "react"

// Mock system data
const systemHealth = {
  bidServer: { status: "healthy", uptime: "99.99%", latency: "45ms" },
  database: { status: "healthy", connections: 23, poolSize: 50 },
  redis: { status: "healthy", memory: "256MB", hitRate: "94.5%" },
  workers: { status: "healthy", active: 4, queue: 12 },
}

const recentLogs = [
  { timestamp: "2024-01-15 14:32:45", level: "INFO", message: "Bid request processed successfully", source: "bid-server" },
  { timestamp: "2024-01-15 14:32:44", level: "WARN", message: "DSP timeout: unity-ads (exceeded 200ms)", source: "ortb-connector" },
  { timestamp: "2024-01-15 14:32:43", level: "INFO", message: "New publisher registered: AppMakers Ltd", source: "dashboard" },
  { timestamp: "2024-01-15 14:32:42", level: "ERROR", message: "Failed to sync GAM placements", source: "gam-connector" },
  { timestamp: "2024-01-15 14:32:41", level: "INFO", message: "Cache invalidated for publisher: abc123", source: "redis" },
]

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

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState("health")

  const tabs = [
    { id: "health", label: "Health Check" },
    { id: "config", label: "Configuration" },
    { id: "logs", label: "Logs" },
    { id: "cache", label: "Cache" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System</h1>
          <p className="text-gray-400">System health, configuration, and monitoring</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white text-sm hover:bg-white/20 transition-colors">
            Refresh Status
          </button>
          <button className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white text-sm hover:bg-white/20 transition-colors">
            View Full Logs
          </button>
        </div>
      </div>

      {/* Status Cards - Publishers style */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Bid Server', value: systemHealth.bidServer.latency, status: 'Online', subtext: `Uptime: ${systemHealth.bidServer.uptime}` },
          { label: 'Database', value: `${systemHealth.database.connections}/${systemHealth.database.poolSize}`, status: 'Connected', subtext: 'Pool connections' },
          { label: 'Redis Cache', value: systemHealth.redis.hitRate, status: 'Active', subtext: `Memory: ${systemHealth.redis.memory}` },
          { label: 'Workers', value: systemHealth.workers.active.toString(), status: 'Running', subtext: `Queue: ${systemHealth.workers.queue}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">{stat.label}</p>
              <Badge variant="success">{stat.status}</Badge>
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400 mt-1">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <div className="flex border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-white bg-white/10 border-b-2 border-violet-500"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "health" && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Service Health</h3>
                <p className="text-sm text-gray-400">Detailed health status of all services</p>
              </div>
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Response Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Last Check</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {[
                    { name: "Bid Server (Elysia)", time: "45ms", action: "Restart" },
                    { name: "PostgreSQL Database", time: "12ms", action: "Details" },
                    { name: "Redis Cache", time: "2ms", action: "Flush" },
                    { name: "Google Ad Manager API", time: "234ms", action: "Test" },
                    { name: "OpenRTB Connectors", time: "156ms avg", action: "Details" },
                  ].map((service, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{service.name}</td>
                      <td className="px-4 py-3"><Badge variant="success">Healthy</Badge></td>
                      <td className="px-4 py-3 text-gray-300">{service.time}</td>
                      <td className="px-4 py-3 text-gray-300">{i < 3 ? "Just now" : "2 min ago"}</td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-violet-400 hover:text-violet-300 text-sm transition-colors">
                          {service.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "config" && (
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Bid Server Settings",
                  desc: "Configure bid server parameters",
                  fields: [
                    { label: "Default Timeout (ms)", value: "200", type: "number" },
                    { label: "Max Concurrent Requests", value: "1000", type: "number" },
                    { label: "Global Bid Floor ($)", value: "0.50", type: "number" },
                  ],
                },
                {
                  title: "Auction Settings",
                  desc: "Configure auction behavior",
                  fields: [
                    { label: "Auction Type", value: "First Price", disabled: true },
                    { label: "TMAX Override (ms)", value: "150", type: "number" },
                    { label: "Default Currency", value: "USD" },
                  ],
                },
                {
                  title: "Rate Limiting",
                  desc: "Configure API rate limits",
                  fields: [
                    { label: "Requests per minute", value: "10000", type: "number" },
                    { label: "Burst limit", value: "100", type: "number" },
                  ],
                },
                {
                  title: "Logging",
                  desc: "Configure logging settings",
                  fields: [
                    { label: "Log Level", value: "INFO" },
                    { label: "Log Retention (days)", value: "30", type: "number" },
                  ],
                },
              ].map((card, i) => (
                <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">{card.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{card.desc}</p>
                  <div className="space-y-4">
                    {card.fields.map((field, j) => (
                      <div key={j}>
                        <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
                        <input
                          type={field.type || "text"}
                          defaultValue={field.value}
                          disabled={field.disabled}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    ))}
                    <button className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors">
                      Save Settings
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Logs</h3>
                <p className="text-sm text-gray-400">Latest system log entries</p>
              </div>
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Level</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {recentLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-gray-300">{log.timestamp}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            log.level === "ERROR"
                              ? "destructive"
                              : log.level === "WARN"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {log.level}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{log.source}</td>
                      <td className="px-4 py-3 text-gray-300">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "cache" && (
            <div className="space-y-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Cache Management</h3>
                <p className="text-sm text-gray-400">Redis cache statistics and controls</p>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { value: "256 MB", label: "Memory Used" },
                  { value: "1.2M", label: "Total Keys" },
                  { value: "94.5%", label: "Hit Rate" },
                  { value: "2ms", label: "Avg Latency" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-colors">
                  Clear Publisher Cache
                </button>
                <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-colors">
                  Clear Bid Cache
                </button>
                <button className="px-4 py-2 bg-red-600/80 rounded-lg text-white text-sm hover:bg-red-600 transition-colors">
                  Flush All
                </button>
              </div>

              <div>
                <h4 className="font-medium text-white mb-4">Cache Keys by Type</h4>
                <table className="min-w-full divide-y divide-white/10">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Key Pattern</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Count</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Memory</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {[
                      { pattern: "publisher:*", count: "45,230", memory: "12 MB" },
                      { pattern: "bid:*", count: "890,450", memory: "156 MB" },
                      { pattern: "dsp:*", count: "12,340", memory: "8 MB" },
                      { pattern: "session:*", count: "234,560", memory: "80 MB" },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-mono text-gray-300">{row.pattern}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{row.count}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{row.memory}</td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-violet-400 hover:text-violet-300 text-sm transition-colors">
                            Clear
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
