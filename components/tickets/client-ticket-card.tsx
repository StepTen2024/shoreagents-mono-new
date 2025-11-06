"use client"

import { Ticket } from "@/types/ticket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Paperclip, Clock, User } from "lucide-react"
import { getDepartmentLabel, getDepartmentEmoji } from "@/lib/category-department-map"
import { getCategoryIcon } from "@/lib/ticket-categories"

interface ClientTicketCardProps {
  ticket: Ticket
  onClick?: () => void
}

export default function ClientTicketCard({ ticket, onClick }: ClientTicketCardProps) {
  // Priority colors - Clean and bright for white background
  const priorityColors = {
    URGENT: "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200 shadow-sm",
    HIGH: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200 shadow-sm",
    MEDIUM: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200 shadow-sm",
    LOW: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 shadow-sm",
  }

  // Priority emojis
  const priorityEmojis = {
    URGENT: "🚨",
    HIGH: "⚡",
    MEDIUM: "📋",
    LOW: "💤",
  }

  // Status colors - PROMINENT TOP BORDER!
  const statusColors = {
    OPEN: "bg-blue-500",
    IN_PROGRESS: "bg-orange-500", 
    RESOLVED: "bg-green-500",
    CLOSED: "bg-gray-500",
  }

  // Format date
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

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl bg-slate-900/50 backdrop-blur-xl shadow-xl border border-white/10 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer overflow-visible hover:scale-[1.02] transform"
    >
      {/* Status indicator bar - PROMINENT TOP BORDER! */}
      <div className={`h-4 w-full ${statusColors[ticket.status]} shadow-lg`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 shadow-sm">
                {ticket.ticketId}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm ${
                  priorityColors[ticket.priority]
                }`}
              >
                {priorityEmojis[ticket.priority]} {ticket.priority}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
              {ticket.title}
            </h3>
          </div>
        </div>

        {/* Category */}
        <div className="mb-3">
          <span className="inline-flex items-center text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200 shadow-sm">
            {getCategoryIcon(ticket.category)} {ticket.category.replace(/_/g, " ")}
          </span>
        </div>

        {/* Description preview */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {ticket.description}
        </p>

        {/* Image Thumbnail Preview */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="mb-3">
            <div className="relative h-32 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={ticket.attachments[0]}
                alt="Attachment preview"
                className="w-full h-full object-cover"
              />
              {ticket.attachments.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
                  +{ticket.attachments.length - 1}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {/* Responses count */}
            {ticket.responses && ticket.responses.length > 0 && (
              <div className="flex items-center gap-1.5 bg-blue-100 px-2 py-1 rounded-lg border border-blue-200">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-700">{ticket.responses.length}</span>
              </div>
            )}

            {/* Attachments count */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200">
                <Paperclip className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-700">{ticket.attachments.length}</span>
              </div>
            )}

            {/* Time */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</span>
            </div>
          </div>

          {/* Assigned Manager (for Staff tickets) or Account Manager (for Client tickets) */}
          {ticket.management_users && (
            <div className="relative group/assigned">
              <Avatar className="h-8 w-8 border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/50 ring-2 ring-indigo-500/20">
                <AvatarImage src={ticket.management_users.avatar} alt={ticket.management_users.name} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                  {ticket.management_users.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
               <div className="absolute -top-12 -right-2 px-3 py-1.5 bg-black/95 text-white text-xs rounded shadow-lg opacity-0 group-hover/assigned:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] min-w-max">
                 Assigned to: {ticket.management_users.name}
               </div>
            </div>
          )}
          {!ticket.management_users && ticket.accountManager && (
            <div className="relative group/assigned">
              <Avatar className="h-8 w-8 border-2 border-purple-500/50 shadow-lg shadow-purple-500/50 ring-2 ring-purple-500/20">
                <AvatarImage src={ticket.accountManager.avatar} alt={ticket.accountManager.name} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs font-bold">
                  {ticket.accountManager.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
               <div className="absolute -top-12 -right-2 px-3 py-1.5 bg-black/95 text-white text-xs rounded shadow-lg opacity-0 group-hover/assigned:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] min-w-max">
                 Assigned to: {ticket.accountManager.name}
               </div>
            </div>
          )}
        </div>

      </div>

      {/* Hover effect overlay - Subtle shimmer for white background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  )
}