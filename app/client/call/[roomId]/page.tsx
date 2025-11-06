"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import VideoCallRoom from "@/components/client/video-call-room"
import { Loader2 } from "lucide-react"

function CallRoomPageContent() {
  const searchParams = useSearchParams()
  const roomUrl = searchParams.get("url")
  const staffName = searchParams.get("staff")

  if (!roomUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Error: Missing Call Information</h1>
          <p className="text-lg">Please ensure you have a valid room URL.</p>
          <button
            onClick={() => (window.location.href = "/client")}
            className="mt-6 px-6 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <VideoCallRoom roomUrl={roomUrl} staffName={staffName || undefined} />
}

export default function CallRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 text-white">
          <Loader2 className="h-10 w-10 animate-spin mr-4" />
          <span className="text-xl">Loading video call...</span>
        </div>
      }
    >
      <CallRoomPageContent />
    </Suspense>
  )
}
