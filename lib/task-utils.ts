// Task utility functions for colors, emojis, and permissions

export type TaskStatus = "TODO" | "IN_PROGRESS" | "STUCK" | "FOR_REVIEW" | "COMPLETED"
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"
export type TaskSource = "SELF" | "CLIENT" | "MANAGEMENT"

// Status configuration with colors and emojis
export function getStatusConfig(status: TaskStatus) {
  const configs = {
    TODO: {
      label: "📋 To Do",
      emoji: "📋",
      color: "bg-gradient-to-r from-slate-500 to-gray-500",
      lightColor: "bg-slate-100 text-slate-700 border-slate-300",
      darkColor: "bg-slate-500/20 text-slate-300 ring-slate-500/30",
      textColor: "text-slate-600",
    },
    IN_PROGRESS: {
      label: "⚡ In Progress",
      emoji: "⚡",
      color: "bg-gradient-to-r from-blue-500 to-cyan-500",
      lightColor: "bg-blue-100 text-blue-700 border-blue-300",
      darkColor: "bg-blue-500/20 text-blue-300 ring-blue-500/30",
      textColor: "text-blue-600",
    },
    STUCK: {
      label: "🚧 Stuck",
      emoji: "🚧",
      color: "bg-gradient-to-r from-red-500 to-pink-500",
      lightColor: "bg-red-100 text-red-700 border-red-300",
      darkColor: "bg-red-500/20 text-red-300 ring-red-500/30",
      textColor: "text-red-600",
    },
    FOR_REVIEW: {
      label: "👀 For Review",
      emoji: "👀",
      color: "bg-gradient-to-r from-purple-500 to-indigo-500",
      lightColor: "bg-purple-100 text-purple-700 border-purple-300",
      darkColor: "bg-purple-500/20 text-purple-300 ring-purple-500/30",
      textColor: "text-purple-600",
    },
    COMPLETED: {
      label: "✅ Completed",
      emoji: "✅",
      color: "bg-gradient-to-r from-emerald-500 to-green-500",
      lightColor: "bg-emerald-100 text-emerald-700 border-emerald-300",
      darkColor: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
      textColor: "text-emerald-600",
    },
  }
  return configs[status]
}

// Priority configuration with colors and emojis
export function getPriorityConfig(priority: TaskPriority) {
  const configs = {
    LOW: {
      label: "Low",
      emoji: "💤",
      fullLabel: "💤 Low",
      color: "bg-slate-500",
      lightColor: "bg-slate-100 text-slate-600 border-slate-300",
      darkColor: "bg-slate-500/20 text-slate-300 ring-slate-500/30 border border-slate-500/30",
    },
    MEDIUM: {
      label: "Medium",
      emoji: "📋",
      fullLabel: "📋 Medium",
      color: "bg-blue-500",
      lightColor: "bg-blue-100 text-blue-600 border-blue-300",
      darkColor: "bg-blue-500/20 text-blue-300 ring-blue-500/30 border border-blue-500/30",
    },
    HIGH: {
      label: "High",
      emoji: "⚡",
      fullLabel: "⚡ High",
      color: "bg-orange-500",
      lightColor: "bg-orange-100 text-orange-600 border-orange-300",
      darkColor: "bg-orange-500/20 text-orange-300 ring-orange-500/30 border border-orange-500/30",
    },
    URGENT: {
      label: "Urgent",
      emoji: "🚨",
      fullLabel: "🚨 Urgent",
      color: "bg-red-500",
      lightColor: "bg-red-100 text-red-600 border-red-300",
      darkColor: "bg-red-500/20 text-red-300 ring-red-500/30 border border-red-500/30",
    },
  }
  return configs[priority]
}

// Source configuration
export function getSourceConfig(source: TaskSource) {
  const configs = {
    SELF: {
      label: "Self-Created",
      emoji: "👤",
      lightColor: "bg-purple-100 text-purple-600",
      darkColor: "bg-purple-500/20 text-purple-300",
    },
    CLIENT: {
      label: "Client",
      emoji: "👔",
      lightColor: "bg-blue-100 text-blue-600",
      darkColor: "bg-blue-500/20 text-blue-300",
    },
    MANAGEMENT: {
      label: "Management",
      emoji: "📋",
      lightColor: "bg-amber-100 text-amber-600",
      darkColor: "bg-amber-500/20 text-amber-300",
    },
  }
  return configs[source]
}

// Format deadline with urgency indicator
export function formatDeadline(deadline: string | Date | null): {
  text: string
  isOverdue: boolean
  isUrgent: boolean
  color: string
} {
  if (!deadline) {
    return {
      text: "No deadline",
      isOverdue: false,
      isUrgent: false,
      color: "text-slate-400",
    }
  }

  const deadlineDate = new Date(deadline)
  const now = new Date()
  const diffMs = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const isOverdue = diffMs < 0
  const isUrgent = diffMs > 0 && diffDays <= 2

  let text = ""
  let color = ""

  if (isOverdue) {
    const daysOverdue = Math.abs(diffDays)
    text = daysOverdue === 0 ? "Overdue today" : `Overdue by ${daysOverdue} day${daysOverdue > 1 ? "s" : ""}`
    color = "text-red-600"
  } else if (diffDays === 0) {
    text = "Due today"
    color = "text-orange-600"
  } else if (diffDays === 1) {
    text = "Due tomorrow"
    color = "text-orange-600"
  } else if (diffDays <= 7) {
    text = `Due in ${diffDays} days`
    color = "text-yellow-600"
  } else {
    text = deadlineDate.toLocaleDateString()
    color = "text-slate-600"
  }

  return { text, isOverdue, isUrgent, color }
}

// Permission checks
export function canEditTask(
  userType: "client" | "staff" | "management",
  task: { source: TaskSource; clientUserId?: string | null; staffUserId?: string | null },
  userId: string
): boolean {
  // Management can view but not edit in our case (view-only)
  if (userType === "management") return false

  // Client can edit tasks they created
  if (userType === "client") {
    return task.source === "CLIENT" && task.clientUserId === userId
  }

  // Staff can edit their own tasks (self-created) but not client-created tasks
  if (userType === "staff") {
    return task.source === "SELF"
  }

  return false
}

export function canDeleteTask(
  userType: "client" | "staff" | "management",
  task: { source: TaskSource; clientUserId?: string | null; staffUserId?: string | null },
  userId: string
): boolean {
  // Only the creator can delete
  if (userType === "client") {
    return task.source === "CLIENT" && task.clientUserId === userId
  }

  if (userType === "staff") {
    return task.source === "SELF"
  }

  return false
}

export function canDragTask(
  userType: "client" | "staff" | "management"
): boolean {
  // Management cannot drag (view-only)
  // Client and Staff can drag their tasks
  return userType === "client" || userType === "staff"
}

// Get all statuses in order
export function getAllStatuses(): TaskStatus[] {
  return ["TODO", "IN_PROGRESS", "STUCK", "FOR_REVIEW", "COMPLETED"]
}

// Get all priorities in order
export function getAllPriorities(): TaskPriority[] {
  return ["LOW", "MEDIUM", "HIGH", "URGENT"]
}

