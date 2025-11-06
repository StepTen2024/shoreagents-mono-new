"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Video, X, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useWebSocket } from "@/lib/websocket-provider"

interface Staff {
  id: string
  name: string
  email: string
  avatar?: string
}

interface StaffSelectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StaffSelectionModal({ isOpen, onClose }: StaffSelectionModalProps) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [callingStaffId, setCallingStaffId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { emit } = useWebSocket()

  useEffect(() => {
    if (!isOpen) return

    const fetchStaff = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/client/staff")
        if (!response.ok) {
          throw new Error("Failed to fetch staff")
        }
        const data = await response.json()
        setStaff(data.staff)
      } catch (error) {
        console.error("Error fetching staff:", error)
        toast({
          title: "Error",
          description: "Failed to load staff members. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [isOpen, toast])

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCall = async (staffMember: Staff) => {
    setCallingStaffId(staffMember.id)
    try {
      // Create Daily.co room
      const response = await fetch("/api/daily/create-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ staffId: staffMember.id }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("Failed to create room:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.error || `Failed to create room: ${response.statusText}`)
      }

      // Navigate to video room
      router.push(
        `/client/call/${roomUrl.split("/").pop()}?url=${encodeURIComponent(roomUrl)}&staff=${encodeURIComponent(staffMember.name)}`
      )
    } catch (error) {
      console.error("Error creating call:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to start call. Please try again."
      alert(errorMessage)
      setCalling(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-2xl ring-1 ring-purple-500/50">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Start Video Call</h2>
            <p className="text-sm text-purple-200">Select a staff member to call</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <Input
            placeholder="Search staff..."
            className="w-full rounded-lg border border-slate-700 bg-slate-700/50 py-2 pl-10 pr-4 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Staff List */}
        <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-purple-300">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              Loading staff...
            </div>
          ) : filteredStaff.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No staff found.</p>
          ) : (
            filteredStaff.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-slate-700/70 p-3 transition-colors hover:bg-slate-600/70"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={s.avatar} alt={s.name} />
                    <AvatarFallback className="bg-purple-500 text-white">
                      {s.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white">{s.name}</p>
                    <p className="text-sm text-slate-300">{s.email}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleCall(s)}
                  disabled={callingStaffId === s.id}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                >
                  {callingStaffId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Video className="h-4 w-4 mr-2" />
                  )}
                  {callingStaffId === s.id ? "Calling..." : "Call"}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
