"use client"

import { Ticket } from "@/types/ticket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Paperclip, Clock, User, AlertTriangle, XCircle } from "lucide-react"
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

  // Priority stripe colors (left edge)
  const priorityStripeColors = {
    URGENT: "bg-red-500",
    HIGH: "bg-orange-500",
    MEDIUM: "bg-blue-500",
    LOW: "bg-gray-400",
  }

  // Status colors - PROMINENT TOP BORDER!
  const statusColors = {
    OPEN: "bg-blue-500",
    IN_PROGRESS: "bg-orange-500", 
    RESOLVED: "bg-green-500",
    CLOSED: "bg-gray-500",
    CANCELLED: "bg-red-500",
  }

  // Overdue Logic
  const isOverdue = ticket.dueDate && 
    new Date(ticket.dueDate) < new Date() && 
    ticket.status !== "RESOLVED" && 
    ticket.status !== "CLOSED" && 
    ticket.status !== "CANCELLED"

  const overdueBy = ticket.dueDate 
    ? Math.floor((new Date().getTime() - new Date(ticket.dueDate).getTime()) / (1000 * 60))
    : 0

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
      className={`group relative rounded-xl bg-white border border-gray-200 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer overflow-hidden ${
        ticket.status === "CANCELLED" ? "opacity-75 grayscale" : ""
      }`}
    >
      {/* Overdue Badge (Top Right) */}
      {isOverdue && (
        <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-lg animate-pulse z-10">
          <AlertTriangle className="h-3 w-3" />
          OVERDUE {overdueBy > 60 ? `${Math.floor(overdueBy / 60)}h` : `${overdueBy}m`}
        </span>
      )}

      {/* Cancelled Overlay */}
      {ticket.status === "CANCELLED" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm z-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-red-400 mb-2">
              <XCircle className="h-6 w-6" />
              CANCELLED
            </div>
            {ticket.cancelledReason && (
              <div className="text-sm text-white px-4 max-w-xs">
                Reason: {ticket.cancelledReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Priority stripe on the left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${priorityStripeColors[ticket.priority]}`} />

      {/* Status indicator bar - PROMINENT TOP BORDER! */}
      <div className={`h-1 w-full ${statusColors[ticket.status]}`} />

      <div className="p-5 pl-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                {ticket.ticketId}
              </span>
              {/* Only show priority pill if NOT overdue/cancelled (stripe shows priority) */}
              {!isOverdue && ticket.status !== "CANCELLED" && (
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                    priorityColors[ticket.priority]
                  }`}
                >
                  {priorityEmojis[ticket.priority]} {ticket.priority}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-all">
              {ticket.title}
            </h3>
          </div>
        </div>

        {/* Category */}
        <div className="mb-3">
          <span className="inline-flex items-center text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
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

        {/* Footer - WITH REACTIONS! */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-3 text-sm">
            {/* Comment Count - ALWAYS SHOW */}
            <div className="flex items-center gap-1.5 bg-blue-100 px-2 py-1 rounded-full border border-blue-200">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-bold text-blue-700">{ticket.responses?.length || 0}</span>
            </div>
            
            {/* Reactions Preview */}
            {ticket.reactions && ticket.reactions.length > 0 && (
              <div className="flex items-center gap-0.5">
                {ticket.reactions.slice(0, 3).map((reaction: any, i: number) => (
                  <span key={i} className="text-sm">
                    {reaction.emoji}
                  </span>
                ))}
                {ticket.reactions.length > 3 && (
                  <span className="text-xs text-gray-500 ml-1">
                    +{ticket.reactions.length - 3}
                  </span>
                )}
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
              <Avatar className="h-8 w-8 border-2 border-blue-200 shadow-sm">
                <AvatarImage src={ticket.management_users.avatar} alt={ticket.management_users.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs font-bold">
                  {ticket.management_users.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
               <div className="absolute -top-12 -right-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover/assigned:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] min-w-max">
                 Assigned to: {ticket.management_users.name}
               </div>
            </div>
          )}
          {!ticket.management_users && ticket.accountManager && (
            <div className="relative group/assigned">
              <Avatar className="h-8 w-8 border-2 border-blue-200 shadow-sm">
                <AvatarImage src={ticket.accountManager.avatar} alt={ticket.accountManager.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs font-bold">
                  {ticket.accountManager.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
               <div className="absolute -top-12 -right-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover/assigned:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] min-w-max">
                 Assigned to: {ticket.accountManager.name}
               </div>
            </div>
          )}
        </div>

      </div>

      {/* Hover effect overlay - Subtle shimmer for white background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
    </div>
  )
}