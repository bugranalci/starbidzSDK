import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getDailyStats,
  getFormatStats,
  getDateRange,
  isAnalyticsConfigured,
  type DailyStats,
  type FormatStats,
} from "@/lib/analytics"

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

  // Get real analytics data
  const { startDate, endDate } = getDateRange('30d')
  const analyticsConfigured = await isAnalyticsConfigured()

  let dailyStats: DailyStats[] = []
  let formatStats: FormatStats[] = []
  let impressions = 0
  let clicks = 0
  let revenue = 0
  const appStats: Record<string, { impressions: number; revenue: number }> = {}

  if (analyticsConfigured) {
    // Fetch real data from Tinybird via bid server
    dailyStats = await getDailyStats({ startDate, endDate })
    formatStats = await getFormatStats({ startDate, endDate })

    // Fetch per-app stats
    for (const app of apps) {
      const appDailyStats = await getDailyStats({
        appKey: app.appKey,
        startDate,
        endDate,
      })
      appStats[app.id] = {
        impressions: appDailyStats.reduce((acc, day) => acc + day.impressions, 0),
        revenue: appDailyStats.reduce((acc, day) => acc + day.revenue, 0),
      }
    }

    // Aggregate totals
    impressions = dailyStats.reduce((acc, day) => acc + day.impressions, 0)
    clicks = dailyStats.reduce((acc, day) => acc + day.clicks, 0)
    revenue = dailyStats.reduce((acc, day) => acc + day.revenue, 0)
  }

  return {
    totalApps,
    totalAdUnits,
    activeApps,
    apps,
    impressions,
    clicks,
    revenue: revenue.toFixed(2),
    dailyStats,
    formatStats,
    appStats,
    analyticsConfigured,
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
                        {stats.appStats[app.id]?.impressions.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        ${stats.appStats[app.id]?.revenue.toFixed(2) || '0.00'}
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
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">eCPM</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.formatStats.length > 0 ? (
                    stats.formatStats.map((format) => (
                      <TableRow key={format.format}>
                        <TableCell className="font-medium">{format.format}</TableCell>
                        <TableCell className="text-right">{format.requests.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{format.impressions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${format.avg_cpm.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${format.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {stats.analyticsConfigured
                          ? "No data available for this period"
                          : "Analytics not configured. Set TINYBIRD_API_KEY on the server."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Performance</CardTitle>
              <CardDescription>Last 30 days performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Fill Rate</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.dailyStats.length > 0 ? (
                    stats.dailyStats.slice(0, 30).map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{day.requests.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{day.impressions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{day.clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{day.fill_rate.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">${day.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        {stats.analyticsConfigured
                          ? "No data available for this period"
                          : "Analytics not configured. Set TINYBIRD_API_KEY on the server."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
