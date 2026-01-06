"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewFyberPage() {
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
          type: "FYBER",
          name: formData.get("name"),
          priority: parseInt(formData.get("priority") as string) || 1,
          config: {
            appIdAndroid: formData.get("appIdAndroid"),
            appIdIos: formData.get("appIdIos"),
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
      console.error("Failed to create Fyber account:", error)
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
        <h1 className="text-3xl font-bold mt-2">Add Fyber / DT Exchange</h1>
        <p className="text-muted-foreground">Configure Fyber/Digital Turbine integration (client-side)</p>
      </div>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Spot IDs will be configured per ad unit after creating the account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input id="name" name="name" placeholder="My Fyber Account" required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appIdAndroid">App ID (Android)</Label>
                <Input id="appIdAndroid" name="appIdAndroid" placeholder="123456" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appIdIos">App ID (iOS)</Label>
                <Input id="appIdIos" name="appIdIos" placeholder="123457" required />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Find App IDs in Fyber Console → Apps → App Settings
            </p>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" name="priority" type="number" defaultValue="1" min="1" max="100" />
              <p className="text-sm text-muted-foreground">
                Lower number = higher priority in waterfall
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg text-sm">
              <p className="font-medium text-orange-800">How it works:</p>
              <ol className="list-decimal ml-4 mt-2 space-y-1 text-orange-700">
                <li>Create this Fyber account with App IDs</li>
                <li>Add Ad Units with Fyber Spot IDs</li>
                <li>SDK loads ads directly from Fyber using App ID + Spot ID</li>
              </ol>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Fyber Account"}
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
