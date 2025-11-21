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
import AdminTicketCard from "./admin-ticket-card"
import { Ticket, TicketStatus } from "@/types/ticket"

interface TicketKanbanProps {
  tickets: Ticket[]
  onTicketClick: (ticket: Ticket) => void
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => Promise<void>
}

const columns: { id: TicketStatus; label: string; color: string; emoji: string; gradient: string; ring: string; bg: string }[] = [
  { id: "OPEN", label: "Open", color: "bg-blue-500", emoji: "🆕", gradient: "from-blue-500 to-cyan-500", ring: "ring-blue-500/30", bg: "bg-blue-500/10" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-amber-500", emoji: "⚡", gradient: "from-amber-500 to-orange-500", ring: "ring-amber-500/30", bg: "bg-amber-500/10" },
  { id: "RESOLVED", label: "Resolved", color: "bg-emerald-500", emoji: "✅", gradient: "from-emerald-500 to-green-500", ring: "ring-emerald-500/30", bg: "bg-emerald-500/10" },
  { id: "CLOSED", label: "Closed", color: "bg-slate-500", emoji: "📦", gradient: "from-slate-500 to-gray-500", ring: "ring-slate-500/30", bg: "bg-slate-500/10" },
]

// Outer Card (Column) Component
function KanbanColumn({ 
  id, 
  children,
  isActive,
  column,
  count
}: { 
  id: string; 
  children: React.ReactNode;
  isActive: boolean;
  column: typeof columns[0];
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-[calc(100vh-14rem)] min-h-[600px] rounded-2xl border transition-all duration-300 group ${
        isActive || isOver
          ? `border-transparent ring-2 ring-${column.color.split('-')[1]}-400 bg-${column.color.split('-')[1]}-500/10 shadow-xl` 
          : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
      }`}
    >
      {/* Header Area - Integrated into the card */}
      <div className={`p-4 border-b border-white/5 rounded-t-2xl bg-gradient-to-b from-white/5 to-transparent flex items-center justify-between backdrop-blur-sm`}>
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${column.gradient} text-white shadow-lg shadow-${column.color.split('-')[1]}-500/20`}>
            <span className="text-lg">{column.emoji}</span>
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">{column.label}</h3>
            <span className="text-xs text-slate-500 font-medium">
              {count} {count === 1 ? 'Ticket' : 'Tickets'}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Drop Zone */}
      <div className="flex-1 overflow-y-auto overflow-x-visible admin-tickets-scrollbar p-3 space-y-3" style={{ overflowX: 'visible' }}>
        {children}
        
        {count === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500/50 min-h-[150px] border-2 border-dashed border-slate-800/50 rounded-xl m-2">
            <div className="p-4 rounded-full bg-slate-800/50 mb-3">
              <span className="text-2xl opacity-50 grayscale">{column.emoji}</span>
            </div>
            <p className="text-xs font-medium">No tickets</p>
          </div>
        )}
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

  // ADMIN DRAG AND DROP - Super smooth and easy
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 3,
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full h-full overflow-visible" style={{ overflow: 'visible' }}>
        {columns.map((column) => {
          const columnTickets = getTicketsByStatus(column.id)

          return (
              <SortableContext
              key={column.id}
                id={column.id}
                items={columnTickets.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
              <KanbanColumn 
                id={column.id} 
                isActive={overId === column.id}
                column={column}
                count={columnTickets.length}
              >
                  {columnTickets.map((ticket) => (
              <AdminTicketCard
                key={ticket.id}
                ticket={ticket}
                isDragging={activeId === ticket.id}
                onClick={() => onTicketClick(ticket)}
              />
                  ))}
              </KanbanColumn>
              </SortableContext>
          )
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeTicket ? (
          <div className="rotate-2 scale-105 cursor-grabbing shadow-2xl shadow-blue-500/50 transition-transform">
            <AdminTicketCard ticket={activeTicket} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
