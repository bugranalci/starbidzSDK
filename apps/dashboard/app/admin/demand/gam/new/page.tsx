'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewGamPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      type: 'GAM',
      name: formData.get('name'),
      priority: parseInt(formData.get('priority') as string) || 1,
      config: {
        networkCode: formData.get('networkCode'),
        credentials: formData.get('credentials') || null,
      },
    }

    try {
      const res = await fetch('/api/admin/demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        router.push('/admin/demand')
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create demand source')
      }
    } catch {
      alert('Failed to create demand source')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add GAM/MCM Account</h1>

      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Display Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="My GAM Account"
          />
        </div>

        <div>
          <label htmlFor="networkCode" className="block text-sm font-medium mb-2">
            Network Code
          </label>
          <input
            id="networkCode"
            name="networkCode"
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="123456789"
          />
          <p className="text-sm text-gray-500 mt-1">
            Found in GAM: Admin → Global Settings → Network Code
          </p>
        </div>

        <div>
          <label htmlFor="credentials" className="block text-sm font-medium mb-2">
            Service Account JSON (optional)
          </label>
          <textarea
            id="credentials"
            name="credentials"
            rows={6}
            className="w-full px-3 py-2 border rounded-md font-mono text-sm"
            placeholder='{"type": "service_account", ...}'
          />
          <p className="text-sm text-gray-500 mt-1">
            Required for programmatic access. Create in Google Cloud Console.
          </p>
          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Credentials are encrypted before storage (AES-256-GCM)
          </p>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-2">
            Priority
          </label>
          <input
            id="priority"
            name="priority"
            type="number"
            min="1"
            defaultValue="1"
            className="w-full px-3 py-2 border rounded-md"
          />
          <p className="text-sm text-gray-500 mt-1">
            Lower number = higher priority in auction
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create GAM Account'}
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
