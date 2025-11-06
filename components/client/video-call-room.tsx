"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import DailyIframe, { DailyCall } from "@daily-co/daily-js"
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Loader2 } from "lucide-react"

interface VideoCallRoomProps {
  roomUrl: string
  staffName?: string
  callerName?: string
}

export default function VideoCallRoom({ roomUrl, staffName, callerName }: VideoCallRoomProps) {
  const router = useRouter()
  const callFrameRef = useRef<DailyCall | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isJoining, setIsJoining] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    // Create Daily call instance
    const initializeCall = async () => {
      try {
        if (!containerRef.current || !mounted) return

        // Always destroy any existing instance first
        if (callFrameRef.current) {
          console.log("Destroying existing Daily instance")
          try {
            callFrameRef.current.destroy()
          } catch (e) {
            console.log("Error destroying existing instance:", e)
          }
          callFrameRef.current = null
        }

        // Wait a moment to ensure cleanup is complete
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (!mounted) return

        console.log("Creating new Daily iframe for room:", roomUrl)

        // Create call frame
        const callFrame = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: false,
          showFullscreenButton: false,
          iframeStyle: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "0",
          },
        })

        if (!mounted) {
          callFrame.destroy()
          return
        }

        callFrameRef.current = callFrame

        // Set up event listeners
        callFrame
          .on("joined-meeting", () => {
            console.log("Joined meeting successfully")
            if (mounted) setIsJoining(false)
          })
          .on("left-meeting", () => {
            console.log("Left meeting")
          })
          .on("error", (error) => {
            console.error("Daily.co error:", error)
            if (mounted) {
              setError("Failed to join call. Please try again.")
              setIsJoining(false)
            }
          })

        // Join the call
        await callFrame.join({ url: roomUrl })
      } catch (err) {
        console.error("Error initializing call:", err)
        if (mounted) {
          setError("Failed to start call. Please check your connection.")
          setIsJoining(false)
        }
      }
    }

    initializeCall()

    // Cleanup
    return () => {
      console.log("Cleaning up Daily iframe")
      mounted = false
      if (callFrameRef.current) {
        try {
          callFrameRef.current.destroy()
        } catch (e) {
          console.log("Error in cleanup:", e)
        }
        callFrameRef.current = null
      }
    }
  }, [roomUrl])

  const toggleMute = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalAudio(!isMuted)
      setIsMuted(!isMuted)
    }
  }

  const toggleCamera = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalVideo(!isCameraOff)
      setIsCameraOff(!isCameraOff)
    }
  }

  const toggleScreenShare = async () => {
    if (callFrameRef.current) {
      try {
        if (isScreenSharing) {
          await callFrameRef.current.stopScreenShare()
          setIsScreenSharing(false)
        } else {
          await callFrameRef.current.startScreenShare()
          setIsScreenSharing(true)
        }
      } catch (err) {
        console.error("Screen share error:", err)
        alert("Failed to share screen. Please try again.")
      }
    }
  }

  const handleEndCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave()
      callFrameRef.current.destroy()
    }
    router.push("/client")
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ {error}</div>
          <button
            onClick={handleEndCall}
            className="px-6 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const displayName = staffName || callerName || "Video Call"

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Call Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">
              {staffName ? `Call with ${displayName}` : `Call from ${displayName}`}
            </h1>
            <p className="text-white/80 text-sm">Video Call in Progress</p>
          </div>
          {isJoining && (
            <div className="flex items-center gap-2 text-white">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Connecting...</span>
            </div>
          )}
        </div>
      </div>

      {/* Video Container */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Mute/Unmute */}
          <button
            onClick={toggleMute}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
              isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
            } backdrop-blur-sm`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
          </button>

          {/* Camera On/Off */}
          <button
            onClick={toggleCamera}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
              isCameraOff ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
            } backdrop-blur-sm`}
            title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isCameraOff ? (
              <VideoOff className="h-6 w-6 text-white" />
            ) : (
              <Video className="h-6 w-6 text-white" />
            )}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
              isScreenSharing ? "bg-purple-500 hover:bg-purple-600" : "bg-white/20 hover:bg-white/30"
            } backdrop-blur-sm`}
            title="Share Screen"
          >
            <MonitorUp className="h-6 w-6 text-white" />
          </button>

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-all"
            title="End Call"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
