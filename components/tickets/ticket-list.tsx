"use client"

import { useState } from "react"
import { Ticket, TicketStatus } from "@/types/ticket"
import { format } from "date-fns"
import { 
  Clock, 
  User, 
  Tag, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  MessageSquare,
  Paperclip
} from "lucide-react"

interface TicketListProps {
  tickets: Ticket[]
  onTicketClick: (ticket: Ticket) => void
  onStatusChange: (ticketId: string, status: TicketStatus) => void
}

export default function TicketList({ tickets, onTicketClick, onStatusChange }: TicketListProps) {
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set())

  const toggleExpanded = (ticketId: string) => {
    setExpandedTickets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId)
      } else {
        newSet.add(ticketId)
      }
      return newSet
    })
  }

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="h-4 w-4 text-blue-400" />
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-yellow-400" />
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "CLOSED":
        return <XCircle className="h-4 w-4 text-slate-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-blue-400" />
    }
  }

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "IN_PROGRESS":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "RESOLVED":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "CLOSED":
        return "bg-slate-500/20 text-slate-300 border-slate-500/30"
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "HIGH":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30"
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "LOW":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      default:
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    }
  }

  const getAssigneeName = (ticket: Ticket) => {
    if (ticket.staff_users) return ticket.staff_users.name
    if (ticket.management_users) return ticket.management_users.name
    if (ticket.client_users) return ticket.client_users.name
    return "Unassigned"
  }

  const getCreatorName = (ticket: Ticket) => {
    if (ticket.createdByType === "STAFF" && ticket.staff_users) return ticket.staff_users.name
    if (ticket.createdByType === "MANAGEMENT" && ticket.management_users) return ticket.management_users.name
    if (ticket.createdByType === "CLIENT" && ticket.client_users) return ticket.client_users.name
    return "Unknown"
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-slate-800/50 p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No tickets found</h3>
        <p className="text-slate-400">Try adjusting your filters or create a new ticket.</p>
      </div>
    )
  }

  // Group tickets by status
  const groupedTickets = {
    OPEN: tickets.filter(ticket => ticket.status === "OPEN"),
    IN_PROGRESS: tickets.filter(ticket => ticket.status === "IN_PROGRESS"),
    RESOLVED: tickets.filter(ticket => ticket.status === "RESOLVED"),
    CLOSED: tickets.filter(ticket => ticket.status === "CLOSED")
  }

  const statusSections = [
    { status: "OPEN", title: "Open Tickets", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
    { status: "IN_PROGRESS", title: "In Progress", color: "text-yellow-400", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/30" },
    { status: "RESOLVED", title: "Resolved", color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/30" },
    { status: "CLOSED", title: "Closed", color: "text-slate-400", bgColor: "bg-slate-500/10", borderColor: "border-slate-500/30" }
  ]

  return (
    <div className="space-y-6">
      {statusSections.map((section) => {
        const sectionTickets = groupedTickets[section.status as keyof typeof groupedTickets]
        
        if (sectionTickets.length === 0) return null

        return (
          <div key={section.status} className="space-y-3">
            {/* Section Header */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${section.bgColor} ${section.borderColor}`}>
              <div className={`flex items-center gap-2 ${section.color}`}>
                {getStatusIcon(section.status as TicketStatus)}
                <h3 className="text-lg font-semibold">{section.title}</h3>
                <span className="text-sm opacity-75">({sectionTickets.length})</span>
              </div>
            </div>

            {/* Tickets in this section */}
            <div className="space-y-3 pl-4">
              {sectionTickets.map((ticket) => {
                const isExpanded = expandedTickets.has(ticket.id)
                const hasAttachments = ticket.attachments && ticket.attachments.length > 0
                const hasResponses = ticket.responses && ticket.responses.length > 0

                return (
                  <div
                    key={ticket.id}
                    className="group rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-slate-900/20"
                  >
                    {/* Main Ticket Row */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-mono text-slate-400">{ticket.ticketId}</span>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                              {getStatusIcon(ticket.status)}
                              {ticket.status.replace("_", " ")}
                            </div>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </div>
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30">
                              <Tag className="h-3 w-3" />
                              {ticket.category.replace("_", " ")}
                            </div>
                          </div>

                          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors cursor-pointer"
                              onClick={() => onTicketClick(ticket)}>
                            {ticket.title}
                          </h3>

                          <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>Assigned to: {getAssigneeName(ticket)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
                            </div>
                            {hasAttachments && (
                              <div className="flex items-center gap-1">
                                <Paperclip className="h-4 w-4" />
                                <span>{ticket.attachments.length} file(s)</span>
                              </div>
                            )}
                            {hasResponses && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{ticket.responses.length} response(s)</span>
                              </div>
                            )}
                          </div>

                          {/* Description Preview */}
                          <p className="text-slate-300 text-sm leading-relaxed line-clamp-2">
                            {ticket.description}
                          </p>

                          {/* Creator Info */}
                          <div className="mt-3 text-xs text-slate-500">
                            Created by {getCreatorName(ticket)} ({ticket.createdByType})
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => toggleExpanded(ticket.id)}
                            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-slate-700/50 bg-slate-800/30 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-300 mb-2">Full Description</h4>
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                              {ticket.description}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-slate-300 mb-2">Ticket Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Status:</span>
                                <span className="text-slate-300">{ticket.status.replace("_", " ")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Priority:</span>
                                <span className="text-slate-300">{ticket.priority}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Category:</span>
                                <span className="text-slate-300">{ticket.category.replace("_", " ")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Assigned to:</span>
                                <span className="text-slate-300">{getAssigneeName(ticket)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Created:</span>
                                <span className="text-slate-300">{format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                              </div>
                              {ticket.resolvedDate && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Resolved:</span>
                                  <span className="text-slate-300">{format(new Date(ticket.resolvedDate), "MMM d, yyyy 'at' h:mm a")}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Attachments */}
                        {hasAttachments && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-slate-300 mb-2">Attachments</h4>
                            <div className="flex flex-wrap gap-2">
                              {ticket.attachments.map((attachment, index) => (
                                <a
                                  key={index}
                                  href={attachment}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors text-xs"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  File {index + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            onClick={() => onTicketClick(ticket)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            View Details
                          </button>
                          
                          {ticket.status !== "CLOSED" && (
                            <select
                              value={ticket.status}
                              onChange={(e) => onStatusChange(ticket.id, e.target.value as TicketStatus)}
                              className="px-3 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                              <option value="OPEN">Open</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="RESOLVED">Resolved</option>
                              <option value="CLOSED">Closed</option>
                            </select>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}