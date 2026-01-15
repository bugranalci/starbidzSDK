'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

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
    name: '',
    externalId: '',
    format: 'BANNER',
    bidFloor: '1.00',
    platform: 'BOTH',
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
          name: formData.name,
          externalId: formData.externalId,
          format: formData.format,
          bidFloor: parseFloat(formData.bidFloor),
          platform: formData.platform,
          width: formData.width ? parseInt(formData.width) : null,
          height: formData.height ? parseInt(formData.height) : null,
        }),
      })

      if (res.ok) {
        setIsOpen(false)
        setFormData({ name: '', externalId: '', format: 'BANNER', bidFloor: '1.00', platform: 'BOTH', width: '', height: '' })
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
      <div className="bg-background border rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add GAM Ad Unit</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded px-3 py-2 bg-background"
              placeholder="banner_1.00_android"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Internal name for this ad unit</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">GAM Ad Unit Path</label>
            <input
              type="text"
              value={formData.externalId}
              onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
              className="w-full border rounded px-3 py-2 bg-background font-mono text-sm"
              placeholder="/21728129623,22755403919/app_banner_1_00"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Format: /network_code/ad_unit_path</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Format</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                className="w-full border rounded px-3 py-2 bg-background"
              >
                <option value="BANNER">Banner</option>
                <option value="INTERSTITIAL">Interstitial</option>
                <option value="REWARDED">Rewarded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full border rounded px-3 py-2 bg-background"
              >
                <option value="BOTH">Both</option>
                <option value="ANDROID">Android</option>
                <option value="IOS">iOS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Floor Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="999.99"
              value={formData.bidFloor}
              onChange={(e) => setFormData({ ...formData, bidFloor: e.target.value })}
              className="w-full border rounded px-3 py-2 bg-background"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">This price will be used as bid in auction</p>
          </div>

          {formData.format === 'BANNER' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Width</label>
                <input
                  type="number"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  className="w-full border rounded px-3 py-2 bg-background"
                  placeholder="320"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full border rounded px-3 py-2 bg-background"
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

// Ad Unit Actions (Edit, Delete, Toggle)
interface AdUnitActionsProps {
  sourceId: string
  sourceType: 'gam' | 'unity' | 'fyber'
  unitId: string
  unitName: string
}

export function AdUnitActions({ sourceId, sourceType, unitId, unitName }: AdUnitActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${unitName}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/demand/${sourceType}/${sourceId}/units/${unitId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
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

  async function handleToggle(isActive: boolean) {
    setIsToggling(true)
    try {
      const res = await fetch(`/api/admin/demand/${sourceType}/${sourceId}/units/${unitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update')
      }
    } catch {
      alert('Failed to update')
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isDeleting || isToggling}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleToggle(true)} className="cursor-pointer">
          <ToggleRight className="mr-2 h-4 w-4" />
          Enable
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleToggle(false)} className="cursor-pointer">
          <ToggleLeft className="mr-2 h-4 w-4" />
          Disable
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
