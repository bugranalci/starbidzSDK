"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data for admin reports
const overviewStats = {
  totalRevenue: 125430.50,
  totalImpressions: 15234567,
  totalRequests: 18456789,
  avgFillRate: 82.5,
  avgEcpm: 8.23,
  activePublishers: 45,
}

const demandSourceStats = [
  { name: "Google AdMob", impressions: 5234567, revenue: 45230.50, ecpm: 8.64, fillRate: 85.2 },
  { name: "Unity Ads", impressions: 3456789, revenue: 28450.30, ecpm: 8.23, fillRate: 78.5 },
  { name: "Fyber", impressions: 2345678, revenue: 19870.40, ecpm: 8.47, fillRate: 82.1 },
  { name: "OpenRTB DSPs", impressions: 4197533, revenue: 31879.30, ecpm: 7.59, fillRate: 84.3 },
]

const publisherStats = [
  { name: "GameStudio Inc", apps: 5, impressions: 4234567, revenue: 35230.50, status: "active" },
  { name: "AppMakers Ltd", apps: 3, impressions: 3456789, revenue: 28450.30, status: "active" },
  { name: "MobileGames Co", apps: 8, impressions: 2345678, revenue: 19870.40, status: "active" },
  { name: "CasualPlay", apps: 2, impressions: 1897533, revenue: 15879.30, status: "active" },
  { name: "IndieDev Studio", apps: 1, impressions: 1300000, revenue: 10000.00, status: "inactive" },
]

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState("30d")
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Platform-wide analytics and reporting</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export CSV</Button>
          <Button variant="outline">Export PDF</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">${overviewStats.totalRevenue.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Impressions</CardDescription>
            <CardTitle className="text-2xl">{(overviewStats.totalImpressions / 1000000).toFixed(1)}M</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Requests</CardDescription>
            <CardTitle className="text-2xl">{(overviewStats.totalRequests / 1000000).toFixed(1)}M</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fill Rate</CardDescription>
            <CardTitle className="text-2xl">{overviewStats.avgFillRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg eCPM</CardDescription>
            <CardTitle className="text-2xl">${overviewStats.avgEcpm}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Publishers</CardDescription>
            <CardTitle className="text-2xl">{overviewStats.activePublishers}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="demand">Demand Sources</TabsTrigger>
          <TabsTrigger value="publishers">Publishers</TabsTrigger>
          <TabsTrigger value="formats">Ad Formats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg">
                <p className="text-muted-foreground">Revenue chart placeholder</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Apps</CardTitle>
                <CardDescription>By revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">App Name {i}</p>
                        <p className="text-sm text-muted-foreground">Publisher {i}</p>
                      </div>
                      <span className="font-bold">${(Math.random() * 10000 + 5000).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Platform</CardTitle>
                <CardDescription>iOS vs Android</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div>
                      <p className="font-medium">iOS</p>
                      <p className="text-sm text-muted-foreground">55% of total</p>
                    </div>
                    <span className="text-2xl font-bold">$68,986</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div>
                      <p className="font-medium">Android</p>
                      <p className="text-sm text-muted-foreground">45% of total</p>
                    </div>
                    <span className="text-2xl font-bold">$56,444</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demand Source Performance</CardTitle>
              <CardDescription>Revenue and metrics by demand source</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">eCPM</TableHead>
                    <TableHead className="text-right">Fill Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demandSourceStats.map((source) => (
                    <TableRow key={source.name}>
                      <TableCell className="font-medium">{source.name}</TableCell>
                      <TableCell className="text-right">{source.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${source.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${source.ecpm}</TableCell>
                      <TableCell className="text-right">{source.fillRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publishers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publisher Performance</CardTitle>
              <CardDescription>Revenue and metrics by publisher</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Publisher</TableHead>
                    <TableHead className="text-right">Apps</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publisherStats.map((pub) => (
                    <TableRow key={pub.name}>
                      <TableCell className="font-medium">{pub.name}</TableCell>
                      <TableCell className="text-right">{pub.apps}</TableCell>
                      <TableCell className="text-right">{pub.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${pub.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={pub.status === "active" ? "success" : "secondary"}>
                          {pub.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Ad Format</CardTitle>
              <CardDescription>Metrics breakdown by format type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-6 rounded-lg border">
                  <h3 className="font-semibold mb-4">Banner</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Impressions</span>
                      <span className="font-medium">8.2M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium">$24,560</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">eCPM</span>
                      <span className="font-medium">$3.00</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-lg border">
                  <h3 className="font-semibold mb-4">Interstitial</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Impressions</span>
                      <span className="font-medium">4.1M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium">$45,230</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">eCPM</span>
                      <span className="font-medium">$11.03</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-lg border">
                  <h3 className="font-semibold mb-4">Rewarded</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Impressions</span>
                      <span className="font-medium">2.9M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium">$55,640</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">eCPM</span>
                      <span className="font-medium">$19.19</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
