"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  Monitor,
  Users,
  MessageSquare,
  Package,
  HelpCircle,
  MapPin,
  Cloud,
  Gift,
  Bus,
  Video,
  Calendar,
  Edit3,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { Ticket, TicketResponse } from "@/types/ticket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import ImageLightbox from "@/components/ui/image-lightbox"
import { getDepartmentLabel, getDepartmentEmoji } from "@/lib/category-department-map"
import CommentThread from "@/components/universal/comment-thread"
import StaffUploadPreloader from "@/components/uploads/staff-upload-preloader"

interface TicketDetailModalProps {
  ticket: Ticket
  onClose: () => void
  onUpdate: () => void
  isManagement?: boolean
  isClient?: boolean  // NEW: Detect if client is viewing
}

const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
  IT: {
    label: "IT / Computer",
    icon: Monitor,
    color: "bg-blue-500/20 text-blue-400 ring-blue-500/30",
  },
  HR: {
    label: "HR / Payroll",
    icon: Users,
    color: "bg-purple-500/20 text-purple-400 ring-purple-500/30",
  },
  MANAGEMENT: {
    label: "Management",
    icon: MessageSquare,
    color: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
  },
  EQUIPMENT: {
    label: "Equipment",
    icon: Package,
    color: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
  },
  STATION: {
    label: "Workstation",
    icon: MapPin,
    color: "bg-pink-500/20 text-pink-400 ring-pink-500/30",
  },
  SURROUNDINGS: {
    label: "Environment",
    icon: Cloud,
    color: "bg-cyan-500/20 text-cyan-400 ring-cyan-500/30",
  },
  COMPENSATION: {
    label: "Perks & Requests",
    icon: Gift,
    color: "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30",
  },
  TRANSPORT: {
    label: "Transport",
    icon: Bus,
    color: "bg-indigo-500/20 text-indigo-400 ring-indigo-500/30",
  },
  OTHER: {
    label: "Other",
    icon: HelpCircle,
    color: "bg-slate-500/20 text-slate-400 ring-slate-500/30",
  },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: "🆕 Open", color: "bg-gradient-to-r from-blue-500 to-cyan-500" },
  IN_PROGRESS: { label: "⚡ In Progress", color: "bg-gradient-to-r from-amber-500 to-orange-500" },
  RESOLVED: { label: "✅ Resolved", color: "bg-gradient-to-r from-emerald-500 to-green-500" },
  CLOSED: { label: "📦 Closed", color: "bg-gradient-to-r from-slate-500 to-gray-500" },
  CANCELLED: { label: "❌ Cancelled", color: "bg-gradient-to-r from-red-500 to-rose-500" },
}

export default function TicketDetailModal({
  ticket,
  onClose,
  onUpdate,
  isManagement = false,
  isClient = false,  // NEW: Default to false
}: TicketDetailModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedStatus, setSelectedStatus] = useState(ticket.status)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const [ticketAttachments, setTicketAttachments] = useState<string[]>(ticket.attachments || [])
  
  // 🔄 REASSIGNMENT STATE
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [availableManagers, setAvailableManagers] = useState<any[]>([])
  const [selectedNewAssignee, setSelectedNewAssignee] = useState("")
  const [reassignReason, setReassignReason] = useState("")
  const [reassigning, setReassigning] = useState(false)

  // ✨ NEW FEATURES STATE
  const [editingPriority, setEditingPriority] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState(ticket.priority)
  const [showDueDateModal, setShowDueDateModal] = useState(false)
  const [dueDate, setDueDate] = useState(ticket.dueDate || "")
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelling, setCancelling] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTitle, setEditTitle] = useState(ticket.title)
  const [editDescription, setEditDescription] = useState(ticket.description)
  const [editing, setEditing] = useState(false)

  const CategoryIcon = categoryConfig[ticket.category]?.icon || HelpCircle

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setShowLightbox(true)
  }

  // Handle adding more attachments to ticket
  const handleAddAttachments = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingAttachments(true)
    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData
        })

        const data = await response.json()

        if (data.url) {
          uploadedUrls.push(data.url)
        } else {
          throw new Error(data.error || "Failed to upload image")
        }
      }

      // Update ticket with new attachments
      const newAttachments = [...ticketAttachments, ...uploadedUrls]
      
      const response = await fetch(`/api/tickets/${ticket.id}/attachments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachments: newAttachments })
      })

      if (!response.ok) throw new Error("Failed to add attachments")

      setTicketAttachments(newAttachments)
      toast({
        title: "Images added!",
        description: `${uploadedUrls.length} image(s) added to ticket.`,
      })
      // Don't call onUpdate() - keep modal open for more edits
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive"
      })
    } finally {
      setUploadingAttachments(false)
    }
  }

  // Handle status change (admin only)
  const handleStatusChange = async () => {
    if (selectedStatus === ticket.status) return

    try {
      const response = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      })

      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStartVideoCall = async () => {
    // Create Daily.co room with ticket ID
    const roomName = `ticket-call-${ticket.ticketId}`
    router.push(`/call/ticket-${ticket.ticketId}?ticketId=${ticket.id}`)
  }

  // 🔄 REASSIGNMENT FUNCTIONS
  const fetchAvailableManagers = async () => {
    try {
      const response = await fetch("/api/management/available")
      if (!response.ok) throw new Error("Failed to fetch managers")
      const data = await response.json()
      setAvailableManagers(data.managers || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load available managers",
        variant: "destructive"
      })
    }
  }

  const handleReassign = async () => {
    if (!selectedNewAssignee) {
      toast({
        title: "Error",
        description: "Please select a manager to reassign to",
        variant: "destructive"
      })
      return
    }

    setReassigning(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/reassign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newAssigneeId: selectedNewAssignee,
          reason: reassignReason
        })
      })

      if (!response.ok) throw new Error("Failed to reassign ticket")

      const data = await response.json()
      
      toast({
        title: "Success!",
        description: data.message || "Ticket reassigned successfully"
      })

      // Reset state
      setShowReassignModal(false)
      setSelectedNewAssignee("")
      setReassignReason("")
      
      // Refresh ticket data
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reassign ticket. Please try again.",
        variant: "destructive"
      })
    } finally {
      setReassigning(false)
    }
  }

  // ✨ NEW: CHANGE PRIORITY
  const handleChangePriority = async (newPriority: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/priority`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority })
      })

      if (!response.ok) throw new Error("Failed to change priority")

      toast({
        title: "Success!",
        description: `Priority changed to ${newPriority}`
      })

      setSelectedPriority(newPriority)
      setEditingPriority(false)
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change priority",
        variant: "destructive"
      })
    }
  }

  // ✨ NEW: SET DUE DATE
  const handleSetDueDate = async () => {
    if (!dueDate) {
      toast({
        title: "Error",
        description: "Please select a due date",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(`/api/tickets/${ticket.id}/due-date`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: new Date(dueDate).toISOString() })
      })

      if (!response.ok) throw new Error("Failed to set due date")

      toast({
        title: "Success!",
        description: "Due date set successfully"
      })

      setShowDueDateModal(false)
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set due date",
        variant: "destructive"
      })
    }
  }

  // ✨ NEW: CANCEL TICKET
  const handleCancelTicket = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a cancellation reason",
        variant: "destructive"
      })
      return
    }

    setCancelling(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason })
      })

      if (!response.ok) throw new Error("Failed to cancel ticket")

      toast({
        title: "Success!",
        description: "Ticket cancelled successfully"
      })

      setShowCancelModal(false)
      setCancelReason("") // Reset cancel reason
      onUpdate() // Keep modal open so user can review cancelled ticket
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel ticket",
        variant: "destructive"
      })
    } finally {
      setCancelling(false)
    }
  }

  // ✨ NEW: EDIT TICKET
  const handleEditTicket = async () => {
    if (!editTitle.trim() || !editDescription.trim()) {
      toast({
        title: "Error",
        description: "Title and description cannot be empty",
        variant: "destructive"
      })
      return
    }

    setEditing(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: editTitle,
          description: editDescription
        })
      })

      if (!response.ok) throw new Error("Failed to edit ticket")

      toast({
        title: "Success!",
        description: "Ticket updated successfully"
      })

      setShowEditModal(false)
      onUpdate()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to edit ticket",
        variant: "destructive"
      })
    } finally {
      setEditing(false)
    }
  }

  // Client gets LIGHT theme, Staff/Management get DARK theme
  const isDark = !isClient  // Light theme for clients, dark for staff/management
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl animate-in fade-in duration-300">
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-500 flex flex-col ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 ring-2 ring-indigo-500/30 backdrop-blur-2xl"
          : "bg-white border-2 border-gray-200"
      }`}>
        {/* Header - STICKY */}
        <div className={`sticky top-0 z-10 p-8 pb-6 rounded-t-3xl ${
          isDark
            ? "bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 backdrop-blur-xl"
            : "bg-white border-b-2 border-gray-200"
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className={`font-mono text-sm font-bold px-3 py-1.5 rounded-lg shadow ${
                  isDark 
                    ? "text-indigo-300 bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30 shadow-indigo-500/20"
                    : "text-blue-700 bg-blue-50 border border-blue-200"
                }`}>
                  {ticket.ticketId}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold backdrop-blur-sm ring-1 shadow-lg ${
                    categoryConfig[ticket.category]?.color
                  }`}
                >
                  <CategoryIcon className="h-3 w-3" />
                  {categoryConfig[ticket.category]?.label}
                </span>
                <span
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-lg ${
                    statusConfig[ticket.status]?.color
                  }`}
                >
                  {statusConfig[ticket.status]?.label}
                </span>

                {/* ✨ PRIORITY - Management can edit, others can view */}
                {isManagement ? (
                  <select
                    value={selectedPriority}
                    onChange={(e) => handleChangePriority(e.target.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                      selectedPriority === "URGENT" ? "bg-red-500 text-white animate-pulse" :
                      selectedPriority === "HIGH" ? "bg-orange-500 text-white" :
                      selectedPriority === "MEDIUM" ? "bg-blue-500 text-white" :
                      "bg-slate-500 text-white"
                    }`}
                  >
                    <option value="LOW">🔵 Low</option>
                    <option value="MEDIUM">⚪ Medium</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="URGENT">🔴 Urgent</option>
                  </select>
                ) : (
                  <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    ticket.priority === "URGENT" ? "bg-red-500 text-white animate-pulse" :
                    ticket.priority === "HIGH" ? "bg-orange-500 text-white" :
                    ticket.priority === "MEDIUM" ? "bg-blue-500 text-white" :
                    "bg-slate-500 text-white"
                  }`}>
                    {ticket.priority === "URGENT" ? "🔴 Urgent" :
                     ticket.priority === "HIGH" ? "🟠 High" :
                     ticket.priority === "MEDIUM" ? "⚪ Medium" :
                     "🔵 Low"}
                  </span>
                )}

                {/* ✨ DUE DATE - Management can set, others can view */}
                {isManagement && !ticket.dueDate && (
                  <Button
                    onClick={() => setShowDueDateModal(true)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
                  >
                    <Calendar className="h-3 w-3" />
                    Set Due Date
                  </Button>
                )}
                {ticket.dueDate && (
                  <span className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold bg-purple-500 text-white">
                    <Calendar className="h-3 w-3" />
                    Due: {new Date(ticket.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h2 className={`text-3xl font-bold ${
                isDark 
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
                  : "text-gray-900"
              }`}>
                {ticket.title}
              </h2>
            </div>
            
            {/* Close Button - Top Right */}
            <button
              onClick={onClose}
              className={`absolute top-6 right-6 rounded-xl p-2.5 transition-all hover:scale-110 ring-1 backdrop-blur-sm ${
                isDark
                  ? "text-slate-400 hover:bg-red-500/20 hover:text-red-400 ring-slate-700 hover:ring-red-500"
                  : "text-gray-600 hover:bg-red-500/10 hover:text-red-600 ring-gray-300 hover:ring-red-400"
              }`}
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Action Buttons - Cleaner Row Below Header */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            {/* ✨ EDIT BUTTON - Staff (own) / Management (any) */}
            {(isManagement || (!isManagement && !isClient && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && ticket.status !== "CANCELLED")) && (
              <Button
                onClick={() => setShowEditModal(true)}
                className={`flex items-center gap-2 text-white shadow-lg hover:scale-105 transition-all rounded-xl px-4 py-2 ${
                  isDark
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/50"
                    : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/30"
                }`}
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
            )}

            {/* 🔄 REASSIGN BUTTON - Management Only */}
            {isManagement && (
              <Button
                onClick={() => {
                  setShowReassignModal(true)
                  fetchAvailableManagers()
                }}
                className={`flex items-center gap-2 text-white shadow-lg hover:scale-105 transition-all rounded-xl px-4 py-2 ${
                  isDark
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-500/50"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30"
                }`}
              >
                <Users className="h-4 w-4" />
                Reassign
              </Button>
            )}

            {/* ✨ CANCEL BUTTON - Staff (own, if open) / Management (any) */}
            {(isManagement || (!isManagement && !isClient && (ticket.status === "OPEN" || ticket.status === "IN_PROGRESS"))) && ticket.status !== "CANCELLED" && (
              <Button
                onClick={() => setShowCancelModal(true)}
                className={`flex items-center gap-2 text-white shadow-lg hover:scale-105 transition-all rounded-xl px-4 py-2 ${
                  isDark
                    ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/50"
                    : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-500/30"
                }`}
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            )}
            
            {/* Video Call Button */}
            <Button
              onClick={handleStartVideoCall}
              className={`flex items-center gap-2 text-white shadow-lg hover:scale-105 transition-all rounded-xl px-4 py-2 ${
                isDark
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/50"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/30"
              }`}
            >
              <Video className="h-4 w-4" />
              Video Call 📹
            </Button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">

        {/* Assigned To - Account Manager */}
        {/* Relationship Display - FULL CHAIN */}
        {(ticket.accountManager || ticket.client_users || ticket.management_users || ticket.staff_users) && (
          <div className={`mb-6 rounded-xl p-5 ${
            isDark 
              ? "bg-gradient-to-r from-purple-900/30 to-indigo-900/30 ring-1 ring-purple-500/30 backdrop-blur-xl" 
              : "bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200"
          }`}>
            <div className="flex items-center justify-between gap-4">
              {/* STAFF MEMBER - Who created it (for Staff tickets) */}
              {ticket.staff_users && (
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-14 w-14 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20">
                    <AvatarImage src={ticket.staff_users.avatar} alt={ticket.staff_users.name} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-sm">
                      {ticket.staff_users.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className={`text-xs font-semibold ${isDark ? "text-emerald-300" : "text-emerald-600"} uppercase tracking-wide`}>
                      Created by
                    </p>
                    <p className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {ticket.staff_users.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isDark 
                          ? "bg-emerald-500/30 text-emerald-300" 
                          : "bg-emerald-200 text-emerald-700"
                      }`}>
                        Staff Member
                      </span>
                      <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        {ticket.staff_users.email}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Manager / Assigned To (for Client tickets) */}
              {!ticket.staff_users && ticket.accountManager && (
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-14 w-14 ring-2 ring-purple-500/50 shadow-lg">
                    <AvatarImage src={ticket.accountManager.avatar} alt={ticket.accountManager.name} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold text-sm">
                      {ticket.accountManager.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className={`text-xs font-semibold ${isDark ? "text-purple-300" : "text-purple-600"} uppercase tracking-wide`}>
                      Assigned to
                    </p>
                    <p className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {ticket.accountManager.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isDark 
                          ? "bg-purple-500/30 text-purple-300" 
                          : "bg-purple-200 text-purple-700"
                      }`}>
                        Account Manager
                      </span>
                      <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        {ticket.accountManager.email}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Arrow */}
              {(ticket.staff_users || ticket.client_users) && (ticket.accountManager || ticket.management_users) && (
                <div className={`text-3xl font-bold ${isDark ? "text-indigo-400" : "text-gray-300"}`}>
                  →
                </div>
              )}

              {/* MANAGEMENT + DEPARTMENT - Who will handle it (for Staff tickets) */}
              {ticket.staff_users && ticket.management_users && (
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${isDark ? "text-indigo-300" : "text-indigo-600"} uppercase tracking-wide`}>
                      Assigned to
                    </p>
                    <p className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {ticket.management_users.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        {ticket.management_users.email}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isDark 
                          ? "bg-indigo-500/30 text-indigo-300" 
                          : "bg-indigo-200 text-indigo-700"
                      }`}>
                        {getDepartmentEmoji(ticket.management_users.department as any)} {getDepartmentLabel(ticket.management_users.department as any)}
                      </span>
                    </div>
                  </div>
                  <Avatar className="h-14 w-14 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20">
                    <AvatarImage src={ticket.management_users.avatar} alt={ticket.management_users.name} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm">
                      {ticket.management_users.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* Client / For (for Client tickets) */}
              {ticket.client_users && (
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${isDark ? "text-indigo-300" : "text-indigo-600"} uppercase tracking-wide`}>
                      Ticket FOR
                    </p>
                    <p className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {ticket.client_users.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        {ticket.client_users.email}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isDark 
                          ? "bg-indigo-500/30 text-indigo-300" 
                          : "bg-indigo-200 text-indigo-700"
                      }`}>
                        Client
                      </span>
                    </div>
                  </div>
                  <Avatar className="h-14 w-14 ring-2 ring-indigo-500/50 shadow-lg">
                    <AvatarImage src={ticket.client_users.avatar} alt={ticket.client_users.name} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-sm">
                      {ticket.client_users.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Change (Management Only) */}
        {isManagement && (
          <div className="mb-6 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/10">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Update Status
            </label>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-white outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <Button
                onClick={handleStatusChange}
                disabled={selectedStatus === ticket.status}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Update
              </Button>
            </div>
          </div>
        )}

        {/* Ticket Description */}
        <div className="mb-6 space-y-4">
          <div className={`rounded-2xl p-6 ${
            isDark
              ? "bg-slate-800/50 backdrop-blur-xl ring-1 ring-white/10"
              : "bg-white border-2 border-gray-200"
          }`}>
            <div className="mb-4">
              <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                📝 Description
              </h3>
              <div className={`mb-3 flex items-center justify-between text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                <span className="flex items-center gap-2">
                  🕐 Created {new Date(ticket.createdAt).toLocaleString()}
                </span>
                {(ticket.staff_users || ticket.client_users) && (
                  <div className="flex items-center gap-2">
                    <span className={isDark ? "text-slate-400" : "text-gray-600"}>Created by:</span>
                    <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {ticket.staff_users?.name || ticket.client_users?.name}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isDark
                        ? ticket.createdByType === "CLIENT"
                          ? "bg-green-500/30 text-green-300 border border-green-500/30"
                          : ticket.createdByType === "MANAGEMENT"
                          ? "bg-purple-500/30 text-purple-300 border border-purple-500/30"
                          : "bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                        : ticket.createdByType === "CLIENT"
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : ticket.createdByType === "MANAGEMENT"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-green-100 text-green-700 border border-green-200"
                    }`}>
                      {ticket.createdByType === "STAFF" ? "👤 STAFF" : ticket.createdByType === "CLIENT" ? "👔 CLIENT" : "📋 MANAGEMENT"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className={`rounded-lg p-4 border ${
              isDark
                ? "bg-slate-900/50 border-slate-700/50"
                : "bg-gray-50 border-gray-200"
            }`}>
              <p className={`whitespace-pre-wrap leading-relaxed ${isDark ? "text-slate-200" : "text-gray-900"}`}>{ticket.description}</p>
            </div>

            {(ticketAttachments.length > 0 || uploadingAttachments) && (
              <div className="mt-6 space-y-4">
                <div className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-indigo-300" : "text-gray-900"}`}>
                  📎 Attachments ({ticketAttachments.length})
                </div>

                {/* Existing Attachments Grid */}
                {ticketAttachments.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {ticketAttachments.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => openLightbox(ticketAttachments, index)}
                        className="group relative overflow-hidden rounded-xl transition-all cursor-pointer ring-1 ring-white/10 hover:ring-indigo-400/50 hover:scale-105 transform shadow-lg hover:shadow-indigo-500/20"
                      >
                        <img
                          src={url}
                          alt={`Attachment ${index + 1}`}
                          className="h-32 w-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 group-hover:from-indigo-900/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-indigo-500/90 rounded-full p-3 ring-2 ring-white/50 backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-transform">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* ADD MORE SECTION - Staff Upload Preloader Style */}
                <div className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                  isDark
                    ? "border-indigo-400/50 bg-slate-800/30 hover:border-indigo-400/70 hover:bg-slate-800/40"
                    : "border-blue-300 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50"
                }`}>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleAddAttachments}
                    className="hidden"
                    id="add-more-attachments"
                    disabled={uploadingAttachments}
                  />
                  
                  {uploadingAttachments ? (
                    // ⬆️ UPLOADING STATE
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {/* Spinner */}
                      <div className="mx-auto flex h-16 w-16 items-center justify-center">
                        <div className="relative">
                          <div className={`h-16 w-16 rounded-full border-4 animate-spin ${
                            isDark 
                              ? "border-indigo-200/20 border-t-indigo-500"
                              : "border-blue-200 border-t-blue-500"
                          }`}></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className={`h-6 w-6 ${isDark ? "text-indigo-400" : "text-blue-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Upload Text */}
                      <div className="space-y-2">
                        <p className={`text-lg font-bold animate-pulse ${isDark ? "text-indigo-400" : "text-blue-600"}`}>⬆️ Uploading images...</p>
                        <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>Please wait while we upload your files</p>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className={`w-full max-w-xs mx-auto h-2 rounded-full overflow-hidden ${
                        isDark ? "bg-slate-700/50" : "bg-gray-200"
                      }`}>
                        <div className={`h-full rounded-full animate-pulse ${
                          isDark 
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                            : "bg-gradient-to-r from-blue-500 to-cyan-500"
                        }`} style={{ width: '70%' }}></div>
                      </div>
                    </div>
                  ) : (
                    // 📤 READY TO ADD MORE STATE
                    <label htmlFor="add-more-attachments" className="cursor-pointer block group">
                      {/* Upload Icon */}
                      <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-all group-hover:scale-110 ${
                        isDark
                          ? "bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30"
                          : "bg-blue-100 text-blue-600 group-hover:bg-blue-200"
                      }`}>
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      
                      {/* Upload Text */}
                      <div className="space-y-1">
                        <p className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Add More Images</p>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>Click to upload • PNG, JPG up to 5MB</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 💬 UNIVERSAL COMMENT SYSTEM - COMMENTS & REACTIONS! */}
        <CommentThread
          commentableType="TICKET"
          commentableId={ticket.id}
          variant={isClient ? "client" : isManagement ? "management" : "staff"}
          onUpdate={onUpdate}
        />
        </div>
      </div>
      
      {/* 🔄 REASSIGNMENT MODAL */}
      {showReassignModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 ring-2 ring-amber-500/30 backdrop-blur-2xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                Reassign Ticket
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                Assign this ticket to a different manager
              </p>
            </div>

            {/* Current Assignment */}
            {ticket.management_users && (
              <div className="mb-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-2">Currently assigned to:</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-amber-500/30">
                    <AvatarImage src={ticket.management_users.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold">
                      {ticket.management_users.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold text-white">{ticket.management_users.name}</p>
                    <p className="text-xs text-slate-400">{ticket.management_users.department?.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* New Assignee Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Reassign to: <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedNewAssignee}
                onChange={(e) => setSelectedNewAssignee(e.target.value)}
                className="w-full rounded-xl bg-slate-800/50 px-4 py-3 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select a manager...</option>
                {availableManagers
                  .filter(m => m.id !== ticket.managementUserId)
                  .map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.department.replace('_', ' ')})
                    </option>
                  ))}
              </select>
            </div>

            {/* Reason (Optional) */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="e.g., Manager is on leave today"
                rows={3}
                className="w-full rounded-xl bg-slate-800/50 px-4 py-3 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowReassignModal(false)
                  setSelectedNewAssignee("")
                  setReassignReason("")
                }}
                disabled={reassigning}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReassign}
                disabled={reassigning || !selectedNewAssignee}
                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl py-3 shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {reassigning ? "Reassigning..." : "Reassign"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ NEW: EDIT TICKET MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 ring-2 ring-blue-500/30 backdrop-blur-2xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-500">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Edit Ticket
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                Update the ticket title and description
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-xl bg-slate-800/50 px-4 py-3 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={6}
                className="w-full rounded-xl bg-slate-800/50 px-4 py-3 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowEditModal(false)}
                disabled={editing}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditTicket}
                disabled={editing || !editTitle.trim() || !editDescription.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl py-3 shadow-lg shadow-blue-500/30 disabled:opacity-50"
              >
                {editing ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ NEW: CANCEL TICKET MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 ring-2 ring-red-500/30 backdrop-blur-2xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-500">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-red-500/20">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">
                  Cancel Ticket
                </h3>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                This ticket will be marked as cancelled. Please provide a reason.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Cancellation Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Issue resolved itself, Duplicate ticket, etc."
                rows={4}
                className="w-full rounded-xl bg-slate-800/50 px-4 py-3 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3"
              >
                Go Back
              </Button>
              <Button
                onClick={handleCancelTicket}
                disabled={cancelling || !cancelReason.trim()}
                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl py-3 shadow-lg shadow-red-500/30 disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel Ticket"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ NEW: SET DUE DATE MODAL (Management only) */}
      {showDueDateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 ring-2 ring-purple-500/30 backdrop-blur-2xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-500">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Set Due Date
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                Set a deadline for when this ticket should be resolved
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Due Date & Time <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl bg-slate-800/50 px-4 py-3 text-white ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowDueDateModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetDueDate}
                disabled={!dueDate}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl py-3 shadow-lg shadow-purple-500/30 disabled:opacity-50"
              >
                Set Due Date
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {showLightbox && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  )
}