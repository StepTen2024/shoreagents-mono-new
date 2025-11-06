"use client"

import { useState, useEffect } from "react"
import { useWebSocket } from "@/lib/websocket-provider"
import { useSession } from "next-auth/react"
import IncomingCallModal from "./incoming-call-modal"

interface IncomingCall {
  callId: string
  callerName: string
  callerAvatar?: string
  roomUrl: string
  roomName: string
}

export default function CallNotificationProvider() {
  const { on, off } = useWebSocket()
  const { data: session } = useSession()
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    // Listen for incoming call notifications
    const handleIncomingCall = (data: IncomingCall) => {
      console.log("📞 INCOMING CALL:", data)
      setIncomingCall(data)
      
      // Play ringtone (optional)
      playRingtone()
    }

    on("incoming-call", handleIncomingCall)

    return () => {
      off("incoming-call", handleIncomingCall)
    }
  }, [session, on, off])

  const playRingtone = () => {
    // Create a simple ringtone using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      gainNode.gain.value = 0.3
      
      oscillator.start()
      
      // Ring for 2 seconds
      setTimeout(() => {
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5)
        setTimeout(() => oscillator.stop(), 500)
      }, 2000)
    } catch (error) {
      console.error("Error playing ringtone:", error)
    }
  }

  const handleAccept = () => {
    console.log("✅ CALL ACCEPTED")
    setIncomingCall(null)
  }

  const handleDecline = () => {
    console.log("❌ CALL DECLINED")
    setIncomingCall(null)
  }

  if (!incomingCall) return null

  return (
    <IncomingCallModal
      isOpen={!!incomingCall}
      callerName={incomingCall.callerName}
      callerAvatar={incomingCall.callerAvatar}
      roomUrl={incomingCall.roomUrl}
      roomName={incomingCall.roomName}
      callId={incomingCall.callId}
      onAccept={handleAccept}
      onDecline={handleDecline}
    />
  )
}

