"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Video, Search, Loader2, User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ClientUser {
  id: string
  name: string
  email: string
  avatar?: string
  company: {
    companyName: string
  }
}

interface ClientSelectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ClientSelectionModal({ isOpen, onClose }: ClientSelectionModalProps) {
  const router = useRouter()
  const [clients, setClients] = useState<ClientUser[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [calling, setCalling] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchClients()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredClients(filtered)
    } else {
      setFilteredClients(clients)
    }
  }, [searchQuery, clients])

  const fetchClients = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/staff/clients")
      if (!response.ok) throw new Error("Failed to fetch clients")
      
      const data = await response.json()
      setClients(data.clients || [])
      setFilteredClients(data.clients || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCallClient = async (client: ClientUser) => {
    setCalling(client.id)
    
    try {
      const response = await fetch("/api/daily/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          clientName: client.name,
          initiatedBy: "staff"
        })
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

      const data = await response.json()
      
      // Redirect to call room
      router.push(`/call/${data.roomName}?url=${encodeURIComponent(data.roomUrl)}&caller=${encodeURIComponent(data.clientName)}`)
      onClose()
    } catch (error) {
      console.error("Error creating call:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to start call. Please try again."
      alert(errorMessage)
      setCalling(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700 max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="h-6 w-6 text-purple-400" />
            Call a Client
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search clients by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Client List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              {searchQuery ? "No clients found matching your search" : "No clients available"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-slate-700">
                      <AvatarImage src={client.avatar} alt={client.name} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-white">{client.name}</h3>
                      <p className="text-sm text-slate-400">{client.email}</p>
                      <p className="text-xs text-slate-500">{client.company.companyName}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCallClient(client)}
                    disabled={calling === client.id}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white space-x-2"
                  >
                    {calling === client.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Calling...</span>
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4" />
                        <span>Call</span>
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}

