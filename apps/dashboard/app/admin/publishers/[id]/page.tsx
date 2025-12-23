import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getPublisher(id: string) {
  const publisher = await prisma.publisher.findUnique({
    where: { id },
    include: {
      apps: {
        include: {
          adUnits: true,
        },
      },
    },
  })
  return publisher
}

export default async function PublisherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const publisher = await getPublisher(id)

  if (!publisher) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/publishers" className="text-muted-foreground hover:text-foreground">
            ← Back to Publishers
          </Link>
          <h1 className="text-3xl font-bold mt-2">{publisher.name}</h1>
          <p className="text-muted-foreground">{publisher.company || "Individual Publisher"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button variant="outline">Reset API Key</Button>
          <Button variant={publisher.isActive ? "destructive" : "default"}>
            {publisher.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Account Info</CardTitle>
            <CardDescription>Publisher account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{publisher.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Company</span>
              <span>{publisher.company || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={publisher.isActive ? "success" : "secondary"}>
                {publisher.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(publisher.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Access</CardTitle>
            <CardDescription>API key and integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">API Key</span>
              <div className="mt-1 p-2 bg-muted rounded font-mono text-sm break-all">
                {publisher.apiKey}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Webhook URL</span>
              <Badge variant={publisher.webhookUrl ? "success" : "outline"}>
                {publisher.webhookUrl ? "Configured" : "Not Set"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Account overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Apps</span>
              <span className="font-bold">{publisher.apps.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Ad Units</span>
              <span className="font-bold">
                {publisher.apps.reduce((acc, app) => acc + app.adUnits.length, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Apps</span>
              <span className="font-bold">
                {publisher.apps.filter((app) => app.isActive).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>Publisher&apos;s registered applications</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App Name</TableHead>
                <TableHead>Bundle ID</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Ad Units</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publisher.apps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell>
                    <code className="text-sm">{app.bundleId}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{app.platform}</Badge>
                  </TableCell>
                  <TableCell>{app.adUnits.length}</TableCell>
                  <TableCell>
                    <Badge variant={app.isActive ? "success" : "secondary"}>
                      {app.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
              {publisher.apps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No applications registered yet.
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
