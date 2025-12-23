import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function getPublisherStats(publisherId: string) {
  const apps = await prisma.app.findMany({
    where: { publisherId },
    include: {
      adUnits: true,
    },
  })

  const totalApps = apps.length
  const totalAdUnits = apps.reduce((acc, app) => acc + app.adUnits.length, 0)
  const activeApps = apps.filter(app => app.isActive).length

  // Get recent events (mock data for now - would come from analytics)
  const recentStats = {
    impressions: Math.floor(Math.random() * 100000),
    clicks: Math.floor(Math.random() * 5000),
    revenue: (Math.random() * 1000).toFixed(2),
  }

  return {
    totalApps,
    totalAdUnits,
    activeApps,
    apps,
    ...recentStats,
  }
}

export default async function ReportsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")

  const publisher = await prisma.publisher.findFirst({
    where: { user: { clerkId: userId } },
  })

  if (!publisher) redirect("/login")

  const stats = await getPublisherStats(publisher.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">View your app performance and revenue</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.impressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(2) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Click-through rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="apps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="apps">By App</TabsTrigger>
          <TabsTrigger value="formats">By Format</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
        </TabsList>

        <TabsContent value="apps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by App</CardTitle>
              <CardDescription>View metrics for each of your apps</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App Name</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Ad Units</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.apps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.name}</TableCell>
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
                        {Math.floor(Math.random() * 50000).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(Math.random() * 500).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {stats.apps.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No apps found. Create your first app to start seeing reports.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Ad Format</CardTitle>
              <CardDescription>Compare performance across different ad formats</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Format</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">eCPM</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Banner</TableCell>
                    <TableCell className="text-right">45,230</TableCell>
                    <TableCell className="text-right">892</TableCell>
                    <TableCell className="text-right">1.97%</TableCell>
                    <TableCell className="text-right">$2.50</TableCell>
                    <TableCell className="text-right">$113.08</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Interstitial</TableCell>
                    <TableCell className="text-right">12,450</TableCell>
                    <TableCell className="text-right">1,245</TableCell>
                    <TableCell className="text-right">10.00%</TableCell>
                    <TableCell className="text-right">$8.50</TableCell>
                    <TableCell className="text-right">$105.83</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Rewarded</TableCell>
                    <TableCell className="text-right">8,920</TableCell>
                    <TableCell className="text-right">2,230</TableCell>
                    <TableCell className="text-right">25.00%</TableCell>
                    <TableCell className="text-right">$15.00</TableCell>
                    <TableCell className="text-right">$133.80</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Performance</CardTitle>
              <CardDescription>Last 7 days performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 7 }).map((_, i) => {
                    const date = new Date()
                    date.setDate(date.getDate() - i)
                    return (
                      <TableRow key={i}>
                        <TableCell>{date.toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          {Math.floor(Math.random() * 15000).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {Math.floor(Math.random() * 750).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(Math.random() * 150).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
