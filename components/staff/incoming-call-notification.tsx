"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Video, Phone, PhoneOff, User } from "lucide-react"
import { useWebSocket } from "@/lib/websocket-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface IncomingCall {
  roomUrl: string
  callerName: string
  callerId: string
  timestamp: number
}

export default function IncomingCallNotification() {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [isRinging, setIsRinging] = useState(false)
  const router = useRouter()
  const { on, off, emit } = useWebSocket()

  useEffect(() => {
    // Listen for incoming calls
    const handleIncomingCall = (data: IncomingCall) => {
      console.log("[IncomingCall] Received call from:", data.callerName)
      setIncomingCall(data)
      setIsRinging(true)

      // Auto-dismiss after 30 seconds
      setTimeout(() => {
        if (incomingCall?.timestamp === data.timestamp) {
          handleReject()
        }
      }, 30000)
    }

    on("call:incoming", handleIncomingCall)

    return () => {
      off("call:incoming", handleIncomingCall)
    }
  }, [on, off, incomingCall])

  const handleAccept = () => {
    if (!incomingCall) return

    console.log("[IncomingCall] Accepting call from:", incomingCall.callerName)

    // Notify caller that call was accepted
    emit("call:accept", {
      callerId: incomingCall.callerId,
      staffId: "current-staff-id", // Will be populated from session
      staffName: "Current Staff Name", // Will be populated from session
    })

    // Navigate to video call room
    router.push(
      `/call/${incomingCall.roomUrl.split("/").pop()}?url=${encodeURIComponent(incomingCall.roomUrl)}&caller=${encodeURIComponent(incomingCall.callerName)}`
    )

    // Clear notification
    setIncomingCall(null)
    setIsRinging(false)
  }

  const handleReject = () => {
    if (!incomingCall) return

    console.log("[IncomingCall] Rejecting call from:", incomingCall.callerName)

    // Notify caller that call was rejected
    emit("call:reject", {
      callerId: incomingCall.callerId,
      staffId: "current-staff-id", // Will be populated from session
      staffName: "Current Staff Name", // Will be populated from session
    })

    // Clear notification
    setIncomingCall(null)
    setIsRinging(false)
  }

  if (!incomingCall || !isRinging) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm" />

      {/* Incoming Call Modal */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 p-8 shadow-2xl ring-2 ring-white/20 animate-in fade-in zoom-in duration-300">
          {/* Pulsing Ring Animation */}
          <div className="absolute inset-0 rounded-3xl bg-purple-500/30 animate-pulse" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center space-y-6">
            {/* Video Icon */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/30">
                <Video className="h-10 w-10 text-white" />
              </div>
            </div>

            {/* Caller Info */}
            <div className="text-center">
              <p className="text-sm font-medium text-purple-200">Incoming Video Call</p>
              <h2 className="mt-2 text-3xl font-bold text-white">{incomingCall.callerName}</h2>
              <p className="mt-1 text-sm text-purple-300">wants to start a video call</p>
            </div>

            {/* Action Buttons */}
            <div className="flex w-full gap-4 pt-4">
              {/* Reject Button */}
              <button
                onClick={handleReject}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500 px-8 py-4 font-semibold text-white transition-all hover:bg-red-600 hover:scale-105 active:scale-95"
              >
                <PhoneOff className="h-5 w-5" />
                Decline
              </button>

              {/* Accept Button */}
              <button
                onClick={handleAccept}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green-500 px-8 py-4 font-semibold text-white transition-all hover:bg-green-600 hover:scale-105 active:scale-95 animate-pulse"
              >
                <Phone className="h-5 w-5" />
                Accept
              </button>
            </div>

            {/* Auto-dismiss hint */}
            <p className="text-xs text-purple-300/70">Call will auto-dismiss in 30 seconds</p>
          </div>
        </div>
      </div>
    </>
  )
}

