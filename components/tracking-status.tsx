"use client"

import { useEffect, useState } from "react"
import { Activity, Wifi, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function TrackingStatus() {
  const [isActive, setIsActive] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Check if tracking is active
    if (window.electron?.performance) {
      window.electron.performance.getStatus().then((status: any) => {
        setIsActive(!status.isPaused)
      })

      // Listen for status changes
      const unsubscribe = window.electron.performance.onStatusChange((status: any) => {
        setIsActive(!status.isPaused)
      })

      return unsubscribe
    }
  }, [])

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="flex gap-2">
        {/* Tracking Status */}
        <Badge variant={isActive ? "default" : "secondary"} className="flex items-center gap-1.5">
          <Activity className="h-3 w-3" />
          <span className="text-xs">
            {isActive ? "Tracking Active" : "Tracking Paused"}
          </span>
        </Badge>

        {/* Online Status */}
        <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1.5">
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              <span className="text-xs">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span className="text-xs">Offline</span>
            </>
          )}
        </Badge>
      </div>
    </div>
  )
}
