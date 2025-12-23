'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function NewAdUnitPage() {
  const router = useRouter()
  const params = useParams()
  const appId = params.appId as string
  const [isLoading, setIsLoading] = useState(false)
  const [format, setFormat] = useState('BANNER')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      format: formData.get('format'),
      width: format === 'BANNER' ? parseInt(formData.get('width') as string) : null,
      height: format === 'BANNER' ? parseInt(formData.get('height') as string) : null,
    }

    try {
      const res = await fetch(`/api/apps/${appId}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        router.push(`/apps/${appId}`)
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create ad unit')
      }
    } catch {
      alert('Failed to create ad unit')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create New Ad Unit</h1>

      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Ad Unit Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Home Banner"
          />
        </div>

        <div>
          <label htmlFor="format" className="block text-sm font-medium mb-2">
            Ad Format
          </label>
          <select
            id="format"
            name="format"
            required
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="BANNER">Banner</option>
            <option value="INTERSTITIAL">Interstitial</option>
            <option value="REWARDED">Rewarded</option>
          </select>
        </div>

        {format === 'BANNER' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="width" className="block text-sm font-medium mb-2">
                Width
              </label>
              <select
                id="width"
                name="width"
                className="w-full px-3 py-2 border rounded-md"
                defaultValue="320"
              >
                <option value="320">320 (Banner)</option>
                <option value="300">300 (MREC)</option>
                <option value="728">728 (Leaderboard)</option>
              </select>
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium mb-2">
                Height
              </label>
              <select
                id="height"
                name="height"
                className="w-full px-3 py-2 border rounded-md"
                defaultValue="50"
              >
                <option value="50">50 (Banner)</option>
                <option value="250">250 (MREC)</option>
                <option value="90">90 (Leaderboard)</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Ad Unit'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-md"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
