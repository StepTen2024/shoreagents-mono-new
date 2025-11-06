"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverEvent,
  closestCenter,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import TicketCard from "./ticket-card"
import { Ticket, TicketStatus } from "@/types/ticket"

interface TicketKanbanProps {
  tickets: Ticket[]
  onTicketClick: (ticket: Ticket) => void
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => Promise<void>
}

const columns: { id: TicketStatus; label: string; color: string; emoji: string; gradient: string; ring: string }[] = [
  { id: "OPEN", label: "Open", color: "bg-blue-500", emoji: "🆕", gradient: "from-blue-500/20 to-cyan-500/20", ring: "ring-blue-500/50" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-amber-500", emoji: "⚡", gradient: "from-amber-500/20 to-orange-500/20", ring: "ring-amber-500/50" },
  { id: "RESOLVED", label: "Resolved", color: "bg-emerald-500", emoji: "✅", gradient: "from-emerald-500/20 to-green-500/20", ring: "ring-emerald-500/50" },
  { id: "CLOSED", label: "Closed", color: "bg-slate-500", emoji: "📦", gradient: "from-slate-500/20 to-gray-500/20", ring: "ring-slate-500/50" },
]

// Droppable Column Component
function DroppableColumn({ 
  id, 
  children,
  isActive
}: { 
  id: string; 
  children: React.ReactNode;
  isActive: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-[800px] rounded-xl bg-slate-800/30 ring-1 ring-white/10 transition-all duration-200 min-w-0 w-full max-w-full ${
        isActive || isOver
          ? "ring-4 ring-indigo-400 bg-indigo-500/20 scale-[1.03] shadow-2xl shadow-indigo-500/40 animate-pulse" 
          : ""
      }`}
      data-status={id}
    >
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overflow-x-visible admin-tickets-scrollbar p-4 space-y-3 w-full max-w-full" style={{ overflowX: 'visible' }}>
        {children}
      </div>
    </div>
  )
}

export default function TicketKanban({
  tickets,
  onTicketClick,
  onStatusChange,
}: TicketKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [updatingTickets, setUpdatingTickets] = useState<Set<string>>(() => new Set())

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Reduced for quicker response
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // Slight delay to distinguish from scrolling
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over?.id as string | null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setOverId(null)
      return
    }

    const ticketId = active.id as string
    const newStatus = over.id as TicketStatus

    // Only update if status actually changed and not already updating
    const ticket = tickets.find((t) => t.id === ticketId)
    if (ticket && ticket.status !== newStatus && !updatingTickets.has(ticketId)) {
      // Mark as updating
      setUpdatingTickets(prev => new Set(prev).add(ticketId))
      
      try {
        await onStatusChange(ticketId, newStatus)
      } finally {
        // Remove from updating set after completion
        setUpdatingTickets(prev => {
          const next = new Set(prev)
          next.delete(ticketId)
          return next
        })
      }
    }

    setActiveId(null)
    setOverId(null)
  }

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter((ticket) => ticket.status === status)
  }

  const activeTicket = tickets.find((t) => t.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full overflow-visible" style={{ overflow: 'visible' }}>
        {columns.map((column) => {
          const columnTickets = getTicketsByStatus(column.id)

          return (
            <div key={column.id} className="flex flex-col min-w-0 w-full">
              {/* Column Header with Gradient and Emoji */}
              <div className={`mb-4 rounded-2xl bg-gradient-to-r ${column.gradient} backdrop-blur-xl p-4 ring-1 ${column.ring} shadow-lg`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{column.emoji}</span>
                  <h3 className="text-lg font-bold text-white">{column.label}</h3>
                  <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm">
                    {columnTickets.length}
                  </span>
                </div>
              </div>

              {/* Droppable Column Area */}
              <SortableContext
                id={column.id}
                items={columnTickets.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableColumn id={column.id} isActive={overId === column.id}>
                  {columnTickets.map((ticket) => (
                    <TicketCard 
                      key={ticket.id}
                      ticket={ticket} 
                      isDragging={activeId === ticket.id}
                      onClick={() => onTicketClick(ticket)}
                    />
                  ))}

                  {columnTickets.length === 0 && (
                    <div className="flex h-48 items-center justify-center text-sm text-slate-500">
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
                </DroppableColumn>
              </SortableContext>
            </div>
          )
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeTicket ? (
          <div className="rotate-2 scale-105 cursor-grabbing shadow-2xl shadow-indigo-500/50 transition-transform">
            <TicketCard ticket={activeTicket} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}