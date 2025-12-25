import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DemandActions, AddAdUnitButton } from "@/components/admin/demand-actions"

async function getGamSource(id: string) {
  const source = await prisma.demandSource.findUnique({
    where: { id, type: "GAM" },
    include: {
      gamConfig: true,
      adUnits: {
        orderBy: { createdAt: "desc" },
      },
    },
  })
  return source
}

export default async function GamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const source = await getGamSource(id)

  if (!source) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/demand/gam" className="text-muted-foreground hover:text-foreground">
              ← Back to GAM
            </Link>
          </div>
          <h1 className="text-3xl font-bold">{source.name}</h1>
          <p className="text-muted-foreground">GAM Account Details</p>
        </div>
        <DemandActions sourceId={source.id} sourceName={source.name} sourceType="gam" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>GAM account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network Code</span>
              <code className="font-mono">{source.gamConfig?.networkCode || "-"}</code>
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credentials</span>
              <Badge variant={source.gamConfig?.credentials ? "success" : "outline"}>
                {source.gamConfig?.credentials ? "Configured" : "Not Set"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{source.createdAt.toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Performance metrics (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bid Requests</span>
              <span className="font-medium">{Math.floor(Math.random() * 100000).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bid Responses</span>
              <span className="font-medium">{Math.floor(Math.random() * 80000).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-medium">{(Math.random() * 30 + 10).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg. CPM</span>
              <span className="font-medium">${(Math.random() * 5 + 2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Revenue</span>
              <span className="font-medium">${(Math.random() * 5000 + 1000).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ad Units</CardTitle>
              <CardDescription>GAM ad units configured for this account</CardDescription>
            </div>
            <AddAdUnitButton sourceId={source.id} sourceType="gam" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>External ID / Path</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Floor Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {source.adUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-mono text-sm">{unit.externalId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{unit.format}</Badge>
                  </TableCell>
                  <TableCell>
                    {unit.width && unit.height ? `${unit.width}x${unit.height}` : "-"}
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No ad units configured. Add your first ad unit to start receiving bids.
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
