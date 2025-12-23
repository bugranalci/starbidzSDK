"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock system data
const systemHealth = {
  bidServer: { status: "healthy", uptime: "99.99%", latency: "45ms" },
  database: { status: "healthy", connections: 23, poolSize: 50 },
  redis: { status: "healthy", memory: "256MB", hitRate: "94.5%" },
  workers: { status: "healthy", active: 4, queue: 12 },
}

const recentLogs = [
  { timestamp: "2024-01-15 14:32:45", level: "INFO", message: "Bid request processed successfully", source: "bid-server" },
  { timestamp: "2024-01-15 14:32:44", level: "WARN", message: "DSP timeout: unity-ads (exceeded 200ms)", source: "ortb-connector" },
  { timestamp: "2024-01-15 14:32:43", level: "INFO", message: "New publisher registered: AppMakers Ltd", source: "dashboard" },
  { timestamp: "2024-01-15 14:32:42", level: "ERROR", message: "Failed to sync GAM placements", source: "gam-connector" },
  { timestamp: "2024-01-15 14:32:41", level: "INFO", message: "Cache invalidated for publisher: abc123", source: "redis" },
]

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState("health")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System</h1>
          <p className="text-muted-foreground">System health, configuration, and monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Refresh Status</Button>
          <Button variant="outline">View Full Logs</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bid Server</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Healthy</CardTitle>
              <Badge variant="success">Online</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Uptime: {systemHealth.bidServer.uptime} | Latency: {systemHealth.bidServer.latency}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Database</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Healthy</CardTitle>
              <Badge variant="success">Connected</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connections: {systemHealth.database.connections}/{systemHealth.database.poolSize}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Redis Cache</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Healthy</CardTitle>
              <Badge variant="success">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Memory: {systemHealth.redis.memory} | Hit Rate: {systemHealth.redis.hitRate}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Background Workers</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Healthy</CardTitle>
              <Badge variant="success">Running</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Active: {systemHealth.workers.active} | Queue: {systemHealth.workers.queue}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="health">Health Check</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Health</CardTitle>
              <CardDescription>Detailed health status of all services</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Last Check</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Bid Server (Elysia)</TableCell>
                    <TableCell><Badge variant="success">Healthy</Badge></TableCell>
                    <TableCell>45ms</TableCell>
                    <TableCell>Just now</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Restart</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">PostgreSQL Database</TableCell>
                    <TableCell><Badge variant="success">Healthy</Badge></TableCell>
                    <TableCell>12ms</TableCell>
                    <TableCell>Just now</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Redis Cache</TableCell>
                    <TableCell><Badge variant="success">Healthy</Badge></TableCell>
                    <TableCell>2ms</TableCell>
                    <TableCell>Just now</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Flush</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Google Ad Manager API</TableCell>
                    <TableCell><Badge variant="success">Healthy</Badge></TableCell>
                    <TableCell>234ms</TableCell>
                    <TableCell>2 min ago</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Test</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">OpenRTB Connectors</TableCell>
                    <TableCell><Badge variant="success">Healthy</Badge></TableCell>
                    <TableCell>156ms avg</TableCell>
                    <TableCell>Just now</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bid Server Settings</CardTitle>
                <CardDescription>Configure bid server parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultTimeout">Default Timeout (ms)</Label>
                  <Input id="defaultTimeout" type="number" defaultValue="200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrent">Max Concurrent Requests</Label>
                  <Input id="maxConcurrent" type="number" defaultValue="1000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bidFloor">Global Bid Floor ($)</Label>
                  <Input id="bidFloor" type="number" step="0.01" defaultValue="0.50" />
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Auction Settings</CardTitle>
                <CardDescription>Configure auction behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="auctionType">Auction Type</Label>
                  <Input id="auctionType" defaultValue="First Price" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tmax">TMAX Override (ms)</Label>
                  <Input id="tmax" type="number" defaultValue="150" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Input id="currency" defaultValue="USD" />
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rate Limiting</CardTitle>
                <CardDescription>Configure API rate limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Requests per minute</Label>
                  <Input id="rateLimit" type="number" defaultValue="10000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="burstLimit">Burst limit</Label>
                  <Input id="burstLimit" type="number" defaultValue="100" />
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logging</CardTitle>
                <CardDescription>Configure logging settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logLevel">Log Level</Label>
                  <Input id="logLevel" defaultValue="INFO" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Log Retention (days)</Label>
                  <Input id="retention" type="number" defaultValue="30" />
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
              <CardDescription>Latest system log entries</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogs.map((log, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.level === "ERROR"
                              ? "destructive"
                              : log.level === "WARN"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{log.source}</TableCell>
                      <TableCell>{log.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Management</CardTitle>
              <CardDescription>Redis cache statistics and controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-2xl font-bold">256 MB</p>
                  <p className="text-sm text-muted-foreground">Memory Used</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-2xl font-bold">1.2M</p>
                  <p className="text-sm text-muted-foreground">Total Keys</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-2xl font-bold">94.5%</p>
                  <p className="text-sm text-muted-foreground">Hit Rate</p>
                </div>
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-2xl font-bold">2ms</p>
                  <p className="text-sm text-muted-foreground">Avg Latency</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">Clear Publisher Cache</Button>
                <Button variant="outline">Clear Bid Cache</Button>
                <Button variant="destructive">Flush All</Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">Cache Keys by Type</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key Pattern</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Memory</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono">publisher:*</TableCell>
                      <TableCell className="text-right">45,230</TableCell>
                      <TableCell className="text-right">12 MB</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Clear</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">bid:*</TableCell>
                      <TableCell className="text-right">890,450</TableCell>
                      <TableCell className="text-right">156 MB</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Clear</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">dsp:*</TableCell>
                      <TableCell className="text-right">12,340</TableCell>
                      <TableCell className="text-right">8 MB</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Clear</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">session:*</TableCell>
                      <TableCell className="text-right">234,560</TableCell>
                      <TableCell className="text-right">80 MB</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Clear</Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
