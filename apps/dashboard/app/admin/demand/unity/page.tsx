import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

async function getUnitySources() {
  const sources = await prisma.demandSource.findMany({
    where: { type: "UNITY" },
    include: {
      unityConfig: true,
      adUnits: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return sources
}

export default async function UnityPage() {
  const sources = await getUnitySources()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unity Ads</h1>
          <p className="text-muted-foreground">Manage your Unity Ads integrations</p>
        </div>
        <Link href="/demand/unity/new">
          <Button>Add Unity Account</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unity Ads Accounts</CardTitle>
          <CardDescription>Configure Unity Ads accounts for demand</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Organization ID</TableHead>
                <TableHead>Game IDs</TableHead>
                <TableHead>Ad Units</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>
                    <code className="text-sm">{source.unityConfig?.organizationId || "-"}</code>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Android:</span> {source.unityConfig?.gameIdAndroid || "-"}
                      <br />
                      <span className="text-muted-foreground">iOS:</span> {source.unityConfig?.gameIdIos || "-"}
                    </div>
                  </TableCell>
                  <TableCell>{source.adUnits.length}</TableCell>
                  <TableCell>
                    <Badge variant={source.isActive ? "success" : "secondary"}>
                      {source.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/demand/unity/${source.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {sources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No Unity Ads accounts configured. Add your first account to get started.
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
