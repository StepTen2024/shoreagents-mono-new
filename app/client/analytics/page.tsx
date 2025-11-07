"use client"

import { useState, useEffect } from "react"
import { 
  Clock, TrendingUp, AlertCircle, Users, Calendar,
  CheckCircle, XCircle, Coffee, Globe, Laptop, Activity,
  BarChart3, RefreshCw
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

interface StaffAnalytics {
  id: string
  name: string
  email: string
  avatar: string | null
  position: string
  
  // Attendance
  clockInStatus: "EARLY" | "ON_TIME" | "LATE" | "NO_DATA"
  minutesEarly: number | null
  minutesLate: number | null
  
  // Break Compliance
  breakCompliance: "GOOD" | "WARNING" | "CONCERN" | "NO_DATA"
  totalBreaks: number
  lateFromBreak: boolean
  
  // Productivity Score (0-100)
  productivityScore: number
  
  // Time Metrics
  activeTime: number // seconds
  idleTime: number // seconds
  activePercentage: number
  
  // Web Activity
  urlsVisited: number
  workRelatedUrls: number
  nonWorkUrls: number
  workUrlPercentage: number
  
  // Applications
  appsUsed: number
  workRelatedApps: number
  nonWorkApps: number
  workAppPercentage: number
  
  lastUpdate: string
}

export default function ClientAnalyticsPage() {
  const [staffList, setStaffList] = useState<StaffAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today")
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    fetchStaffAnalytics()
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchStaffAnalytics()
    }, 60000)
    
    return () => clearInterval(interval)
  }, [selectedPeriod])

  const fetchStaffAnalytics = async () => {
    try {
      const response = await fetch(`/api/client/staff-analytics?period=${selectedPeriod}`)
      if (response.ok) {
        const data = await response.json()
        setStaffList(data.staff)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error("Failed to fetch staff analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const getProductivityColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getProductivityBadge = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "bg-green-100 text-green-800 border-green-300" }
    if (score >= 60) return { label: "Good", color: "bg-yellow-100 text-yellow-800 border-yellow-300" }
    return { label: "Needs Attention", color: "bg-red-100 text-red-800 border-red-300" }
  }

  const getAttendanceBadge = (status: string, minutes: number | null) => {
    switch (status) {
      case "EARLY":
        return { icon: CheckCircle, label: `Early (${minutes}m)`, color: "bg-green-100 text-green-800 border-green-300" }
      case "ON_TIME":
        return { icon: CheckCircle, label: "On Time", color: "bg-blue-100 text-blue-800 border-blue-300" }
      case "LATE":
        return { icon: AlertCircle, label: `Late (${minutes}m)`, color: "bg-red-100 text-red-800 border-red-300" }
      default:
        return { icon: XCircle, label: "No Data", color: "bg-gray-100 text-gray-800 border-gray-300" }
    }
  }

  const getBreakBadge = (compliance: string) => {
    switch (compliance) {
      case "GOOD":
        return { icon: CheckCircle, label: "Good", color: "bg-green-100 text-green-800 border-green-300" }
      case "WARNING":
        return { icon: AlertCircle, label: "Warning", color: "bg-yellow-100 text-yellow-800 border-yellow-300" }
      case "CONCERN":
        return { icon: XCircle, label: "Concern", color: "bg-red-100 text-red-800 border-red-300" }
      default:
        return { icon: Coffee, label: "No Data", color: "bg-gray-100 text-gray-800 border-gray-300" }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading staff analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Analytics</h1>
            <p className="text-gray-600 mt-1">Monitor your team's productivity and attendance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <Button 
              onClick={fetchStaffAnalytics} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(["today", "week", "month"] as const).map((period) => (
            <Button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              variant={selectedPeriod === period ? "default" : "outline"}
              className="capitalize"
            >
              {period === "today" ? "Today" : `This ${period}`}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{staffList.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Productivity</p>
              <p className="text-2xl font-bold text-gray-900">
                {staffList.length > 0 
                  ? Math.round(staffList.reduce((sum, s) => sum + s.productivityScore, 0) / staffList.length)
                  : 0}
                /100
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">On Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {staffList.filter(s => s.clockInStatus === "ON_TIME" || s.clockInStatus === "EARLY").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Late</p>
              <p className="text-2xl font-bold text-gray-900">
                {staffList.filter(s => s.clockInStatus === "LATE").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Staff List */}
      <div className="space-y-6">
        {staffList.map((staff) => {
          const productivityBadge = getProductivityBadge(staff.productivityScore)
          const attendanceBadge = getAttendanceBadge(
            staff.clockInStatus, 
            staff.clockInStatus === "EARLY" ? staff.minutesEarly : staff.minutesLate
          )
          const breakBadge = getBreakBadge(staff.breakCompliance)

          return (
            <Card key={staff.id} className="p-6 bg-white hover:shadow-lg transition-shadow">
              {/* Staff Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={staff.avatar || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{staff.name}</h3>
                    <p className="text-gray-600">{staff.position}</p>
                  </div>
                </div>

                {/* Productivity Score */}
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-24 h-24">
                      <svg className="transform -rotate-90 w-24 h-24">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke={staff.productivityScore >= 80 ? "#10b981" : staff.productivityScore >= 60 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(staff.productivityScore / 100) * 251.2} 251.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">{staff.productivityScore}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`mt-2 ${productivityBadge.color} border`}>
                    {productivityBadge.label}
                  </Badge>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Attendance */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Clock className="h-4 w-4" />
                    Attendance
                  </div>
                  <Badge className={`${attendanceBadge.color} border flex items-center gap-1 w-fit`}>
                    <attendanceBadge.icon className="h-3 w-3" />
                    {attendanceBadge.label}
                  </Badge>
                </div>

                {/* Break Compliance */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Coffee className="h-4 w-4" />
                    Break Compliance
                  </div>
                  <Badge className={`${breakBadge.color} border flex items-center gap-1 w-fit`}>
                    <breakBadge.icon className="h-3 w-3" />
                    {breakBadge.label}
                  </Badge>
                  <p className="text-xs text-gray-500">{staff.totalBreaks} breaks today</p>
                </div>

                {/* Active vs Idle Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Activity className="h-4 w-4" />
                    Activity
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Active:</span>
                      <span className="font-semibold text-green-600">{formatTime(staff.activeTime)}</span>
                    </div>
                    <Progress value={staff.activePercentage} className="h-2" />
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Idle:</span>
                      <span className="font-semibold text-gray-500">{formatTime(staff.idleTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Web & Apps */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Globe className="h-4 w-4" />
                    Web & Apps
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">URLs (Work):</span>
                      <span className="font-semibold text-blue-600">
                        {staff.workRelatedUrls}/{staff.urlsVisited}
                      </span>
                    </div>
                    <Progress value={staff.workUrlPercentage} className="h-1 bg-gray-200" />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Apps (Work):</span>
                      <span className="font-semibold text-purple-600">
                        {staff.workRelatedApps}/{staff.appsUsed}
                      </span>
                    </div>
                    <Progress value={staff.workAppPercentage} className="h-1 bg-gray-200" />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                <span>Last activity: {new Date(staff.lastUpdate).toLocaleString()}</span>
                {(staff.productivityScore < 60 || staff.clockInStatus === "LATE" || staff.breakCompliance === "CONCERN") && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    May need attention
                  </Badge>
                )}
              </div>
            </Card>
          )
        })}

        {staffList.length === 0 && (
          <Card className="p-12 bg-white text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Staff Data</h3>
            <p className="text-gray-600">No staff members have clocked in {selectedPeriod === "today" ? "today" : `this ${selectedPeriod}`}.</p>
          </Card>
        )}
      </div>

      {/* Footer Note */}
      <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Need to address performance concerns?</p>
            <p className="text-blue-800">
              Contact your Account Manager for detailed insights and professional support. 
              We'll help you work with staff to improve productivity and resolve any issues.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
