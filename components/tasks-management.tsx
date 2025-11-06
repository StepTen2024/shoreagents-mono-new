"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Clock, AlertCircle, Calendar, Filter, Search, Plus, LayoutList, LayoutGrid, X, Tag, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type TaskStatus = "TODO" | "IN_PROGRESS" | "STUCK" | "FOR_REVIEW" | "COMPLETED"
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"
type TaskSource = "SELF" | "CLIENT" | "MANAGEMENT"
type CreatorType = "STAFF" | "CLIENT" | "ADMIN"

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  source: TaskSource
  createdByType?: CreatorType
  deadline: string | null
  completedAt: string | null
  createdAt: string
  company?: {
    id: string
    companyName: string
  } | null
}

export default function TasksManagement() {
  const [mounted, setMounted] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "board">("board")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as TaskPriority,
    deadline: "",
  })

  useEffect(() => {
    setMounted(true)
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks")
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      setTasks(data.tasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  const createTask = async () => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTask,
          source: "SELF",
          deadline: newTask.deadline || null,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        throw new Error(errorData.error || "Failed to create task")
      }
      await fetchTasks()
      setIsAddTaskOpen(false)
      setNewTask({ title: "", description: "", priority: "MEDIUM", deadline: "" })
    } catch (err) {
      console.error("Error creating task:", err)
      alert(`Failed to create task: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error("Failed to update task")
      await fetchTasks()
    } catch (err) {
      console.error("Error updating task:", err)
    }
  }

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()
    if (draggedTask && draggedTask.status !== newStatus) {
      await updateTaskStatus(draggedTask.id, newStatus)
    }
    setDraggedTask(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline"
    const date = new Date(dateString)
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`
  }

  const statusConfig = {
    TODO: { label: "To Do", color: "bg-slate-500", icon: Clock, column: "TODO" as TaskStatus },
    IN_PROGRESS: { label: "In Progress", color: "bg-blue-500", icon: Clock, column: "IN_PROGRESS" as TaskStatus },
    STUCK: { label: "Stuck", color: "bg-red-500", icon: AlertCircle, column: "STUCK" as TaskStatus },
    FOR_REVIEW: { label: "For Review", color: "bg-purple-500", icon: Clock, column: "FOR_REVIEW" as TaskStatus },
    COMPLETED: { label: "Completed", color: "bg-emerald-500", icon: CheckCircle2, column: "COMPLETED" as TaskStatus },
  }

  const priorityConfig = {
    LOW: { label: "Low", color: "bg-slate-500/20 text-slate-400 ring-slate-500/30" },
    MEDIUM: { label: "Medium", color: "bg-blue-500/20 text-blue-400 ring-blue-500/30" },
    HIGH: { label: "High", color: "bg-orange-500/20 text-orange-400 ring-orange-500/30" },
    URGENT: { label: "Urgent", color: "bg-red-500/20 text-red-400 ring-red-500/30" },
  }

  const sourceConfig = {
    SELF: { label: "Self", color: "bg-purple-500/20 text-purple-400" },
    CLIENT: { label: "Client", color: "bg-blue-500/20 text-blue-400" },
    MANAGEMENT: { label: "Management", color: "bg-amber-500/20 text-amber-400" },
  }

  const creatorConfig = {
    STAFF: { label: "👤 Created by Staff", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    CLIENT: { label: "👔 Created by Client", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    ADMIN: { label: "⚡ Created by Admin", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || task.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const columns = Object.keys(statusConfig) as TaskStatus[]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-full space-y-6">
          <div className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-96 rounded-xl bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Tasks</h2>
            <p className="mt-2 text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-full space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-blue-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Task Management</h1>
              <p className="mt-1 text-slate-300">{filteredTasks.length} tasks</p>
            </div>
            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 text-white">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400">Title</label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="w-full rounded-lg bg-slate-800 p-2 text-white"
                      placeholder="Task title..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Description</label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="w-full rounded-lg bg-slate-800 p-2 text-white"
                      rows={3}
                      placeholder="Task description..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                      className="w-full rounded-lg bg-slate-800 p-2 text-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Deadline (Optional)</label>
                    <input
                      type="date"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                      className="w-full rounded-lg bg-slate-800 p-2 text-white"
                    />
                  </div>
                  <Button
                    onClick={createTask}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    disabled={!newTask.title}
                  >
                    Create Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-900/50 p-4 backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-1">
            <button
              onClick={() => setViewMode("board")}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === "board" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="inline h-4 w-4 mr-1" />
              Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === "list" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutList className="inline h-4 w-4 mr-1" />
              List
            </button>
          </div>

          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-slate-800/50 py-2 pl-10 pr-4 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg bg-slate-800/50 px-3 py-2 text-white outline-none ring-1 ring-white/10"
          >
            <option value="all">All Status</option>
            {columns.map((status) => (
              <option key={status} value={status}>
                {statusConfig[status].label}
              </option>
            ))}
          </select>
        </div>

        {/* Kanban Board View */}
        {viewMode === "board" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {columns.map((status) => {
              const columnTasks = filteredTasks.filter((task) => task.status === status)
              const config = statusConfig[status]

              return (
                <div
                  key={status}
                  className="flex flex-col rounded-xl bg-slate-900/50 p-4 backdrop-blur-xl ring-1 ring-white/10"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, config.column)}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${config.color}`} />
                    <h3 className="font-semibold text-white">{config.label}</h3>
                    <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {columnTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        className="group cursor-grab rounded-xl bg-slate-800/50 p-3 ring-1 ring-white/5 transition-all hover:bg-slate-800 hover:ring-blue-500/30 active:cursor-grabbing"
                      >
                        <div className="mb-2 flex items-start gap-2">
                          <GripVertical className="h-5 w-5 flex-shrink-0 text-slate-500 group-hover:text-slate-400" />
                          <h4 className="flex-1 text-sm font-semibold text-white">{task.title}</h4>
                        </div>
                        {task.description && (
                          <p className="mb-2 line-clamp-2 text-xs text-slate-400">{task.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${priorityConfig[task.priority].color}`}>
                            {priorityConfig[task.priority].label}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sourceConfig[task.source].color}`}>
                            {sourceConfig[task.source].label}
                          </span>
                        </div>
                        {task.createdByType && (
                          <div className={`mt-2 rounded-lg border px-2 py-1 text-xs font-medium ${creatorConfig[task.createdByType].color}`}>
                            {creatorConfig[task.createdByType].label}
                          </div>
                        )}
                        {task.deadline && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                            <Calendar className="h-3 w-3" />
                            {mounted ? formatDate(task.deadline) : task.deadline}
                          </div>
                        )}
                      </div>
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="rounded-xl border-2 border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl bg-slate-900/50 p-4 backdrop-blur-xl ring-1 ring-white/10 transition-all hover:bg-slate-800/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{task.title}</h3>
                    {task.description && <p className="mt-1 text-sm text-slate-400">{task.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${priorityConfig[task.priority].color}`}>
                        {priorityConfig[task.priority].label}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sourceConfig[task.source].color}`}>
                        {sourceConfig[task.source].label}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusConfig[task.status].color} text-white`}>
                        {statusConfig[task.status].label}
                      </span>
                      {task.createdByType && (
                        <span className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${creatorConfig[task.createdByType].color}`}>
                          {creatorConfig[task.createdByType].label}
                        </span>
                      )}
                      {task.deadline && (
                        <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-300">
                          Due: {mounted ? formatDate(task.deadline) : task.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredTasks.length === 0 && (
              <div className="rounded-xl bg-slate-900/50 p-12 text-center backdrop-blur-xl ring-1 ring-white/10">
                <p className="text-slate-400">No tasks found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
