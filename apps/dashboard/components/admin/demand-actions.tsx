'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface DemandActionsProps {
  sourceId: string
  sourceName: string
  sourceType: 'gam' | 'ortb' | 'unity' | 'fyber'
}

export function DemandActions({ sourceId, sourceName, sourceType }: DemandActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${sourceName}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/demand/${sourceType}/${sourceId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push(`/admin/demand/${sourceType}`)
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete')
      }
    } catch {
      alert('Failed to delete')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleTestConnection() {
    setIsTesting(true)
    try {
      const res = await fetch(`/api/admin/demand/${sourceType}/${sourceId}/test`, {
        method: 'POST',
      })

      const result = await res.json()

      if (res.ok && result.success) {
        alert(`Connection successful!\nLatency: ${result.latency}ms`)
      } else {
        alert(`Connection failed: ${result.error || 'Unknown error'}`)
      }
    } catch {
      alert('Failed to test connection')
    } finally {
      setIsTesting(false)
    }
  }

  function handleEdit() {
    router.push(`/admin/demand/${sourceType}/${sourceId}/edit`)
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleEdit}>
        Edit
      </Button>
      {sourceType === 'ortb' && (
        <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
          {isTesting ? 'Testing...' : 'Test Connection'}
        </Button>
      )}
      <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
    </div>
  )
}

interface AddAdUnitButtonProps {
  sourceId: string
  sourceType: 'gam' | 'unity' | 'fyber'
}

export function AddAdUnitButton({ sourceId, sourceType }: AddAdUnitButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    externalId: '',
    format: 'BANNER',
    bidFloor: '1.00',
    width: '',
    height: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/admin/demand/${sourceType}/${sourceId}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: formData.externalId,
          format: formData.format,
          bidFloor: parseFloat(formData.bidFloor),
          width: formData.width ? parseInt(formData.width) : null,
          height: formData.height ? parseInt(formData.height) : null,
        }),
      })

      if (res.ok) {
        setIsOpen(false)
        setFormData({ externalId: '', format: 'BANNER', bidFloor: '1.00', width: '', height: '' })
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add ad unit')
      }
    } catch {
      alert('Failed to add ad unit')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button size="sm" onClick={() => setIsOpen(true)}>
        Add Ad Unit
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add Ad Unit</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              External ID / Path
            </label>
            <input
              type="text"
              value={formData.externalId}
              onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="/12345/ad-unit-name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Format</label>
            <select
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="BANNER">Banner</option>
              <option value="INTERSTITIAL">Interstitial</option>
              <option value="REWARDED">Rewarded</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Floor Price (CPM)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.bidFloor}
              onChange={(e) => setFormData({ ...formData, bidFloor: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {formData.format === 'BANNER' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Width</label>
                <input
                  type="number"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="320"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="50"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Ad Unit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
