"use client"

import { use, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import VideoCallRoom from "@/components/client/video-call-room"
import { Loader2 } from "lucide-react"

export default function StaffCallRoomPage({
  params
}: {
  params: Promise<{ roomId: string }>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedParams = use(params)
  
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [callerName, setCallerName] = useState<string>("Client")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get room URL and caller name from query params
    const url = searchParams.get("url")
    const caller = searchParams.get("caller")

    if (!url) {
      console.error("No room URL provided")
      router.push("/")
      return
    }

    setRoomUrl(decodeURIComponent(url))
    if (caller) {
      setCallerName(decodeURIComponent(caller))
    }
    setLoading(false)
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Joining call...</p>
        </div>
      </div>
    )
  }

  if (!roomUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">❌ Invalid call link</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <VideoCallRoom roomUrl={roomUrl} staffName={callerName} />
}

