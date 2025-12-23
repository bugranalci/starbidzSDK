import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

async function getGamSources() {
  const sources = await prisma.demandSource.findMany({
    where: { type: "GAM" },
    include: {
      gamConfig: true,
      adUnits: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return sources
}

export default async function GamPage() {
  const sources = await getGamSources()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Google Ad Manager</h1>
          <p className="text-muted-foreground">Manage your GAM/MCM integrations</p>
        </div>
        <Link href="/demand/gam/new">
          <Button>Add GAM Account</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>GAM Accounts</CardTitle>
          <CardDescription>
            Configure Google Ad Manager accounts for demand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Network Code</TableHead>
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
                    <code className="text-sm">{source.gamConfig?.networkCode || "-"}</code>
                  </TableCell>
                  <TableCell>{source.adUnits.length}</TableCell>
                  <TableCell>{source.priority}</TableCell>
                  <TableCell>
                    <Badge variant={source.isActive ? "success" : "secondary"}>
                      {source.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/demand/gam/${source.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {sources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No GAM accounts configured. Add your first account to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
          <CardDescription>How to connect your Google Ad Manager account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Get your Network Code</h4>
            <p className="text-sm text-muted-foreground">
              Find your network code in GAM under Admin {">"} Global Settings {">"} Network Code
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">2. Create Service Account (Optional)</h4>
            <p className="text-sm text-muted-foreground">
              For programmatic access, create a service account in Google Cloud Console
              and grant it access to your GAM network
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">3. Add Ad Units</h4>
            <p className="text-sm text-muted-foreground">
              Create ad units in GAM first, then add them here with their paths and floor prices
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
