"use client"

import { useEffect, useState } from "react"
import { Plus, Grid3X3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import TicketKanbanLight from "@/components/tickets/ticket-kanban-light"
import TicketListLight from "@/components/tickets/ticket-list-light"
import TicketDetailModal from "@/components/tickets/ticket-detail-modal"
import { Ticket } from "@/types/ticket"
import { getCategoriesForUserType, getCategoryLabel } from "@/lib/ticket-categories"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TicketKanbanSkeleton, TicketListSkeleton, TicketStatsSkeleton, TicketFiltersSkeleton } from "@/components/tickets/ticket-skeleton"

export default function ClientTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [accountManager, setAccountManager] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [isHydrated, setIsHydrated] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM",
  })
  const [attachments, setAttachments] = useState<File[]>([])

  const clientCategories = getCategoriesForUserType('client')

  // Handle view mode change and save to localStorage
  const handleViewModeChange = (mode: 'board' | 'list') => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('client-tickets-view-mode', mode)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  // Handle hydration and localStorage reading
  useEffect(() => {
    setIsHydrated(true)
    const savedViewMode = localStorage.getItem('client-tickets-view-mode') as 'board' | 'list'
    if (savedViewMode) {
      setViewMode(savedViewMode)
    }
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/client/tickets")
      const data = await res.json()
      
      if (res.ok) {
        setTickets(data.tickets || [])
        // Get account manager from first ticket (all tickets have same account manager)
        if (data.tickets?.length > 0 && data.tickets[0].accountManager) {
          setAccountManager(data.tickets[0].accountManager)
        }
      } else {
        console.error("API Error:", data.error)
        setTickets([])
        toast({
          title: "Error",
          description: data.error || "Failed to load tickets",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
      setTickets([])
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

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

      // Create ticket with attachment URLs
      const res = await fetch("/api/client/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          attachments: attachmentUrls,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Success",
          description: "Support ticket created successfully. Your account manager will be notified.",
        })
        setIsCreateModalOpen(false)
        setFormData({
          title: "",
          description: "",
          category: "",
          priority: "MEDIUM",
        })
        setAttachments([])
        fetchTickets()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create ticket",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating ticket:", error)
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
  }

  const handleCloseModal = () => {
    setSelectedTicket(null)
  }

  const handleModalUpdate = async () => {
    await fetchTickets()
    // Keep the modal open but update the selected ticket with fresh data
    if (selectedTicket) {
      const updatedTicket = tickets.find(t => t.id === selectedTicket.id)
      if (updatedTicket) {
        setSelectedTicket(updatedTicket)
      }
    }
  }

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="w-full">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <div className={`h-8 w-16 rounded-md ${viewMode === 'board' ? 'bg-gray-300' : 'bg-gray-200'}`}></div>
                <div className={`h-8 w-16 rounded-md ${viewMode === 'list' ? 'bg-gray-300' : 'bg-gray-200'}`}></div>
              </div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Stats skeleton */}
          <TicketStatsSkeleton />

          {/* Dynamic skeleton based on current view mode */}
          <div className="mt-8">
            {viewMode === 'board' ? (
              <TicketKanbanSkeleton count={3} />
            ) : (
              <TicketListSkeleton count={5} />
            )}
          </div>
        </div>
      </div>
    )
  }

  const stats = {
    total: tickets?.length || 0,
    open: tickets?.filter((t) => t.status === "OPEN").length || 0,
    inProgress: tickets?.filter((t) => t.status === "IN_PROGRESS").length || 0,
    resolved: tickets?.filter((t) => t.status === "RESOLVED").length || 0,
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600 mt-2">
              View and manage your support requests
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('board')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'board'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Board
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>
            
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="text-sm text-gray-500">Total Tickets</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="text-sm text-gray-500">Open</div>
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="text-sm text-gray-500">In Progress</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.inProgress}
            </div>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="text-sm text-gray-500">Resolved</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.resolved}
            </div>
          </div>
        </div>

        {/* Tickets Display */}
        {viewMode === 'board' ? (
          <TicketKanbanLight
            tickets={tickets || []}
            onTicketClick={handleTicketClick}
            onStatusChange={() => {}}
          />
        ) : (
          <TicketListLight
            tickets={tickets || []}
            onTicketClick={handleTicketClick}
            onStatusChange={() => {}}
          />
        )}

        {/* Create Ticket Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Create Support Ticket
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Submit a support request and our team will get back to you shortly
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-semibold text-gray-900">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="h-11 bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {clientCategories.map((category) => (
                      <SelectItem key={category} value={category} className="text-gray-900">
                        {getCategoryLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-900">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Brief summary of your issue"
                  className="h-11 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-900">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Please provide detailed information about your request"
                  rows={5}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-semibold text-gray-900">
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger className="h-11 bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="LOW" className="text-gray-900">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        Low
                      </span>
                    </SelectItem>
                    <SelectItem value="MEDIUM" className="text-gray-900">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="HIGH" className="text-gray-900">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        High
                      </span>
                    </SelectItem>
                    <SelectItem value="URGENT" className="text-gray-900">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Urgent
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments" className="text-sm font-semibold text-gray-900">
                  Attachments (Optional)
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <input
                    type="file"
                    id="attachments"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setAttachments(Array.from(e.target.files))
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="attachments"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <svg
                      className="w-8 h-8 text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-sm text-gray-600 font-medium">
                      Click to upload files
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PDF, PNG, JPG, or DOC (Max 10MB each)
                    </span>
                  </label>
                </div>
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-sm"
                      >
                        <span className="text-gray-700 truncate flex-1">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachments(attachments.filter((_, i) => i !== index))
                          }}
                          className="ml-2 text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Account Manager Info */}
              {accountManager && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={accountManager.avatar} alt={accountManager.name} />
                      <AvatarFallback className="bg-purple-600 text-white">
                        {accountManager.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        This ticket will be assigned to:
                      </p>
                      <p className="text-sm text-purple-700 font-medium">
                        {accountManager.name} <span className="text-gray-500">({accountManager.role})</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 h-11 border border-gray-900 text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || uploading}
                  className="px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading Images...
                    </>
                  ) : submitting ? (
                    "Creating Ticket..."
                  ) : (
                    "Create Ticket"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <TicketDetailModal
            ticket={selectedTicket}
            onClose={handleCloseModal}
            onUpdate={handleModalUpdate}
            isManagement={false}
          />
        )}
      </div>
    </div>
  )
}

