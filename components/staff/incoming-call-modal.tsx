"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Video, X, Phone } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface IncomingCallModalProps {
  isOpen: boolean
  callerName: string
  callerAvatar?: string
  roomUrl: string
  roomName: string
  callId: string
  onAccept: () => void
  onDecline: () => void
}

export default function IncomingCallModal({
  isOpen,
  callerName,
  callerAvatar,
  roomUrl,
  roomName,
  callId,
  onAccept,
  onDecline
}: IncomingCallModalProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(30)

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(30)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleDecline()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  const handleAccept = async () => {
    try {
      // Update call status to ANSWERED
      await fetch(`/api/video-calls/${callId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ANSWERED" })
      })

      onAccept()
      
      // Navigate to the call room
      router.push(`/call/${roomName}?url=${encodeURIComponent(roomUrl)}&caller=${encodeURIComponent(callerName)}`)
    } catch (error) {
      console.error("Error accepting call:", error)
    }
  }

  const handleDecline = async () => {
    try {
      // Update call status to DECLINED
      await fetch(`/api/video-calls/${callId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DECLINED" })
      })

      onDecline()
    } catch (error) {
      console.error("Error declining call:", error)
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDecline()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-900/95 to-pink-900/95 border-purple-500 backdrop-blur-lg">
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {/* Pulsing Animation */}
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <div className="w-24 h-24 rounded-full bg-purple-500/30"></div>
            </div>
            <Avatar className="h-24 w-24 border-4 border-white/20 relative z-10">
              <AvatarImage src={callerAvatar} alt={callerName} />
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl">
                {getInitials(callerName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Caller Info */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">{callerName}</h2>
            <div className="flex items-center justify-center gap-2 text-purple-200">
              <Video className="h-4 w-4 animate-pulse" />
              <span className="text-sm">Incoming Video Call</span>
            </div>
            <p className="text-xs text-purple-300">Auto-decline in {timeLeft}s</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 w-full px-6">
            <Button
              onClick={handleDecline}
              variant="outline"
              size="lg"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-500 hover:border-red-600 space-x-2"
            >
              <X className="h-5 w-5" />
              <span>Decline</span>
            </Button>
            <Button
              onClick={handleAccept}
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white space-x-2 animate-pulse"
            >
              <Phone className="h-5 w-5" />
              <span>Accept</span>
            </Button>
          </div>

          {/* Call Info */}
          <div className="text-center text-xs text-purple-300 opacity-75">
            <p>This call will be recorded for quality assurance</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

