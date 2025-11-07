"use client"

import { Ticket, TicketStatus } from "@/types/ticket"
import StaffTicketCard from "./staff-ticket-card"

interface StaffTicketBoardProps {
  tickets: Ticket[]
  onTicketClick: (ticket: Ticket) => void
}

// STAFF PORTAL - Indigo/Purple theme - VIEW ONLY (NO DRAG AND DROP)
const columns: { id: TicketStatus; label: string; emoji: string; gradient: string; ring: string }[] = [
  { id: "OPEN", label: "Open", emoji: "🆕", gradient: "from-indigo-500/20 to-purple-500/20", ring: "ring-indigo-500/50" },
  { id: "IN_PROGRESS", label: "In Progress", emoji: "⚡", gradient: "from-purple-500/20 to-pink-500/20", ring: "ring-purple-500/50" },
  { id: "RESOLVED", label: "Resolved", emoji: "✅", gradient: "from-cyan-500/20 to-teal-500/20", ring: "ring-cyan-500/50" },
  { id: "CLOSED", label: "Closed", emoji: "📦", gradient: "from-slate-500/20 to-gray-500/20", ring: "ring-slate-500/50" },
]

export default function StaffTicketBoard({
  tickets,
  onTicketClick,
}: StaffTicketBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4" data-board="staff-only">
      {columns.map((column, idx) => {
        const columnTickets = tickets.filter((ticket) => ticket.status === column.id)

        return (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className={`mb-4 rounded-2xl bg-gradient-to-r ${column.gradient} backdrop-blur-xl p-4 ring-1 ${column.ring} shadow-lg`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{column.emoji}</span>
                <h3 className="text-lg font-bold text-white">{column.label}</h3>
                <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm">
                  {columnTickets.length}
                </span>
              </div>
            </div>

            {/* Tickets Column - NO DRAG, just click to view */}
            <div className="flex flex-col h-[800px] rounded-2xl bg-slate-900/30 backdrop-blur-xl ring-1 ring-white/5">
              <div className="flex-1 overflow-y-auto staff-tickets-scrollbar p-4 space-y-3">
                {columnTickets.map((ticket) => (
                  <StaffTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => onTicketClick(ticket)}
                  />
                ))}

                {columnTickets.length === 0 && (
                  <div className="flex h-48 items-center justify-center rounded-xl bg-slate-800/30 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="mb-2">
                        <svg className="h-12 w-12 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-slate-400">No tickets</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

