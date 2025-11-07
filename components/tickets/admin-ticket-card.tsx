"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Monitor,
  Users,
  MessageSquare,
  Package,
  HelpCircle,
  MapPin,
  Cloud,
  Gift,
  Bus,
  Paperclip,
  Clock,
} from "lucide-react"
import { Ticket } from "@/types/ticket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AdminTicketCardProps {
  ticket: Ticket
  isDragging?: boolean
  onClick?: () => void
}

// ADMIN PORTAL STYLING - Blue/Emerald theme
const categoryConfig: Record<string, { icon: any; color: string }> = {
  IT: { icon: Monitor, color: "bg-blue-500/20 text-blue-400 ring-blue-500/30" },
  HR: { icon: Users, color: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30" },
  MANAGEMENT: { icon: MessageSquare, color: "bg-amber-500/20 text-amber-400 ring-amber-500/30" },
  EQUIPMENT: { icon: Package, color: "bg-teal-500/20 text-teal-400 ring-teal-500/30" },
  STATION: { icon: MapPin, color: "bg-cyan-500/20 text-cyan-400 ring-cyan-500/30" },
  SURROUNDINGS: { icon: Cloud, color: "bg-sky-500/20 text-sky-400 ring-sky-500/30" },
  COMPENSATION: { icon: Gift, color: "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30" },
  TRANSPORT: { icon: Bus, color: "bg-indigo-500/20 text-indigo-400 ring-indigo-500/30" },
  OTHER: { icon: HelpCircle, color: "bg-slate-500/20 text-slate-400 ring-slate-500/30" },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "Low", color: "bg-slate-500/20 text-slate-400" },
  MEDIUM: { label: "Medium", color: "bg-blue-500/20 text-blue-400" },
  HIGH: { label: "High", color: "bg-orange-500/20 text-orange-400" },
  URGENT: { label: "Urgent", color: "bg-red-500/20 text-red-400 animate-pulse" },
}

// Status colors - ADMIN PORTAL
const statusColors = {
  OPEN: "bg-blue-500",
  IN_PROGRESS: "bg-amber-500", 
  RESOLVED: "bg-emerald-500",
  CLOSED: "bg-slate-500",
}

export default function AdminTicketCard({ ticket, isDragging, onClick }: AdminTicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: ticket.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.18, 0.67, 0.6, 1.22)',
  }

  // Only allow click if not dragging
  const handleClick = (e: React.MouseEvent) => {
    if (!isSortableDragging && onClick) {
      onClick()
    }
  }

  // Format date for timestamps
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const CategoryIcon = categoryConfig[ticket.category]?.icon || HelpCircle
  const categoryColor = categoryConfig[ticket.category]?.color || categoryConfig.OTHER.color
  const priorityColor = priorityConfig[ticket.priority]?.color || priorityConfig.MEDIUM.color

  // Determine which user to show
  // Priority: Show CLIENT if exists (ticket FOR them), otherwise creator
  const displayUser = ticket.client_users || ticket.staff_users || ticket.management_users
  const assignedTo = ticket.management_users // Who manages this ticket
  
  const initials = displayUser?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"
  
  const assignedInitials = assignedTo?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // Creator type badge config
  const creatorTypeConfig: Record<string, { label: string; color: string }> = {
    STAFF: { label: "Staff", color: "bg-blue-500/20 text-blue-400" },
    CLIENT: { label: "Client", color: "bg-green-500/20 text-green-400" },
    MANAGEMENT: { label: "Mgmt", color: "bg-purple-500/20 text-purple-400" },
  }

  const creatorBadge = creatorTypeConfig[ticket.createdByType] || creatorTypeConfig.STAFF

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`group cursor-grab active:cursor-grabbing rounded-lg bg-slate-800/50 ring-1 ring-blue-500/20 transition-all duration-200 hover:bg-slate-800 hover:ring-blue-400/60 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 w-full max-w-full min-w-0 overflow-visible ${
        isDragging || isSortableDragging ? "opacity-0 cursor-grabbing" : ""
      }`}
      style={{ overflow: 'visible' }}
    >
      {/* Status indicator bar - PROMINENT TOP BORDER! */}
      <div className={`h-4 w-full ${statusColors[ticket.status]} shadow-lg rounded-t-lg`} />
      
      <div className="p-4">
      {/* Ticket ID & Creator Type Badge */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-500">{ticket.ticketId}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${creatorBadge.color}`}>
            {creatorBadge.label}
          </span>
        </div>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ring-1 ${priorityColor}`}>
          {priorityConfig[ticket.priority]?.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="mb-2 line-clamp-2 text-sm font-semibold text-white group-hover:text-indigo-400 break-words">
        {ticket.title}
      </h4>

      {/* Category Badge */}
      <div className={`mb-3 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ring-1 ${categoryColor}`}>
        <CategoryIcon className="h-3 w-3" />
        <span>{ticket.category}</span>
      </div>

      {/* Image Thumbnail Preview */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div className="mb-3 w-full">
          <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-700/50 ring-1 ring-white/10">
            <img
              src={ticket.attachments[0]}
              alt="Attachment preview"
              className="w-full h-full object-cover object-center"
            />
            {ticket.attachments.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-full">
                +{ticket.attachments.length - 1}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {ticket.attachments && ticket.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-indigo-400">
              <Paperclip className="h-3 w-3" />
              {ticket.attachments.length}
            </span>
          )}
          {ticket.responses && ticket.responses.length > 0 && (
            <span className="flex items-center gap-1 text-blue-400">
              <MessageSquare className="h-3 w-3" />
              {ticket.responses.length}
            </span>
          )}
          {/* Timestamp */}
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="h-3 w-3" />
            {formatDate(ticket.createdAt)}
          </span>
        </div>

        {/* User Avatars */}
        <div className="flex items-center gap-1">
          {/* Client Avatar (For) */}
          {displayUser && (
            <div className="relative group/avatar">
              <Avatar className="h-6 w-6 ring-2 ring-white/20">
                <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-xs text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-12 -right-2 px-3 py-1.5 bg-black/95 text-white text-xs rounded shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] min-w-max">
                Created by: {displayUser.name}
              </div>
            </div>
          )}
          
          {/* Management Avatar (Assigned To) */}
          {assignedTo && (
            <div className="relative group/assigned">
              <Avatar className="h-6 w-6 ring-2 ring-purple-500/50">
                <AvatarImage src={assignedTo.avatar} alt={assignedTo.name} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-xs text-white font-semibold">
                  {assignedInitials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-12 -right-2 px-3 py-1.5 bg-black/95 text-white text-xs rounded shadow-lg opacity-0 group-hover/assigned:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] min-w-max">
                Assigned to: {assignedTo.name}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}