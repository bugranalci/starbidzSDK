import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getUnitySource(id: string) {
  const source = await prisma.demandSource.findUnique({
    where: { id, type: "UNITY" },
    include: {
      unityConfig: true,
      adUnits: true,
    },
  })
  return source
}

export default async function UnityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const source = await getUnitySource(id)

  if (!source) {
    notFound()
  }

  const config = source.unityConfig

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/demand/unity" className="text-muted-foreground hover:text-foreground">
            ← Back to Unity Ads
          </Link>
          <h1 className="text-3xl font-bold mt-2">{source.name}</h1>
          <p className="text-muted-foreground">Unity Ads Configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button variant="outline">Sync Placements</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Configuration</CardTitle>
            <CardDescription>Unity Ads account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organization ID</span>
              <code>{config?.organizationId || "-"}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Game ID (Android)</span>
              <code>{config?.gameIdAndroid || "-"}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Game ID (iOS)</span>
              <code>{config?.gameIdIos || "-"}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API Key</span>
              <Badge variant={config?.apiKey ? "success" : "outline"}>
                {config?.apiKey ? "Configured" : "Not Set"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority</span>
              <span>{source.priority}</span>
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
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Last 30 days metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{Math.floor(Math.random() * 100000).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Impressions</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">${(Math.random() * 1000 + 500).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">${(Math.random() * 15 + 5).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">eCPM</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{(Math.random() * 90 + 10).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Fill Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ad Units</CardTitle>
          <CardDescription>Configured Unity ad placements</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placement ID</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {source.adUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-mono">{unit.externalId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{unit.format}</Badge>
                  </TableCell>
                  <TableCell>{unit.platform || "All"}</TableCell>
                  <TableCell>
                    <Badge variant={unit.isActive ? "success" : "secondary"}>
                      {unit.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
              {source.adUnits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No ad units configured. Sync placements to import from Unity.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
