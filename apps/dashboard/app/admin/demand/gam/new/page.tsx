'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
        networkCode: formData.get('networkCode') || null,
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
    <div className="space-y-6">
      <div>
        <Link href="/admin/demand" className="text-muted-foreground hover:text-foreground">
          ← Back to Demand Sources
        </Link>
        <h1 className="text-3xl font-bold mt-2">Add Google Ad Manager</h1>
        <p className="text-muted-foreground">Configure GAM/MCM integration (client-side)</p>
      </div>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Ad Unit paths will be configured per placement after creating the account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="My GAM Account"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="networkCode">Network Code (Optional)</Label>
              <Input
                id="networkCode"
                name="networkCode"
                placeholder="123456789"
              />
              <p className="text-sm text-muted-foreground">
                Found in GAM: Admin → Global Settings. Used for reference only.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                name="priority"
                type="number"
                min="1"
                defaultValue="1"
              />
              <p className="text-sm text-muted-foreground">
                Lower number = higher priority in waterfall
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <p className="font-medium text-blue-800">How it works:</p>
              <ol className="list-decimal ml-4 mt-2 space-y-1 text-blue-700">
                <li>Create this GAM account</li>
                <li>Add Ad Units with GAM paths (e.g., /21728129623/app_banner)</li>
                <li>SDK loads ads directly from GAM using these paths</li>
              </ol>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create GAM Account'}
              </Button>
              <Link href="/admin/demand">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
