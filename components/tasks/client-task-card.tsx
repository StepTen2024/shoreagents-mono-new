"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, Users, AlertCircle, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPriorityConfig, formatDeadline } from "@/lib/task-utils"
import TaskDetailModal from "./task-detail-modal"

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

interface ClientTaskCardProps {
  task: Task
  onUpdate: () => void
  isDragging?: boolean
}

export default function ClientTaskCard({ task, onUpdate, isDragging }: ClientTaskCardProps) {
  const [showModal, setShowModal] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: task.id,
  })

  const priorityConfig = getPriorityConfig(task.priority as any)
  const deadlineInfo = formatDeadline(task.deadline)

  // Get all assigned staff (from both assignedStaff and legacy staffUser)
  const allAssignedStaff = []
  if (task.assignedStaff) {
    allAssignedStaff.push(...task.assignedStaff.map(a => a.staff_users))
  } else if (task.staff_users) {
    allAssignedStaff.push(task.staff_users)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)",
  }

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group cursor-grab active:cursor-grabbing rounded-xl bg-white p-4 border-2 border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300 hover:scale-[1.02] ${
        isDragging || isSortableDragging ? "opacity-50" : ""
      }`}
    >
      {/* Priority Bar */}
      <div className={`h-1 w-full rounded-full mb-3 ${priorityConfig.color}`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-slate-900 line-clamp-2 flex-1 group-hover:text-blue-600 transition-colors">
          {task.title}
        </h4>
        <span className={`text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap ${priorityConfig.lightColor}`}>
          {priorityConfig.fullLabel}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{task.description}</p>
      )}

      {/* Deadline */}
      {task.deadline && (
        <div className={`flex items-center gap-1.5 text-xs mb-3 ${deadlineInfo.color}`}>
          {deadlineInfo.isOverdue ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <Calendar className="h-3.5 w-3.5" />
          )}
          <span className="font-medium">{deadlineInfo.text}</span>
        </div>
      )}

      {/* Attachments indicator */}
      {task.attachments && task.attachments.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <span>📎 {task.attachments.length} attachment{task.attachments.length > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Footer - Assigned Staff */}
      {allAssignedStaff.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">
              {allAssignedStaff.length} staff
            </span>
          </div>
          <div className="flex -space-x-2">
            {allAssignedStaff.slice(0, 3).map((staff) => (
              <Avatar key={staff.id} className="h-7 w-7 border-2 border-white ring-1 ring-slate-200">
                <AvatarImage src={staff.avatar || undefined} alt={staff.name} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                  {staff.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ))}
            {allAssignedStaff.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                <span className="text-xs font-bold text-slate-600">+{allAssignedStaff.length - 3}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
    </div>

    {/* Modal - Use Portal to render at body level */}
    {showModal && typeof window !== 'undefined' && createPortal(
      <TaskDetailModal
        task={task}
        onClose={() => setShowModal(false)}
        isDarkTheme={false}
      />,
      document.body
    )}
    </>
  )
}

