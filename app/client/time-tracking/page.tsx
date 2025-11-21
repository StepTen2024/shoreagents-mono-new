"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Clock, 
  Coffee, 
  Users, 
  Calendar,
  Grid3x3,
  List,
  RefreshCw,
  TrendingUp,
  Play,
  Pause,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Activity,
  Globe
} from "lucide-react"
import { useWebSocket } from "@/lib/websocket-provider"

type BreakType = "MORNING" | "LUNCH" | "AFTERNOON" | "AWAY"

type Break = {
  id: string
  type: BreakType
  scheduledStart: string | null
  scheduledEnd: string | null
  actualStart: Date | null
  actualEnd: Date | null
  duration: number | null
  isLate: boolean
  lateBy: number | null
}

type TimeEntry = {
  id: string
  clockIn: Date
  clockOut: Date | null
  totalHours: number
  expectedClockIn: Date | null
  expectedClockOut: Date | null
  wasLate: boolean
  lateBy: number | null
  wasEarly: boolean
  earlyBy: number | null
  wasEarlyClockOut: boolean
  earlyClockOutBy: number | null
  overtimeMinutes: number | null
  workedFullShift: boolean
  lateReason: string | null
  clockOutReason: string | null
  shiftDate: Date | null
  shiftDayOfWeek: string | null
  workSchedule: {
    startTime: string
    endTime: string
    dayOfWeek: string
    shiftType: string
  } | null
  breaks: Break[]
}

type StaffTimeEntry = {
  staff: {
    id: string
    name: string
    email: string
    avatar: string | null
    role: string
    employmentStatus: string
  }
  isClockedIn: boolean
  isOnBreak: boolean
  currentBreakType: BreakType | null
  currentEntry: {
    id: string
    clockIn: Date
    currentHours: number
    expectedClockIn: Date | null
    expectedClockOut: Date | null
    wasLate: boolean
    lateBy: number | null
    wasEarly: boolean
    earlyBy: number | null
    lateReason: string | null
    // ✨ NEW: Real-time overtime tracking
    isCurrentlyOvertime: boolean
    liveOvertimeMinutes: number
    workSchedule: {
      startTime: string
      endTime: string
      dayOfWeek: string
      shiftType: string
    } | null
    breaks: Break[]
  } | null
  timeEntries: TimeEntry[]
  totalHours: number
  totalEntries: number
}

export default function ClientTimeTrackingPage() {
  const [staffData, setStaffData] = useState<StaffTimeEntry[]>([])
  const [allStaffData, setAllStaffData] = useState<StaffTimeEntry[]>([]) // Store unfiltered data
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedStaff, setSelectedStaff] = useState<StaffTimeEntry | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')
  const [staffFilter, setStaffFilter] = useState<string>('all') // 'all' or staffId
  const [statusFilter, setStatusFilter] = useState<string>('all') // 'all', 'working', 'break', 'out'
  
  const [summary, setSummary] = useState({
    totalHours: 0,
    activeStaff: 0,
    totalEntries: 0,
    totalStaff: 0
  })

  // WebSocket for real-time updates
  const { on, off, isConnected } = useWebSocket()

  useEffect(() => {
    fetchTimeEntries()
  }, [selectedDate])

  // ✨ NEW: Auto-refresh every 30 seconds for real-time overtime updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (staffData.some(s => s.isClockedIn)) {
        console.log('[Time Tracking] Auto-refreshing for real-time overtime...')
        fetchTimeEntries(true) // Silent refresh
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [staffData])

  // WebSocket real-time event handlers
  useEffect(() => {
    if (!isConnected) return

    const handleTimeUpdate = (data: any) => {
      console.log('[Time Tracking] WebSocket update:', data)
      // Refresh data when staff clocks in/out or takes break
      fetchTimeEntries(true)
    }

    // Listen to time tracking events
    on('time:clockin', handleTimeUpdate)
    on('time:clockout', handleTimeUpdate)
    on('break:start', handleTimeUpdate)
    on('break:end', handleTimeUpdate)

    return () => {
      off('time:clockin', handleTimeUpdate)
      off('time:clockout', handleTimeUpdate)
      off('break:start', handleTimeUpdate)
      off('break:end', handleTimeUpdate)
    }
  }, [isConnected, on, off])

  // Auto-refresh every 30 seconds (backup for WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTimeEntries(true) // Silent refresh
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [selectedDate])

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters()
  }, [staffFilter, statusFilter, allStaffData])

  async function fetchTimeEntries(silent = false) {
    try {
      if (!silent) setLoading(true)
      setRefreshing(true)
      
      const res = await fetch(`/api/client/time-tracking?startDate=${selectedDate}&endDate=${selectedDate}`)
      if (res.ok) {
        const data = await res.json()
        console.log('📊 [Client Time Tracking] Received data:', data)
        console.log('👥 [Client Time Tracking] Staff entries:', data.staffTimeEntries?.length || 0)
        if (data.staffTimeEntries && data.staffTimeEntries.length > 0) {
          data.staffTimeEntries.forEach((entry: any) => {
            if (entry.currentEntry) {
              console.log(`   📌 ${entry.staff.name}:`, {
                isClockedIn: entry.isClockedIn,
                clockIn: entry.currentEntry.clockIn,
                wasLate: entry.currentEntry.wasLate,
                lateBy: entry.currentEntry.lateBy,
                wasEarly: entry.currentEntry.wasEarly,
                earlyBy: entry.currentEntry.earlyBy,
                isCurrentlyOvertime: entry.currentEntry.isCurrentlyOvertime,
                liveOvertimeMinutes: entry.currentEntry.liveOvertimeMinutes,
                workSchedule: entry.currentEntry.workSchedule
              })
            }
          })
        }
        setAllStaffData(data.staffTimeEntries)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Failed to fetch time entries:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function applyFilters() {
    let filtered = [...allStaffData]

    // Staff filter
    if (staffFilter !== 'all') {
      filtered = filtered.filter(s => s.staff.id === staffFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'working':
          filtered = filtered.filter(s => s.isClockedIn && !s.isOnBreak)
          break
        case 'break':
          filtered = filtered.filter(s => s.isOnBreak)
          break
        case 'out':
          filtered = filtered.filter(s => !s.isClockedIn)
          break
      }
    }

    setStaffData(filtered)
  }

  function setDateRangePreset(range: 'today' | 'week' | 'month') {
    setDateRange(range)
    const today = new Date()
    
    switch (range) {
      case 'today':
        setSelectedDate(today.toISOString().split('T')[0])
        break
      case 'week':
        const monday = new Date(today)
        monday.setDate(today.getDate() - today.getDay() + 1)
        setSelectedDate(monday.toISOString().split('T')[0])
        break
      case 'month':
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        setSelectedDate(firstDay.toISOString().split('T')[0])
        break
    }
  }

  const formatTime = (date: Date | string | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "0m"
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getDisplayHours = (staff: StaffTimeEntry) => {
    if (staff.isClockedIn && staff.currentEntry) {
      // For active staff, use backend's calculated current hours (includes break deduction)
      return (staff.currentEntry as any).currentHours || staff.totalHours
    }
    // For inactive staff, use the total hours from completed entries
    return staff.totalHours
  }

  const getBreakIcon = (type: BreakType) => {
    switch (type) {
      case "MORNING": return <Coffee className="h-4 w-4" />
      case "LUNCH": return <Coffee className="h-4 w-4" />
      case "AFTERNOON": return <Coffee className="h-4 w-4" />
      case "AWAY": return <Pause className="h-4 w-4" />
    }
  }

  const getStatusBadge = (staff: StaffTimeEntry) => {
    if (staff.isClockedIn && staff.isOnBreak) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
          <Pause className="h-3 w-3 mr-1" />
          On Break ({staff.currentBreakType})
        </Badge>
      )
    }
    if (staff.isClockedIn) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <Play className="h-3 w-3 mr-1" />
          Working
        </Badge>
      )
    }
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200">
        <LogOut className="h-3 w-3 mr-1" />
        Clocked Out
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4 pt-20 md:p-8 lg:pt-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading time tracking data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-7xl animate-in fade-in duration-700">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Time Tracking</h1>
              </div>
              <p className="text-gray-600 text-lg">
                Monitor your team's attendance and work hours
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Date Selector */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.activeStaff}/{summary.totalStaff}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalHours}h</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalEntries}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-l-orange-500 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Hours/Staff</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.totalStaff > 0 ? Math.round((summary.totalHours / summary.totalStaff) * 10) / 10 : 0}h
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filter Controls */}
          <div className="mb-6 space-y-4">
            {/* Date Range Presets & Refresh */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateRangePreset('today')}
                  className={dateRange === 'today' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateRangePreset('week')}
                  className={dateRange === 'week' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'}
                >
                  This Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateRangePreset('month')}
                  className={dateRange === 'month' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'}
                >
                  This Month
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTimeEntries(false)}
                disabled={refreshing}
                className="bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            {/* Staff & Status Filters */}
            <div className="flex items-center gap-3">
              {/* Staff Filter */}
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="all">All Staff ({allStaffData.length})</option>
                {allStaffData.map(s => (
                  <option key={s.staff.id} value={s.staff.id}>
                    {s.staff.name} ({s.totalHours}h)
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'text-gray-600 hover:bg-gray-100'}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'working' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('working')}
                  className={statusFilter === 'working' ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'text-gray-600 hover:bg-gray-100'}
                >
                  Working
                </Button>
                <Button
                  variant={statusFilter === 'break' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('break')}
                  className={statusFilter === 'break' ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'text-gray-600 hover:bg-gray-100'}
                >
                  On Break
                </Button>
                <Button
                  variant={statusFilter === 'out' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('out')}
                  className={statusFilter === 'out' ? 'bg-gray-50 text-gray-700 hover:bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}
                >
                  Clocked Out
                </Button>
              </div>

              {/* Results Count */}
              <span className="text-sm text-gray-600 ml-auto">
                Showing {staffData.length} of {allStaffData.length} staff
              </span>
            </div>
          </div>
        </div>

        {/* Staff Time Entries */}
        {staffData.length === 0 ? (
          <Card className="p-12 text-center bg-white shadow-sm border">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No time entries found</h3>
            <p className="text-gray-600">No staff clocked in on this date</p>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {staffData.map((staffEntry) => {
              const initials = staffEntry.staff.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)

              if (viewMode === 'grid') {
                // GRID VIEW
                return (
                  <Card
                    key={staffEntry.staff.id}
                    className="p-6 bg-white border shadow-sm hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500"
                    onClick={() => setSelectedStaff(staffEntry)}
                  >
                    <div className="flex flex-col items-center text-center mb-4">
                      <Avatar className="h-20 w-20 mb-3 ring-4 ring-blue-100">
                        <AvatarImage src={staffEntry.staff.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-lg font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{staffEntry.staff.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{staffEntry.staff.role}</p>
                      {getStatusBadge(staffEntry)}
                    </div>

                    {staffEntry.currentEntry && (
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Clock In:</span>
                          <span className="font-semibold text-green-600">{formatTime(staffEntry.currentEntry.clockIn)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Breaks:</span>
                          <span className="font-semibold">{staffEntry.currentEntry.breaks.length}</span>
                        </div>
                        {/* ✨ NEW: LIVE OVERTIME (Grid View) */}
                        {staffEntry.currentEntry.isCurrentlyOvertime && staffEntry.currentEntry.liveOvertimeMinutes > 0 && (
                          <Badge className="w-full justify-center bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900 border-purple-300 text-xs font-bold animate-pulse mt-2">
                            🌟 OVERTIME +{staffEntry.currentEntry.liveOvertimeMinutes}m
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Hours</span>
                        <span className="text-xl font-bold text-blue-600">{getDisplayHours(staffEntry)}h</span>
                      </div>
                    </div>
                  </Card>
                )
              }

              // LIST VIEW
              return (
                <Card
                  key={staffEntry.staff.id}
                  className="p-6 bg-white border shadow-sm hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500"
                  onClick={() => setSelectedStaff(staffEntry)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 ring-4 ring-blue-100">
                        <AvatarImage src={staffEntry.staff.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-lg font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{staffEntry.staff.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{staffEntry.staff.role}</p>
                        {getStatusBadge(staffEntry)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Hours Today</p>
                      <p className="text-3xl font-bold text-blue-600">{getDisplayHours(staffEntry)}h</p>
                    </div>
                  </div>

                  {staffEntry.currentEntry && (
                    <div className="space-y-3">
                      {/* Shift Schedule Info */}
                      {staffEntry.currentEntry.workSchedule && (
                        <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                          <p className="text-xs font-semibold text-indigo-900 mb-1">📅 Shift Schedule</p>
                          <p className="text-sm font-bold text-indigo-700">
                            {staffEntry.currentEntry.workSchedule.startTime} - {staffEntry.currentEntry.workSchedule.endTime}
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        {/* ✨ LIVE OVERTIME BANNER - Show prominently at top */}
                        {staffEntry.currentEntry.isCurrentlyOvertime && staffEntry.currentEntry.liveOvertimeMinutes > 0 && (
                          <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-2 border-purple-400 animate-pulse">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">🌟</span>
                                <div>
                                  <p className="text-sm font-black text-purple-900">WORKING OVERTIME</p>
                                  <p className="text-xs text-purple-700">+{staffEntry.currentEntry.liveOvertimeMinutes} min past shift end</p>
                                </div>
                              </div>
                              <Badge className="bg-purple-900 text-white font-bold text-sm px-3 py-1">
                                +{(staffEntry.currentEntry.liveOvertimeMinutes / 60).toFixed(1)}h
                              </Badge>
                            </div>
                          </div>
                        )}
                        
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Clock In</p>
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4 text-green-600" />
                          <p className="font-semibold text-green-600">{formatTime(staffEntry.currentEntry.clockIn)}</p>
                        </div>
                            {/* Late/Early Badges */}
                            {staffEntry.currentEntry.wasLate && staffEntry.currentEntry.lateBy && (
                              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs mt-1">
                                ⚠️ {staffEntry.currentEntry.lateBy}m late
                              </Badge>
                            )}
                            {staffEntry.currentEntry.wasEarly && staffEntry.currentEntry.earlyBy && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs mt-1">
                                ✨ {staffEntry.currentEntry.earlyBy}m early
                              </Badge>
                            )}
                      </div>

                      <div>
                        <p className="text-xs text-gray-600 mb-1">Breaks</p>
                        <div className="flex items-center gap-2">
                          <Coffee className="h-4 w-4 text-orange-600" />
                          <p className="font-semibold text-gray-900">
                            {staffEntry.currentEntry.breaks.length} breaks
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600 mb-1">Status</p>
                        {staffEntry.isOnBreak ? (
                          <p className="font-semibold text-yellow-600">On Break</p>
                        ) : (
                          <p className="font-semibold text-green-600">Working</p>
                        )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!staffEntry.currentEntry && staffEntry.timeEntries.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">
                        Completed {staffEntry.timeEntries.length} {staffEntry.timeEntries.length === 1 ? 'shift' : 'shifts'} today
                      </p>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader className="border-b border-gray-200 pb-4">
              <DialogTitle className="flex items-center gap-3">
                {selectedStaff && (
                  <>
                    <Avatar className="h-12 w-12 ring-4 ring-blue-100">
                      <AvatarImage src={selectedStaff.staff.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
                        {selectedStaff.staff.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{selectedStaff.staff.name}</p>
                      <p className="text-sm text-gray-600 font-normal">{selectedStaff.staff.role}</p>
                    </div>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedStaff && (
              <div className="space-y-6 pt-4">
                {/* BIG STATUS BADGE */}
                <div className="text-center py-6 px-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
                  {selectedStaff.isClockedIn && selectedStaff.isOnBreak ? (
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full border-2 border-yellow-300">
                        <Pause className="h-8 w-8 text-yellow-700" />
                        <span className="text-2xl font-bold text-yellow-900">ON BREAK</span>
                      </div>
                      <p className="text-lg text-gray-700">
                        {selectedStaff.currentBreakType === 'AWAY' ? '🚶 Away' : `☕ ${selectedStaff.currentBreakType}`}
                      </p>
                    </div>
                  ) : selectedStaff.isClockedIn ? (
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full border-2 border-green-300">
                        <Activity className="h-8 w-8 text-green-700 animate-pulse" />
                        <span className="text-2xl font-bold text-green-900">WORKING NOW</span>
                      </div>
                      <p className="text-lg text-gray-700">✨ Active and productive</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-gray-100 to-slate-100 rounded-full border-2 border-gray-300">
                        <LogOut className="h-8 w-8 text-gray-600" />
                        <span className="text-2xl font-bold text-gray-700">CLOCKED OUT</span>
                      </div>
                      <p className="text-lg text-gray-600">Not currently working</p>
                    </div>
                  )}
                </div>

                {/* CURRENT SESSION ONLY */}
                {selectedStaff.isClockedIn && selectedStaff.currentEntry && (
                  <Card className="p-6 bg-white border-2 border-blue-200 shadow-md">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Today's Session
                    </h3>
                    
                    {/* Shift Schedule - Show at top if available */}
                    {selectedStaff.currentEntry.workSchedule && (
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200 mb-4">
                        <p className="text-xs font-semibold text-indigo-900 mb-2">📅 TODAY'S SHIFT SCHEDULE</p>
                        <p className="text-xl font-bold text-indigo-700">
                          {selectedStaff.currentEntry.workSchedule.startTime} - {selectedStaff.currentEntry.workSchedule.endTime}
                        </p>
                        <p className="text-xs text-indigo-600 mt-1">
                          {selectedStaff.currentEntry.workSchedule.shiftType === 'NIGHT_SHIFT' ? '🌙 Night Shift' : 
                           selectedStaff.currentEntry.workSchedule.shiftType === 'MID_SHIFT' ? '🌅 Mid Shift' : '☀️ Day Shift'}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">Clock In</p>
                        <p className="text-2xl font-bold text-blue-900">{formatTime(selectedStaff.currentEntry.clockIn)}</p>
                        {selectedStaff.currentEntry.expectedClockIn && (
                          <p className="text-xs text-gray-600 mt-1">
                            Expected: {formatTime(selectedStaff.currentEntry.expectedClockIn)}
                          </p>
                        )}
                        {/* Accountability Badges */}
                        {selectedStaff.currentEntry.wasLate && selectedStaff.currentEntry.lateBy && (
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs mt-2">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                            ⚠️ {selectedStaff.currentEntry.lateBy}m late
                            {selectedStaff.currentEntry.lateReason && ` (${selectedStaff.currentEntry.lateReason})`}
                          </Badge>
                        )}
                        {selectedStaff.currentEntry.wasEarly && selectedStaff.currentEntry.earlyBy && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs mt-2">
                            ✨ {selectedStaff.currentEntry.earlyBy}m early
                                </Badge>
                              )}
                            </div>
                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Hours Worked</p>
                        <p className="text-2xl font-bold text-green-900">{selectedStaff.currentEntry.currentHours.toFixed(2)}h</p>
                        <p className="text-xs text-gray-600 mt-1">Updates in real-time</p>
                        {selectedStaff.currentEntry.expectedClockOut && (
                          <p className="text-xs text-gray-600 mt-1">
                            Expected out: {formatTime(selectedStaff.currentEntry.expectedClockOut)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ✨ NEW: LIVE OVERTIME BANNER (Detail Modal) */}
                    {selectedStaff.currentEntry.isCurrentlyOvertime && selectedStaff.currentEntry.liveOvertimeMinutes > 0 && (
                      <div className="p-6 bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 rounded-xl border-4 border-purple-400 mb-4 animate-pulse shadow-lg shadow-purple-500/30">
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-5xl">🌟</div>
                          <div>
                            <p className="text-2xl font-black text-purple-900 mb-1">WORKING OVERTIME!</p>
                            <p className="text-lg font-bold text-purple-700">
                              +{selectedStaff.currentEntry.liveOvertimeMinutes} minutes past shift end
                              {' '}({(selectedStaff.currentEntry.liveOvertimeMinutes / 60).toFixed(2)} hours)
                            </p>
                            <p className="text-xs text-purple-600 mt-1">
                              Shift ended at: {formatTime(selectedStaff.currentEntry.expectedClockOut!)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Current Break Info */}
                    {selectedStaff.isOnBreak && selectedStaff.currentEntry.breaks && (
                      <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-200 mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Coffee className="h-5 w-5 text-orange-600" />
                          <p className="font-bold text-gray-900">Current Break: {selectedStaff.currentBreakType}</p>
                        </div>
                        {(() => {
                          const currentBreak = selectedStaff.currentEntry.breaks.find((b: Break) => !b.actualEnd)
                          if (currentBreak) {
                            return (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Started:</span>
                                  <span className="font-medium text-gray-900">{formatTime(currentBreak.actualStart)}</span>
                                </div>
                                {currentBreak.isLate && (
                                  <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                                    Late by {currentBreak.lateBy} minutes
                                </Badge>
                              )}
                            </div>
                            )
                          }
                        })()}
                          </div>
                    )}

                    {/* Break Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coffee className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-semibold text-gray-700">Scheduled Breaks</span>
                          </div>
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                            {selectedStaff.currentEntry.breaks?.filter((b: Break) => b.type !== 'AWAY').length || 0} breaks
                          </Badge>
                        </div>
                        {(() => {
                          const awayBreaksCount = selectedStaff.currentEntry.breaks?.filter((b: Break) => b.type === 'AWAY').length || 0
                          if (awayBreaksCount > 0) {
                            return (
                              <div className="flex items-center justify-between pl-6">
                                <span className="text-xs text-gray-600">+ Away breaks</span>
                                <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                  {awayBreaksCount}
                                      </Badge>
                                  </div>
                            )
                          }
                        })()}
                            </div>
                          </div>
                      </Card>
                )}

                {/* Not Clocked In Message */}
                {!selectedStaff.isClockedIn && (
                  <div className="text-center py-8 text-gray-600">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-lg">This staff member is not currently clocked in.</p>
                    <p className="text-sm mt-2">Total hours today: {selectedStaff.totalHours}h</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
