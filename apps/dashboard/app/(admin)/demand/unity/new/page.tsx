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
            organizationId: formData.get("organizationId"),
            gameIdAndroid: formData.get("gameIdAndroid"),
            gameIdIos: formData.get("gameIdIos"),
            apiKey: formData.get("apiKey"),
          },
        }),
      })

      if (res.ok) {
        router.push("/demand/unity")
      }
    } catch (error) {
      console.error("Failed to create Unity account:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/demand/unity" className="text-muted-foreground hover:text-foreground">
          ← Back to Unity Ads
        </Link>
        <h1 className="text-3xl font-bold mt-2">Add Unity Ads Account</h1>
        <p className="text-muted-foreground">Configure a new Unity Ads integration</p>
      </div>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Enter your Unity Ads account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input id="name" name="name" placeholder="My Unity Account" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationId">Organization ID</Label>
              <Input id="organizationId" name="organizationId" placeholder="1234567" required />
              <p className="text-sm text-muted-foreground">
                Find this in Unity Dashboard under Organization Settings
              </p>
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

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key (Optional)</Label>
              <Input id="apiKey" name="apiKey" type="password" placeholder="Enter API key" />
              <p className="text-sm text-muted-foreground">
                Required for server-side bidding and reporting
              </p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                API keys are encrypted before storage (AES-256-GCM)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" name="priority" type="number" defaultValue="1" min="1" max="100" />
              <p className="text-sm text-muted-foreground">
                Higher priority sources are queried first (1-100)
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Account"}
              </Button>
              <Link href="/demand/unity">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
