"use client"

import { useState, useEffect } from "react"
import { Plus, Paperclip, X, ArrowRight, Search } from "lucide-react"
import { Ticket, TicketStatus, TicketCategory, TicketPriority } from "@/types/ticket"
import TicketDetailModal from "@/components/tickets/ticket-detail-modal"
import ViewToggle from "@/components/tickets/view-toggle"
import TicketList from "@/components/tickets/ticket-list"
import { useToast } from "@/components/ui/use-toast"
import { getCategoriesForUserType, getCategoryLabel, getCategoryIcon } from "@/lib/ticket-categories"
import StaffTicketBoard from "@/components/tickets/staff-ticket-board"
import { mapCategoryToDepartment, getDepartmentLabel, getDepartmentEmoji } from "@/lib/category-department-map"
import { TicketListSkeleton, TicketKanbanSkeleton } from "@/components/tickets/ticket-skeleton"

export default function TicketsPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const { toast} = useToast()
  
  const staffCategories = getCategoriesForUserType('staff')

  useEffect(() => {
    setMounted(true)
    fetchTickets()
  }, [])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, filterStatus, filterCategory])

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets")
      if (!response.ok) throw new Error("Failed to fetch tickets")
      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tickets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterTickets = () => {
    let filtered = tickets

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === filterStatus)
    }

    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter((ticket) => ticket.category === filterCategory)
    }

    setFilteredTickets(filtered)
  }

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
  }

  const handleCloseModal = () => {
    setSelectedTicket(null)
  }

  const handleUpdate = () => {
    fetchTickets()
    setSelectedTicket(null)
  }

  // Prevent flash by not rendering anything until mounted
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="w-full space-y-6" data-portal="staff-loading">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-10 w-64 bg-slate-700/50 rounded-lg animate-pulse" />
              <div className="mt-2 h-4 w-48 bg-slate-700/50 rounded animate-pulse" />
            </div>
            <div className="h-12 w-32 bg-slate-700/50 rounded-2xl animate-pulse" />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="group rounded-2xl bg-slate-900/50 backdrop-blur-xl p-6 ring-1 ring-white/10">
                <div className="text-3xl font-extrabold bg-slate-700/50 h-8 w-12 rounded animate-pulse" />
                <div className="text-sm font-medium bg-slate-700/50 h-4 w-20 rounded mt-1 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Kanban skeleton */}
          <TicketKanbanSkeleton count={2} />
        </div>
      </div>
    )
  }

  const stats = {
    total: filteredTickets.length,
    open: filteredTickets.filter((t) => t.status === "OPEN").length,
    inProgress: filteredTickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved: filteredTickets.filter((t) => t.status === "RESOLVED").length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8" data-portal="staff-tickets" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease-in' }}>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Support Tickets 🎫
            </h1>
            <p className="mt-2 text-slate-400">Submit and track your support requests</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-all hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
              New Ticket
            </button>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>

        {/* Stats Cards - Glassmorphism Style */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group rounded-2xl bg-slate-900/50 backdrop-blur-xl p-6 ring-1 ring-white/10 hover:ring-indigo-500/50 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400">
              {stats.total}
            </div>
            <div className="text-sm font-medium text-slate-400 mt-1">Total Tickets</div>
          </div>
          <div className="group rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl p-6 ring-1 ring-blue-500/30 hover:ring-blue-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              {stats.open}
            </div>
            <div className="text-sm font-medium text-blue-300 mt-1">Open Tickets</div>
          </div>
          <div className="group rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl p-6 ring-1 ring-amber-500/30 hover:ring-amber-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-300">
              {stats.inProgress}
            </div>
            <div className="text-sm font-medium text-amber-300 mt-1">In Progress</div>
          </div>
          <div className="group rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-xl p-6 ring-1 ring-emerald-500/30 hover:ring-emerald-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
              {stats.resolved}
            </div>
            <div className="text-sm font-medium text-emerald-300 mt-1">Resolved</div>
          </div>
        </div>

        {/* Search and Filters */}
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
            <option value="all">All Category</option>
            <option value="HR">HR Request</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="CLINIC">Clinic/Nurse</option>
            <option value="MEETING_ROOM">Meeting Room</option>
            <option value="MANAGEMENT">Management</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Tickets View - STAFF VIEW ONLY (NO DRAG AND DROP) */}
        <div className={view === "kanban" ? "flex-1 min-h-0 overflow-hidden w-full" : "flex-1"}>
          {view === "kanban" ? (
            <StaffTicketBoard
              tickets={filteredTickets}
              onTicketClick={handleTicketClick}
            />
          ) : (
            <TicketList
              tickets={filteredTickets}
              onTicketClick={handleTicketClick}
              onStatusChange={async () => {}} // Staff can't change status, so empty function
            />
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={handleCloseModal}
          onUpdate={handleUpdate}
          isManagement={false}
        />
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchTickets()
          }}
          categories={staffCategories}
        />
      )}
    </div>
  )
}

// Create Ticket Modal Component
function CreateTicketModal({
  onClose,
  onSuccess,
  categories,
}: {
  onClose: () => void
  onSuccess: () => void
  categories: TicketCategory[]
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as TicketCategory | "",
    priority: "MEDIUM" as TicketPriority,
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      
      // Limit to 5 files
      if (attachments.length + files.length > 5) {
        toast({
          title: "Too many files",
          description: "You can only upload up to 5 images",
          variant: "destructive",
        })
        return
      }

      // Check file sizes (5MB each)
      const oversized = files.filter(f => f.size > 5 * 1024 * 1024)
      if (oversized.length > 0) {
        toast({
          title: "File too large",
          description: "Each image must be under 5MB",
          variant: "destructive",
        })
        return
      }

      // Check file types (images only)
      const nonImages = files.filter(f => !f.type.startsWith('image/'))
      if (nonImages.length > 0) {
        toast({
          title: "Invalid file type",
          description: "Only image files are allowed",
          variant: "destructive",
        })
        return
      }

      setAttachments([...attachments, ...files].slice(0, 5))
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category || !formData.title || !formData.description) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Upload attachments first if any
      let attachmentUrls: string[] = []
      
      if (attachments.length > 0) {
        setUploading(true)
        const uploadFormData = new FormData()
        attachments.forEach((file) => {
          uploadFormData.append("files", file)
        })

        const uploadRes = await fetch("/api/tickets/attachments", {
          method: "POST",
          body: uploadFormData,
        })

        setUploading(false)

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          attachmentUrls = uploadData.urls || []
        } else {
          toast({
            title: "Warning",
            description: "Some attachments failed to upload",
            variant: "destructive",
          })
        }
      }

      // Create ticket
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          attachments: attachmentUrls,
        }),
      })

      if (!response.ok) throw new Error("Failed to create ticket")

      toast({
        title: "✅ Success!",
        description: `Ticket created${attachmentUrls.length > 0 ? ` with ${attachmentUrls.length} image${attachmentUrls.length > 1 ? 's' : ''}` : ''}`,
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 shadow-2xl ring-2 ring-indigo-500/30 max-h-[90vh] overflow-y-auto backdrop-blur-2xl animate-in slide-in-from-bottom duration-500 create-ticket-modal-scrollbar">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg">
                <span className="text-2xl">🎫</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create New Ticket</h2>
                <p className="text-sm text-slate-300">Submit your support request with all the details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-800/50 hover:text-white hover:scale-110"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Title <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl bg-slate-800/50 backdrop-blur-xl px-5 py-4 text-white ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800/80 transition-all duration-300"
                placeholder="Brief description of your issue"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
              className="w-full rounded-xl bg-slate-800/50 backdrop-blur-xl px-5 py-4 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800/80 transition-all duration-300"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
            
            {/* Department Preview - Shows where ticket will be routed */}
            {formData.category && mapCategoryToDepartment(formData.category) && (
              <div className="mt-3 animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-xl px-4 py-3 border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 font-medium">Will be assigned to:</span>
                    <ArrowRight className="h-4 w-4 text-indigo-400" />
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                      {getDepartmentEmoji(mapCategoryToDepartment(formData.category)!)} {getDepartmentLabel(mapCategoryToDepartment(formData.category)!)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
              className="w-full rounded-xl bg-slate-800/50 backdrop-blur-xl px-5 py-4 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800/80 transition-all duration-300"
            >
              <option value="LOW">🟢 Low</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="HIGH">🟠 High</option>
              <option value="URGENT">🔴 Urgent</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-300">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl bg-slate-800/50 backdrop-blur-xl px-5 py-4 text-white ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800/80 transition-all duration-300"
              placeholder="Provide detailed information about your issue..."
              rows={5}
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-300 flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments (Optional)
            </label>
            
            <label className="group cursor-pointer block">
              <div className="relative rounded-xl border-2 border-dashed border-indigo-400/50 bg-slate-800/30 p-8 text-center transition-all hover:border-indigo-400/70 hover:bg-slate-800/40">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={attachments.length >= 5}
                />
                
                {attachments.length === 0 ? (
                  <>
                    {/* Upload Icon */}
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 transition-all group-hover:bg-indigo-500/30 group-hover:scale-110">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    
                    {/* Upload Text */}
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-white">Click to upload images</p>
                      <p className="text-sm text-slate-400">PNG, JPG up to 5MB (max 5 files)</p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Image Previews Inside Upload Area */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {attachments.map((file, index) => (
                        <div key={index} className="relative group/image rounded-lg overflow-hidden bg-slate-700/50">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="h-16 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              removeAttachment(index)
                            }}
                            className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover/image:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Upload More Text */}
                    <div className="space-y-1">
                      {attachments.length < 5 && (
                        <p className="text-sm font-medium text-indigo-300">Click to add more images</p>
                      )}
                      <p className="text-xs text-slate-400">{attachments.length}/5 files selected</p>
                    </div>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-800/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-800/50 backdrop-blur-xl px-6 py-4 font-bold text-white ring-1 ring-white/10 transition-all hover:bg-slate-700/50 hover:scale-105 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 font-bold text-white transition-all hover:from-indigo-700 hover:to-purple-700 hover:scale-105 disabled:opacity-50 shadow-2xl shadow-indigo-500/50"
            >
              {uploading ? "⬆️ Uploading..." : loading ? "⏳ Creating..." : "✨ Create Ticket"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
