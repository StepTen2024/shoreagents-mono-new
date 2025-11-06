"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { Ticket, TicketStatus } from "@/types/ticket"
import ClientTicketCard from "./client-ticket-card"

interface TicketKanbanLightProps {
  tickets: Ticket[]
  onTicketClick?: (ticket: Ticket) => void
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void
  onRefresh?: () => void
}

const columns: { status: TicketStatus; label: string; color: string }[] = [
  { status: "OPEN", label: "Open", color: "border-blue-500 bg-blue-50" },
  { status: "IN_PROGRESS", label: "In Progress", color: "border-yellow-500 bg-yellow-50" },
  { status: "RESOLVED", label: "Resolved", color: "border-green-500 bg-green-50" },
  { status: "CLOSED", label: "Closed", color: "border-gray-500 bg-gray-50" },
]

export default function TicketKanbanLight({
  tickets,
  onTicketClick,
  onStatusChange,
}: TicketKanbanLightProps) {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find((t) => t.id === event.active.id)
    setActiveTicket(ticket || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const ticketId = active.id as string
      const newStatus = over.id as TicketStatus

      onStatusChange(ticketId, newStatus)
    }

    setActiveTicket(null)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTickets = tickets.filter((ticket) => ticket.status === column.status)

          return (
            <div key={column.status} className="flex flex-col">
              {/* Column Header */}
              <div className={`border-t-4 ${column.color} rounded-t-lg bg-white p-3 shadow-sm`}>
                <h3 className="text-sm font-semibold text-gray-900">{column.label}</h3>
                <span className="text-xs text-gray-500">{columnTickets.length}</span>
              </div>

              {/* Column Content */}
              <div className="flex-1 space-y-3 rounded-b-lg bg-gray-100 p-3 min-h-[500px]">
                {columnTickets.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 mt-8">No tickets</p>
                ) : (
                  columnTickets.map((ticket) => (
                    <ClientTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onClick={() => onTicketClick?.(ticket)}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeTicket ? (
          <div className="opacity-50">
            <ClientTicketCard ticket={activeTicket} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}