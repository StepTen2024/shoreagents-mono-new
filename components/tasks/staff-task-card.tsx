"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, Users, AlertCircle, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPriorityConfig, formatDeadline, getSourceConfig } from "@/lib/task-utils"
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

interface StaffTaskCardProps {
  task: Task
  onUpdate: () => void
  isDragging?: boolean
}

export default function StaffTaskCard({ task, onUpdate, isDragging }: StaffTaskCardProps) {
  const [showModal, setShowModal] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: task.id,
  })

  const priorityConfig = getPriorityConfig(task.priority as any)
  const sourceConfig = getSourceConfig(task.source as any)
  const deadlineInfo = formatDeadline(task.deadline)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)",
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setShowModal(true)}
        className={`group cursor-grab active:cursor-grabbing rounded-2xl bg-slate-900/50 backdrop-blur-xl p-4 border border-white/10 shadow-xl transition-all duration-300 hover:border-slate-400/50 relative overflow-hidden ${
          isDragging || isSortableDragging ? "opacity-50 scale-95" : ""
        }`}
      >
      {/* Priority Bar */}
      <div className={`h-2 w-full rounded-full mb-3 ${priorityConfig.color} shadow-lg`} />


      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-bold text-slate-100 line-clamp-2 flex-1">
          {task.title}
        </h4>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${priorityConfig.darkColor} shadow-md`}>
          {priorityConfig.emoji} {priorityConfig.label}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-slate-400 line-clamp-2 mb-3">{task.description}</p>
      )}

      {/* Source Badge (if from client) */}
      {task.source === "CLIENT" && task.client_users && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-blue-500/20 ring-1 ring-blue-500/30 border border-blue-500/30">
          <Avatar className="h-6 w-6 ring-2 ring-blue-500/50">
            <AvatarImage src={task.client_users.avatar || undefined} alt={task.client_users.name} />
            <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
              {task.client_users.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-300">{sourceConfig.emoji} {sourceConfig.label}</p>
            <p className="text-xs text-blue-400">{task.client_users.name}</p>
          </div>
        </div>
      )}

      {/* Deadline */}
      {task.deadline && (
        <div className={`flex items-center gap-1.5 text-xs mb-3 px-2 py-1.5 rounded-lg ${
          deadlineInfo.isOverdue
            ? "bg-red-500/20 ring-1 ring-red-500/30 text-red-300"
            : deadlineInfo.isUrgent
            ? "bg-orange-500/20 ring-1 ring-orange-500/30 text-orange-300"
            : "bg-slate-700/50 ring-1 ring-white/10 text-slate-400"
        }`}>
          {deadlineInfo.isOverdue ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <Calendar className="h-3.5 w-3.5" />
          )}
          <span className="font-semibold">{deadlineInfo.text}</span>
        </div>
      )}

      {/* Image Preview */}
      {task.attachments && task.attachments.length > 0 && (
        <div className="mb-3 relative rounded-lg overflow-hidden bg-slate-800/50 ring-1 ring-white/10">
          <img
            src={task.attachments[0]}
            alt="Task attachment"
            className="w-full h-32 object-cover"
            onError={(e) => {
              // Hide image if it fails to load (not an image file)
              e.currentTarget.parentElement!.style.display = 'none'
            }}
          />
          {task.attachments.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
              +{task.attachments.length - 1} more
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 text-white text-xs font-semibold flex items-center gap-1 backdrop-blur-sm bg-black/30 px-2 py-1 rounded">
            📎 {task.attachments.length} file{task.attachments.length > 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Footer - Team indicator if bulk assigned */}
      {task.assignedStaff && task.assignedStaff.length > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-semibold">
              Team Task • {task.assignedStaff.length} members
            </span>
          </div>
          <div className="flex -space-x-2">
            {task.assignedStaff.slice(0, 3).map((assignment) => (
              <Avatar
                key={assignment.staff_users.id}
                className="h-7 w-7 border-2 border-slate-900 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/50"
              >
                <AvatarImage
                  src={assignment.staff_users.avatar || undefined}
                  alt={assignment.staff_users.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-xs font-bold">
                  {assignment.staff_users.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.assignedStaff.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center ring-2 ring-indigo-500/30">
                <span className="text-xs font-bold text-indigo-300">
                  +{task.assignedStaff.length - 3}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>

    {/* Modal - Use Portal to render at body level */}
    {showModal && typeof window !== 'undefined' && createPortal(
      <TaskDetailModal
        task={task}
        onClose={() => setShowModal(false)}
        isDarkTheme={true}
      />,
      document.body
    )}
    </>
  )
}

