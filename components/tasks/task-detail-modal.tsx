"use client"

import { useState, useEffect } from "react"
import { X, Calendar, Clock, Users, Building2, Paperclip, AlertCircle, Sparkles, MessageSquare, CheckSquare, Plus, Trash2, Loader2, Send, Image, Edit2, Check, XCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getPriorityConfig, getSourceConfig, formatDeadline } from "@/lib/task-utils"
import { useToast } from "@/hooks/use-toast"
import { CommentSection } from "@/components/engagement/comment-section"

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

interface Subtask {
  id: string
  taskId: string
  title: string
  completed: boolean
  order: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

interface TaskDetailModalProps {
  task: Task
  onClose: () => void
  isDarkTheme?: boolean
  onUpdate?: () => void
}

export default function TaskDetailModal({ task, onClose, isDarkTheme = false, onUpdate }: TaskDetailModalProps) {
  const { toast } = useToast()
  const priorityConfig = getPriorityConfig(task.priority as any)
  const sourceConfig = getSourceConfig(task.source as any)
  const deadlineInfo = formatDeadline(task.deadline)

  // State for subtasks
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [showSubtaskInput, setShowSubtaskInput] = useState(false)
  const [loadingSubtasks, setLoadingSubtasks] = useState(true)
  const [submittingSubtask, setSubmittingSubtask] = useState(false)
  const [subtaskProgress, setSubtaskProgress] = useState({ total: 0, completed: 0, percentage: 0 })
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("")
  
  // State for editing task details
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  const [editedDescription, setEditedDescription] = useState(task.description || "")
  const [editedDeadline, setEditedDeadline] = useState(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "")
  const [editedPriority, setEditedPriority] = useState(task.priority)
  const [savingTask, setSavingTask] = useState(false)

  // Get all assigned staff
  const allAssignedStaff = []
  if (task.assignedStaff) {
    allAssignedStaff.push(...task.assignedStaff.map(a => a.staff_users))
  } else if (task.staff_users) {
    allAssignedStaff.push(task.staff_users)
  }

  // Fetch subtasks on mount
  useEffect(() => {
    fetchSubtasks()
  }, [task.id])

  const fetchSubtasks = async () => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`)
      if (res.ok) {
        const data = await res.json()
        setSubtasks(data.subtasks || [])
        setSubtaskProgress(data.progress || { total: 0, completed: 0, percentage: 0 })
      }
    } catch (error) {
      console.error("Error fetching subtasks:", error)
    } finally {
      setLoadingSubtasks(false)
    }
  }

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a subtask title",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmittingSubtask(true)

      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubtaskTitle }),
      })

      if (!res.ok) throw new Error("Failed to add subtask")

      const data = await res.json()
      setSubtasks(prev => [...prev, data.subtask])
      setNewSubtaskTitle("")
      setShowSubtaskInput(false)

      // Recalculate progress
      const newTotal = subtasks.length + 1
      const completed = subtasks.filter(s => s.completed).length
      setSubtaskProgress({
        total: newTotal,
        completed,
        percentage: Math.round((completed / newTotal) * 100),
      })

      toast({
        title: "Success",
        description: "Subtask added! 🎯",
      })

      if (onUpdate) onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add subtask. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingSubtask(false)
    }
  }

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId, completed }),
      })

      if (!res.ok) throw new Error("Failed to update subtask")

      const data = await res.json()
      setSubtasks(prev => prev.map(s => s.id === subtaskId ? data.subtask : s))

      // Recalculate progress
      const newSubtasks = subtasks.map(s => s.id === subtaskId ? { ...s, completed } : s)
      const completedCount = newSubtasks.filter(s => s.completed).length
      setSubtaskProgress({
        total: subtasks.length,
        completed: completedCount,
        percentage: Math.round((completedCount / subtasks.length) * 100),
      })

      if (onUpdate) onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subtask",
        variant: "destructive",
      })
    }
  }

  const deleteSubtask = async (subtaskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks?subtaskId=${subtaskId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete subtask")

      setSubtasks(prev => prev.filter(s => s.id !== subtaskId))

      // Recalculate progress
      const newSubtasks = subtasks.filter(s => s.id !== subtaskId)
      const completed = newSubtasks.filter(s => s.completed).length
      const total = newSubtasks.length
      setSubtaskProgress({
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      })

      toast({
        title: "Success",
        description: "Subtask deleted! 🗑️",
      })

      if (onUpdate) onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete subtask",
        variant: "destructive",
      })
    }
  }

  const startEditingSubtask = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id)
    setEditingSubtaskTitle(subtask.title)
  }

  const cancelEditingSubtask = () => {
    setEditingSubtaskId(null)
    setEditingSubtaskTitle("")
  }

  const saveEditedSubtask = async (subtaskId: string) => {
    if (!editingSubtaskTitle.trim()) {
      toast({
        title: "Error",
        description: "Subtask title cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId, title: editingSubtaskTitle }),
      })

      if (!res.ok) throw new Error("Failed to update subtask")

      const data = await res.json()
      setSubtasks(prev => prev.map(s => s.id === subtaskId ? data.subtask : s))
      setEditingSubtaskId(null)
      setEditingSubtaskTitle("")

      toast({
        title: "Success",
        description: "Subtask updated! ✏️",
      })

      if (onUpdate) onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subtask",
        variant: "destructive",
      })
    }
  }

  const saveTaskEdits = async () => {
    if (!editedTitle.trim()) {
      toast({
        title: "Error",
        description: "Task title cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      setSavingTask(true)

      const updateData: any = {
        title: editedTitle,
        description: editedDescription,
        priority: editedPriority,
        // Always send deadline - either the date or null to clear it
        deadline: editedDeadline ? new Date(editedDeadline).toISOString() : null,
      }

      console.log("💾 Saving task with data:", updateData)

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        console.error("❌ Failed to update task:", errorData)
        throw new Error("Failed to update task")
      }

      const result = await res.json()
      console.log("✅ Task updated successfully:", result)

      toast({
        title: "Success! 🎉",
        description: "Task updated: " + (editedDeadline ? "📅 Deadline set!" : "✏️ Changes saved!"),
      })

      setIsEditingTask(false)
      
      if (onUpdate) onUpdate()
      
      // Close modal and let parent refresh to see changes
      setTimeout(() => {
        onClose()
      }, 800)
    } catch (error) {
      console.error("❌ Error saving task:", error)
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingTask(false)
    }
  }

  const cancelTaskEdit = () => {
    setEditedTitle(task.title)
    setEditedDescription(task.description || "")
    setEditedDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "")
    setEditedPriority(task.priority)
    setIsEditingTask(false)
  }

  const statusColors: Record<string, string> = {
    TODO: isDarkTheme ? "bg-slate-500/20 text-slate-300 ring-slate-500/30" : "bg-slate-100 text-slate-700 border-slate-300",
    IN_PROGRESS: isDarkTheme ? "bg-blue-500/20 text-blue-300 ring-blue-500/30" : "bg-blue-100 text-blue-700 border-blue-300",
    STUCK: isDarkTheme ? "bg-red-500/20 text-red-300 ring-red-500/30" : "bg-red-100 text-red-700 border-red-300",
    FOR_REVIEW: isDarkTheme ? "bg-purple-500/20 text-purple-300 ring-purple-500/30" : "bg-purple-100 text-purple-700 border-purple-300",
    COMPLETED: isDarkTheme ? "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30" : "bg-emerald-100 text-emerald-700 border-emerald-300",
  }

  const statusLabels: Record<string, string> = {
    TODO: "📋 To Do",
    IN_PROGRESS: "⚡ In Progress",
    STUCK: "🚧 Stuck",
    FOR_REVIEW: "👀 For Review",
    COMPLETED: "✅ Completed",
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
      isDarkTheme ? "bg-black/70 backdrop-blur-sm" : "bg-black/50 backdrop-blur-sm"
    } animate-in fade-in duration-300`}>
      <div className={`w-full max-w-4xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl animate-in slide-in-from-bottom duration-500 ${
        isDarkTheme 
          ? "bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 ring-2 ring-indigo-500/30" 
          : "bg-white border-2 border-slate-200"
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                isDarkTheme ? statusColors[task.status] + " ring-1" : statusColors[task.status] + " border"
              }`}>
                {statusLabels[task.status]}
              </span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                isDarkTheme ? priorityConfig.darkColor : priorityConfig.lightColor
              }`}>
                {priorityConfig.fullLabel}
              </span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                isDarkTheme ? sourceConfig.darkColor : sourceConfig.lightColor
              }`}>
                {sourceConfig.emoji} {sourceConfig.label}
              </span>
              
              {/* Edit Task Button */}
              {!isEditingTask && (
                <button
                  onClick={() => setIsEditingTask(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 ${
                    isDarkTheme 
                      ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30 hover:bg-blue-500/30" 
                      : "bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100"
                  }`}
                >
                  <Edit2 className="h-3 w-3" />
                  Edit Task
                </button>
              )}
            </div>
            <h2 className={`text-3xl font-bold mb-2 ${
              isDarkTheme 
                ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400" 
                : "text-slate-900"
            }`}>
              {task.title}
            </h2>
            {task.description && (
              <p className={`text-base ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
                {task.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={`rounded-xl p-2.5 transition-all hover:scale-110 ${
              isDarkTheme 
                ? "text-slate-400 hover:bg-slate-800 hover:text-white ring-1 ring-slate-700 hover:ring-red-500" 
                : "text-slate-600 hover:bg-red-50 hover:text-red-600 border-2 border-slate-300 hover:border-red-400"
            }`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* ✏️ EDIT TASK FORM */}
        {isEditingTask && (
          <div className={`rounded-2xl p-6 mb-6 ${
            isDarkTheme 
              ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 ring-2 ring-blue-500/30 backdrop-blur-xl" 
              : "bg-blue-50 border-2 border-blue-300"
          }`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
              isDarkTheme 
                ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400" 
                : "text-blue-900"
            }`}>
              <Edit2 className="h-5 w-5" />
              ✏️ Edit Task Details
            </h3>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${
                  isDarkTheme ? "text-slate-300" : "text-slate-700"
                }`}>
                  Task Title *
                </label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg outline-none ${
                    isDarkTheme 
                      ? "bg-slate-800 text-white placeholder-slate-500 ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500" 
                      : "bg-white border-2 border-slate-300 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${
                  isDarkTheme ? "text-slate-300" : "text-slate-700"
                }`}>
                  Description
                </label>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-lg outline-none resize-none ${
                    isDarkTheme 
                      ? "bg-slate-800 text-white placeholder-slate-500 ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500" 
                      : "bg-white border-2 border-slate-300 focus:border-blue-500"
                  }`}
                />
              </div>

              {/* Deadline & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Deadline */}
                <div>
                  <label className={`block text-sm font-bold mb-2 flex items-center justify-between ${
                    isDarkTheme ? "text-slate-300" : "text-slate-700"
                  }`}>
                    <span>📅 Deadline {!editedDeadline && "(Optional)"}</span>
                    {editedDeadline && (
                      <button
                        type="button"
                        onClick={() => setEditedDeadline("")}
                        className={`text-xs px-2 py-1 rounded ${
                          isDarkTheme 
                            ? "text-red-400 hover:bg-red-500/20" 
                            : "text-red-600 hover:bg-red-50"
                        }`}
                      >
                        Clear
                      </button>
                    )}
                  </label>
                  <input
                    type="date"
                    value={editedDeadline}
                    onChange={(e) => setEditedDeadline(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg outline-none ${
                      isDarkTheme 
                        ? "bg-slate-800 text-white ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500 [color-scheme:dark]" 
                        : "bg-white border-2 border-slate-300 focus:border-blue-500"
                    }`}
                  />
                  {editedDeadline && (
                    <p className={`text-xs mt-1 ${isDarkTheme ? "text-emerald-400" : "text-emerald-600"}`}>
                      ✅ Deadline set for {new Date(editedDeadline).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className={`block text-sm font-bold mb-2 ${
                    isDarkTheme ? "text-slate-300" : "text-slate-700"
                  }`}>
                    ⚡ Priority
                  </label>
                  <select
                    value={editedPriority}
                    onChange={(e) => setEditedPriority(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg outline-none ${
                      isDarkTheme 
                        ? "bg-slate-800 text-white ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500" 
                        : "bg-white border-2 border-slate-300 focus:border-blue-500"
                    }`}
                  >
                    <option value="LOW">🟢 Low Priority</option>
                    <option value="MEDIUM">🟡 Medium Priority</option>
                    <option value="HIGH">🟠 High Priority</option>
                    <option value="URGENT">🔴 Urgent</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveTaskEdits}
                  disabled={savingTask}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkTheme 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {savingTask ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={cancelTaskEdit}
                  disabled={savingTask}
                  className={`px-4 py-2.5 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 ${
                    isDarkTheme 
                      ? "bg-slate-700 hover:bg-slate-600 text-white" 
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Relationship Chain */}
        <div className={`rounded-2xl p-6 mb-6 ${
          isDarkTheme 
            ? "bg-slate-800/50 backdrop-blur-xl ring-1 ring-white/10" 
            : "bg-slate-50 border-2 border-slate-200"
        }`}>
          <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${
            isDarkTheme ? "text-slate-300" : "text-slate-700"
          }`}>
            <Users className="h-4 w-4" />
            Task Relationships
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {/* Created By - Client */}
            {task.client_users && (
              <>
                <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                  isDarkTheme 
                    ? "bg-blue-500/20 ring-1 ring-blue-500/30 border border-blue-500/30" 
                    : "bg-blue-50 border-2 border-blue-300"
                }`}>
                  <Avatar className={`h-10 w-10 ${
                    isDarkTheme ? "ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/50" : "border-2 border-blue-400"
                  }`}>
                    <AvatarImage src={task.client_users.avatar || undefined} alt={task.client_users.name} />
                    <AvatarFallback className={isDarkTheme ? "bg-blue-600 text-white" : "bg-blue-200 text-blue-700"}>
                      {task.client_users.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className={`text-xs font-semibold ${isDarkTheme ? "text-blue-300" : "text-blue-700"}`}>
                      👔 Created by Client
                    </p>
                    <p className={`text-sm font-bold ${isDarkTheme ? "text-blue-200" : "text-blue-900"}`}>
                      {task.client_users.name}
                    </p>
                  </div>
                </div>

                <span className={`text-2xl ${isDarkTheme ? "text-slate-600" : "text-slate-400"}`}>→</span>
              </>
            )}

            {/* Assigned To - Staff Members */}
            {allAssignedStaff.length > 0 && (
              <>
                <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                  isDarkTheme 
                    ? "bg-indigo-500/20 ring-1 ring-indigo-500/30 border border-indigo-500/30" 
                    : "bg-indigo-50 border-2 border-indigo-300"
                }`}>
                  <div className="flex -space-x-2">
                    {allAssignedStaff.slice(0, 3).map((staff) => (
                      <Avatar
                        key={staff.id}
                        className={`h-10 w-10 ${
                          isDarkTheme 
                            ? "border-2 border-slate-900 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/50" 
                            : "border-2 border-white ring-1 ring-indigo-300"
                        }`}
                      >
                        <AvatarImage src={staff.avatar || undefined} alt={staff.name} />
                        <AvatarFallback className={isDarkTheme ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white" : "bg-indigo-200 text-indigo-700"}>
                          {staff.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {allAssignedStaff.length > 3 && (
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isDarkTheme 
                          ? "bg-slate-700 border-2 border-slate-900 ring-2 ring-indigo-500/30" 
                          : "bg-slate-200 border-2 border-white"
                      }`}>
                        <span className={`text-xs font-bold ${isDarkTheme ? "text-indigo-300" : "text-slate-700"}`}>
                          +{allAssignedStaff.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${isDarkTheme ? "text-indigo-300" : "text-indigo-700"}`}>
                      👥 Assigned to Staff
                    </p>
                    <p className={`text-sm font-bold ${isDarkTheme ? "text-indigo-200" : "text-indigo-900"}`}>
                      {allAssignedStaff.length} member{allAssignedStaff.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {task.company && <span className={`text-2xl ${isDarkTheme ? "text-slate-600" : "text-slate-400"}`}>→</span>}
              </>
            )}

            {/* Company */}
            {task.company && (
              <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                isDarkTheme 
                  ? "bg-purple-500/20 ring-1 ring-purple-500/30 border border-purple-500/30" 
                  : "bg-purple-50 border-2 border-purple-300"
              }`}>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  isDarkTheme ? "bg-purple-600" : "bg-purple-200"
                }`}>
                  <Building2 className={`h-5 w-5 ${isDarkTheme ? "text-white" : "text-purple-700"}`} />
                </div>
                <div>
                  <p className={`text-xs font-semibold ${isDarkTheme ? "text-purple-300" : "text-purple-700"}`}>
                    🏢 Company
                  </p>
                  <p className={`text-sm font-bold ${isDarkTheme ? "text-purple-200" : "text-purple-900"}`}>
                    {task.company.companyName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Staff Details List */}
          {allAssignedStaff.length > 0 && (
            <div className="mt-4 pt-4 border-t border-opacity-20" style={{ borderColor: isDarkTheme ? '#ffffff33' : '#00000020' }}>
              <p className={`text-xs font-semibold mb-2 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                Staff Members:
              </p>
              <div className="flex flex-wrap gap-2">
                {allAssignedStaff.map((staff) => (
                  <div
                    key={staff.id}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                      isDarkTheme 
                        ? "bg-slate-700/50 ring-1 ring-white/10" 
                        : "bg-white border border-slate-300"
                    }`}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={staff.avatar || undefined} alt={staff.name} />
                      <AvatarFallback className={isDarkTheme ? "bg-indigo-600 text-white text-xs" : "bg-indigo-100 text-indigo-700 text-xs"}>
                        {staff.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`text-sm font-medium ${isDarkTheme ? "text-slate-200" : "text-slate-700"}`}>
                      {staff.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Task Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Deadline */}
          {task.deadline && (
            <div className={`rounded-xl p-4 ${
              isDarkTheme 
                ? "bg-slate-800/50 ring-1 ring-white/10" 
                : "bg-slate-50 border border-slate-300"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className={`h-4 w-4 ${
                  deadlineInfo.isOverdue ? (isDarkTheme ? "text-red-400" : "text-red-600") : (isDarkTheme ? "text-slate-400" : "text-slate-600")
                }`} />
                <p className={`text-xs font-bold ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                  Deadline
                </p>
              </div>
              <p className={`text-lg font-bold ${
                deadlineInfo.isOverdue 
                  ? (isDarkTheme ? "text-red-400" : "text-red-600") 
                  : (isDarkTheme ? "text-slate-200" : "text-slate-900")
              }`}>
                {deadlineInfo.text}
              </p>
            </div>
          )}

          {/* Created Date */}
          <div className={`rounded-xl p-4 ${
            isDarkTheme 
              ? "bg-slate-800/50 ring-1 ring-white/10" 
              : "bg-slate-50 border border-slate-300"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className={`h-4 w-4 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`} />
              <p className={`text-xs font-bold ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                Created
              </p>
            </div>
            <p className={`text-lg font-bold ${isDarkTheme ? "text-slate-200" : "text-slate-900"}`}>
              {new Date(task.createdAt).toLocaleDateString()} at {new Date(task.createdAt).toLocaleTimeString()}
            </p>
          </div>

          {/* Completed Date */}
          {task.completedAt && (
            <div className={`rounded-xl p-4 ${
              isDarkTheme 
                ? "bg-emerald-500/20 ring-1 ring-emerald-500/30" 
                : "bg-emerald-50 border border-emerald-300"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className={`h-4 w-4 ${isDarkTheme ? "text-emerald-400" : "text-emerald-600"}`} />
                <p className={`text-xs font-bold ${isDarkTheme ? "text-emerald-400" : "text-emerald-700"}`}>
                  Completed
                </p>
              </div>
              <p className={`text-lg font-bold ${isDarkTheme ? "text-emerald-300" : "text-emerald-900"}`}>
                {new Date(task.completedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <div className={`rounded-2xl p-6 mb-6 ${
            isDarkTheme 
              ? "bg-slate-800/50 backdrop-blur-xl ring-1 ring-white/10" 
              : "bg-slate-50 border-2 border-slate-200"
          }`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${
              isDarkTheme ? "text-slate-300" : "text-slate-700"
            }`}>
              <Paperclip className="h-4 w-4" />
              Attachments ({task.attachments.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {task.attachments.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative rounded-xl overflow-hidden transition-all hover:scale-105 ${
                    isDarkTheme 
                      ? "ring-1 ring-white/10 hover:ring-indigo-500/50" 
                      : "border-2 border-slate-300 hover:border-blue-500"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Attachment ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      View
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 🎯 SUBTASKS SECTION */}
        <div className={`rounded-2xl p-6 mb-6 ${
          isDarkTheme 
            ? "bg-slate-800/50 backdrop-blur-xl ring-1 ring-white/10" 
            : "bg-slate-50 border-2 border-slate-200"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${
              isDarkTheme 
                ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400" 
                : "text-slate-900"
            }`}>
              <CheckSquare className="h-5 w-5" />
              🎯 Subtasks
            </h3>
            <button
              onClick={() => setShowSubtaskInput(!showSubtaskInput)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 ${
                isDarkTheme 
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Plus className="h-4 w-4" />
              Add Subtask
            </button>
          </div>

          {/* Progress Bar */}
          {subtaskProgress.total > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Progress: {subtaskProgress.completed}/{subtaskProgress.total} completed
                </span>
                <span className={`text-sm font-bold ${
                  subtaskProgress.percentage === 100 
                    ? (isDarkTheme ? "text-emerald-400" : "text-emerald-600")
                    : (isDarkTheme ? "text-indigo-400" : "text-blue-600")
                }`}>
                  {subtaskProgress.percentage}% 🔥
                </span>
              </div>
              <div className={`w-full h-3 rounded-full overflow-hidden ${
                isDarkTheme ? "bg-slate-700" : "bg-slate-200"
              }`}>
                <div
                  className={`h-full transition-all duration-500 ${
                    subtaskProgress.percentage === 100
                      ? "bg-gradient-to-r from-emerald-500 to-green-500"
                      : "bg-gradient-to-r from-indigo-500 to-purple-500"
                  }`}
                  style={{ width: `${subtaskProgress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Add Subtask Input */}
          {showSubtaskInput && (
            <div className={`mb-4 p-4 rounded-xl ${
              isDarkTheme 
                ? "bg-slate-700/50 ring-1 ring-white/10" 
                : "bg-white border-2 border-slate-300"
            }`}>
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Enter subtask title..."
                onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                className={`w-full px-4 py-3 rounded-lg outline-none mb-3 transition-all duration-200 ${
                  isDarkTheme 
                    ? "bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-500" 
                    : "bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-400"
                }`}
              />
              <div className="flex gap-2">
                <button
                  onClick={addSubtask}
                  disabled={submittingSubtask}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    isDarkTheme 
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submittingSubtask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowSubtaskInput(false)
                    setNewSubtaskTitle("")
                  }}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    isDarkTheme 
                      ? "bg-slate-700 hover:bg-slate-600 text-white" 
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Subtask List */}
          {loadingSubtasks ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className={`h-8 w-8 animate-spin ${isDarkTheme ? "text-indigo-400" : "text-blue-600"}`} />
            </div>
          ) : subtasks.length === 0 ? (
            <div className={`text-center py-8 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
              <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No subtasks yet</p>
              <p className="text-sm">Break this task down into smaller chunks!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className={`group flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isDarkTheme 
                      ? "bg-slate-700/50 ring-1 ring-white/10 hover:ring-indigo-500/30" 
                      : "bg-white border-2 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {editingSubtaskId === subtask.id ? (
                    // EDIT MODE
                    <>
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        disabled
                        className="h-5 w-5 rounded cursor-not-allowed opacity-50"
                      />
                      <input
                        type="text"
                        value={editingSubtaskTitle}
                        onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') saveEditedSubtask(subtask.id)
                          if (e.key === 'Escape') cancelEditingSubtask()
                        }}
                        autoFocus
                        className={`flex-1 px-3 py-2 rounded-lg outline-none transition-all duration-200 ${
                          isDarkTheme 
                            ? "bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                            : "bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        }`}
                      />
                      <button
                        onClick={() => saveEditedSubtask(subtask.id)}
                        className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                          isDarkTheme 
                            ? "text-emerald-400 hover:bg-emerald-500/20" 
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title="Save (Enter)"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditingSubtask}
                        className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                          isDarkTheme 
                            ? "text-slate-400 hover:bg-slate-600" 
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                        title="Cancel (Esc)"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    // VIEW MODE
                    <>
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={(e) => toggleSubtask(subtask.id, e.target.checked)}
                        className={`h-5 w-5 rounded cursor-pointer transition-all ${
                          subtask.completed 
                            ? "accent-emerald-500" 
                            : "accent-indigo-600"
                        }`}
                      />
                      <span 
                        className={`flex-1 ${
                          subtask.completed 
                            ? (isDarkTheme ? "line-through text-slate-500" : "line-through text-slate-400")
                            : (isDarkTheme ? "text-slate-200" : "text-slate-700")
                        } font-medium transition-all`}
                      >
                        {subtask.title}
                      </span>
                      {subtask.completed && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 animate-in fade-in">
                          ✅ Done
                        </span>
                      )}
                      <button
                        onClick={() => startEditingSubtask(subtask)}
                        className={`p-1.5 rounded-lg transition-all hover:scale-110 opacity-0 group-hover:opacity-100 ${
                          isDarkTheme 
                            ? "text-blue-400 hover:bg-blue-500/20" 
                            : "text-blue-600 hover:bg-blue-50"
                        }`}
                        title="Edit subtask"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteSubtask(subtask.id)}
                        className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                          isDarkTheme 
                            ? "text-red-400 hover:bg-red-500/20" 
                            : "text-red-600 hover:bg-red-50"
                        }`}
                        title="Delete subtask"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🎯 UNIFIED COMMENT SYSTEM - Replaces old task_responses */}
        <div className={`rounded-2xl p-6 mb-6 ${
          isDarkTheme 
            ? "bg-slate-800/50 backdrop-blur-xl ring-1 ring-white/10" 
            : "bg-white border-2 border-slate-200"
        }`}>
          <CommentSection
            commentableType="TASK"
            commentableId={task.id}
            darkMode={isDarkTheme}
          />
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={onClose}
            className={`rounded-xl px-6 py-3 font-bold ${
              isDarkTheme 
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-2xl shadow-indigo-500/50" 
                : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

