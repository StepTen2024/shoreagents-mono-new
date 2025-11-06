"use client"

import { useEffect, useState } from "react"
import { useWebSocket } from "@/lib/websocket-provider"

interface NotificationBadgeProps {
  className?: string
}

export function NotificationBadge({ className = "" }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const { on, off } = useWebSocket()

  useEffect(() => {
    // Fetch initial unread count
    fetchUnreadCount()
  }, [])

  // 🔔 Listen for new notifications
  useEffect(() => {
    if (!on || !off) return

    const handleNewNotification = () => {
      setUnreadCount((prev) => prev + 1)
    }

    const handleNotificationRead = () => {
      fetchUnreadCount() // Refresh count
    }

    on('notification:new', handleNewNotification)
    on('notification:read', handleNotificationRead)
    on('notification:allRead', () => setUnreadCount(0))

    return () => {
      off('notification:new', handleNewNotification)
      off('notification:read', handleNotificationRead)
      off('notification:allRead', () => setUnreadCount(0))
    }
  }, [on, off])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications?unreadOnly=true&limit=1")
      const data = await response.json()
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
  }

  if (unreadCount === 0) {
    return null
  }

  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full ${className}`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )
}

