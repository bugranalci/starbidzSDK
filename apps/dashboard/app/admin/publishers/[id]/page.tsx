'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface App {
  id: string
  name: string
  bundleId: string
  platform: string
  isActive: boolean
  adUnits: { id: string }[]
}

interface Publisher {
  id: string
  name: string | null
  email: string | null
  company: string | null
  isActive: boolean
  apiKey: string | null
  webhookUrl: string | null
  margin: number
  createdAt: string
  apps: App[]
}

export default function PublisherDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [publisher, setPublisher] = useState<Publisher | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingMargin, setEditingMargin] = useState(false)
  const [newMargin, setNewMargin] = useState(20)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    fetchPublisher()
  }, [params.id])

  async function fetchPublisher() {
    try {
      const res = await fetch(`/api/admin/publishers/${params.id}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setPublisher(data)
      setNewMargin(Math.round((data.margin || 0.20) * 100))
    } catch (err) {
      console.error(err)
      router.push('/admin/publishers')
    } finally {
      setLoading(false)
    }
  }

  async function saveMargin() {
    if (!publisher) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/publishers/${publisher.id}/margin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ margin: newMargin / 100 })
      })
      if (res.ok) {
        setPublisher({ ...publisher, margin: newMargin / 100 })
        setEditingMargin(false)
      }
    } catch (err) {
      console.error('Failed to save margin:', err)
    } finally {
      setSaving(false)
    }
  }

  async function resetApiKey() {
    if (!publisher || !confirm('Are you sure you want to reset the API key? The old key will stop working immediately.')) return
    try {
      const res = await fetch(`/api/admin/publishers/${publisher.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-api-key' })
      })
      if (res.ok) {
        const data = await res.json()
        setPublisher({ ...publisher, apiKey: data.apiKey })
        setShowApiKey(true)
      }
    } catch (err) {
      console.error('Failed to reset API key:', err)
    }
  }

  async function toggleStatus() {
    if (!publisher) return
    try {
      const res = await fetch(`/api/admin/publishers/${publisher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !publisher.isActive })
      })
      if (res.ok) {
        setPublisher({ ...publisher, isActive: !publisher.isActive })
      }
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!publisher) return null

  const totalAdUnits = publisher.apps.reduce((acc, app) => acc + app.adUnits.length, 0)
  const activeApps = publisher.apps.filter(app => app.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/publishers"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Publishers
          </Link>
          <h1 className="text-3xl font-bold text-white mt-2">{publisher.name || 'Unnamed Publisher'}</h1>
          <p className="text-gray-400">{publisher.company || 'Individual Publisher'}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetApiKey}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors text-sm"
          >
            Reset API Key
          </button>
          <button
            onClick={toggleStatus}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              publisher.isActive
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
            }`}
          >
            {publisher.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Account Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Account Info</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span className="text-white">{publisher.email || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Company</span>
              <span className="text-white">{publisher.company || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                publisher.isActive
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {publisher.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created</span>
              <span className="text-white">{new Date(publisher.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Revenue Margin Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Revenue Margin</h2>
            {!editingMargin && (
              <button
                onClick={() => setEditingMargin(true)}
                className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editingMargin ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Starbidz keeps (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newMargin}
                    onChange={(e) => setNewMargin(parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-violet-500"
                  />
                  <span className="text-gray-400">%</span>
                </div>
              </div>
              <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                <p className="text-sm text-violet-300">
                  Publisher receives: <strong>{100 - newMargin}%</strong> of gross revenue
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveMargin}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 text-white rounded-lg transition-colors text-sm"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditingMargin(false)
                    setNewMargin(Math.round((publisher.margin || 0.20) * 100))
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-violet-400">
                  {Math.round((publisher.margin || 0.20) * 100)}%
                </p>
                <p className="text-sm text-gray-400 mt-1">Starbidz margin</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-lg font-bold text-emerald-400">
                    {100 - Math.round((publisher.margin || 0.20) * 100)}%
                  </p>
                  <p className="text-xs text-gray-400">Publisher gets</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-lg font-bold text-amber-400">
                    {Math.round((publisher.margin || 0.20) * 100)}%
                  </p>
                  <p className="text-xs text-gray-400">Platform keeps</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Apps</span>
              <span className="text-2xl font-bold text-white">{publisher.apps.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active Apps</span>
              <span className="text-2xl font-bold text-green-400">{activeApps}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Ad Units</span>
              <span className="text-2xl font-bold text-white">{totalAdUnits}</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Access Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">API Access</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">API Key</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-black/30 rounded-lg text-sm text-gray-300 font-mono break-all">
                {showApiKey ? publisher.apiKey : '••••••••••••••••••••••••••••••••'}
              </code>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors text-sm"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publisher.apiKey || '')
                }}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors text-sm"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Webhook URL</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              publisher.webhookUrl
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
              {publisher.webhookUrl ? 'Configured' : 'Not Set'}
            </span>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Applications</h2>
          <p className="text-sm text-gray-400">Publisher's registered applications</p>
        </div>
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">App Name</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Bundle ID</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Platform</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Ad Units</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {publisher.apps.map((app) => (
              <tr key={app.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{app.name}</td>
                <td className="px-6 py-4">
                  <code className="text-sm text-gray-300 bg-black/30 px-2 py-1 rounded">{app.bundleId}</code>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    app.platform === 'ANDROID'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : app.platform === 'IOS'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}>
                    {app.platform}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300">{app.adUnits.length}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    app.isActive
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {app.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {publisher.apps.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No applications registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
