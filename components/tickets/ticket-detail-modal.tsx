"use client"

import { useState, useEffect } from "react"
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
  Paperclip,
  Send,
  Upload,
  Trash2,
  Video,
  Loader2,
} from "lucide-react"
import { Ticket, TicketResponse } from "@/types/ticket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import ImageLightbox from "@/components/ui/image-lightbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getDepartmentLabel, getDepartmentEmoji } from "@/lib/category-department-map"
import { CommentSection } from "@/components/engagement/comment-section"

interface TicketDetailModalProps {
  ticket: Ticket
  onClose: () => void
  onUpdate: () => void
  isManagement?: boolean
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
}

export default function TicketDetailModal({
  ticket,
  onClose,
  onUpdate,
  isManagement = false,
}: TicketDetailModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedStatus, setSelectedStatus] = useState(ticket.status)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)
  const [managementUsers, setManagementUsers] = useState<any[]>([])
  const [assigningTicket, setAssigningTicket] = useState(false)

  const CategoryIcon = categoryConfig[ticket.category]?.icon || HelpCircle

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setShowLightbox(true)
  }

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

  // Fetch all management users for reassignment dropdown
  const fetchManagementUsers = async () => {
    if (!isManagement) return
    
    try {
      const response = await fetch('/api/admin/management-users')
      if (response.ok) {
        const data = await response.json()
        setManagementUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch management users:', error)
    }
  }

  // Handle ticket reassignment
  const handleReassignTicket = async (managementUserId: string | null) => {
    setAssigningTicket(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managementUserId }),
      })

      if (!response.ok) throw new Error('Failed to reassign ticket')

      toast({
        title: "Success",
        description: managementUserId 
          ? "Ticket reassigned successfully" 
          : "Ticket unassigned successfully",
      })

      onUpdate() // Refresh ticket data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reassign ticket. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAssigningTicket(false)
    }
  }

  // Use FUN dark theme for Staff, management theme for others
  const isDark = true // Always fun theme!
  
  // Load management users on mount (for management only)
  useEffect(() => {
    if (isManagement) {
      fetchManagementUsers()
    }
  }, [isManagement])
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 ring-2 ring-indigo-500/30 backdrop-blur-2xl animate-in slide-in-from-bottom duration-500 flex flex-col">
        {/* Header - FUN STYLE! - STICKY */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 backdrop-blur-xl p-8 pb-6 rounded-t-3xl ">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-indigo-300 bg-indigo-500/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
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
              </div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                {ticket.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleStartVideoCall}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/50 hover:scale-105 transition-all rounded-xl px-4 py-2"
              >
                <Video className="h-4 w-4" />
                Video Call 📹
              </Button>
              <button
                onClick={onClose}
                className="rounded-xl p-2.5 transition-all hover:scale-110 text-slate-400 hover:bg-red-500/20 hover:text-red-400 ring-1 ring-slate-700 hover:ring-red-500 backdrop-blur-sm"
                title="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
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
              
              {/* Reassign Ticket - MANAGEMENT ONLY */}
              {isManagement && ticket.staff_users && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-300 mb-1">
                        🎯 Reassign Ticket
                      </p>
                      <p className="text-xs text-slate-500">
                        Change who handles this ticket
                      </p>
                    </div>
                  </div>
                  
                  <Select
                    value={ticket.management_users?.id || "unassigned"}
                    onValueChange={(value) => {
                      const managementUserId = value === "unassigned" ? null : value
                      handleReassignTicket(managementUserId)
                    }}
                    disabled={assigningTicket}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50">
                      <SelectValue>
                        {assigningTicket ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Reassigning...
                          </span>
                        ) : ticket.management_users ? (
                          <span className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={ticket.management_users.avatar} />
                              <AvatarFallback className="text-xs bg-indigo-500">
                                {ticket.management_users.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            {ticket.management_users.name} ({getDepartmentLabel(ticket.management_users.department as any)})
                          </span>
                        ) : (
                          "Unassigned"
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="unassigned" className="text-slate-300 hover:bg-slate-700">
                        🔄 Unassigned
                      </SelectItem>
                      {managementUsers.map((user) => (
                        <SelectItem 
                          key={user.id} 
                          value={user.id}
                          className="text-slate-300 hover:bg-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="text-xs bg-indigo-500">
                                {user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                            {user.department && (
                              <span className="text-xs text-slate-500">
                                ({getDepartmentLabel(user.department)})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          <div className="rounded-2xl p-6 bg-slate-800/50 backdrop-blur-xl ring-1 ring-white/10">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                📝 Description
              </h3>
              <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  🕐 Created {new Date(ticket.createdAt).toLocaleString()}
                </span>
                {(ticket.staff_users || ticket.client_users) && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Created by:</span>
                    <span className="font-bold text-white">
                      {ticket.staff_users?.name || ticket.client_users?.name}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
                      ticket.createdByType === "CLIENT"
                        ? "bg-green-500/30 text-green-300 border border-green-500/30"
                        : ticket.createdByType === "MANAGEMENT"
                        ? "bg-purple-500/30 text-purple-300 border border-purple-500/30"
                        : "bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                    }`}>
                      {ticket.createdByType === "STAFF" ? "👤 STAFF" : ticket.createdByType === "CLIENT" ? "👔 CLIENT" : "📋 MANAGEMENT"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <p className="whitespace-pre-wrap text-slate-200 leading-relaxed">{ticket.description}</p>
            </div>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                  📎 Attachments ({ticket.attachments.length})
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {ticket.attachments.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => openLightbox(ticket.attachments, index)}
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
              </div>
            )}
          </div>
        </div>

        {/* Responses/Comments - FUN STYLE! */}
        {ticket.responses && ticket.responses.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-2">
              💬 Responses ({ticket.responses.length})
            </h3>
            <div className="space-y-3">
              {ticket.responses.map((response) => {
                const user = response.staff_users || response.management_users || response.client_users
                const initials = user?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)

                // Determine styling based on creator type
                const isManagementResp = response.createdByType === "MANAGEMENT"
                const isClientResp = response.createdByType === "CLIENT"
                
                const bgColor = isManagementResp 
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 ring-1 ring-indigo-500/30 backdrop-blur-xl shadow-lg shadow-indigo-500/10" 
                    : isClientResp 
                    ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 ring-1 ring-green-500/30 backdrop-blur-xl shadow-lg shadow-green-500/10"
                    : "bg-gradient-to-r from-slate-800/70 to-slate-800/50 ring-1 ring-white/10 backdrop-blur-xl shadow-lg"
                
                const avatarColor = isManagementResp
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                  : isClientResp
                  ? "bg-gradient-to-br from-green-500 to-emerald-600"
                  : "bg-gradient-to-br from-blue-500 to-cyan-600"
                
                const textColor = isManagementResp
                    ? "text-indigo-300"
                    : isClientResp
                    ? "text-green-300"
                    : "text-white"
                
                const badgeColor = isManagementResp
                    ? "bg-indigo-500/30 text-indigo-200 border border-indigo-500/30"
                    : isClientResp
                    ? "bg-green-500/30 text-green-200 border border-green-500/30"
                    : "bg-emerald-500/30 text-emerald-200 border border-emerald-500/30"

                return (
                  <div
                    key={response.id}
                    className={`rounded-2xl p-5 ${bgColor}`}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-white/20 shadow-lg">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className={`${avatarColor} text-white font-bold`}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${textColor}`}>
                            {user?.name}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold backdrop-blur-sm ${badgeColor}`}>
                            {response.createdByType === "STAFF" ? "👤 STAFF" : response.createdByType === "MANAGEMENT" ? "📋 MGMT" : "👔 CLIENT"}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(response.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {response.message && response.message.trim() && (
                      <p className="text-slate-200 leading-relaxed">{response.message}</p>
                    )}

                    {response.attachments && response.attachments.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {response.attachments.map((url, index) => (
                          <button
                            key={index}
                            onClick={() => openLightbox(response.attachments, index)}
                            className={`group overflow-hidden rounded transition-all cursor-pointer relative ${
                              isDark 
                                ? "ring-1 ring-white/10 hover:ring-indigo-400/50" 
                                : "border-2 border-gray-200 hover:border-blue-400"
                            }`}
                          >
                            <img
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="h-20 w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 🎯 UNIFIED COMMENT SYSTEM - Replaces old ticket_responses */}
        <div className="rounded-2xl bg-slate-800/30 backdrop-blur-xl p-6 ring-1 ring-indigo-500/20">
          <CommentSection
            commentableType="TICKET"
            commentableId={ticket.id}
            currentUserType={isManagement ? "MANAGEMENT" : ticket.staff_users ? "STAFF" : "CLIENT"}
            currentUserId={isManagement ? "temp-management-id" : ticket.staff_users?.id || ticket.client_users?.id || ""}
            currentUserName={isManagement ? "Management User" : ticket.staff_users?.name || ticket.client_users?.name || "User"}
            currentUserAvatar={ticket.staff_users?.avatar || ticket.client_users?.avatar}
            darkMode={true}
          />
        </div>
        
        {/* Close Button */}
        <div className="flex justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:scale-105 transition-all rounded-xl px-6 py-3 font-bold"
          >
            ✖️ Close
          </Button>
        </div>
        
        </div>
      </div>
      
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