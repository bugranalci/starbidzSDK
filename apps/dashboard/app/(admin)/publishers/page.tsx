import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

async function getPublishers() {
  const publishers = await prisma.publisher.findMany({
    include: {
      apps: true,
      _count: {
        select: { apps: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return publishers
}

async function getStats() {
  const [totalPublishers, activePublishers, totalApps] = await Promise.all([
    prisma.publisher.count(),
    prisma.publisher.count({ where: { isActive: true } }),
    prisma.app.count(),
  ])
  return { totalPublishers, activePublishers, totalApps }
}

export default async function PublishersPage() {
  const [publishers, stats] = await Promise.all([getPublishers(), getStats()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Publishers</h1>
          <p className="text-muted-foreground">Manage publisher accounts and applications</p>
        </div>
        <Button>Add Publisher</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Publishers</CardDescription>
            <CardTitle className="text-3xl">{stats.totalPublishers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Publishers</CardDescription>
            <CardTitle className="text-3xl">{stats.activePublishers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Apps</CardDescription>
            <CardTitle className="text-3xl">{stats.totalApps}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Apps/Publisher</CardDescription>
            <CardTitle className="text-3xl">
              {stats.totalPublishers > 0 ? (stats.totalApps / stats.totalPublishers).toFixed(1) : "0"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Publishers</CardTitle>
          <CardDescription>View and manage all registered publishers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Publisher</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Apps</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publishers.map((publisher) => (
                <TableRow key={publisher.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{publisher.name}</p>
                      <p className="text-sm text-muted-foreground">{publisher.company || "-"}</p>
                    </div>
                  </TableCell>
                  <TableCell>{publisher.email}</TableCell>
                  <TableCell>{publisher._count.apps}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {publisher.apiKey?.slice(0, 12)}...
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={publisher.isActive ? "success" : "secondary"}>
                      {publisher.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(publisher.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/publishers/${publisher.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {publishers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No publishers registered yet.
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
