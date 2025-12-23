'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdUnitActionsProps {
  appId: string
  unitId: string
  unitName: string
}

export function AdUnitActions({ appId, unitId, unitName }: AdUnitActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${unitName}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/apps/${appId}/units/${unitId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete ad unit')
      }
    } catch {
      alert('Failed to delete ad unit')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  )
}
