"use client"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Sidebar from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import ElectronProvider from "@/components/electron-provider"
import { WebSocketProvider } from "@/lib/websocket-provider"
import StaffFloatingCallButton from "@/components/staff/floating-call-button"
import CallNotificationProvider from "@/components/staff/call-notification-provider"
import IncomingCallNotification from "@/components/staff/incoming-call-notification"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // CRITICAL: Don't render anything until pathname is available
  if (!pathname) {
    return null
  }
  
  // Don't show sidebar on login pages, admin pages, or client pages
  const isLoginPage = pathname.startsWith("/login")
  const isAdminPage = pathname.startsWith("/admin")
  const isClientPage = pathname === "/client" || pathname.startsWith("/client/")  // Exact match or with trailing slash to avoid matching /client-company
  const isCallPage = pathname.startsWith("/call")
  
  // Staff pages = everything else (root level pages)
  const isStaffPage = !isLoginPage && !isAdminPage && !isClientPage && !isCallPage
  
  // Extract user info from session for WebSocket
  const userId = session?.user?.id
  const userName = session?.user?.name || session?.user?.email || undefined
  
  const content = isStaffPage ? (
    <>
      <Sidebar />
      <main className="lg:pl-64">
        <div className="min-h-screen bg-slate-950">
            {children}
        </div>
      </main>
      <StaffFloatingCallButton />
      <CallNotificationProvider />
      <Toaster />
    </>
  ) : (
    // For login, admin, and client pages - no sidebar but include toaster
    <>
      {children}
      <Toaster />
    </>
  )
  
  return (
    <ElectronProvider>
      <WebSocketProvider userId={userId} userName={userName}>
        {content}
      </WebSocketProvider>
    </ElectronProvider>
  )
}
