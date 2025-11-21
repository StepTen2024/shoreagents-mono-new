"use client"

import React, { useState, useEffect } from "react"
import { Eye, Filter, RefreshCw, Search, AlertCircle, Calendar, Users, Paperclip, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  source: string
  deadline: string | null
  completedAt: string | null
  createdAt: string
  attachments: string[]
  company?: { id: string; companyName: string; logo: string | null } | null
  clientUser?: { id: string; name: string; email: string; avatar: string | null } | null
  staffUser?: { id: string; name: string; email: string; avatar: string | null; role: string } | null
  assignedStaff?: Array<{
    staff_users: {
      id: string
      name: string
      email: string
      avatar: string | null
      role: string
    }
  }>
}

interface Stats {
  total: number
  byStatus: {
    TODO: number
    IN_PROGRESS: number
    STUCK: number
    FOR_REVIEW: number
    COMPLETED: number
  }
  byPriority: {
    LOW: number
    MEDIUM: number
    HIGH: number
    URGENT: number
  }
  bySource: {
    SELF: number
    CLIENT: number
    MANAGEMENT: number
  }
}

// Status configurations - Dark mode friendly
const statusConfig = {
  TODO: { label: "To Do", color: "bg-slate-700 text-slate-100 border border-slate-500" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-600 text-white border border-blue-500" },
  STUCK: { label: "Stuck", color: "bg-red-600 text-white border border-red-500" },
  FOR_REVIEW: { label: "For Review", color: "bg-purple-600 text-white border border-purple-500" },
  COMPLETED: { label: "Completed", color: "bg-green-600 text-white border border-green-500" },
}

// Priority configurations - Dark mode friendly
const priorityConfig = {
  LOW: { label: "Low", color: "bg-slate-600 text-slate-100 border border-slate-500" },
  MEDIUM: { label: "Medium", color: "bg-blue-600 text-white border border-blue-500" },
  HIGH: { label: "High", color: "bg-orange-600 text-white border border-orange-500" },
  URGENT: { label: "Urgent", color: "bg-red-600 text-white border border-red-500" },
}

// Source configurations - Dark mode friendly
const sourceConfig = {
  SELF: { label: "Staff", color: "bg-purple-600 text-white border border-purple-500", icon: "👤" },
  CLIENT: { label: "Client", color: "bg-blue-600 text-white border border-blue-500", icon: "👔" },
  MANAGEMENT: { label: "Management", color: "bg-indigo-600 text-white border border-indigo-500", icon: "📋" },
}

type SortField = 'createdAt' | 'title' | 'status' | 'priority' | 'source' | 'deadline'
type SortDirection = 'asc' | 'desc'

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tasks, searchQuery, statusFilter, priorityFilter, sourceFilter])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/tasks")
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      setTasks(data.tasks)
      setStats(data.stats)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...tasks]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.company?.companyName.toLowerCase().includes(query) ||
          task.client_users?.name.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    // Source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter((task) => task.source === sourceFilter)
    }

    setFilteredTasks(filtered)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setPriorityFilter("all")
    setSourceFilter("all")
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO':
        return <AlertCircle className="w-4 h-4 text-slate-500" />
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'STUCK':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'FOR_REVIEW':
        return <AlertCircle className="w-4 h-4 text-purple-500" />
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'HIGH':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'MEDIUM':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'LOW':
        return <AlertCircle className="w-4 h-4 text-green-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    // Handle date sorting
    if (sortField === 'createdAt' || sortField === 'deadline') {
      aValue = new Date(aValue || 0).getTime()
      bValue = new Date(bValue || 0).getTime()
    }

    // Handle string sorting
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header - Enhanced with gradient and better spacing */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-850 to-slate-900 rounded-2xl p-8 border border-slate-700/50 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                Task Overview
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs px-3 py-1">
                  View Only
                </Badge>
              </h1>
              <p className="text-slate-300 mt-1.5 text-base">
                Real-time monitoring of all tasks across the organization
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={fetchTasks} 
              variant="outline" 
              className="gap-2 bg-slate-700/50 hover:bg-slate-700 border-slate-600 text-slate-200 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button 
              onClick={clearFilters} 
              variant="outline" 
              className="gap-2 bg-slate-700/50 hover:bg-slate-700 border-slate-600 text-slate-200 hover:text-white"
            >
              <Filter className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Enhanced with gradients and icons */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          <Card className="relative overflow-hidden border-slate-700 bg-gradient-to-br from-slate-800 to-slate-850 hover:shadow-xl transition-all group">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-400 mb-2">Total Tasks</div>
                  <div className="text-3xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-slate-700/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-slate-300" />
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-600/10 rounded-full -mr-12 -mt-12"></div>
          </Card>

          <Card className="relative overflow-hidden border-green-500/30 bg-gradient-to-br from-green-900/30 to-slate-850 hover:shadow-xl hover:shadow-green-500/10 transition-all group">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-300/80 mb-2">Completed</div>
                  <div className="text-3xl font-bold text-green-400">{stats.byStatus.COMPLETED}</div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-12 -mt-12"></div>
          </Card>

          <Card className="relative overflow-hidden border-blue-500/30 bg-gradient-to-br from-blue-900/30 to-slate-850 hover:shadow-xl hover:shadow-blue-500/10 transition-all group">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-300/80 mb-2">In Progress</div>
                  <div className="text-3xl font-bold text-blue-400">{stats.byStatus.IN_PROGRESS}</div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12"></div>
          </Card>

          <Card className="relative overflow-hidden border-red-500/30 bg-gradient-to-br from-red-900/30 to-slate-850 hover:shadow-xl hover:shadow-red-500/10 transition-all group">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-red-300/80 mb-2">Stuck</div>
                  <div className="text-3xl font-bold text-red-400">{stats.byStatus.STUCK}</div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-12 -mt-12"></div>
          </Card>

          <Card className="relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-slate-850 hover:shadow-xl hover:shadow-purple-500/10 transition-all group">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-purple-300/80 mb-2">For Review</div>
                  <div className="text-3xl font-bold text-purple-400">{stats.byStatus.FOR_REVIEW}</div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Eye className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -mr-12 -mt-12"></div>
          </Card>
        </div>
      )}

      {/* Filters - Enhanced with better styling */}
      <Card className="border-slate-700 bg-gradient-to-r from-slate-800/50 to-slate-850/50 backdrop-blur-sm">
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search tasks, companies, or clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/20 h-11">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="TODO">📋 To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">⏳ In Progress</SelectItem>
                <SelectItem value="STUCK">🚫 Stuck</SelectItem>
                <SelectItem value="FOR_REVIEW">👀 For Review</SelectItem>
                <SelectItem value="COMPLETED">✅ Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/20 h-11">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="LOW">🟢 Low</SelectItem>
                <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                <SelectItem value="HIGH">🟠 High</SelectItem>
                <SelectItem value="URGENT">🔴 Urgent</SelectItem>
              </SelectContent>
            </Select>

            {/* Source Filter */}
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/20 h-11">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="SELF">👤 Staff</SelectItem>
                <SelectItem value="CLIENT">👔 Client</SelectItem>
                <SelectItem value="MANAGEMENT">📋 Management</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count - Enhanced */}
          <div className="mt-5 pt-5 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Showing <span className="font-bold text-white text-lg mx-1">{filteredTasks.length}</span> of{" "}
                <span className="font-bold text-slate-300 text-lg mx-1">{tasks.length}</span> tasks
              </div>
              {filteredTasks.length !== tasks.length && (
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                  Filtered
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Task Table - Enhanced with modern styling */}
      <Card className="overflow-hidden border-slate-700 bg-gradient-to-br from-slate-800/30 to-slate-850/30">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-900/80 border-b border-slate-700 hover:bg-slate-900/80">
              <TableHead className="w-12"></TableHead>
              <TableHead 
                className="cursor-pointer hover:text-blue-400 transition-colors text-slate-300 font-semibold"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-2">
                  <span>Title</span>
                  {sortField === 'title' && (
                    sortDirection === 'asc' ? 
                    <ChevronUp className="w-4 h-4 text-blue-400" /> : 
                    <ChevronDown className="w-4 h-4 text-blue-400" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-blue-400 transition-colors text-slate-300 font-semibold"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  <span>Status</span>
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? 
                    <ChevronUp className="w-4 h-4 text-blue-400" /> : 
                    <ChevronDown className="w-4 h-4 text-blue-400" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-blue-400 transition-colors text-slate-300 font-semibold"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-2">
                  <span>Priority</span>
                  {sortField === 'priority' && (
                    sortDirection === 'asc' ? 
                    <ChevronUp className="w-4 h-4 text-blue-400" /> : 
                    <ChevronDown className="w-4 h-4 text-blue-400" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-blue-400 transition-colors text-slate-300 font-semibold"
                onClick={() => handleSort('source')}
              >
                <div className="flex items-center gap-2">
                  <span>Source</span>
                  {sortField === 'source' && (
                    sortDirection === 'asc' ? 
                    <ChevronUp className="w-4 h-4 text-blue-400" /> : 
                    <ChevronDown className="w-4 h-4 text-blue-400" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-slate-300 font-semibold">Company</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-blue-400 transition-colors text-slate-300 font-semibold"
                onClick={() => handleSort('deadline')}
              >
                <div className="flex items-center gap-2">
                  <span>Deadline</span>
                  {sortField === 'deadline' && (
                    sortDirection === 'asc' ? 
                    <ChevronUp className="w-4 h-4 text-blue-400" /> : 
                    <ChevronDown className="w-4 h-4 text-blue-400" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-blue-400 transition-colors text-slate-300 font-semibold"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-2">
                  <span>Created</span>
                  {sortField === 'createdAt' && (
                    sortDirection === 'asc' ? 
                    <ChevronUp className="w-4 h-4 text-blue-400" /> : 
                    <ChevronDown className="w-4 h-4 text-blue-400" />
                  )}
                </div>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task) => {
              const isExpanded = expandedTasks.has(task.id)
              const hasAttachments = task.attachments && task.attachments.length > 0
              const assignedStaffCount = task.assignedStaff?.length || (task.staff_users ? 1 : 0)

              return (
                <React.Fragment key={task.id}>
                  <TableRow 
                    className="cursor-pointer hover:bg-slate-800/50 border-b border-slate-700/50 transition-all duration-200 group"
                    onClick={() => handleTaskClick(task)}
                  >
                    {/* Expand Button */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpanded(task.id)
                        }}
                        className="p-1 h-8 w-8"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>

                    {/* Title */}
                    <TableCell>
                      <div className="font-semibold text-white truncate max-w-[200px] group-hover:text-blue-300 transition-colors">
                        {task.title}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <Badge className={statusConfig[task.status as keyof typeof statusConfig].color}>
                          {statusConfig[task.status as keyof typeof statusConfig].label}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Priority */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(task.priority)}
                        <Badge className={priorityConfig[task.priority as keyof typeof priorityConfig].color}>
                          {priorityConfig[task.priority as keyof typeof priorityConfig].label}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Source */}
                    <TableCell>
                      <Badge className={sourceConfig[task.source as keyof typeof sourceConfig].color}>
                        {sourceConfig[task.source as keyof typeof sourceConfig].icon}{" "}
                        {sourceConfig[task.source as keyof typeof sourceConfig].label}
                      </Badge>
                    </TableCell>

                    {/* Company */}
                    <TableCell>
                      {task.company ? (
                        <div className="text-sm text-slate-300 truncate max-w-[150px] group-hover:text-white transition-colors">
                          🏢 {task.company.companyName}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </TableCell>

                    {/* Deadline */}
                    <TableCell>
                      {task.deadline ? (
                        <div className="text-sm text-slate-300 group-hover:text-white transition-colors">
                          📅 {format(new Date(task.deadline), 'MMM dd, yyyy')}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </TableCell>

                    {/* Created */}
                    <TableCell>
                      <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                        {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>

                    {/* View Icon */}
                    <TableCell>
                      <Eye className="h-5 w-5 text-slate-500 group-hover:text-blue-400 transition-all group-hover:scale-110" />
                    </TableCell>
                  </TableRow>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-slate-900/50 border-b border-slate-700/50">
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Description */}
                            {task.description && (
                              <div>
                                <h4 className="text-sm font-medium text-foreground mb-2">Description</h4>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                  {task.description}
                                </p>
                              </div>
                            )}

                            {/* Metadata */}
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">Details</h4>
                              <div className="space-y-2">
                                {hasAttachments && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      {task.attachments.length} attachment{task.attachments.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}
                                {assignedStaffCount > 0 && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      {assignedStaffCount} staff assigned
                                    </span>
                                  </div>
                                )}
                                {task.client_users && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">
                                      Created by {task.client_users.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Attachments Preview */}
                          {hasAttachments && (
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">Attachments</h4>
                              <div className="flex flex-wrap gap-2">
                                {task.attachments.slice(0, 3).map((attachment, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md text-sm"
                                  >
                                    <Paperclip className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-muted-foreground truncate max-w-32">
                                      {attachment.split('/').pop()}
                                    </span>
                                  </div>
                                ))}
                                {task.attachments.length > 3 && (
                                  <div className="px-3 py-1 bg-muted rounded-md text-sm text-muted-foreground">
                                    +{task.attachments.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>

        {/* Empty State */}
        {sortedTasks.length === 0 && (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Tasks Found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </Card>

      {/* Task Detail Modal - Enhanced Design */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="!max-w-none max-w-6xl w-[85vw] max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-slate-700">
          {selectedTask && (
            <div className="space-y-6">
              {/* Header - Enhanced with gradient */}
              <DialogHeader className="pb-6 border-b border-slate-700/50">
                <DialogTitle className="flex items-center gap-4 text-2xl">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold">Task Details (View Only)</div>
                  </div>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm mt-2">
                  Read-only monitoring view for administrative oversight
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Title & Badges - Enhanced */}
                <div className="space-y-5">
                  <h2 className="text-3xl font-bold text-white">{selectedTask.title}</h2>
                  <div className="flex flex-wrap gap-3">
                    <Badge className={`${statusConfig[selectedTask.status as keyof typeof statusConfig].color} px-4 py-1.5 text-sm font-semibold`}>
                      {getStatusIcon(selectedTask.status)}
                      <span className="ml-2">{statusConfig[selectedTask.status as keyof typeof statusConfig].label}</span>
                    </Badge>
                    <Badge className={`${priorityConfig[selectedTask.priority as keyof typeof priorityConfig].color} px-4 py-1.5 text-sm font-semibold`}>
                      {getPriorityIcon(selectedTask.priority)}
                      <span className="ml-2">{priorityConfig[selectedTask.priority as keyof typeof priorityConfig].label}</span>
                    </Badge>
                    <Badge className={`${sourceConfig[selectedTask.source as keyof typeof sourceConfig].color} px-4 py-1.5 text-sm font-semibold`}>
                      {sourceConfig[selectedTask.source as keyof typeof sourceConfig].icon}{" "}
                      {sourceConfig[selectedTask.source as keyof typeof sourceConfig].label}
                    </Badge>
                  </div>
                </div>

                {/* Description - Enhanced */}
                {selectedTask.description && (
                  <Card className="p-6 border-slate-700 bg-slate-800/50">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      📝 Description
                    </h4>
                    <p className="text-base text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedTask.description}</p>
                  </Card>
                )}

                {/* Metadata - Enhanced with gradients */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {selectedTask.company && (
                    <Card className="p-6 border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-850/80 hover:shadow-xl transition-all">
                      <div className="text-sm font-medium text-slate-400 mb-3">Company</div>
                      <div className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="text-2xl">🏢</span>
                        {selectedTask.company.companyName}
                      </div>
                    </Card>
                  )}

                  {selectedTask.deadline && (
                    <Card className="p-6 border-blue-500/30 bg-gradient-to-br from-blue-900/30 to-slate-850/80 hover:shadow-xl hover:shadow-blue-500/10 transition-all">
                      <div className="text-sm font-medium text-blue-300 mb-3">Deadline</div>
                      <div className="text-xl font-bold text-white flex items-center gap-3">
                        <Calendar className="h-6 w-6 text-blue-400" />
                        {format(new Date(selectedTask.deadline), 'MMM dd, yyyy')}
                      </div>
                    </Card>
                  )}

                  <Card className="p-6 border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-850/80 hover:shadow-xl transition-all">
                    <div className="text-sm font-medium text-slate-400 mb-3">Created</div>
                    <div className="text-xl font-bold text-white">
                      {format(new Date(selectedTask.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </Card>

                  {selectedTask.completedAt && (
                    <Card className="p-6 border-green-500/30 bg-gradient-to-br from-green-900/30 to-slate-850/80 hover:shadow-xl hover:shadow-green-500/10 transition-all">
                      <div className="text-sm font-medium text-green-300 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </div>
                      <div className="text-xl font-bold text-green-400">
                        {format(new Date(selectedTask.completedAt), 'MMM dd, yyyy')}
                      </div>
                    </Card>
                  )}
                </div>

                {/* Client Creator - Enhanced */}
                {selectedTask.client_users && (
                  <Card className="p-6 border-blue-500/30 bg-gradient-to-r from-blue-900/40 to-cyan-900/30 hover:shadow-xl hover:shadow-blue-500/20 transition-all">
                    <div className="text-sm font-bold text-blue-300 mb-4 flex items-center gap-2">
                      <span className="text-lg">👔</span>
                      Created by Client
                    </div>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 ring-2 ring-blue-400/50">
                        <AvatarImage src={selectedTask.client_users.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-lg font-bold">
                          {selectedTask.client_users.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-lg font-bold text-white">{selectedTask.client_users.name}</div>
                        <div className="text-sm text-blue-300">{selectedTask.client_users.email}</div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Assigned Staff - Enhanced */}
                {(selectedTask.assignedStaff?.length || selectedTask.staff_users) && (
                  <Card className="p-6 border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-slate-850/80">
                    <h4 className="text-lg font-bold text-white mb-5 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <div>Assigned Staff</div>
                        <div className="text-sm font-normal text-purple-300">
                          {selectedTask.assignedStaff?.length || 1} team member{(selectedTask.assignedStaff?.length || 1) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTask.assignedStaff?.map((assignment) => (
                        <div key={assignment.staff_users.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
                          <Avatar className="h-12 w-12 ring-2 ring-purple-400/50">
                            <AvatarImage src={assignment.staff_users.avatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
                              {assignment.staff_users.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                              {assignment.staff_users.name}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {assignment.staff_users.email}
                            </div>
                            <Badge className="mt-1 bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                              {assignment.staff_users.role}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {selectedTask.staff_users && !selectedTask.assignedStaff?.length && (
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
                          <Avatar className="h-12 w-12 ring-2 ring-purple-400/50">
                            <AvatarImage src={selectedTask.staff_users.avatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
                              {selectedTask.staff_users.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                              {selectedTask.staff_users.name}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {selectedTask.staff_users.email}
                            </div>
                            <Badge className="mt-1 bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                              {selectedTask.staff_users.role}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Attachments - Enhanced */}
                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <Card className="p-6 border-slate-700 bg-slate-800/50">
                    <h4 className="text-lg font-bold text-white mb-5 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                        <Paperclip className="h-5 w-5 text-slate-300" />
                      </div>
                      <div>
                        <div>📎 Attachments</div>
                        <div className="text-sm font-normal text-slate-400">
                          {selectedTask.attachments.length} file{selectedTask.attachments.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {selectedTask.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Paperclip className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                              {attachment.split('/').pop() || attachment}
                            </div>
                            <div className="text-xs text-slate-500 truncate mt-1">
                              {attachment}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(attachment, '_blank')}
                            className="flex-shrink-0 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
