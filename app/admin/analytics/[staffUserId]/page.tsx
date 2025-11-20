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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  Coffee,
  Trash2,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react"

export default function StaffAnalyticsDetailPage() {
  const params = useParams()
  const router = useRouter()
  const staffUserId = params.staffUserId as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(1)  // ✅ Default to "Today"
  const [deletingScreenshot, setDeletingScreenshot] = useState<string | null>(null)
  const [screenshotToDelete, setScreenshotToDelete] = useState<string | null>(null)
  const [selectedScreenshots, setSelectedScreenshots] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

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
        setSelectedScreenshots(new Set()) // Clear selection when data refreshes
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

  function getProductivityColor(percentage: number): string {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-blue-600"
    if (percentage >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  function toggleScreenshotSelection(url: string) {
    setSelectedScreenshots((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(url)) {
        newSet.delete(url)
      } else {
        newSet.add(url)
      }
      return newSet
    })
  }

  function toggleSelectAll() {
    if (selectedScreenshots.size === screenshots.length) {
      setSelectedScreenshots(new Set())
    } else {
      setSelectedScreenshots(new Set(screenshots.map((s: any) => s.url)))
    }
  }

  async function confirmDeleteScreenshot() {
    if (!screenshotToDelete) return

    try {
      setDeletingScreenshot(screenshotToDelete)
      
      const res = await fetch(
        `/api/admin/screenshots/delete?url=${encodeURIComponent(screenshotToDelete)}&staffUserId=${staffUserId}`,
        { method: "DELETE" }
      )

      const result = await res.json()

      if (result.success) {
        // Remove the screenshot from local state
        setData((prevData: any) => ({
          ...prevData,
          screenshots: prevData.screenshots.filter((s: any) => s.url !== screenshotToDelete)
        }))
      } else {
        alert(`Failed to delete screenshot: ${result.error}`)
      }
    } catch (error) {
      console.error("Error deleting screenshot:", error)
      alert("Failed to delete screenshot. Please try again.")
    } finally {
      setDeletingScreenshot(null)
      setScreenshotToDelete(null)
    }
  }

  async function confirmBulkDelete() {
    if (selectedScreenshots.size === 0) return

    setIsDeleting(true)
    setShowBulkDeleteDialog(false)
    const urlsToDelete = Array.from(selectedScreenshots)
    let successCount = 0
    let failCount = 0

    for (const url of urlsToDelete) {
      try {
        const res = await fetch(
          `/api/admin/screenshots/delete?url=${encodeURIComponent(url)}&staffUserId=${staffUserId}`,
          { method: "DELETE" }
        )

        const result = await res.json()

        if (result.success) {
          successCount++
        } else {
          failCount++
          console.error(`Failed to delete ${url}:`, result.error)
        }
      } catch (error) {
        failCount++
        console.error(`Error deleting ${url}:`, error)
      }
    }

    // Refresh the data to get the latest state
    if (successCount > 0) {
      await fetchStaffDetail()
    }

    // Clear selection
    setSelectedScreenshots(new Set())
    setIsDeleting(false)

    // Show result
    if (failCount === 0) {
      alert(`Successfully deleted ${successCount} screenshot(s)`)
    } else {
      alert(`Deleted ${successCount} screenshot(s). Failed to delete ${failCount} screenshot(s).`)
    }
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

  const { staff, summary, visitedUrls, suspiciousUrls, applications, breaks, lateBreaks, screenshots, dailyActivity } = data

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
      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Idle Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatTime(summary.totalIdleTime)}</div>
            <p className="text-xs text-muted-foreground">Inactive periods</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Break Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.lateBreakCount}</div>
            <p className="text-xs text-muted-foreground">Late break returns</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Data Views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="urls">
            URLs Visited
            {suspiciousUrls.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {suspiciousUrls.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="apps">Applications</TabsTrigger>
          <TabsTrigger value="breaks">Breaks</TabsTrigger>
          <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
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
              <div className="grid gap-4 md:grid-cols-3">
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
                        {day.lateBreaks > 0 && (
                          <>
                            <AlertTriangle className="h-3 w-3 ml-2 text-red-600" />
                            <span className="text-red-600">{day.lateBreaks} late breaks</span>
                          </>
                        )}
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
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-900">Suspicious Activity Detected</CardTitle>
                </div>
                <CardDescription className="text-red-700">
                  {suspiciousUrls.length} potentially non-work-related URLs detected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspiciousUrls.slice(0, 20).map((urlData: any, index: number) => (
                      <TableRow key={index} className="bg-red-100">
                        <TableCell className="font-mono text-sm max-w-md truncate">{urlData.url || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{urlData.reason || "suspicious"}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatAdminDateTime(urlData.date)}</TableCell>
                        <TableCell className="text-sm">{urlData.duration ? `${urlData.duration}s` : "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Visited URLs</CardTitle>
              <CardDescription>Complete list of URLs visited during work hours</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitedUrls.slice(0, 50).map((urlData: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm max-w-md truncate">{urlData.url || "N/A"}</TableCell>
                      <TableCell className="max-w-xs truncate">{urlData.title || "-"}</TableCell>
                      <TableCell className="text-sm">{formatAdminDateTime(urlData.date)}</TableCell>
                      <TableCell className="text-sm">{urlData.duration ? `${urlData.duration}s` : "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {visitedUrls.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No URL data available for this period.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="apps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Applications Used</CardTitle>
              <CardDescription>Time spent in each application</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>Total Time</TableHead>
                    <TableHead>Usage Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{app.name}</TableCell>
                      <TableCell>{formatTime(app.totalTime)}</TableCell>
                      <TableCell>{app.count} times</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {applications.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No application data available for this period.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breaks Tab */}
        <TabsContent value="breaks" className="space-y-4">
          {lateBreaks.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-orange-900">Late Break Returns</CardTitle>
                </div>
                <CardDescription className="text-orange-700">{lateBreaks.length} instances of late return from breaks</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Break Type</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Late By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lateBreaks.map((brk: any) => (
                      <TableRow key={brk.id} className="bg-orange-100">
                        <TableCell className="font-medium">{brk.type}</TableCell>
                        <TableCell className="text-sm">
                          {brk.scheduledStart} - {brk.scheduledEnd}
                        </TableCell>
                        <TableCell className="text-sm">
                          {brk.actualStart ? formatAdminDateTime(brk.actualStart) : "N/A"} - {brk.actualEnd ? formatAdminDateTime(brk.actualEnd) : "Ongoing"}
                        </TableCell>
                        <TableCell className="text-red-600 font-semibold">{brk.lateBy ? `${brk.lateBy} min` : "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Breaks</CardTitle>
              <CardDescription>Complete break history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breaks.map((brk: any) => (
                    <TableRow key={brk.id}>
                      <TableCell className="font-medium">{brk.type}</TableCell>
                      <TableCell className="text-sm">{brk.actualStart ? formatAdminDateTime(brk.actualStart) : "N/A"}</TableCell>
                      <TableCell className="text-sm">{brk.actualEnd ? formatAdminDateTime(brk.actualEnd) : "Ongoing"}</TableCell>
                      <TableCell>{brk.duration ? `${brk.duration} min` : "N/A"}</TableCell>
                      <TableCell>
                        {brk.isLate ? (
                          <Badge variant="destructive">Late ({brk.lateBy} min)</Badge>
                        ) : (
                          <Badge className="bg-green-500">On Time</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {breaks.length === 0 && <p className="text-center text-muted-foreground py-8">No break data available for this period.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Screenshots Tab */}
        <TabsContent value="screenshots" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Screenshots</CardTitle>
                  <CardDescription>Captured screenshots during work hours (for future analysis)</CardDescription>
                </div>
                {screenshots.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                      className="gap-2"
                    >
                      {selectedScreenshots.size === screenshots.length ? (
                        <>
                          <CheckSquare className="h-4 w-4" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4" />
                          Select All
                        </>
                      )}
                    </Button>
                    {selectedScreenshots.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowBulkDeleteDialog(true)}
                        disabled={isDeleting}
                        className="gap-2"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Delete Selected ({selectedScreenshots.size})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {screenshots.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {screenshots.map((screenshot: any, index: number) => {
                    const isSelected = selectedScreenshots.has(screenshot.url)
                    return (
                      <div 
                        key={index} 
                        className={`border rounded-lg p-2 relative group transition-all ${
                          isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
                        }`}
                      >
                        {/* Selection Checkbox - Always visible when any screenshot is selected */}
                        <Button
                          variant="outline"
                          size="sm"
                          className={`absolute top-3 left-3 h-8 w-8 p-0 shadow-lg bg-white ${
                            selectedScreenshots.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          } transition-opacity z-10`}
                          onClick={() => toggleScreenshotSelection(screenshot.url)}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>

                        <img src={screenshot.url} alt={`Screenshot ${index + 1}`} className="w-full h-auto rounded" />
                        <p className="text-xs text-muted-foreground mt-1">{formatAdminDateTime(screenshot.date)}</p>
                        
                        {/* Delete Single Button - Shows on hover when no selection mode */}
                        {selectedScreenshots.size === 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={() => setScreenshotToDelete(screenshot.url)}
                            disabled={deletingScreenshot === screenshot.url}
                          >
                            {deletingScreenshot === screenshot.url ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No screenshots available for this period.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Single Screenshot Confirmation Dialog */}
      <AlertDialog open={!!screenshotToDelete} onOpenChange={(open) => !open && setScreenshotToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Screenshot?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this screenshot? This action cannot be undone and will permanently remove the screenshot from storage and the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingScreenshot}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteScreenshot}
              disabled={!!deletingScreenshot}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingScreenshot ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={(open) => !open && setShowBulkDeleteDialog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedScreenshots.size} Screenshot(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedScreenshots.size} selected screenshot(s)? This action cannot be undone and will permanently remove the screenshots from storage and the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting {selectedScreenshots.size} screenshot(s)...
                </>
              ) : (
                <>Delete {selectedScreenshots.size} Screenshot(s)</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

