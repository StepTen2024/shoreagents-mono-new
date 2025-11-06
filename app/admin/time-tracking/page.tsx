"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Clock, 
  Search, 
  Calendar,
  Coffee,
  PlayCircle,
  StopCircle,
  Timer,
  Building2
} from "lucide-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  wasLate: boolean
  lateBy: number | null
  notes: string | null
  createdAt: string
  staff_users: {
    id: string
    name: string
    email: string
    avatar: string | null
    role: string
    company: {
      id: string
      companyName: string
      tradingName: string | null
      logo: string | null
    } | null
  }
  breaks: {
    id: string
    type: string
    actualStart: string | null
    actualEnd: string | null
    duration: number | null
  }[]
}

export default function AdminTimeTrackingPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    fetchTimeEntries()
  }, [])

  const fetchTimeEntries = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/time-tracking')
      const data = await response.json()
      setTimeEntries(data.entries || [])
    } catch (error) {
      console.error('Error fetching time entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = (clockIn: string, clockOut: string | null) => {
    const start = new Date(clockIn).getTime()
    const end = clockOut ? new Date(clockOut).getTime() : Date.now()
    const diff = end - start
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return { hours, minutes, total: `${hours}h ${minutes}m` }
  }

  const filteredEntries = timeEntries.filter(entry => {
    // Status filter
    if (statusFilter === 'active' && entry.clockOut) return false
    if (statusFilter === 'completed' && !entry.clockOut) return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        entry.staff_users.name.toLowerCase().includes(query) ||
        entry.staff_users.email.toLowerCase().includes(query) ||
        entry.staff_users.company?.companyName.toLowerCase().includes(query)
      )
    }

    return true
  })

  const stats = {
    total: timeEntries.length,
    active: timeEntries.filter(e => !e.clockOut).length,
    completed: timeEntries.filter(e => e.clockOut).length,
    lateToday: timeEntries.filter(e => e.wasLate).length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Time Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor staff clock in/out times, breaks, and attendance
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Total Entries</div>
          <div className="text-2xl font-semibold text-foreground mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Currently Clocked In</div>
          <div className="text-2xl font-semibold text-emerald-500 mt-1">{stats.active}</div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Completed Today</div>
          <div className="text-2xl font-semibold text-blue-500 mt-1">{stats.completed}</div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Late Clock-Ins</div>
          <div className="text-2xl font-semibold text-amber-500 mt-1">{stats.lateToday}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border bg-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by staff name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entries</SelectItem>
              <SelectItem value="active">Currently Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Time Entries Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEntries.map((entry) => {
          const duration = calculateDuration(entry.clockIn, entry.clockOut)
          const isActive = !entry.clockOut

          return (
            <Link 
              key={entry.id}
              href={`/admin/time-tracking/${entry.id}`}
              className="block"
            >
              <Card className="p-6 border-border bg-card hover:bg-card/80 transition-colors cursor-pointer">
                {/* Staff Info */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-12 w-12 ring-2 ring-white/10">
                    <AvatarImage src={entry.staff_users.avatar || undefined} alt={entry.staff_users.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                      {entry.staff_users.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{entry.staff_users.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{entry.staff_users.email}</p>
                    {entry.staff_users.company && (
                      <div className="flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {entry.staff_users.company.companyName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-4">
                  {isActive ? (
                    <Badge className="bg-emerald-600 gap-1">
                      <PlayCircle className="h-3 w-3" />
                      Clocked In
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <StopCircle className="h-3 w-3" />
                      Completed
                    </Badge>
                  )}
                  {entry.wasLate && (
                    <Badge variant="outline" className="text-amber-500 border-amber-500/50">
                      Late {entry.lateBy}m
                    </Badge>
                  )}
                </div>

                {/* Time Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Clock In:
                    </span>
                    <span className="font-medium text-foreground">
                      {new Date(entry.clockIn).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {entry.clockOut && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Clock Out:
                      </span>
                      <span className="font-medium text-foreground">
                        {new Date(entry.clockOut).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Timer className="h-3 w-3" />
                      Duration:
                    </span>
                    <span className="font-semibold text-foreground">{duration.total}</span>
                  </div>
                  {entry.breaks.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Coffee className="h-3 w-3" />
                        Breaks:
                      </span>
                      <span className="font-medium text-foreground">{entry.breaks.length}</span>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(entry.clockIn).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {/* View Details Button */}
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {filteredEntries.length === 0 && (
        <Card className="p-12 border-border bg-card text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Time Entries Found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Time entries will appear here when staff clock in'}
          </p>
        </Card>
      )}
    </div>
  )
}
