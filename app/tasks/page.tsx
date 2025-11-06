"use client"

import { useState, useEffect } from "react"
import { Plus, ListTodo, CheckCircle2, Clock, AlertCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import StaffTaskKanban from "@/components/tasks/staff-task-kanban"
import CreateTaskModal from "@/components/tasks/create-task-modal"

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
  company?: { id: string; companyName: string } | null
  clientUser?: { id: string; name: string; email: string; avatar: string | null } | null
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

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks")
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

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // Optimistic update
    const previousTasks = [...tasks]
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
    )

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        setTasks(previousTasks)
        throw new Error("Failed to update task")
      }

      // Show appropriate toast message
      let toastMessage = "Task status updated"
      if (newStatus === "COMPLETED") {
        toastMessage = "Task completed! 🎉"
      }

      toast({
        title: "Success! 🎉",
        description: toastMessage,
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex items-center gap-2 text-indigo-400">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-900 border-t-indigo-400" />
          <span className="text-lg font-bold">Loading tasks...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2 flex items-center gap-3">
                <ListTodo className="h-8 w-8 text-indigo-400" />
                My Tasks ✨
              </h1>
              <p className="text-slate-400">Manage your tasks and crush your goals! 🚀</p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 font-bold text-white transition-all hover:from-indigo-700 hover:to-purple-700 hover:scale-105 shadow-2xl shadow-indigo-500/50"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Task 🎯
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl p-6 ring-1 ring-white/10 hover:ring-indigo-500/50 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400 mb-1">Total Tasks</p>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                    {stats.total}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                  <ListTodo className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl p-6 ring-1 ring-white/10 hover:ring-emerald-500/50 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                    {stats.completed}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl p-6 ring-1 ring-white/10 hover:ring-blue-500/50 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400 mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                    {stats.inProgress}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl p-6 ring-1 ring-white/10 hover:ring-red-500/50 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400 mb-1">Stuck</p>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">
                    {stats.stuck}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/50">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <StaffTaskKanban
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onTaskUpdate={fetchTasks}
        />

        {/* Create Task Modal */}
        {isCreateModalOpen && (
          <CreateTaskModal
            isClient={false}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleCreateTask}
          />
        )}
      </div>
    </div>
  )
}
