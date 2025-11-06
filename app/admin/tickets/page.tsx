"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter } from "lucide-react"
import { Ticket, TicketStatus, TicketCategory, TicketPriority } from "@/types/ticket"
import TicketKanban from "@/components/tickets/ticket-kanban"
import TicketList from "@/components/tickets/ticket-list"
import TicketDetailModal from "@/components/tickets/ticket-detail-modal"
import ViewToggle from "@/components/tickets/view-toggle"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketListSkeleton, TicketStatsSkeleton, TicketFiltersSkeleton } from "@/components/tickets/ticket-skeleton"

export default function AdminTicketsPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchTickets()
  }, [activeTab])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, filterStatus, filterCategory])

  const fetchTickets = async () => {
    try {
      let url = "/api/admin/tickets"
      if (activeTab !== "all") {
        url += `?creatorType=${activeTab}`
      }
      const response = await fetch(url)
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === filterStatus)
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((ticket) => ticket.category === filterCategory)
    }

    setFilteredTickets(filtered)
  }

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    // Optimistically update UI first for instant feedback
    const previousTickets = [...tickets]
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      )
    )

    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        // Revert on failure
        setTickets(previousTickets)
        throw new Error("Failed to update status")
      }

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      })
    } catch (error) {
      // Revert already happened above
      toast({
        title: "Error",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive",
      })
    }
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

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-6 p-6">
        {/* Stats skeleton */}
        <TicketStatsSkeleton />
        
        {/* Filters skeleton */}
        <TicketFiltersSkeleton />
        
        {/* Tickets list skeleton */}
        <TicketListSkeleton count={6} />
      </div>
    )
  }

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
  }

  return (
    <div className={`flex min-h-screen flex-col gap-6 p-6 overflow-x-visible w-full ${view === "list" ? "admin-tickets-scrollbar" : ""}`} style={{ overflowX: 'visible' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Ticket Management</h1>
          <p className="mt-1 text-slate-400">Oversee and respond to all support tickets</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-all hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5" />
            Create Ticket
          </Button>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4 bg-slate-800/50 ring-1 ring-white/10">
          <TabsTrigger 
            value="all"
            className="cursor-pointer data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-indigo-400/50 transition-all duration-200"
          >
            All Tickets
          </TabsTrigger>
          <TabsTrigger 
            value="staff"
            className="cursor-pointer data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-indigo-400/50 transition-all duration-200"
          >
            Staff
          </TabsTrigger>
          <TabsTrigger 
            value="client"
            className="cursor-pointer data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-indigo-400/50 transition-all duration-200"
          >
            Clients
          </TabsTrigger>
          <TabsTrigger 
            value="management"
            className="cursor-pointer data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-indigo-400/50 transition-all duration-200"
          >
            Internal
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
          <Input
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
          <optgroup label="Staff & Management">
            <option value="IT">IT Support</option>
            <option value="HR">HR Request</option>
            <option value="MANAGEMENT">Management</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="CLINIC">Clinic / Nurse</option>
            <option value="MEETING_ROOM">Meeting Room</option>
          </optgroup>
          <optgroup label="Management Only">
            <option value="ONBOARDING">Onboarding</option>
            <option value="OFFBOARDING">Offboarding</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="CLEANING">Cleaning</option>
            <option value="FINANCE">Finance</option>
            <option value="OPERATIONS">Operations</option>
            <option value="SURROUNDINGS">Environment</option>
            <option value="COMPENSATION">Compensation</option>
            <option value="TRANSPORT">Transport</option>
          </optgroup>
          <optgroup label="Client Only">
            <option value="ACCOUNT_SUPPORT">Account Support</option>
            <option value="STAFF_PERFORMANCE">Staff Performance</option>
            <option value="PURCHASE_REQUEST">Purchase Request</option>
            <option value="BONUS_REQUEST">Bonus / Gift Request</option>
            <option value="REFERRAL">Referral</option>
            <option value="REPORTING_ISSUES">Reporting Issues</option>
            <option value="SYSTEM_ACCESS">System Access</option>
            <option value="GENERAL_INQUIRY">General Inquiry</option>
          </optgroup>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Tickets View */}
      <div className={view === "kanban" ? "flex-1 min-h-0 overflow-visible w-full" : "flex-1"} style={{ overflow: 'visible' }}>
        {view === "kanban" ? (
        <TicketKanban
          tickets={filteredTickets}
          onTicketClick={handleTicketClick}
          onStatusChange={handleStatusChange}
        />
        ) : (
          <TicketList
            tickets={filteredTickets}
            onTicketClick={handleTicketClick}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={handleCloseModal}
          onUpdate={handleUpdate}
          isManagement={true}
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
        />
      )}
    </div>
  )
}

// Create Ticket Modal Component
function CreateTicketModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    staffUserId: "",
    managementUserId: "",
    clientUserId: "",
    assigneeType: "staff" as "staff" | "management" | "client",
    title: "",
    description: "",
    category: "OTHER" as TicketCategory,
    priority: "MEDIUM" as TicketPriority,
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [staffUsers, setStaffUsers] = useState<any[]>([])
  const [managementUsers, setManagementUsers] = useState<any[]>([])
  const [clientUsers, setClientUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { toast } = useToast()

  // Get categories based on assignee type
  const getCategoriesForAssigneeType = (assigneeType: string) => {
    switch (assigneeType) {
      case "staff":
        return [
          { value: "IT", label: "IT Support" },
          { value: "HR", label: "HR Request" },
          { value: "MANAGEMENT", label: "Management" },
          { value: "EQUIPMENT", label: "Equipment" },
          { value: "CLINIC", label: "Clinic / Nurse" },
          { value: "MEETING_ROOM", label: "Meeting Room" },
          { value: "OTHER", label: "Other" }
        ]
      case "management":
        return [
          { value: "ONBOARDING", label: "Onboarding" },
          { value: "OFFBOARDING", label: "Offboarding" },
          { value: "MAINTENANCE", label: "Maintenance" },
          { value: "CLEANING", label: "Cleaning" },
          { value: "FINANCE", label: "Finance" },
          { value: "OPERATIONS", label: "Operations" },
          { value: "SURROUNDINGS", label: "Environment" },
          { value: "COMPENSATION", label: "Compensation" },
          { value: "TRANSPORT", label: "Transport" },
          { value: "OTHER", label: "Other" }
        ]
      case "client":
        return [
          { value: "ACCOUNT_SUPPORT", label: "Account Support" },
          { value: "STAFF_PERFORMANCE", label: "Staff Performance" },
          { value: "PURCHASE_REQUEST", label: "Purchase Request" },
          { value: "BONUS_REQUEST", label: "Bonus / Gift Request" },
          { value: "REFERRAL", label: "Referral" },
          { value: "REPORTING_ISSUES", label: "Reporting Issues" },
          { value: "SYSTEM_ACCESS", label: "System Access" },
          { value: "GENERAL_INQUIRY", label: "General Inquiry" },
          { value: "OTHER", label: "Other" }
        ]
      default:
        return [{ value: "OTHER", label: "Other" }]
    }
  }

  // Reset category when assignee type changes
  useEffect(() => {
    const categories = getCategoriesForAssigneeType(formData.assigneeType)
    if (categories.length > 0) {
      setFormData(prev => ({ ...prev, category: categories[0].value as TicketCategory }))
    }
  }, [formData.assigneeType])

  useEffect(() => {
    // Fetch current user session
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        if (session?.user) {
          // Fetch management users first to get current user details
          fetch("/api/admin/management")
            .then((res) => res.json())
            .then((data) => {
              setManagementUsers(data.management || [])
              // Find current user in management list
              const user = (data.management || []).find((m: any) => m.email === session.user.email)
              if (user) {
                setCurrentUser(user)
              }
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
    
    // Fetch staff users
    fetch("/api/admin/staff")
      .then((res) => res.json())
      .then((data) => setStaffUsers(data.staff || []))
      .catch(() => {})
    
    // Fetch client users
    fetch("/api/admin/clients")
      .then((res) => res.json())
      .then((data) => setClientUsers(data.clients || []))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let assigneeId = ""
    if (formData.assigneeType === "staff") assigneeId = formData.staffUserId
    else if (formData.assigneeType === "management") assigneeId = formData.managementUserId
    else if (formData.assigneeType === "client") assigneeId = formData.clientUserId
    
    if (!assigneeId || !formData.title || !formData.description) {
      toast({
        title: "Error",
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
        console.log("Starting upload for files:", attachments.map(f => ({ name: f.name, size: f.size, type: f.type })))
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
          console.log("Upload successful:", uploadData)
          attachmentUrls = uploadData.urls || []
        } else {
          const errorData = await uploadRes.json()
          console.error("Upload failed:", errorData)
          toast({
            title: "Warning",
            description: `Upload failed: ${errorData.error || "Unknown error"}`,
            variant: "destructive",
          })
        }
      }

      const payload = {
        staffUserId: formData.assigneeType === "staff" ? formData.staffUserId : undefined,
        managementUserId: formData.assigneeType === "management" 
          ? formData.managementUserId 
          : (formData.assigneeType === "client" && currentUser ? currentUser.id : undefined),
        clientUserId: formData.assigneeType === "client" ? formData.clientUserId : undefined,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        attachments: attachmentUrls,
      }

      const response = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl ring-1 ring-white/10 animate-in fade-in-0 zoom-in-95 duration-300 create-ticket-modal-scrollbar">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg">
                <span className="text-2xl">🎫</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create New Ticket</h2>
                <p className="text-sm text-slate-300">Fill in the details to create a support ticket</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-800/50 hover:text-white hover:scale-110"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Assignee Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              Assign To <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`group relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                formData.assigneeType === "staff" 
                  ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30" 
                  : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70"
              }`}>
                <input
                  type="radio"
                  name="assigneeType"
                  value="staff"
                  checked={formData.assigneeType === "staff"}
                  onChange={(e) =>
                    setFormData({ ...formData, assigneeType: "staff", managementUserId: "", clientUserId: "" })
                  }
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    formData.assigneeType === "staff" 
                      ? "bg-blue-500/20 text-blue-400" 
                      : "bg-slate-700/50 text-slate-400 group-hover:bg-slate-600/50 group-hover:text-slate-300"
                  }`}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-white">Staff Member</div>
                    <div className="text-xs text-slate-400">Offshore team</div>
                  </div>
                </div>
              </label>

              <label className={`group relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                formData.assigneeType === "management" 
                  ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30" 
                  : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70"
              }`}>
                <input
                  type="radio"
                  name="assigneeType"
                  value="management"
                  checked={formData.assigneeType === "management"}
                  onChange={(e) =>
                    setFormData({ ...formData, assigneeType: "management", staffUserId: "", clientUserId: "" })
                  }
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    formData.assigneeType === "management" 
                      ? "bg-purple-500/20 text-purple-400" 
                      : "bg-slate-700/50 text-slate-400 group-hover:bg-slate-600/50 group-hover:text-slate-300"
                  }`}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-white">Management</div>
                    <div className="text-xs text-slate-400">Internal team</div>
                  </div>
                </div>
              </label>

              <label className={`group relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                formData.assigneeType === "client" 
                  ? "border-green-500 bg-green-500/10 ring-2 ring-green-500/30" 
                  : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70"
              }`}>
                <input
                  type="radio"
                  name="assigneeType"
                  value="client"
                  checked={formData.assigneeType === "client"}
                  onChange={(e) =>
                    setFormData({ ...formData, assigneeType: "client", staffUserId: "", managementUserId: "" })
                  }
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    formData.assigneeType === "client" 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-slate-700/50 text-slate-400 group-hover:bg-slate-600/50 group-hover:text-slate-300"
                  }`}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-white">Client</div>
                    <div className="text-xs text-slate-400">External user</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Assignee Dropdown */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              {formData.assigneeType === "staff" && <>Select Staff Member <span className="text-red-400">*</span></>}
              {formData.assigneeType === "management" && <>Select Management Member <span className="text-red-400">*</span></>}
              {formData.assigneeType === "client" && <>Select Client <span className="text-red-400">*</span></>}
              </label>
            
            {formData.assigneeType === "staff" ? (
              <select
                required
                value={formData.staffUserId}
                onChange={(e) =>
                  setFormData({ ...formData, staffUserId: e.target.value })
                }
                className="w-full rounded-xl bg-slate-800/50 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-blue-400/50 focus:bg-slate-800/70"
              >
                <option value="">Choose a staff member...</option>
                {staffUsers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.email})
                  </option>
                ))}
              </select>
          ) : formData.assigneeType === "management" ? (
              <select
                required
                value={formData.managementUserId}
                onChange={(e) =>
                  setFormData({ ...formData, managementUserId: e.target.value })
                }
                className="w-full rounded-xl bg-slate-800/50 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-purple-400/50 focus:bg-slate-800/70"
              >
                <option value="">Choose a management member...</option>
                {managementUsers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.email})
                  </option>
                ))}
              </select>
          ) : (
              <select
                required
                value={formData.clientUserId}
                onChange={(e) =>
                  setFormData({ ...formData, clientUserId: e.target.value })
                }
                className="w-full rounded-xl bg-slate-800/50 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-green-400/50 focus:bg-slate-800/70"
              >
                <option value="">Choose a client...</option>
                {clientUsers.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
          )}
          </div>

          {/* Relationship Preview */}
          {formData.clientUserId && formData.assigneeType === "client" && currentUser && (
            <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 ring-1 ring-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold text-sm">
                    {currentUser.name?.split(" ").map((n: string) => n[0]).join("").slice(0,2) || "ME"}
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Assigned to (You)</div>
                    <div className="font-semibold text-white">{currentUser.name}</div>
                  </div>
                </div>
                <div className="text-2xl text-slate-600">→</div>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-xs text-slate-400">Creating ticket FOR</div>
                    <div className="font-semibold text-white">
                      {clientUsers.find(c => c.id === formData.clientUserId)?.name || "Client"}
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-sm">
                    {clientUsers.find(c => c.id === formData.clientUserId)?.name?.split(" ").map((n: string) => n[0]).join("").slice(0,2) || "CL"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Title & Description */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              Ticket Title <span className="text-red-400">*</span>
            </label>
              <div className="relative">
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50 focus:bg-slate-800/70"
              placeholder="Brief summary of the issue..."
            />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
          </div>

            <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              Description <span className="text-red-400">*</span>
            </label>
              <div className="relative">
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
                  className="w-full rounded-xl bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50 focus:bg-slate-800/70 resize-none"
                  placeholder="Provide detailed information about the issue..."
                />
                <div className="absolute right-3 top-3">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-300">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as TicketCategory })
                }
                className="w-full rounded-xl bg-slate-800/50 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50 focus:bg-slate-800/70"
              >
                {getCategoriesForAssigneeType(formData.assigneeType).map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400">
                {formData.assigneeType === "staff" && "📋 Categories for staff members"}
                {formData.assigneeType === "management" && "🏢 Categories for management team"}
                {formData.assigneeType === "client" && "👥 Categories for client users"}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-300">
                Priority Level <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as TicketPriority })
                }
                className="w-full rounded-xl bg-slate-800/50 px-4 py-3 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50 focus:bg-slate-800/70"
              >
                <option value="LOW">🟢 Low Priority</option>
                <option value="MEDIUM">🟡 Medium Priority</option>
                <option value="HIGH">🟠 High Priority</option>
                <option value="URGENT">🔴 Urgent</option>
              </select>
              <p className="text-xs text-slate-400">
                Choose the urgency level for this ticket
              </p>
            </div>
          </div>

          {/* Image Attachments */}
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-300 flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attachments (Optional)
            </label>
            
            <label className="group cursor-pointer block">
              <div className="relative rounded-xl border-2 border-dashed border-indigo-400/50 bg-slate-800/30 p-8 text-center transition-all hover:border-indigo-400/70 hover:bg-slate-800/40">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      const files = Array.from(e.target.files).slice(0, 5 - attachments.length)
                      setAttachments(prev => [...prev, ...files].slice(0, 5))
                    }
                  }}
                  className="hidden"
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
                              setAttachments(prev => prev.filter((_, i) => i !== index))
                            }}
                            className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover/image:opacity-100"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
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
            
            {uploading && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-500/10 p-3 ring-1 ring-indigo-500/30">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                <span className="text-sm font-medium text-indigo-400">
                  Uploading {attachments.length} image{attachments.length > 1 ? 's' : ''}...
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-800/50">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>All fields marked with * are required</span>
            </div>
            
            <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading || uploading}
                className="rounded-xl bg-slate-700/50 px-6 py-3 font-medium text-white transition-all hover:bg-slate-600/50 disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50"
            >
              {uploading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                  </div>
              ) : loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {attachments.length > 0 ? `Create with ${attachments.length} image${attachments.length > 1 ? 's' : ''}` : "Create Ticket"}
                  </div>
              )}
            </Button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

