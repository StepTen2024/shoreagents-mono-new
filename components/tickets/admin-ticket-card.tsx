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
  AlertTriangle,
  Ban,
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
  LOW: { label: "Low", color: "bg-slate-500/20 text-slate-400 border-slate-500/20" },
  MEDIUM: { label: "Medium", color: "bg-blue-500/20 text-blue-400 border-blue-500/20" },
  HIGH: { label: "High", color: "bg-orange-500/20 text-orange-400 border-orange-500/20" },
  URGENT: { label: "Urgent", color: "bg-red-500/20 text-red-400 border-red-500/20 animate-pulse" },
}

// Status colors - ADMIN PORTAL
const statusColors = {
  OPEN: "bg-blue-500",
  IN_PROGRESS: "bg-amber-500", 
  RESOLVED: "bg-emerald-500",
  CLOSED: "bg-slate-500",
  CANCELLED: "bg-red-500",
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

  // Overdue Logic
  const isOverdue = ticket.dueDate && 
    new Date(ticket.dueDate) < new Date() && 
    ticket.status !== "RESOLVED" && 
    ticket.status !== "CLOSED" && 
    ticket.status !== "CANCELLED"

  const getOverdueTime = () => {
    if (!ticket.dueDate) return ""
    const diff = new Date().getTime() - new Date(ticket.dueDate).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return `${hours}h late`
  }

  const CategoryIcon = categoryConfig[ticket.category]?.icon || HelpCircle
  const categoryColor = categoryConfig[ticket.category]?.color || categoryConfig.OTHER.color
  const priorityColor = priorityConfig[ticket.priority]?.color || priorityConfig.MEDIUM.color

  // Determine which user to show
  const displayUser = ticket.client_users || ticket.staff_users || ticket.management_users
  const assignedTo = ticket.management_users 
  
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
      className={`group cursor-grab active:cursor-grabbing rounded-xl bg-[#1e293b] border border-slate-700/50 transition-all duration-200 hover:bg-[#1e293b] hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 w-full max-w-full min-w-0 overflow-hidden relative ${
        isDragging || isSortableDragging ? "opacity-0 cursor-grabbing" : ""
      } ${ticket.status === "CANCELLED" ? "opacity-75 grayscale-[0.5]" : ""}`}
    >
      {/* Overdue / Cancelled Overlays */}
      {ticket.status === "CANCELLED" && (
        <div className="absolute top-0 right-0 p-2 z-10">
          <span className="flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-1 rounded-full text-[10px] font-bold border border-red-500/20">
            <Ban className="w-3 h-3" /> CANCELLED
          </span>
        </div>
      )}

      {isOverdue && (
        <div className="absolute top-0 right-0 p-2 z-10">
          <span className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-lg shadow-red-500/20 animate-pulse">
            <AlertTriangle className="w-3 h-3" /> {getOverdueTime()}
          </span>
        </div>
      )}

      {/* Priority Stripe (Left Border) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        ticket.priority === 'URGENT' ? 'bg-red-500' :
        ticket.priority === 'HIGH' ? 'bg-orange-500' :
        ticket.priority === 'MEDIUM' ? 'bg-blue-500' :
        'bg-slate-500'
      }`} />
      
      <div className="p-4 pl-5">
        {/* Header: ID & Badges */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-500 font-medium">#{ticket.ticketId}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${creatorBadge.color} border border-current/10`}>
              {creatorBadge.label}
            </span>
          </div>
          {!isOverdue && !ticket.status.includes("CANCELLED") && (
             <span className={`rounded px-2 py-0.5 text-[10px] font-bold border ${priorityColor}`}>
               {priorityConfig[ticket.priority]?.label}
             </span>
          )}
        </div>

        {/* Title */}
        <h4 className="mb-3 text-sm font-semibold text-slate-200 leading-relaxed group-hover:text-white transition-colors line-clamp-2">
          {ticket.title}
        </h4>

        {/* Tags Row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold border ${categoryColor}`}>
            <CategoryIcon className="h-3 w-3" />
            <span>{ticket.category}</span>
          </div>
          
          {assignedTo?.department && (
            <div className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
              <span>To:</span>
              <span className="text-slate-300">{assignedTo.department.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        {/* Footer: Users & Meta */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-auto">
          {/* Users */}
          <div className="flex -space-x-2">
            {/* Creator */}
            {displayUser && (
              <div className="relative group/avatar z-10">
                <Avatar className="h-7 w-7 ring-2 ring-[#1e293b]">
                  <AvatarImage src={displayUser.avatar} />
                  <AvatarFallback className="bg-slate-700 text-[10px] text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            {/* Assignee */}
            {assignedTo && (
              <div className="relative group/avatar z-20">
                <Avatar className="h-7 w-7 ring-2 ring-[#1e293b]">
                  <AvatarImage src={assignedTo.avatar} />
                  <AvatarFallback className="bg-indigo-600 text-[10px] text-white">
                    {assignedInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            {ticket.responses?.length > 0 && (
              <div className="flex items-center gap-1 text-blue-400">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{ticket.responses.length}</span>
              </div>
            )}
            
            {ticket.attachments?.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" />
                <span>{ticket.attachments.length}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDate(ticket.createdAt).replace(' ago', '')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
