'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AppStatusToggleProps {
  appId: string
  isActive: boolean
}

export function AppStatusToggle({ appId, isActive }: AppStatusToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(isActive)

  async function toggleStatus() {
    setLoading(true)
    try {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !active }),
      })

      if (res.ok) {
        setActive(!active)
        router.refresh()
      } else {
        alert('Failed to update status')
      }
    } catch {
      alert('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleStatus}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
        active ? 'bg-green-500 focus:ring-green-500' : 'bg-gray-300 focus:ring-gray-500'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          active ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
