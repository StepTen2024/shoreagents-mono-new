"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import ClientTaskCard from "./client-task-card"
import { getStatusConfig, getAllStatuses } from "@/lib/task-utils"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  source: string
  deadline: string | null
  completedAt: string | null
  createdAt: string
  attachments: string[]
  company?: { id: string; companyName: string } | null
  clientUser?: { id: string; name: string; email: string; avatar: string | null } | null
  assignedStaff?: Array<{
    staff_users: {
      id: string
      name: string
      email: string
      avatar: string | null
      role: string
    }
  }>
  staffUser?: { id: string; name: string; email: string; avatar: string | null; role: string } | null
}

interface ClientTaskKanbanProps {
  tasks: Task[]
  onStatusChange: (taskId: string, newStatus: string) => void
  onTaskUpdate: () => void
}

function DroppableColumn({ id, children, isOver }: { id: string; children: React.ReactNode; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className="flex-1">
      {children}
    </div>
  )
}

export default function ClientTaskKanban({
  tasks,
  onStatusChange,
  onTaskUpdate,
}: ClientTaskKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const statuses = getAllStatuses()
  const activeTask = tasks.find((task) => task.id === activeId)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over ? (over.id as string) : null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) {
      setActiveId(null)
      setOverId(null)
      return
    }

    const taskId = active.id as string
    const newStatus = over.id as string
    const task = tasks.find((t) => t.id === taskId)

    if (task && task.status !== newStatus) {
      onStatusChange(taskId, newStatus)
    }

    setActiveId(null)
    setOverId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setOverId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statuses.map((status) => {
          const statusTasks = tasks.filter((task) => task.status === status)
          const config = getStatusConfig(status as any)
          const isOver = overId === status

          return (
            <DroppableColumn key={status} id={status} isOver={isOver}>
              <div className="flex flex-col min-h-[500px]">
                {/* Column Header */}
                <div className={`mb-3 rounded-xl p-4 ${config.lightColor} border-2 transition-all ${
                  isOver ? "ring-4 ring-blue-400 scale-[1.02] shadow-lg" : ""
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <span className="text-lg">{config.emoji}</span>
                      <span>{config.label.replace(config.emoji, "").trim()}</span>
                    </h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.lightColor}`}>
                      {statusTasks.length}
                    </span>
                  </div>
                </div>

                {/* Sortable Column */}
                <SortableContext
                  items={statusTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    className={`flex-1 rounded-xl p-3 transition-all ${
                      isOver
                        ? "bg-blue-100 border-2 border-blue-400 border-dashed"
                        : "bg-slate-50 border-2 border-slate-200 border-dashed"
                    }`}
                  >
                    {statusTasks.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <p className="text-3xl mb-2">📭</p>
                        <p className="text-sm">No tasks</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {statusTasks.map((task) => (
                          <ClientTaskCard key={task.id} task={task} onUpdate={onTaskUpdate} />
                        ))}
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            </DroppableColumn>
          )
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeTask ? (
          <div className="rotate-2 scale-105 cursor-grabbing shadow-2xl">
            <ClientTaskCard task={activeTask} onUpdate={onTaskUpdate} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

