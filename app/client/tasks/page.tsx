"use client"

import { useState, useEffect } from "react"
import { Plus, Users, CheckCircle2, Clock, AlertCircle, ListTodo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import ClientTaskKanban from "@/components/tasks/client-task-kanban"
import CreateTaskModal from "@/components/tasks/create-task-modal"
import { getAllStatuses } from "@/lib/task-utils"

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
  company?: {
    id: string
    companyName: string
  } | null
  clientUser?: {
    id: string
    name: string
    email: string
    avatar: string | null
  } | null
  assignedStaff?: Array<{
    staff_users: {
      id: string
      name: string
      email: string
      avatar: string | null
      role: string
    }
  }>
  staffUser?: {
    id: string
    name: string
    email: string
    avatar: string | null
    role: string
  } | null
}

interface StaffUser {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
}

export default function ClientTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchTasks()
    fetchStaffUsers()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/client/tasks")
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      setTasks(data.tasks)
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

  const fetchStaffUsers = async () => {
    try {
      // Fetch staff users from the client's company
      const response = await fetch("/api/client/staff")
      if (!response.ok) throw new Error("Failed to fetch staff")
      const data = await response.json()
      setStaffUsers(data.staff || [])
    } catch (error) {
      console.error("Error fetching staff:", error)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // Optimistic update
    const previousTasks = [...tasks]
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
    )

    try {
      const response = await fetch(`/api/client/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        setTasks(previousTasks)
        throw new Error("Failed to update task")
      }

      toast({
        title: "Success",
        description: "Task status updated",
      })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      })
    }
  }

  const handleCreateTask = () => {
    fetchTasks()
    setIsCreateModalOpen(false)
  }

  // Calculate stats
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    stuck: tasks.filter((t) => t.status === "STUCK").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="flex items-center gap-2 text-blue-600">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <span className="text-lg font-medium">Loading tasks...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <ListTodo className="h-8 w-8 text-blue-600" />
                Task Management
              </h1>
              <p className="text-slate-600">Assign and manage tasks for your team</p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Task
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Tasks</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ListTodo className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Stuck</p>
                  <p className="text-3xl font-bold text-red-600">{stats.stuck}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <ClientTaskKanban
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onTaskUpdate={fetchTasks}
        />

        {/* Create Task Modal */}
        {isCreateModalOpen && (
          <CreateTaskModal
            isClient
            staffUsers={staffUsers}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleCreateTask}
          />
        )}
      </div>
    </div>
  )
}
