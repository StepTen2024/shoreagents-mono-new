"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Search, TrendingUp, TrendingDown, AlertTriangle, Clock, Activity, MousePointer, Users } from "lucide-react"

interface StaffStats {
  productivityScore: number
  productivityPercentage: number
  totalMouseClicks: number
  totalKeystrokes: number
  totalActiveTime: number
  totalIdleTime: number
  totalUrlsVisited: number
  lateBreaks: number
  hasSuspiciousActivity: boolean
  suspiciousUrlCount: number
}

interface StaffMember {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  company: {
    id: string
    companyName: string
    logo: string | null
  } | null
  currentRole: string | null
  isClockedIn: boolean
  stats: StaffStats
  lastActivity: string | null
}

export default function StaffAnalyticsPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [companyFilter, setCompanyFilter] = useState("all")
  const [days, setDays] = useState(1) // Default to Today

  useEffect(() => {
    fetchStaff()
  }, [days])

  useEffect(() => {
    filterStaff()
  }, [staff, searchQuery, companyFilter])

  async function fetchStaff() {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/staff-analytics?days=${days}`)
      const data = await res.json()
      if (data.success) {
        setStaff(data.staff)
      }
    } catch (error) {
      console.error("Error fetching staff:", error)
    } finally {
      setLoading(false)
    }
  }

  function filterStaff() {
    let filtered = [...staff]

    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.company?.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (companyFilter !== "all") {
      filtered = filtered.filter((s) => s.company?.id === companyFilter)
    }

    setFilteredStaff(filtered)
  }

  function formatTime(seconds: number): string {
    // ⏱️ Database now stores SECONDS (not minutes!)
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${mins}m ${secs}s`
  }

  function getProductivityColor(score: number): string {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  function getProductivityBadge(score: number) {
    if (score >= 80) return <Badge className="bg-green-500">Excellent</Badge>
    if (score >= 60) return <Badge className="bg-blue-500">Good</Badge>
    if (score >= 40) return <Badge className="bg-yellow-500">Fair</Badge>
    return <Badge className="bg-red-500">Low</Badge>
  }

  // Calculate summary stats
  const totalStaff = staff.length
  const activeStaff = staff.filter((s) => s.isClockedIn).length
  const avgProductivity =
    staff.length > 0 ? Math.round(staff.reduce((sum, s) => sum + s.stats.productivityScore, 0) / staff.length) : 0  // ✅ FIX: Use productivityScore (weighted) instead of productivityPercentage
  const staffWithIssues = staff.filter((s) => s.stats.hasSuspiciousActivity || s.stats.lateBreaks > 0).length

  const companies = Array.from(new Set(staff.map((s) => s.company?.id).filter(Boolean)))

  if (loading) {
  return (
      <div className="space-y-6">
          <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Analytics</h1>
          <p className="text-muted-foreground">Loading staff performance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
        <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Analytics</h1>
        <p className="text-muted-foreground">Monitor individual staff performance, activity, and productivity</p>
        </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">Tracked staff members</p>
          </CardContent>
          </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Active</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeStaff}</div>
            <p className="text-xs text-muted-foreground">Clocked in now</p>
          </CardContent>
          </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Productivity</CardTitle>
            <TrendingUp className={`h-4 w-4 ${getProductivityColor(avgProductivity)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProductivityColor(avgProductivity)}`}>{avgProductivity}%</div>
            <p className="text-xs text-muted-foreground">Active vs idle time</p>
          </CardContent>
          </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{staffWithIssues}</div>
            <p className="text-xs text-muted-foreground">Suspicious activity or late breaks</p>
          </CardContent>
        </Card>
              </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search staff, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {staff
                .filter((s, i, arr) => s.company && arr.findIndex((x) => x.company?.id === s.company?.id) === i)
                .map((s) => (
                  <SelectItem key={s.company!.id} value={s.company!.id}>
                    {s.company!.companyName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={days.toString()} onValueChange={(val) => setDays(parseInt(val))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Today</SelectItem>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStaff.map((staffMember) => (
          <Link key={staffMember.id} href={`/admin/analytics/${staffMember.id}`}>
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={staffMember.avatar || ""} alt={staffMember.name} />
                      <AvatarFallback>
                        {staffMember.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{staffMember.name}</CardTitle>
                      <CardDescription className="text-xs">{staffMember.email}</CardDescription>
                    </div>
                  </div>
                  {staffMember.isClockedIn && (
                    <Badge className="bg-green-500">
                      <Clock className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Company */}
                {staffMember.company && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Company:</span>
                    <span className="font-medium">{staffMember.company.companyName}</span>
                  </div>
                )}

                {/* Productivity Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Productivity</span>
                  <div className="flex items-center gap-2">
                    {getProductivityBadge(staffMember.stats.productivityScore)}
                    <span className={`text-lg font-bold ${getProductivityColor(staffMember.stats.productivityScore)}`}>
                      {staffMember.stats.productivityScore}%
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Active Time</p>
                    <p className="font-semibold">{formatTime(staffMember.stats.totalActiveTime)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Idle Time</p>
                    <p className="font-semibold">{formatTime(staffMember.stats.totalIdleTime)}</p>
                  </div>
          <div>
                    <p className="text-muted-foreground">Mouse Clicks</p>
                    <p className="font-semibold">{staffMember.stats.totalMouseClicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">URLs Visited</p>
                    <p className="font-semibold">{staffMember.stats.totalUrlsVisited}</p>
                  </div>
                </div>
                
                {/* Red Flags */}
                {(staffMember.stats.hasSuspiciousActivity || staffMember.stats.lateBreaks > 0) && (
                  <div className="border-t pt-3 space-y-1">
                    {staffMember.stats.hasSuspiciousActivity && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{staffMember.stats.suspiciousUrlCount} suspicious URLs detected</span>
                      </div>
                    )}
                    {staffMember.stats.lateBreaks > 0 && (
                      <div className="flex items-center gap-2 text-orange-600 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{staffMember.stats.lateBreaks} late break returns</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
          ))}
      </div>

      {filteredStaff.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No staff members found matching your filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
