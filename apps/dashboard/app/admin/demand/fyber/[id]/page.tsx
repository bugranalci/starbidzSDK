import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getFyberSource(id: string) {
  const source = await prisma.demandSource.findUnique({
    where: { id, type: "FYBER" },
    include: {
      fyberConfig: true,
      adUnits: true,
    },
  })
  return source
}

export default async function FyberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const source = await getFyberSource(id)

  if (!source) {
    notFound()
  }

  const config = source.fyberConfig

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/demand/fyber" className="text-muted-foreground hover:text-foreground">
            ← Back to Fyber
          </Link>
          <h1 className="text-3xl font-bold mt-2">{source.name}</h1>
          <p className="text-muted-foreground">Fyber/DT Exchange Configuration</p>
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
            <CardDescription>Fyber account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">App ID</span>
              <code>{config?.appId || "-"}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Security Token</span>
              <Badge variant={config?.securityToken ? "success" : "outline"}>
                {config?.securityToken ? "Configured" : "Not Set"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">App ID</span>
              <code>{config?.appId || "-"}</code>
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
                <p className="text-2xl font-bold">{Math.floor(Math.random() * 80000).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Impressions</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">${(Math.random() * 800 + 300).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">${(Math.random() * 12 + 4).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">eCPM</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{(Math.random() * 85 + 15).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Fill Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ad Units</CardTitle>
          <CardDescription>Configured Fyber ad placements</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spot ID</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Bid Floor</TableHead>
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
                  <TableCell>${unit.bidFloor.toFixed(2)}</TableCell>
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
                    No ad units configured. Sync placements to import from Fyber.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Info</CardTitle>
          <CardDescription>Fyber/DT Exchange integration details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">SDK Version</h4>
              <p className="text-2xl font-bold">8.2.x</p>
              <p className="text-sm text-muted-foreground">Latest supported</p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Bidding</h4>
              <p className="text-2xl font-bold">Enabled</p>
              <p className="text-sm text-muted-foreground">In-app bidding</p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Ad Formats</h4>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Banner, Inter, Rewarded</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
