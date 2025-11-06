"use client"

import { LayoutGrid, List } from "lucide-react"

interface ViewToggleProps {
  view: "kanban" | "list"
  onViewChange: (view: "kanban" | "list") => void
}

export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-slate-800/50 p-1 ring-1 ring-white/10">
      <button
        onClick={() => onViewChange("kanban")}
        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          view === "kanban"
            ? "bg-indigo-600 text-white shadow-lg"
            : "text-slate-400 hover:text-white"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        Kanban
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          view === "list"
            ? "bg-indigo-600 text-white shadow-lg"
            : "text-slate-400 hover:text-white"
        }`}
      >
        <List className="h-4 w-4" />
        List
      </button>
    </div>
  )
}