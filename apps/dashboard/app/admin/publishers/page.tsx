'use client'

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Publisher {
  id: string
  name: string | null
  email: string | null
  company: string | null
  margin: number
  isActive: boolean
  createdAt: string
  user: {
    name: string | null
    email: string
  }
  apps: { id: string; isActive: boolean }[]
  _count: { apps: number }
}

interface Stats {
  totalPublishers: number
  totalApps: number
  activeApps: number
}

export default function PublishersPage() {
  const router = useRouter()
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [stats, setStats] = useState<Stats>({ totalPublishers: 0, totalApps: 0, activeApps: 0 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    margin: 20, // Percentage display
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/admin/publishers')
      const data = await res.json()
      setPublishers(data.data || [])

      // Calculate stats from fetched data
      const apps = data.data?.reduce((acc: number, p: Publisher) => acc + p._count.apps, 0) || 0
      const activeApps = data.data?.reduce((acc: number, p: Publisher) =>
        acc + p.apps.filter(a => a.isActive).length, 0) || 0

      setStats({
        totalPublishers: data.data?.length || 0,
        totalApps: apps,
        activeApps: activeApps,
      })
    } catch (err) {
      console.error('Failed to fetch publishers:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/publishers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company || null,
          margin: formData.margin / 100, // Convert percentage to decimal
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create publisher')
      }

      setShowModal(false)
      setFormData({ name: '', email: '', company: '', margin: 20 })
      fetchData()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create publisher')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Publishers</h1>
          <p className="text-gray-400">Manage publisher accounts and applications</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
        >
          Add Publisher
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Publishers', value: stats.totalPublishers },
          { label: 'Total Apps', value: stats.totalApps },
          { label: 'Active Apps', value: stats.activeApps },
          { label: 'Avg Apps/Publisher', value: stats.totalPublishers > 0 ? (stats.totalApps / stats.totalPublishers).toFixed(1) : '0' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">All Publishers</h2>
          <p className="text-sm text-gray-400">View and manage all registered publishers</p>
        </div>
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Publisher</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Margin</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Apps</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Active Apps</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {publishers.map((publisher) => {
              const activeAppsCount = publisher.apps.filter(app => app.isActive).length
              return (
                <tr key={publisher.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">{publisher.user.name || 'No Name'}</p>
                      <p className="text-sm text-gray-400">{publisher.company || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{publisher.user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30">
                      {((publisher.margin || 0.20) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{publisher._count.apps}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      activeAppsCount > 0
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {activeAppsCount} active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {new Date(publisher.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/publishers/${publisher.id}`}
                      className="text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              )
            })}
            {publishers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  No publishers registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Publisher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Add New Publisher</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  placeholder="Publisher name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  placeholder="publisher@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  placeholder="Company name (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Revenue Margin (%) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="1"
                    value={formData.margin}
                    onChange={(e) => setFormData({ ...formData, margin: parseInt(e.target.value) || 0 })}
                    className="w-24 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                  <span className="text-gray-400">%</span>
                  <span className="text-sm text-gray-500 ml-2">
                    (Starbidz keeps {formData.margin}%, publisher gets {100 - formData.margin}%)
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 text-white rounded-lg transition-colors"
                >
                  {submitting ? 'Creating...' : 'Create Publisher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
