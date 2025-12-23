import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

async function getOrtbSource(id: string) {
  const source = await prisma.demandSource.findUnique({
    where: { id, type: "ORTB" },
    include: {
      ortbConfig: true,
    },
  })
  return source
}

export default async function OrtbDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const source = await getOrtbSource(id)

  if (!source) {
    notFound()
  }

  const config = source.ortbConfig

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/demand/ortb" className="text-muted-foreground hover:text-foreground">
            ← Back to OpenRTB DSPs
          </Link>
          <h1 className="text-3xl font-bold mt-2">{source.name}</h1>
          <p className="text-muted-foreground">OpenRTB DSP Configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button variant="outline">Test Connection</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Configuration</CardTitle>
            <CardDescription>DSP connection settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">Endpoint URL</span>
              <p className="font-mono text-sm break-all">{config?.endpoint || "-"}</p>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seat ID</span>
              <code>{config?.seatId || "-"}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Timeout</span>
              <span>{config?.timeout || 200}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Authentication</span>
              <Badge variant={config?.authHeader ? "success" : "outline"}>
                {config?.authHeader ? "Configured" : "None"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={source.isActive ? "success" : "secondary"}>
                {source.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Format Configuration</CardTitle>
            <CardDescription>Enabled ad formats and floor prices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Banner</p>
                <p className="text-sm text-muted-foreground">
                  Floor: ${config?.bannerFloor?.toFixed(2) || "1.00"}
                </p>
              </div>
              <Badge variant={config?.bannerEnabled ? "success" : "secondary"}>
                {config?.bannerEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Interstitial</p>
                <p className="text-sm text-muted-foreground">
                  Floor: ${config?.interstitialFloor?.toFixed(2) || "5.00"}
                </p>
              </div>
              <Badge variant={config?.interstitialEnabled ? "success" : "secondary"}>
                {config?.interstitialEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Rewarded</p>
                <p className="text-sm text-muted-foreground">
                  Floor: ${config?.rewardedFloor?.toFixed(2) || "8.00"}
                </p>
              </div>
              <Badge variant={config?.rewardedEnabled ? "success" : "secondary"}>
                {config?.rewardedEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Statistics</CardTitle>
          <CardDescription>Last 30 days metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{Math.floor(Math.random() * 500000).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Bid Requests</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{Math.floor(Math.random() * 400000).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Bid Responses</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{(Math.random() * 25 + 5).toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Win Rate</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold">${(Math.random() * 8 + 2).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Avg CPM</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{Math.floor(Math.random() * 50 + 80)}ms</p>
              <p className="text-sm text-muted-foreground">Avg Latency</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
