"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewUnityPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch("/api/admin/demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "UNITY",
          name: formData.get("name"),
          priority: parseInt(formData.get("priority") as string) || 1,
          config: {
            gameIdAndroid: formData.get("gameIdAndroid"),
            gameIdIos: formData.get("gameIdIos"),
            // Report API
            apiKey: formData.get("apiKey") || null,
            organizationCoreId: formData.get("organizationCoreId") || null,
            // Auto Create Ad Source
            keyId: formData.get("keyId") || null,
            secretKey: formData.get("secretKey") || null,
          },
        }),
      })

      if (res.ok) {
        router.push("/admin/demand")
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to create demand source")
      }
    } catch (error) {
      console.error("Failed to create Unity account:", error)
      alert("Failed to create demand source")
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
        <h1 className="text-3xl font-bold mt-2">Add Unity Ads</h1>
        <p className="text-muted-foreground">Configure Unity Ads integration (client-side)</p>
      </div>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Placement IDs will be configured per ad unit after creating the account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input id="name" name="name" placeholder="My Unity Account" required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gameIdAndroid">Game ID (Android)</Label>
                <Input id="gameIdAndroid" name="gameIdAndroid" placeholder="1234567" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gameIdIos">Game ID (iOS)</Label>
                <Input id="gameIdIos" name="gameIdIos" placeholder="1234568" required />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Find Game IDs in Unity Dashboard → Monetization → Project Settings
            </p>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" name="priority" type="number" defaultValue="1" min="1" max="100" />
              <p className="text-sm text-muted-foreground">
                Lower number = higher priority in waterfall
              </p>
            </div>

            {/* Report API Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-3">Report API (Optional)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Required for revenue reporting. Find these in Unity Dashboard.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input id="apiKey" name="apiKey" placeholder="Unity API Key" />
                  <p className="text-xs text-muted-foreground">Settings → API Key</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationCoreId">Organization Core ID</Label>
                  <Input id="organizationCoreId" name="organizationCoreId" placeholder="Organization Core ID" />
                  <p className="text-xs text-muted-foreground">Organization Settings</p>
                </div>
              </div>
            </div>

            {/* Auto Create Ad Source Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-3">Auto Create Ad Source (Optional)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Required for automatic ad source creation. Find these in Unity Dashboard → Service Account → Add Key.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="keyId">Key ID</Label>
                  <Input id="keyId" name="keyId" placeholder="Service Account Key ID" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Key</Label>
                  <Input id="secretKey" name="secretKey" type="password" placeholder="Service Account Secret Key" />
                  <p className="text-xs text-muted-foreground">Save it when created - won't be visible later</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg text-sm">
              <p className="font-medium text-purple-800">How it works:</p>
              <ol className="list-decimal ml-4 mt-2 space-y-1 text-purple-700">
                <li>Create this Unity account with Game IDs</li>
                <li>Add Ad Units with Unity Placement IDs</li>
                <li>SDK loads ads directly from Unity using Game ID + Placement ID</li>
              </ol>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Unity Account"}
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
