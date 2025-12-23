import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

async function getFyberSources() {
  const sources = await prisma.demandSource.findMany({
    where: { type: "FYBER" },
    include: {
      fyberConfig: true,
      adUnits: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return sources
}

export default async function FyberPage() {
  const sources = await getFyberSources()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fyber</h1>
          <p className="text-muted-foreground">Manage your Fyber/DT Exchange integrations</p>
        </div>
        <Link href="/demand/fyber/new">
          <Button>Add Fyber Account</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fyber Accounts</CardTitle>
          <CardDescription>Configure Fyber accounts for demand</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>App ID</TableHead>
                <TableHead>Ad Units</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>
                    <code className="text-sm">{source.fyberConfig?.appId || "-"}</code>
                  </TableCell>
                  <TableCell>{source.adUnits.length}</TableCell>
                  <TableCell>{source.priority}</TableCell>
                  <TableCell>
                    <Badge variant={source.isActive ? "success" : "secondary"}>
                      {source.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/demand/fyber/${source.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {sources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No Fyber accounts configured. Add your first account to get started.
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
