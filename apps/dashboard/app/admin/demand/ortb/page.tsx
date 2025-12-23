import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

async function getOrtbSources() {
  const sources = await prisma.demandSource.findMany({
    where: { type: "ORTB" },
    include: {
      ortbConfig: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return sources
}

export default async function OrtbPage() {
  const sources = await getOrtbSources()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OpenRTB DSPs</h1>
          <p className="text-muted-foreground">Manage your OpenRTB demand-side platform integrations</p>
        </div>
        <Link href="/demand/ortb/new">
          <Button>Add DSP</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>DSP Endpoints</CardTitle>
          <CardDescription>Configure OpenRTB 2.5 compatible DSP endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Timeout</TableHead>
                <TableHead>Formats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>
                    <code className="text-sm truncate max-w-[200px] block">
                      {source.ortbConfig?.endpoint || "-"}
                    </code>
                  </TableCell>
                  <TableCell>{source.ortbConfig?.timeout || 200}ms</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {source.ortbConfig?.bannerEnabled && (
                        <Badge variant="outline" className="text-xs">Banner</Badge>
                      )}
                      {source.ortbConfig?.interstitialEnabled && (
                        <Badge variant="outline" className="text-xs">Interstitial</Badge>
                      )}
                      {source.ortbConfig?.rewardedEnabled && (
                        <Badge variant="outline" className="text-xs">Rewarded</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={source.isActive ? "success" : "secondary"}>
                      {source.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/demand/ortb/${source.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {sources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No OpenRTB DSPs configured. Add your first DSP to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OpenRTB Integration</CardTitle>
          <CardDescription>Information about OpenRTB protocol support</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Protocol Version</h4>
              <p className="text-2xl font-bold">2.5</p>
              <p className="text-sm text-muted-foreground">OpenRTB Specification</p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Default Timeout</h4>
              <p className="text-2xl font-bold">200ms</p>
              <p className="text-sm text-muted-foreground">Configurable per DSP</p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Auction Type</h4>
              <p className="text-2xl font-bold">First Price</p>
              <p className="text-sm text-muted-foreground">Winner pays bid price</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
