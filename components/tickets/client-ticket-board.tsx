"use client"

import { Ticket, TicketStatus } from "@/types/ticket"
import ClientTicketCard from "./client-ticket-card"

interface ClientTicketBoardProps {
  tickets: Ticket[]
  onTicketClick: (ticket: Ticket) => void
}

// CLIENT PORTAL - Light theme - VIEW ONLY (NO DRAG AND DROP)
const columns: { id: TicketStatus; label: string; emoji: string; color: string }[] = [
  { id: "OPEN", label: "Open", emoji: "🆕", color: "border-blue-500 bg-blue-50" },
  { id: "IN_PROGRESS", label: "In Progress", emoji: "⚡", color: "border-yellow-500 bg-yellow-50" },
  { id: "RESOLVED", label: "Resolved", emoji: "✅", color: "border-green-500 bg-green-50" },
  { id: "CLOSED", label: "Closed", emoji: "📦", color: "border-gray-500 bg-gray-50" },
]

export default function ClientTicketBoard({
  tickets,
  onTicketClick,
}: ClientTicketBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((column) => {
        const columnTickets = tickets.filter((ticket) => ticket.status === column.id)

        return (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className={`border-t-4 ${column.color} rounded-t-lg bg-white p-3 shadow-sm mb-3`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{column.emoji}</span>
                <h3 className="text-sm font-semibold text-gray-900">{column.label}</h3>
                <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">
                  {columnTickets.length}
                </span>
              </div>
            </div>

            {/* Tickets Column - NO DRAG, just click to view */}
            <div className="flex-1 space-y-3 rounded-lg bg-gray-50 p-3 min-h-[600px]">
              {columnTickets.length === 0 ? (
                <div className="flex h-48 items-center justify-center">
                  <p className="text-center text-sm text-gray-400">No tickets</p>
                </div>
              ) : (
                columnTickets.map((ticket) => (
                  <ClientTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => onTicketClick(ticket)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}


