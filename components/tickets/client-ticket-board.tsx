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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((column) => {
        const columnTickets = tickets.filter((ticket) => ticket.status === column.id)

        return (
          <div key={column.id} className="flex flex-col">
            {/* COHESIVE OUTER CARD - Header + Content Together */}
            <div className="flex flex-col h-[calc(100vh-16rem)] rounded-2xl bg-white border-2 border-gray-200 shadow-lg overflow-hidden">
              {/* Column Header (Integrated) */}
              <div className={`border-t-4 ${column.color} p-4`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{column.emoji}</span>
                  <h3 className="text-lg font-bold text-gray-900">{column.label}</h3>
                  <span className="ml-auto rounded-full bg-gray-100 px-3 py-1.5 text-sm font-bold text-gray-700 border border-gray-200">
                  {columnTickets.length}
                </span>
              </div>
            </div>

            {/* Tickets Column - NO DRAG, just click to view */}
              <div className="flex-1 space-y-3 p-4 overflow-y-auto bg-gray-50">
              {columnTickets.length === 0 ? (
                <div className="flex h-48 items-center justify-center">
                    <div className="text-center">
                      <div className="mb-2">
                        <svg className="h-12 w-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-400 font-medium">No tickets</p>
                    </div>
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
          </div>
        )
      })}
    </div>
  )
}


