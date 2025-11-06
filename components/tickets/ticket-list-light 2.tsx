"use client"

import { useState } from "react"
import { Ticket, TicketStatus, TicketPriority } from "@/types/ticket"
import { format } from "date-fns"
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Paperclip,
  User
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCategoryLabel, getPriorityColor, getStatusColor } from "@/lib/ticket-utils"

interface TicketListLightProps {
  tickets: Ticket[]
  onTicketClick?: (ticket: Ticket) => void
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void
  onRefresh?: () => void
}

type SortField = 'createdAt' | 'title' | 'status' | 'priority' | 'category' | 'ticketId'
type SortDirection = 'asc' | 'desc'

export default function TicketListLight({
  tickets,
  onTicketClick,
  onStatusChange,
}: TicketListLightProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set())

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const toggleExpanded = (ticketId: string) => {
    const newExpanded = new Set(expandedTickets)
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId)
    } else {
      newExpanded.add(ticketId)
    }
    setExpandedTickets(newExpanded)
  }

  const sortedTickets = [...tickets].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    // Handle date sorting
    if (sortField === 'createdAt') {
      aValue = new Date(a.createdAt).getTime()
      bValue = new Date(b.createdAt).getTime()
    }

    // Handle string sorting (including ticketId)
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'RESOLVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'CLOSED':
        return <XCircle className="w-4 h-4 text-gray-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriorityIcon = (priority: TicketPriority) => {
    switch (priority) {
      case 'URGENT':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'HIGH':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'MEDIUM':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'LOW':
        return <AlertCircle className="w-4 h-4 text-green-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-12 text-sm font-medium text-gray-500">
          <div className="col-span-1"></div>
          <button
            onClick={() => handleSort('ticketId')}
            className="col-span-2 text-left hover:text-gray-700 flex items-center gap-1 pl-2 cursor-pointer"
          >
            Ticket ID
            {sortField === 'ticketId' && (
              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleSort('title')}
            className="col-span-3 text-left hover:text-gray-700 flex items-center gap-1 pl-2 cursor-pointer"
          >
            Title
            {sortField === 'title' && (
              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleSort('status')}
            className="col-span-2 text-left hover:text-gray-700 flex items-center gap-1 pl-2 cursor-pointer"
          >
            Status
            {sortField === 'status' && (
              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleSort('priority')}
            className="col-span-2 text-left hover:text-gray-700 flex items-center gap-1 pl-2 cursor-pointer"
          >
            Priority
            {sortField === 'priority' && (
              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleSort('category')}
            className="col-span-1 text-left hover:text-gray-700 flex items-center gap-1 pl-2 cursor-pointer"
          >
            Category
            {sortField === 'category' && (
              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleSort('createdAt')}
            className="col-span-1 text-left hover:text-gray-700 flex items-center gap-1 pl-2 cursor-pointer"
          >
            Created
            {sortField === 'createdAt' && (
              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Ticket Rows */}
      <div className="divide-y divide-gray-200">
        {sortedTickets.map((ticket) => {
          const isExpanded = expandedTickets.has(ticket.id)
          const hasAttachments = ticket.attachments && ticket.attachments.length > 0
          const hasResponses = ticket.responses && ticket.responses.length > 0

          return (
            <div
              key={ticket.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onTicketClick?.(ticket)}
            >
              <div className="grid grid-cols-12 items-center">
                {/* Expand/Collapse Button */}
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpanded(ticket.id)
                    }}
                    className="p-1 h-8 w-8 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Ticket ID */}
                <div className="col-span-2 pl-2">
                  <div className="font-mono text-sm font-medium text-gray-900">
                    #{ticket.ticketId}
                  </div>
                </div>

                {/* Title */}
                <div className="col-span-3 pl-2">
                  <div className="font-medium text-gray-900 truncate">
                    {ticket.title}
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 pl-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ticket.status)}
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(ticket.status)} border-current`}
                    >
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Priority */}
                <div className="col-span-2 pl-2">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(ticket.priority)}
                    <Badge 
                      variant="outline" 
                      className={`${getPriorityColor(ticket.priority)} border-current`}
                    >
                      {ticket.priority}
                    </Badge>
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-1 pl-2">
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryLabel(ticket.category)}
                  </Badge>
                </div>

                {/* Created Date */}
                <div className="col-span-1 pl-2">
                  <div className="text-sm text-gray-500">
                    {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-xs text-gray-400">
                    {format(new Date(ticket.createdAt), 'h:mm a')}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {ticket.description}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Details</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {hasResponses ? `${ticket.responses.length} responses` : 'No responses yet'}
                          </span>
                        </div>
                        {hasAttachments && (
                          <div className="flex items-center gap-2 text-sm">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {ticket.attachments.length} attachment{ticket.attachments.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Created by {ticket.client_users?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attachments Preview */}
                  {hasAttachments && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments</h4>
                      <div className="flex flex-wrap gap-2">
                        {ticket.attachments.slice(0, 3).map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md text-sm"
                          >
                            <Paperclip className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600 truncate max-w-32">
                              {attachment.split('/').pop()}
                            </span>
                          </div>
                        ))}
                        {ticket.attachments.length > 3 && (
                          <div className="px-3 py-1 bg-gray-100 rounded-md text-sm text-gray-500">
                            +{ticket.attachments.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {tickets.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-500">Create your first support ticket to get started.</p>
          </div>
        </div>
      )}
    </div>
  )
}
