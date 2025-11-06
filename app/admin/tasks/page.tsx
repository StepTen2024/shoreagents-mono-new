"use client"

import React, { useState, useEffect } from "react"
import { Eye, Filter, RefreshCw, Search, AlertCircle, Calendar, Users, Paperclip, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Task Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View-only monitoring of all tasks across the organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTasks} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={clearFilters} variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Tasks</div>
            <div className="text-2xl font-semibold text-foreground mt-1">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-semibold text-green-600 mt-1">{stats.byStatus.COMPLETED}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">In Progress</div>
            <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.byStatus.IN_PROGRESS}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Stuck</div>
            <div className="text-2xl font-semibold text-red-600 mt-1">{stats.byStatus.STUCK}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">For Review</div>
            <div className="text-2xl font-semibold text-purple-600 mt-1">{stats.byStatus.FOR_REVIEW}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks, companies, or clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="STUCK">Stuck</SelectItem>
              <SelectItem value="FOR_REVIEW">For Review</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>

          {/* Source Filter */}
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="SELF">Staff (Self)</SelectItem>
              <SelectItem value="CLIENT">Client</SelectItem>
              <SelectItem value="MANAGEMENT">Management</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredTasks.length}</span> of{" "}
          <span className="font-semibold text-foreground">{tasks.length}</span> tasks
        </div>
      </Card>

      {/* Task Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12"></TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  Title
                  {sortField === 'title' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1">
                  Priority
                  {sortField === 'priority' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('source')}
              >
                <div className="flex items-center gap-1">
                  Source
                  {sortField === 'source' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('deadline')}
              >
                <div className="flex items-center gap-1">
                  Deadline
                  {sortField === 'deadline' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  Created
                  {sortField === 'createdAt' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
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
                    className="cursor-pointer hover:bg-muted/50"
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
                      <div className="font-medium text-foreground truncate max-w-[200px]">
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
                        <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                          🏢 {task.company.companyName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Deadline */}
                    <TableCell>
                      {task.deadline ? (
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(task.deadline), 'MMM dd, yyyy')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Created */}
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>

                    {/* View Icon */}
                    <TableCell>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/20">
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

      {/* Task Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="!max-w-none max-w-6xl w-[85vw] max-h-[80vh] overflow-y-auto">
          {selectedTask && (
            <div className="space-y-6">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <Eye className="h-6 w-6 text-muted-foreground" />
                  Task Details (View Only)
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Title & Badges */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground">{selectedTask.title}</h2>
                  <div className="flex flex-wrap gap-3">
                    <Badge className={`${statusConfig[selectedTask.status as keyof typeof statusConfig].color} px-3 py-1`}>
                      {statusConfig[selectedTask.status as keyof typeof statusConfig].label}
                    </Badge>
                    <Badge className={`${priorityConfig[selectedTask.priority as keyof typeof priorityConfig].color} px-3 py-1`}>
                      {priorityConfig[selectedTask.priority as keyof typeof priorityConfig].label}
                    </Badge>
                    <Badge className={`${sourceConfig[selectedTask.source as keyof typeof sourceConfig].color} px-3 py-1`}>
                      {sourceConfig[selectedTask.source as keyof typeof sourceConfig].icon}{" "}
                      {sourceConfig[selectedTask.source as keyof typeof sourceConfig].label}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <Card className="p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-3">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedTask.description}</p>
                  </Card>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTask.company && (
                    <Card className="p-6">
                      <div className="text-sm text-muted-foreground mb-2">Company</div>
                      <div className="text-lg font-semibold text-foreground flex items-center gap-2">
                        🏢 {selectedTask.company.companyName}
                      </div>
                    </Card>
                  )}

                  {selectedTask.deadline && (
                    <Card className="p-6">
                      <div className="text-sm text-muted-foreground mb-2">Deadline</div>
                      <div className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {format(new Date(selectedTask.deadline), 'MMM dd, yyyy')}
                      </div>
                    </Card>
                  )}

                  <Card className="p-6">
                    <div className="text-sm text-muted-foreground mb-2">Created</div>
                    <div className="text-lg font-semibold text-foreground">
                      {format(new Date(selectedTask.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </Card>

                  {selectedTask.completedAt && (
                    <Card className="p-6 bg-green-50 dark:bg-green-900/20">
                      <div className="text-sm text-green-700 dark:text-green-400 mb-2">Completed</div>
                      <div className="text-lg font-semibold text-green-700 dark:text-green-400">
                        {format(new Date(selectedTask.completedAt), 'MMM dd, yyyy')}
                      </div>
                    </Card>
                  )}
                </div>

                {/* Client Creator */}
                {selectedTask.client_users && (
                  <Card className="p-6 bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-sm text-blue-700 dark:text-blue-400 mb-3 font-medium">Created by Client</div>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedTask.client_users.avatar || undefined} />
                        <AvatarFallback className="bg-blue-500 text-white text-lg">
                          {selectedTask.client_users.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">{selectedTask.client_users.name}</div>
                        <div className="text-sm text-blue-700 dark:text-blue-400">{selectedTask.client_users.email}</div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Assigned Staff */}
                {(selectedTask.assignedStaff?.length || selectedTask.staff_users) && (
                  <Card className="p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Assigned Staff ({selectedTask.assignedStaff?.length || 1})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTask.assignedStaff?.map((assignment) => (
                        <div key={assignment.staff_users.id} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={assignment.staff_users.avatar || undefined} />
                            <AvatarFallback className="bg-purple-500 text-white">
                              {assignment.staff_users.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-foreground truncate">
                              {assignment.staff_users.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {assignment.staff_users.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {assignment.staff_users.role}
                            </div>
                          </div>
                        </div>
                      ))}
                      {selectedTask.staff_users && !selectedTask.assignedStaff?.length && (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedTask.staff_users.avatar || undefined} />
                            <AvatarFallback className="bg-purple-500 text-white">
                              {selectedTask.staff_users.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-foreground truncate">
                              {selectedTask.staff_users.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {selectedTask.staff_users.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {selectedTask.staff_users.role}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Attachments */}
                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <Card className="p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Paperclip className="h-5 w-5" />
                      Attachments ({selectedTask.attachments.length})
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedTask.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {attachment.split('/').pop() || attachment}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {attachment}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(attachment, '_blank')}
                            className="flex-shrink-0"
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
