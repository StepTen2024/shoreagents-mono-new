"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Monitor,
  FileText,
  Briefcase,
  UserSearch,
  BookOpen,
  User,
  Trophy,
  Bell,
  Activity,
  Coffee,
  ClipboardList,
  ClipboardCheck,
  Clock,
  LogOut,
  ChevronDown,
  Building2,
  Headphones,
  Settings,
  UserMinus,
} from "lucide-react"

type ClientUserWithCompany = {
  id: string
  name: string
  email: string
  avatar: string | null
  coverPhoto: string | null
  role: string
  company: {
    id: string
    companyName: string
    organizationId: string
    logo?: string | null
  }
}

export function ClientSidebar({ user }: { user: ClientUserWithCompany }) {
  const pathname = usePathname()
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0)

  useEffect(() => {
    fetchPendingReviewsCount()
  }, [])

  const fetchPendingReviewsCount = async () => {
    try {
      const response = await fetch("/api/client/performance-reviews/count")
      if (response.ok) {
        const data = await response.json()
        setPendingReviewsCount(data.pendingCount || 0)
      }
    } catch (error) {
      console.error("Failed to fetch pending reviews count:", error)
    }
  }

  const handleLogout = async () => {
    // Stop Electron sync service if running in Electron
    if (typeof window !== 'undefined' && window.electron?.sync?.stop) {
      try {
        await window.electron.sync.stop()
        console.log('Electron sync service stopped')
      } catch (error) {
        console.error('Failed to stop Electron sync:', error)
      }
    }
    
    await signOut({ callbackUrl: '/login/client', redirect: true })
  }

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const navItems = [
    { href: "/client", label: "Dashboard", icon: LayoutDashboard },
    { href: "/client/profile", label: "Profile", icon: User },
    { href: "/client/company", label: "Company", icon: Building2 },
    { href: "/client/onboarding", label: "Onboarding", icon: ClipboardCheck },
    { href: "/client/staff", label: "Staff", icon: Users },
    { href: "/client/time-tracking", label: "Time Tracking", icon: Clock },
    { href: "/client/analytics", label: "Analytics", icon: Monitor },
    { href: "/client/tickets", label: "Tickets", icon: Headphones },
    { href: "/client/performance-reviews", label: "Performance", icon: FileText, badge: pendingReviewsCount },
    { href: "/client/tasks", label: "Tasks", icon: ClipboardList },
    { href: "/client/knowledge-base", label: "Knowledge Base", icon: BookOpen },
    { href: "/client/news-feed", label: "The Feed", icon: Bell },
    { href: "/client/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/client/offboarding", label: "Offboarding", icon: UserMinus },
    { href: "/client/recruitment", label: "Recruitment", icon: Briefcase },
    { href: "/client/settings", label: "Settings", icon: Settings },
  ]

  return (
    <aside className="w-64 bg-gradient-to-b from-white via-blue-50/30 to-white border-r border-blue-100 shadow-xl shadow-blue-500/5 h-screen fixed left-0 top-0 z-50 flex flex-col">
      {/* Company Header */}
      <div className="p-4 m-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50/50 border border-blue-100 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          {user.company.logo ? (
            <img 
              src={user.company.logo} 
              alt={user.company.companyName}
              className="w-10 h-10 rounded-lg object-cover border-2 border-blue-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 flex items-center justify-center border-2 border-blue-200 shadow-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{user.company.companyName}</h2>
            <p className="text-xs text-gray-600">Client Portal</p>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-blue-100 flex-shrink-0">
        <Link href="/client/profile">
          <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-md transition-all">
            <Avatar className="size-10">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </Button>
        </Link>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? "bg-gradient-to-l from-blue-500 to-cyan-500 text-white font-semibold" 
                      : "text-gray-700 hover:bg-blue-50"
                  }`}
                >
                  <item.icon className={`h-5 w-5 transition-colors duration-200 ${
                    isActive ? "text-white" : "text-gray-600 group-hover:text-blue-600"
                  }`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className={`text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] transition-all duration-200 ${
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/40 hover:scale-110"
                    }`}>
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Actions - Always visible */}
      <div className="p-4 border-t border-blue-100 space-y-2 flex-shrink-0 bg-gradient-to-t from-blue-50/50 to-white">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
        >
          ← Staff Portal
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}











