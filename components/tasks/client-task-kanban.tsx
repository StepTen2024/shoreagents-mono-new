"use client"

import ClientTaskCard from "./client-task-card"
import { getStatusConfig, getAllStatuses } from "@/lib/task-utils"

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
  staffUser?: { id: string; name: string; email: string; avatar: string | null; role: string } | null
}

interface ClientTaskKanbanProps {
  tasks: Task[]
  onStatusChange: (taskId: string, newStatus: string) => void
  onTaskUpdate: () => void
}

export default function ClientTaskKanban({
  tasks,
  onStatusChange,
  onTaskUpdate,
}: ClientTaskKanbanProps) {
  const statuses = getAllStatuses()
  
  // 📌 CLIENTS HAVE VIEW ONLY - NO DRAG & DROP!
  // Only staff can move their own tasks

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statuses.map((status) => {
        const statusTasks = tasks.filter((task) => task.status === status)
        const config = getStatusConfig(status as any)

        return (
          <div key={status} className="flex flex-col min-h-[500px]">
            {/* Column Header */}
            <div className={`mb-3 rounded-xl p-4 ${config.lightColor} border-2`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span className="text-lg">{config.emoji}</span>
                  <span>{config.label.replace(config.emoji, "").trim()}</span>
                </h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.lightColor}`}>
                  {statusTasks.length}
                </span>
              </div>
            </div>

            {/* Tasks Column - VIEW ONLY (no drag & drop) */}
            <div className="flex-1 rounded-xl p-3 bg-slate-50 border-2 border-slate-200 border-dashed">
              {statusTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm">No tasks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {statusTasks.map((task) => (
                    <ClientTaskCard key={task.id} task={task} onUpdate={onTaskUpdate} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
