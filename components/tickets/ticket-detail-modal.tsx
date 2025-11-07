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
} from "lucide-react"
import { Ticket, TicketResponse } from "@/types/ticket"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import ImageLightbox from "@/components/ui/image-lightbox"
import { getDepartmentLabel, getDepartmentEmoji } from "@/lib/category-department-map"
import CommentThread from "@/components/universal/comment-thread"

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
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const [ticketAttachments, setTicketAttachments] = useState<string[]>(ticket.attachments || [])

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
      onUpdate()
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

  // Use FUN dark theme for Staff, management theme for others
  const isDark = true // Always fun theme!
  
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

            {(ticketAttachments.length > 0 || !uploadingAttachments) && (
              <div className="mt-6 space-y-3">
                <div className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                  📎 Attachments ({ticketAttachments.length})
                </div>
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

                  {/* Add More Images Button */}
                  <label className={`group relative overflow-hidden rounded-xl transition-all cursor-pointer ring-2 ring-dashed ${
                    uploadingAttachments 
                      ? "ring-indigo-500/50 bg-indigo-500/10" 
                      : "ring-white/20 hover:ring-indigo-400 hover:bg-indigo-500/5"
                  } flex items-center justify-center h-32 transform hover:scale-105 shadow-lg`}>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleAddAttachments}
                      disabled={uploadingAttachments}
                      className="hidden"
                    />
                    {uploadingAttachments ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-xs text-indigo-300 font-semibold">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-300 group-hover:text-indigo-300 transition-colors">
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs font-semibold">Add More</span>
                        <span className="text-[10px] opacity-60">Click or drag</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 💬 UNIVERSAL COMMENT SYSTEM - COMMENTS & REACTIONS! */}
        <CommentThread
          commentableType="TICKET"
          commentableId={ticket.id}
          variant={isManagement ? "management" : "staff"}
          onUpdate={onUpdate}
        />
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