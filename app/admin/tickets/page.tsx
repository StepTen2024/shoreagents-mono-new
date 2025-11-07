"use client"

import { useState, useEffect } from "react"
import { Search, Filter } from "lucide-react"
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
          <p className="mt-1 text-slate-400">Manage all support tickets from staff and clients</p>
        </div>
        <ViewToggle view={view} onViewChange={setView} />
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
    </div>
  )
}
