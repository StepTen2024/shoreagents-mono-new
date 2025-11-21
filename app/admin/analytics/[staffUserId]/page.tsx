"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatAdminDate, formatAdminDateTime } from "@/lib/utils"
import {
  ArrowLeft,
  Activity,
  MousePointer,
  Clock,
  Globe,
  AppWindow,
  Camera,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

export default function StaffAnalyticsDetailPage() {
  const params = useParams()
  const router = useRouter()
  const staffUserId = params.staffUserId as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(1)  // ✅ Default to "Today"

  useEffect(() => {
    if (staffUserId) {
      fetchStaffDetail()
    }
  }, [staffUserId, days])

  async function fetchStaffDetail() {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/staff-analytics/${staffUserId}?days=${days}`)
      const result = await res.json()
      if (result.success) {
        setData(result)
      }
    } catch (error) {
      console.error("Error fetching staff detail:", error)
    } finally {
      setLoading(false)
    }
  }

  function formatTime(seconds: number): string {
    // ⏱️ Database now stores SECONDS (not minutes!)
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${mins}m ${secs}s`
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  function getProductivityColor(percentage: number): string {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-blue-600"
    if (percentage >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  // ✅ Admin displays dates in Philippines timezone using utility functions

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
          <p className="text-muted-foreground">Fetching staff analytics data...</p>
        </div>
      </div>
    )
  }

  const { staff, summary, visitedUrls, suspiciousUrls, applications, screenshots, dailyActivity } = data

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Analytics
        </Button>

        <Select value={days.toString()} onValueChange={(val) => setDays(parseInt(val))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Today</SelectItem>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={staff.avatar || ""} alt={staff.name} />
              <AvatarFallback className="text-2xl">
                {staff.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{staff.name}</CardTitle>
                {staff.isClockedIn && <Badge className="bg-green-500">Clocked In</Badge>}
              </div>
              <CardDescription className="text-base mt-1">{staff.email}</CardDescription>
              {staff.company && (
                <p className="text-sm text-muted-foreground mt-2">
                  Company: <span className="font-medium">{staff.company.companyName}</span>
                </p>
              )}
              {staff.profile?.currentRole && (
                <p className="text-sm text-muted-foreground">
                  Role: <span className="font-medium">{staff.profile.currentRole}</span>
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity</CardTitle>
            <TrendingUp className={`h-4 w-4 ${getProductivityColor(summary.productivityPercentage)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProductivityColor(summary.productivityPercentage)}`}>
              {summary.productivityPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">Active vs Idle Time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Time</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatTime(summary.totalActiveTime)}</div>
            <p className="text-xs text-muted-foreground">Productive work time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keystrokes</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.totalKeystrokes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total typing activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mouse Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{summary.totalMouseClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total click activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Data Views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="apps">Applications ({applications.length})</TabsTrigger>
          <TabsTrigger value="urls">
            URLs ({visitedUrls.length})
            {suspiciousUrls.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {suspiciousUrls.length} 🚨
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="screenshots">Screenshots ({screenshots.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
              <CardDescription>Key metrics for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Mouse Clicks</p>
                  <p className="text-2xl font-bold">{summary.totalMouseClicks.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Keystrokes</p>
                  <p className="text-2xl font-bold">{summary.totalKeystrokes.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">URLs Visited</p>
                  <p className="text-2xl font-bold">{summary.totalUrlsVisited}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tab Switches</p>
                  <p className="text-2xl font-bold">{summary.totalTabsSwitched || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network & File Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Network & File Activity</CardTitle>
              <CardDescription>Downloads, uploads, and data transfer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">📥 Downloads</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.totalDownloads || 0}</p>
                  <p className="text-xs text-muted-foreground">Files downloaded</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">📤 Uploads</p>
                  <p className="text-2xl font-bold text-green-600">{summary.totalUploads || 0}</p>
                  <p className="text-xs text-muted-foreground">Files uploaded</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">📊 Bandwidth</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatBytes(summary.totalBandwidth || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Data transferred</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Activity */}
          <Card>
            <CardHeader>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>Clipboard and other system interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">📋 Clipboard Actions</p>
                  <p className="text-2xl font-bold">{summary.totalClipboardActions || 0}</p>
                  <p className="text-xs text-muted-foreground">Copy/paste operations</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">🖥️ Screen Time</p>
                  <p className="text-2xl font-bold">{formatTime(summary.totalScreenTime || 0)}</p>
                  <p className="text-xs text-muted-foreground">Total app open time</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">🎯 Productivity Score</p>
                  <p className={`text-2xl font-bold ${getProductivityColor(summary.productivityScore || 0)}`}>
                    {summary.productivityScore || 0}/100
                  </p>
                  <p className="text-xs text-muted-foreground">Weighted score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>Activity trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dailyActivity.map((day: any) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground">{formatAdminDate(day.date)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-green-500 h-full flex items-center px-2 text-xs text-white font-medium"
                            style={{
                              width: `${day.activeTime > 0 ? Math.max((day.activeTime / (day.activeTime + day.idleTime)) * 100, 5) : 0}%`,
                            }}
                          >
                            {day.activeTime > 0 && `${Math.round((day.activeTime / (day.activeTime + day.idleTime)) * 100)}%`}
                          </div>
                        </div>
                        <span className="text-sm w-16">{formatTime(day.activeTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MousePointer className="h-3 w-3" />
                        {day.mouseClicks} clicks
                        <Globe className="h-3 w-3 ml-2" />
                        {day.urlsVisited} URLs
                        <AppWindow className="h-3 w-3 ml-2" />
                        {day.keystrokes} keys
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* URLs Tab */}
        <TabsContent value="urls" className="space-y-4">
          {suspiciousUrls.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-900 dark:text-red-400">🚨 Suspicious Activity Detected</CardTitle>
                </div>
                <CardDescription className="text-red-700 dark:text-red-300">
                  {suspiciousUrls.length} potentially non-work-related sites visited
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suspiciousUrls.slice(0, 20).map((urlData: any, index: number) => {
                    // Handle different URL formats from database
                    let displayUrl = ''
                    if (typeof urlData === 'string') {
                      displayUrl = urlData
                    } else if (urlData && typeof urlData.url === 'string') {
                      displayUrl = urlData.url
                    } else if (urlData && typeof urlData === 'object') {
                      displayUrl = JSON.stringify(urlData)
                    } else {
                      displayUrl = 'Unknown URL'
                    }
                    
                    const cleanUrl = typeof displayUrl === 'string' ? displayUrl.replace('page:', '') : displayUrl
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-red-900 dark:text-red-300">{cleanUrl}</p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {urlData.date ? formatAdminDateTime(urlData.date) : 'N/A'}
                            {urlData.reason && ` • Flagged: ${urlData.reason}`}
                          </p>
                        </div>
                          <Badge variant="destructive">{urlData.reason || "suspicious"}</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Visited Pages ({visitedUrls.length})</CardTitle>
              <CardDescription>Complete browsing history during work hours</CardDescription>
            </CardHeader>
            <CardContent>
              {visitedUrls.length > 0 ? (
                <div className="space-y-2">
                  {visitedUrls.map((urlData: any, index: number) => {
                    // Handle different URL formats from database
                    let displayUrl = ''
                    if (typeof urlData === 'string') {
                      displayUrl = urlData
                    } else if (urlData && typeof urlData.url === 'string') {
                      displayUrl = urlData.url
                    } else if (urlData && typeof urlData === 'object') {
                      displayUrl = JSON.stringify(urlData)
                    } else {
                      displayUrl = 'Unknown URL'
                    }
                    
                    const cleanUrl = typeof displayUrl === 'string' ? displayUrl.replace('page:', '') : displayUrl
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{cleanUrl}</p>
                          <p className="text-xs text-muted-foreground">
                            {urlData.date ? formatAdminDateTime(urlData.date) : 'N/A'}
                          </p>
                        </div>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No browsing activity recorded for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="apps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Applications Used ({applications.length})</CardTitle>
              <CardDescription>All applications accessed during work hours</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {applications.map((app: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <AppWindow className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{app.name}</p>
                          <p className="text-xs text-muted-foreground">Used {app.count} time{app.count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      {app.totalTime > 0 && (
                        <div className="text-right">
                          <p className="font-medium">{formatTime(app.totalTime)}</p>
                          <p className="text-xs text-muted-foreground">Total time</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AppWindow className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No application tracking data for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Screenshots Tab */}
        <TabsContent value="screenshots" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>📸 Screenshots ({screenshots.length})</CardTitle>
                  <CardDescription>Automatically captured every 60 seconds during active work</CardDescription>
                </div>
                <Camera className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardHeader>
            <CardContent>
              {screenshots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {screenshots.map((screenshot: any, index: number) => {
                    const imageUrl = typeof screenshot === 'string' ? screenshot : screenshot.url
                    
                    // 🔍 DEBUG: Log screenshot URL to console
                    if (index < 5) {
                      console.log(`📸 Screenshot ${index + 1}:`, imageUrl)
                    }
                    
                    return (
                      <div key={index} className="group relative border rounded-lg overflow-hidden hover:shadow-lg transition-all">
                        <div className="aspect-video bg-muted relative overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt={`Screenshot ${index + 1}`} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              console.error(`❌ Screenshot ${index + 1} failed to load:`, imageUrl)
                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage unavailable%3C/text%3E%3C/svg%3E'
                            }}
                            onLoad={() => {
                              if (index < 5) {
                                console.log(`✅ Screenshot ${index + 1} loaded successfully`)
                              }
                            }}
                          />
                        </div>
                        <div className="p-2 bg-background">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatAdminDateTime(screenshot.date)}
                          </p>
                        </div>
                        {/* Expand on click */}
                        <a 
                          href={imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <div className="text-white font-medium px-3 py-1 bg-black/75 rounded">
                            View Full Size
                          </div>
                        </a>
                    </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">No Screenshots Captured</p>
                  <p className="text-sm text-muted-foreground">Screenshots are automatically taken every 60 seconds when staff is active</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

