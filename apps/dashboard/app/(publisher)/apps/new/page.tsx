'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewAppPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      bundleId: formData.get('bundleId'),
      platform: formData.get('platform'),
      mediation: formData.get('mediation'),
      storeUrl: formData.get('storeUrl') || null,
    }

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const app = await res.json()
        router.push(`/apps/${app.id}`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create app')
      }
    } catch {
      alert('Failed to create app')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create New App</h1>

      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            App Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="My Awesome App"
          />
        </div>

        <div>
          <label htmlFor="bundleId" className="block text-sm font-medium mb-2">
            Bundle ID / Package Name
          </label>
          <input
            id="bundleId"
            name="bundleId"
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="com.example.myapp"
          />
        </div>

        <div>
          <label htmlFor="platform" className="block text-sm font-medium mb-2">
            Platform
          </label>
          <select
            id="platform"
            name="platform"
            required
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="ANDROID">Android</option>
            <option value="IOS">iOS</option>
            <option value="BOTH">Both</option>
          </select>
        </div>

        <div>
          <label htmlFor="mediation" className="block text-sm font-medium mb-2">
            Mediation SDK
          </label>
          <select
            id="mediation"
            name="mediation"
            required
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="MAX">AppLovin MAX</option>
            <option value="ADMOB">Google AdMob</option>
            <option value="LEVELPLAY">ironSource LevelPlay</option>
          </select>
        </div>

        <div>
          <label htmlFor="storeUrl" className="block text-sm font-medium mb-2">
            Store URL (optional)
          </label>
          <input
            id="storeUrl"
            name="storeUrl"
            type="url"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="https://play.google.com/store/apps/details?id=..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create App'}
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
