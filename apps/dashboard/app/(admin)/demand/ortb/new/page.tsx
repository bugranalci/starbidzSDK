'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewOrtbPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      type: 'ORTB',
      name: formData.get('name'),
      priority: parseInt(formData.get('priority') as string) || 1,
      config: {
        endpoint: formData.get('endpoint'),
        seatId: formData.get('seatId') || null,
        authHeader: formData.get('authHeader') || null,
        authValue: formData.get('authValue') || null,
        timeout: parseInt(formData.get('timeout') as string) || 200,
        bannerEnabled: formData.get('bannerEnabled') === 'on',
        bannerFloor: parseFloat(formData.get('bannerFloor') as string) || 1.0,
        interstitialEnabled: formData.get('interstitialEnabled') === 'on',
        interstitialFloor: parseFloat(formData.get('interstitialFloor') as string) || 5.0,
        rewardedEnabled: formData.get('rewardedEnabled') === 'on',
        rewardedFloor: parseFloat(formData.get('rewardedFloor') as string) || 8.0,
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
      <h1 className="text-2xl font-bold mb-6">Add OpenRTB DSP</h1>

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
            placeholder="My DSP"
          />
        </div>

        <div>
          <label htmlFor="endpoint" className="block text-sm font-medium mb-2">
            Bid Endpoint URL
          </label>
          <input
            id="endpoint"
            name="endpoint"
            type="url"
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="https://dsp.example.com/bid"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="seatId" className="block text-sm font-medium mb-2">
              Seat ID (optional)
            </label>
            <input
              id="seatId"
              name="seatId"
              type="text"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label htmlFor="timeout" className="block text-sm font-medium mb-2">
              Timeout (ms)
            </label>
            <input
              id="timeout"
              name="timeout"
              type="number"
              defaultValue="200"
              min="50"
              max="500"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="authHeader" className="block text-sm font-medium mb-2">
              Auth Header Name
            </label>
            <input
              id="authHeader"
              name="authHeader"
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="X-API-Key"
            />
          </div>
          <div>
            <label htmlFor="authValue" className="block text-sm font-medium mb-2">
              Auth Header Value
            </label>
            <input
              id="authValue"
              name="authValue"
              type="password"
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Auth values are encrypted (AES-256-GCM)
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-medium mb-4">Format Configuration</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="bannerEnabled"
                  name="bannerEnabled"
                  defaultChecked
                  className="w-4 h-4"
                />
                <label htmlFor="bannerEnabled" className="font-medium">Banner</label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Floor $</span>
                <input
                  name="bannerFloor"
                  type="number"
                  step="0.01"
                  defaultValue="1.00"
                  className="w-20 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="interstitialEnabled"
                  name="interstitialEnabled"
                  defaultChecked
                  className="w-4 h-4"
                />
                <label htmlFor="interstitialEnabled" className="font-medium">Interstitial</label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Floor $</span>
                <input
                  name="interstitialFloor"
                  type="number"
                  step="0.01"
                  defaultValue="5.00"
                  className="w-20 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="rewardedEnabled"
                  name="rewardedEnabled"
                  defaultChecked
                  className="w-4 h-4"
                />
                <label htmlFor="rewardedEnabled" className="font-medium">Rewarded</label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Floor $</span>
                <input
                  name="rewardedFloor"
                  type="number"
                  step="0.01"
                  defaultValue="8.00"
                  className="w-20 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          </div>
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
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create OpenRTB DSP'}
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
