"use client"

import { useState, useRef, useEffect } from "react"
import { X, Upload, Trash2, Users, CheckCircle2, AlertCircle, Plus, Minus, Eye, EyeOff, Calendar, Clock, Star, Zap, FileText, Image, File, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { getAllPriorities } from "@/lib/task-utils"

interface StaffUser {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
}

interface BulkTask {
  id: string
  title: string
  description: string
  priority: string
  deadline: string
  subtasks?: Subtask[]
}

interface Subtask {
  id: string
  title: string
  completed: boolean
}

interface CreateTaskModalProps {
  isClient: boolean
  staffUsers?: StaffUser[]
  onClose: () => void
  onSuccess: () => void
}

export default function CreateTaskModal({
  isClient,
  staffUsers = [],
  onClose,
  onSuccess,
}: CreateTaskModalProps) {
  const [tasks, setTasks] = useState<BulkTask[]>([
    {
      id: "1",
      title: "",
      description: "",
      priority: "MEDIUM",
      deadline: "",
      subtasks: [],
    },
  ])
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const priorities = getAllPriorities()
  const isDark = !isClient // Staff and Management use dark theme

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit(e as any)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Auto-focus first field ONLY on initial mount
  useEffect(() => {
    const firstInput = modalRef.current?.querySelector('input')
    if (firstInput) {
      firstInput.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty array = only run on mount, not on tasks changes

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }

  const processFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        })
        return false
      }
      return true
    })

    if (attachments.length + validFiles.length > 5) {
      toast({
        title: "Too many files",
        description: "Maximum 5 files allowed",
        variant: "destructive",
      })
      return
    }

    setAttachments([...attachments, ...validFiles])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }


  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    const validTasks = tasks.filter(task => task.title.trim())
    if (validTasks.length === 0) {
      newErrors.tasks = "At least one task must have a title"
    }
    
    if (isClient && selectedStaffIds.length === 0) {
      newErrors.staff = "Please select at least one staff member"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedStaffIds.length === staffUsers.length) {
      setSelectedStaffIds([])
    } else {
      setSelectedStaffIds(staffUsers.map((s) => s.id))
    }
  }

  const addTask = () => {
    const newTask: BulkTask = {
      id: Date.now().toString(),
      title: "",
      description: "",
      priority: "MEDIUM",
      deadline: "",
      subtasks: [],
    }
    setTasks([...tasks, newTask])
  }

  const removeTask = (taskId: string) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((task) => task.id !== taskId))
    }
  }

  const updateTask = (taskId: string, field: keyof BulkTask, value: string) => {
    console.log('[Task Update]', { taskId, field, value: value.substring(0, 50) })
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    )
  }

  const addSubtask = (taskId: string, title: string) => {
    if (!title.trim()) return
    
    console.log('Adding subtask:', { taskId, title }) // Debug log
    
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      title: title.trim(),
      completed: false,
    }
    
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map((task) =>
        task.id === taskId
          ? { 
              ...task, 
              subtasks: [...(task.subtasks || []), newSubtask] 
            }
          : task
      )
      console.log('Updated tasks:', updatedTasks) // Debug log
      return updatedTasks
    })
  }

  const removeSubtask = (taskId: string, subtaskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { 
              ...task, 
              subtasks: (task.subtasks || []).filter(sub => sub.id !== subtaskId)
            }
          : task
      )
    )
  }

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { 
              ...task, 
              subtasks: (task.subtasks || []).map(sub =>
                sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
              )
            }
          : task
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Validate tasks
    const validTasks = tasks.filter((task) => task.title.trim())
    
    setSubmitting(true)
    try {
      // Upload attachments first if any
      let attachmentUrls: string[] = []
      if (attachments.length > 0) {
        setUploading(true)
        const formDataUpload = new FormData()
        attachments.forEach((file) => {
          formDataUpload.append("files", file)
        })

        const uploadResponse = await fetch("/api/tasks/attachments", {
          method: "POST",
          body: formDataUpload,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          attachmentUrls = uploadData.urls || []
        }
        setUploading(false)
      }

      // Create tasks
      if (isClient) {
        // Client: Create bulk tasks for selected staff
        const endpoint = "/api/client/tasks/bulk"
        const body = {
          tasks: validTasks,
          staffUserIds: selectedStaffIds,
          attachments: attachmentUrls,
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create tasks")
        }
      } else {
        // Staff: Create tasks for themselves (one at a time)
        const endpoint = "/api/tasks"
        
        for (const task of validTasks) {
          const body = {
            title: task.title.trim(),
            description: task.description || "",
            priority: task.priority || "MEDIUM",
            deadline: task.deadline || null,
            tags: [],
            attachments: attachmentUrls,
          }

          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to create task")
          }
        }
      }

      toast({
        title: "Success",
        description: `Created ${validTasks.length} task${validTasks.length > 1 ? "s" : ""}${isClient ? ` for ${selectedStaffIds.length} staff member${selectedStaffIds.length > 1 ? "s" : ""}` : ""}`,
      })

      onSuccess()
    } catch (error) {
      console.error("Error creating tasks:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tasks",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const selectedStaff = staffUsers.filter((s) => selectedStaffIds.includes(s.id))

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 ${
      isDark ? "bg-black/70 backdrop-blur-sm" : "bg-black/50 backdrop-blur-sm"
    } animate-in fade-in duration-300`}>
      <div 
        ref={modalRef}
        className={`w-full max-w-4xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl max-h-[95vh] overflow-y-auto backdrop-blur-xl animate-in slide-in-from-bottom duration-500 ${
          isDark 
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700" 
            : "bg-white border border-gray-200 shadow-xl"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl sm:text-3xl font-bold ${
            isDark 
              ? "text-white" 
              : "text-gray-900"
          }`}>
            {isClient ? "📋 Create Tasks for Staff" : "✨ Create Tasks"}
          </h2>
          <button
            onClick={onClose}
            className={`rounded-lg p-2.5 transition-all duration-200 hover:scale-105 min-w-[40px] min-h-[40px] flex items-center justify-center ${
              isDark 
                ? "text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-700 hover:border-red-500" 
                : "text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-300 hover:border-red-400"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Form */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Tasks ({tasks.length})
              </h3>
              <button
                type="button"
                onClick={addTask}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 min-w-[120px] flex items-center justify-center gap-2 ${
                  isDark
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                }`}
              >
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Add Task</span>
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={`rounded-xl p-4 transition-all duration-200 ${
                      isDark ? "bg-gray-800/50 border border-gray-700 hover:border-blue-500" : "bg-gray-50 border border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                          Task {index + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTask(task.id)}
                            className={`p-2 rounded-lg transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center ${
                              isDark
                                ? "text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/30 hover:border-red-400"
                                : "text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-300 hover:border-red-400"
                            }`}
                            title="Remove task"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Task Title */}
                      <div>
                        <label className={`mb-2 block text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`task-title-${task.id}`}
                          name={`task-title-${task.id}`}
                          type="text"
                          value={task.title}
                          onChange={(e) => {
                            e.stopPropagation()
                            updateTask(task.id, "title", e.target.value)
                          }}
                          onFocus={() => setFocusedField(`bulk-title-${task.id}`)}
                          onBlur={() => setFocusedField(null)}
                          autoComplete="off"
                          className={`w-full rounded-lg px-4 py-3 outline-none transition-all duration-200 ${
                            isDark
                              ? "bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                              : "bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          }`}
                          placeholder="Enter task title..."
                        />
                      </div>

                      {/* Priority & Deadline */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={`mb-2 block text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Priority
                          </label>
                          <div className="relative">
                            <select
                              value={task.priority}
                              onChange={(e) => updateTask(task.id, "priority", e.target.value)}
                              onFocus={() => setFocusedField(`bulk-priority-${task.id}`)}
                              onBlur={() => setFocusedField(null)}
                              className={`w-full rounded-lg px-4 py-3 outline-none transition-all duration-200 appearance-none ${
                                isDark
                                  ? "bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                  : "bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                              }`}
                            >
                              {priorities.map((priority) => {
                                const config = {
                                  LOW: "💤 Low",
                                  MEDIUM: "📋 Medium",
                                  HIGH: "⚡ High",
                                  URGENT: "🚨 Urgent",
                                }[priority]
                                return (
                                  <option key={priority} value={priority}>
                                    {config}
                                  </option>
                                )
                              })}
                            </select>
                            <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className={`mb-2 block text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Deadline
                          </label>
                          <div className="relative">
                            <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`} />
                            <input
                              type="date"
                              value={task.deadline}
                              onChange={(e) => updateTask(task.id, "deadline", e.target.value)}
                              onFocus={() => setFocusedField(`bulk-deadline-${task.id}`)}
                              onBlur={() => setFocusedField(null)}
                              className={`w-full rounded-lg pl-10 pr-4 py-3 outline-none transition-all duration-200 ${
                                isDark
                                  ? "bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                  : "bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className={`mb-2 block text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          Description
                        </label>
                        <textarea
                          id={`task-description-${task.id}`}
                          name={`task-description-${task.id}`}
                          value={task.description}
                          onChange={(e) => {
                            e.stopPropagation()
                            updateTask(task.id, "description", e.target.value)
                          }}
                          rows={3}
                          autoComplete="off"
                          className={`w-full rounded-lg px-4 py-3 outline-none transition-all duration-200 resize-none ${
                            isDark
                              ? "bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-500"
                              : "bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-400"
                          }`}
                          placeholder="Add task details..."
                        />
                      </div>

                      {/* Subtasks */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Subtasks
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById(`subtask-input-${task.id}`) as HTMLInputElement
                              if (input) {
                                input.focus()
                                input.placeholder = "Press Enter to add..."
                              }
                            }}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-200 font-medium ${
                              isDark 
                                ? "text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400" 
                                : "text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-300 hover:border-blue-400"
                            }`}
                          >
                            + Add Subtask
                          </button>
                        </div>
                        
                        {/* Subtask Input */}
                        <div className="mb-3">
                          <div className="flex gap-2">
                            <input
                              id={`subtask-input-${task.id}`}
                              type="text"
                              placeholder="Enter subtask title..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  const input = e.target as HTMLInputElement
                                  if (input.value.trim()) {
                                    addSubtask(task.id, input.value)
                                    input.value = ''
                                    input.placeholder = "Enter subtask title..."
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const input = e.target as HTMLInputElement
                                input.placeholder = "Enter subtask title..."
                              }}
                              className={`flex-1 px-3 py-2 rounded-lg outline-none transition-all duration-200 text-sm ${
                                isDark
                                  ? "bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-500"
                                  : "bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-400"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById(`subtask-input-${task.id}`) as HTMLInputElement
                                if (input && input.value.trim()) {
                                  addSubtask(task.id, input.value)
                                  input.value = ''
                                  input.placeholder = "Enter subtask title..."
                                }
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isDark
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Subtask List */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="space-y-2">
                            {task.subtasks.map((subtask) => (
                              <div
                                key={subtask.id}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                  isDark
                                    ? "bg-gray-700/30 border border-gray-600"
                                    : "bg-gray-50 border border-gray-200"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleSubtask(task.id, subtask.id)}
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                    subtask.completed
                                      ? isDark
                                        ? "bg-blue-500 border-blue-500 text-white"
                                        : "bg-blue-500 border-blue-500 text-white"
                                      : isDark
                                      ? "border-gray-500 hover:border-blue-400"
                                      : "border-gray-400 hover:border-blue-400"
                                  }`}
                                >
                                  {subtask.completed && <CheckCircle2 className="h-3 w-3" />}
                                </button>
                                <span className={`flex-1 text-sm ${
                                  subtask.completed
                                    ? isDark ? "text-gray-500 line-through" : "text-gray-500 line-through"
                                    : isDark ? "text-gray-300" : "text-gray-700"
                                }`}>
                                  {subtask.title}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeSubtask(task.id, subtask.id)}
                                  className={`p-1 rounded transition-all duration-200 ${
                                    isDark
                                      ? "text-red-400 hover:bg-red-500/20 hover:text-red-300"
                                      : "text-red-600 hover:bg-red-100 hover:text-red-700"
                                  }`}
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          {/* Staff Selection (Client only) */}
          {isClient && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <label className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Assign to Staff <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 min-w-[100px] ${
                    isDark 
                      ? "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-blue-500/30 hover:border-blue-400" 
                      : "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-300 hover:border-blue-400"
                  }`}
                >
                  {selectedStaffIds.length === staffUsers.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className={`rounded-xl p-4 max-h-64 overflow-y-auto ${
                isDark ? "bg-gray-800/50 border border-gray-700" : "bg-gray-50 border border-gray-200"
              }`}>
                {staffUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className={`h-12 w-12 mx-auto mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      No staff members available
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {staffUsers.map((staff) => {
                      const isSelected = selectedStaffIds.includes(staff.id)
                      return (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => toggleStaffSelection(staff.id)}
                          className={`w-full rounded-lg p-4 flex items-center gap-4 transition-all duration-200 ${
                            isSelected
                              ? isDark
                                ? "bg-blue-500/20 border-2 border-blue-500 shadow-lg"
                                : "bg-blue-100 border-2 border-blue-500 shadow-lg"
                              : isDark
                              ? "bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600 hover:border-blue-500"
                              : "bg-white hover:bg-gray-100 border border-gray-300 hover:border-blue-300"
                          }`}
                        >
                          <div className={`h-6 w-6 rounded-md flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? isDark ? "bg-blue-500" : "bg-blue-500"
                              : isDark ? "bg-gray-600 border border-gray-500" : "bg-gray-200"
                          }`}>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                          </div>
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={staff.avatar || undefined} alt={staff.name} />
                            <AvatarFallback className={isDark ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}>
                              {staff.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                              {staff.name}
                            </p>
                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                              {staff.email}
                            </p>
                            <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                              {staff.role}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {selectedStaffIds.length > 0 && (
                <div className={`mt-4 rounded-xl p-4 ${
                  isDark ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30" : "bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300"
                }`}>
                  <p className={`text-sm font-semibold mb-3 ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                    📋 Task Assignment Summary:
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                      isDark ? "bg-gray-800/50" : "bg-white"
                    }`}>
                      <span className="text-2xl">👔</span>
                      <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>You</span>
                    </div>
                    <span className={`text-2xl ${isDark ? "text-blue-400" : "text-blue-500"}`}>→</span>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                      isDark ? "bg-gray-800/50" : "bg-white"
                    }`}>
                      <Users className="h-5 w-5" />
                      <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {selectedStaffIds.length} Staff{selectedStaffIds.length > 1 ? " Members" : ""}
                      </span>
                    </div>
                  </div>
                  {selectedStaff.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedStaff.slice(0, 4).map((staff) => (
                        <div key={staff.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                          isDark ? "bg-gray-700/50 text-gray-300" : "bg-gray-100 text-gray-700"
                        }`}>
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={staff.avatar || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {staff.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{staff.name.split(" ")[0]}</span>
                        </div>
                      ))}
                      {selectedStaff.length > 4 && (
                        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          isDark ? "bg-gray-700/50 text-gray-300" : "bg-gray-100 text-gray-700"
                        }`}>
                          +{selectedStaff.length - 4} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* File Upload */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                📎 Attachments (Optional)
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-200 min-w-[100px] flex items-center justify-center ${
                  isDark 
                    ? "text-gray-400 hover:bg-gray-700 hover:text-gray-300 border border-gray-600 hover:border-gray-500" 
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-gray-300 hover:border-gray-400"
                }`}
              >
                {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {showPreview ? "Hide" : "Show"} Preview
              </button>
            </div>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
                dragOver
                  ? isDark
                    ? "border-blue-400 bg-blue-500/10"
                    : "border-blue-400 bg-blue-50"
                  : isDark
                  ? "border-gray-600 bg-gray-800/20 hover:border-blue-500"
                  : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              <label className={`flex cursor-pointer items-center justify-center gap-3 rounded-xl px-6 py-8 text-sm font-semibold transition-all duration-200 ${
                isDark
                  ? "text-blue-300 hover:text-blue-200"
                  : "text-gray-700 hover:text-gray-800"
              }`}>
                <Upload className={`h-6 w-6 transition-transform duration-200 ${dragOver ? "scale-110" : ""}`} />
                <div className="text-center">
                  <div className="text-lg mb-1">📁 Drop files here or click to browse</div>
                  <div className="text-xs opacity-75">Max 5 files, 10MB each</div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={attachments.length >= 5}
                />
              </label>
            </div>
            
            {/* Upload Progress */}
            {uploading && (
              <div className={`mt-4 p-4 rounded-lg ${
                isDark ? "bg-blue-500/20 ring-1 ring-blue-500/30" : "bg-blue-50 border border-blue-200"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span className="text-sm font-semibold">📤 Uploading {attachments.length} file{attachments.length > 1 ? 's' : ''}...</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${
                  isDark ? "bg-slate-700" : "bg-slate-200"
                }`}>
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" style={{width: '75%'}} />
                </div>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="mt-4 space-y-3">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 rounded-xl p-4 transition-all duration-200 ${
                      isDark
                        ? "bg-gray-800/50 border border-gray-700 hover:border-blue-500"
                        : "bg-gray-50 border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      isDark ? "bg-gray-700/50" : "bg-white"
                    }`}>
                      {getFileIcon(file)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium truncate ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                        {file.name}
                      </p>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className={`rounded-lg p-2 transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center ${
                        isDark
                          ? "text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/30 hover:border-red-400"
                          : "text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-300 hover:border-red-400"
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {Object.keys(errors).length > 0 && (
            <div className={`rounded-xl p-4 ${
              isDark ? "bg-red-500/10 border border-red-500/30" : "bg-red-50 border border-red-200"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className={`h-5 w-5 ${isDark ? "text-red-400" : "text-red-600"}`} />
                <span className={`font-semibold ${isDark ? "text-red-300" : "text-red-700"}`}>
                  Please fix the following errors:
                </span>
              </div>
              <ul className={`space-y-1 ${isDark ? "text-red-300" : "text-red-600"}`}>
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key} className="text-sm">• {message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={submitting || uploading}
              className={`w-full rounded-xl px-6 py-4 font-semibold transition-all duration-200 disabled:opacity-50 min-h-[48px] ${
                isDark
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
              }`}
            >
              {uploading ? (
                <>⏳ Uploading files...</>
              ) : submitting ? (
                <>📤 Creating tasks...</>
              ) : (
                <>🚀 Create Tasks</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

