"use client"

import { useState, useEffect } from "react"
import { 
  Plus, Monitor, Users, MessageSquare, Package, HelpCircle,
  AlertCircle, CheckCircle, Clock, X, Search, MapPin, Cloud, Gift, Bus,
  Upload, Paperclip, Send, Trash2, ChevronDown, Filter
} from "lucide-react"
import { TicketListSkeleton, TicketStatsSkeleton, TicketFiltersSkeleton } from "@/components/tickets/ticket-skeleton"

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
type TicketCategory = "IT" | "HR" | "MANAGEMENT" | "EQUIPMENT" | "STATION" | "SURROUNDINGS" | "COMPENSATION" | "TRANSPORT" | "OTHER"
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

interface TicketResponse {
  id: string
  message: string
  role: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface Ticket {
  id: string
  ticketId: string
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  assignedTo: string | null
  attachments: string[]
  createdAt: string
  updatedAt: string
  resolvedDate: string | null
  responses: TicketResponse[]
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "IT" as TicketCategory,
    priority: "MEDIUM" as TicketPriority,
  })
  
  const [attachments, setAttachments] = useState<File[]>([])

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets")
      if (!response.ok) throw new Error("Failed to fetch tickets")
      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.description) {
      alert("Please fill in title and description")
      return
    }

    setUploading(true)
    try {
      // Upload attachments first if any
      const attachmentUrls: string[] = []
      
      if (attachments.length > 0) {
        const formData = new FormData()
        attachments.forEach((file) => {
          formData.append('files', file)
        })

        const uploadResponse = await fetch("/api/tickets/attachments", {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          attachmentUrls.push(...(uploadData.urls || []))
        }
      }

      // Create ticket with attachment URLs
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTicket,
          attachments: attachmentUrls,
        }),
      })

      if (!response.ok) throw new Error("Failed to create ticket")
      
      await fetchTickets()
      setIsCreateOpen(false)
      setNewTicket({ title: "", description: "", category: "IT", priority: "MEDIUM" })
      setAttachments([])
    } catch (err) {
      console.error("Error creating ticket:", err)
      alert("Failed to create ticket. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      // Limit to 3 files, 5MB each
      const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024).slice(0, 3)
      setAttachments(prev => [...prev, ...validFiles].slice(0, 3))
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const categoryConfig = {
    IT: { 
      label: "IT / Computer", 
      icon: Monitor, 
      color: "bg-blue-500/20 text-blue-400 ring-blue-500/30",
      description: "Software, login issues, computer problems"
    },
    HR: { 
      label: "HR / Payroll", 
      icon: Users, 
      color: "bg-purple-500/20 text-purple-400 ring-purple-500/30",
      description: "Leave, payroll, Sprout access"
    },
    MANAGEMENT: { 
      label: "Management", 
      icon: MessageSquare, 
      color: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
      description: "Account access, client requests"
    },
    EQUIPMENT: { 
      label: "Equipment", 
      icon: Package, 
      color: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
      description: "Mouse, keyboard, headset, RFID"
    },
    STATION: { 
      label: "Workstation", 
      icon: MapPin, 
      color: "bg-pink-500/20 text-pink-400 ring-pink-500/30",
      description: "Desk, chair, station changes"
    },
    SURROUNDINGS: { 
      label: "Environment", 
      icon: Cloud, 
      color: "bg-cyan-500/20 text-cyan-400 ring-cyan-500/30",
      description: "AC, temperature, noise"
    },
    COMPENSATION: { 
      label: "Perks & Requests", 
      icon: Gift, 
      color: "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30",
      description: "Special requests, perks"
    },
    TRANSPORT: { 
      label: "Transport", 
      icon: Bus, 
      color: "bg-indigo-500/20 text-indigo-400 ring-indigo-500/30",
      description: "Shuttle, commute"
    },
    OTHER: { 
      label: "Other", 
      icon: HelpCircle, 
      color: "bg-slate-500/20 text-slate-400 ring-slate-500/30",
      description: "Other requests"
    },
  }

  const statusConfig = {
    OPEN: { label: "Open", color: "bg-blue-500", icon: Clock },
    IN_PROGRESS: { label: "In Progress", color: "bg-amber-500", icon: AlertCircle },
    RESOLVED: { label: "Resolved", color: "bg-emerald-500", icon: CheckCircle },
    CLOSED: { label: "Closed", color: "bg-slate-500", icon: CheckCircle },
  }

  const priorityConfig = {
    LOW: { label: "Low", color: "bg-slate-500/20 text-slate-400" },
    MEDIUM: { label: "Medium", color: "bg-blue-500/20 text-blue-400" },
    HIGH: { label: "High", color: "bg-orange-500/20 text-orange-400" },
    URGENT: { label: "Urgent", color: "bg-red-500/20 text-red-400 animate-pulse" },
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus
    const matchesCategory = filterCategory === "all" || ticket.category === filterCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "OPEN").length,
    inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter(t => t.status === "RESOLVED").length,
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-6 p-6">
        {/* Stats skeleton */}
        <TicketStatsSkeleton />
        
        {/* Filters skeleton */}
        <TicketFiltersSkeleton />
        
        {/* Tickets list skeleton */}
        <TicketListSkeleton count={5} />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
        {/* Header */}
          <div className="flex items-center justify-between">
            <div>
          <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
          <p className="mt-1 text-slate-400">Submit and track your requests</p>
            </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white transition-all hover:from-indigo-700 hover:to-purple-700"
        >
          <Plus className="h-5 w-5" />
          New Ticket
        </button>
          </div>

          {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/10">
          <div className="text-2xl font-bold text-white">{ticketStats.total}</div>
          <div className="text-sm text-slate-400">Total Tickets</div>
            </div>
        <div className="rounded-xl bg-blue-500/10 p-4 ring-1 ring-blue-500/30">
          <div className="text-2xl font-bold text-blue-400">{ticketStats.open}</div>
          <div className="text-sm text-blue-300">Open</div>
            </div>
        <div className="rounded-xl bg-amber-500/10 p-4 ring-1 ring-amber-500/30">
          <div className="text-2xl font-bold text-amber-400">{ticketStats.inProgress}</div>
          <div className="text-sm text-amber-300">In Progress</div>
            </div>
        <div className="rounded-xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/30">
          <div className="text-2xl font-bold text-emerald-400">{ticketStats.resolved}</div>
          <div className="text-sm text-emerald-300">Resolved</div>
        </div>
        </div>

        {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tickets..."
            className="w-full rounded-lg bg-slate-800/50 py-3 pl-10 pr-4 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
              />
            </div>
        
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg bg-slate-800/50 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
          >
            <option value="all">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg bg-slate-800/50 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
        >
          <option value="all">All Categories</option>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>

      {/* Tickets List */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {filteredTickets.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-slate-800/30 ring-1 ring-white/10">
            <HelpCircle className="mb-4 h-12 w-12 text-slate-600" />
            <p className="text-lg font-semibold text-slate-400">No tickets found</p>
            <p className="text-sm text-slate-500">
              {searchTerm || filterStatus !== "all" || filterCategory !== "all"
                ? "Try adjusting your filters"
                : "Click 'New Ticket' to create your first ticket"}
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const StatusIcon = statusConfig[ticket.status].icon
            const CategoryIcon = categoryConfig[ticket.category].icon

            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="group cursor-pointer rounded-xl bg-slate-800/50 p-5 ring-1 ring-white/10 transition-all hover:bg-slate-800 hover:ring-indigo-400/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-mono text-sm text-slate-500">{ticket.ticketId}</span>
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ring-1 ${categoryConfig[ticket.category].color}`}>
                        <CategoryIcon className="h-3 w-3" />
                        {categoryConfig[ticket.category].label}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ring-1 ${priorityConfig[ticket.priority].color}`}>
                        {priorityConfig[ticket.priority].label}
                      </span>
                </div>

                    <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-indigo-400">
                      {ticket.title}
                    </h3>
                    
                    <p className="mb-3 line-clamp-2 text-sm text-slate-400">
                      {ticket.description}
                    </p>

                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                        <Paperclip className="h-3 w-3" />
                        {ticket.attachments.length} attachment(s)
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      {ticket.responses && ticket.responses.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {ticket.responses.length} response(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className={`flex items-center gap-1 rounded px-3 py-1 text-xs font-medium text-white ${statusConfig[ticket.status].color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig[ticket.status].label}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Ticket Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Create New Ticket</h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false)
                  setNewTicket({ title: "", description: "", category: "IT", priority: "MEDIUM" })
                  setAttachments([])
                }}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="w-full rounded-lg bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Category <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(categoryConfig).map(([key, config]) => {
                    const Icon = config.icon
                    const isSelected = newTicket.category === key
    return (
                      <button
                        key={key}
                        onClick={() => setNewTicket({ ...newTicket, category: key as TicketCategory })}
                        className={`flex items-center gap-2 rounded-lg p-3 text-left transition-all ${
                          isSelected
                            ? config.color + " ring-2"
                            : "bg-slate-800/50 text-slate-400 ring-1 ring-white/10 hover:bg-slate-800"
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium">{config.label}</div>
                        </div>
                      </button>
            )
          })}
        </div>
                <p className="mt-1 text-xs text-slate-500">
                  {categoryConfig[newTicket.category].description}
                </p>
              </div>

              {/* Priority */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setNewTicket({ ...newTicket, priority: key as TicketPriority })}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        newTicket.priority === key
                          ? config.color + " ring-2"
                          : "bg-slate-800/50 text-slate-400 ring-1 ring-white/10 hover:bg-slate-800"
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Detailed description of your issue..."
                  rows={6}
                  className="w-full rounded-lg bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Attachments (Optional)
                </label>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-2 ring-1 ring-white/10">
                      <Paperclip className="h-4 w-4 text-slate-400" />
                      <span className="flex-1 truncate text-sm text-slate-300">{file.name}</span>
                      <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="rounded p-1 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  {attachments.length < 3 && (
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/30 p-4 text-slate-400 transition-all hover:border-indigo-400/50 hover:bg-slate-800/50 hover:text-indigo-400">
                      <Upload className="h-5 w-5" />
                      <span className="text-sm font-medium">Upload Image (Max 3, 5MB each)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreateOpen(false)
                  setNewTicket({ title: "", description: "", category: "IT", priority: "MEDIUM" })
                  setAttachments([])
                }}
                className="rounded-lg bg-slate-800 px-6 py-3 font-semibold text-white transition-all hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={createTicket}
                disabled={uploading || !newTicket.title || !newTicket.description}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Ticket Modal - Similar structure for viewing/responding */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-sm text-slate-500">{selectedTicket.ticketId}</span>
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ring-1 ${categoryConfig[selectedTicket.category].color}`}>
                    {categoryConfig[selectedTicket.category].label}
                  </span>
                  <span className={`flex items-center gap-1 rounded px-3 py-1 text-xs font-medium text-white ${statusConfig[selectedTicket.status].color}`}>
                    {statusConfig[selectedTicket.status].label}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedTicket.title}</h2>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/10">
                <div className="mb-2 text-xs text-slate-500">
                  Created {new Date(selectedTicket.createdAt).toLocaleString()}
                </div>
                <p className="whitespace-pre-wrap text-slate-300">{selectedTicket.description}</p>
                
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-semibold text-slate-400">Attachments:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTicket.attachments.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative overflow-hidden rounded-lg ring-1 ring-white/10 transition-all hover:ring-indigo-400/50"
                        >
                          <img
                            src={url}
                            alt={`Attachment ${index + 1}`}
                            className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-400">Responses</h3>
                  <div className="space-y-3">
                    {selectedTicket.responses.map((response) => (
                      <div key={response.id} className="rounded-xl bg-indigo-500/10 p-4 ring-1 ring-indigo-500/30">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-indigo-400">{response.user.name}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(response.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-300">{response.message}</p>
                      </div>
                    ))}
                  </div>
          </div>
        )}
      </div>
          </div>
        </div>
      )}
      </div>
    )
}
