"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const Icons = {
  LayoutDashboard: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Users: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Building2: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  ),
  UserCog: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="18" cy="15" r="3" />
      <circle cx="9" cy="7" r="4" />
      <path d="M10 15H6a4 4 0 0 0-4 4v2" />
      <path d="m21.7 16.4-.9-.3" />
      <path d="m15.2 13.9-.9-.3" />
      <path d="m16.6 18.7.3-.9" />
      <path d="m19.1 12.2.3-.9" />
      <path d="m19.6 18.7-.4-1" />
      <path d="m16.8 12.3-.4-1" />
      <path d="m14.3 16.6 1-.4" />
      <path d="m20.7 13.8 1-.4" />
    </svg>
  ),
  ClipboardCheck: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  ),
  LinkIcon: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  Calendar: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  CheckSquare: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  Ticket: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  ),
  FolderOpen: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M2 11.5V5a2 2 0 0 1 2-2h3.9c.7 0 1.3.3 1.7.9l.8 1.2c.4.6 1 .9 1.7.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9.5" />
      <path d="M2 13h10l3.5 7" />
    </svg>
  ),
  Clock: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Trophy: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  Megaphone: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),
  Settings: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Search: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  Bell: () => (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  LogOut: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  User: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  FileText: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  BookOpen: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  Briefcase: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  UserMinus: () => (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
}

const navItems = [
  { icon: "LayoutDashboard", label: "Dashboard", href: "/admin", badge: null },
  { icon: "User", label: "My Profile", href: "/admin/profile", badge: null },
  { icon: "Building2", label: "Client", href: "/admin/clients", badge: null },
  { icon: "ClipboardCheck", label: "Onboarding", href: "/admin/staff/onboarding", badge: null },
  { icon: "Users", label: "Staff", href: "/admin/staff", badge: null },
  { icon: "Clock", label: "Time Tracking", href: "/admin/time-tracking", badge: null },
  { icon: "TrendingUp", label: "Analytics", href: "/admin/analytics", badge: null },
  { icon: "Ticket", label: "Tickets", href: "/admin/tickets", badge: null },
  { icon: "FileText", label: "Performance", href: "/admin/performance-reviews", badge: null },
  { icon: "CheckSquare", label: "Tasks", href: "/admin/tasks", badge: null },
  { icon: "BookOpen", label: "Knowledge Base", href: "/admin/knowledge-base", badge: null },
  { icon: "Megaphone", label: "The Feed", href: "/admin/posts", badge: null },
  { icon: "Trophy", label: "Leaderboard", href: "/admin/leaderboard", badge: null },
  { icon: "UserMinus", label: "Offboarding", href: "/admin/staff/offboarding", badge: null },
  { icon: "Briefcase", label: "Recruitment", href: "/admin/recruitment", badge: null },
  { icon: "Settings", label: "Settings", href: "/admin/settings", badge: null },
]

type ManagementUser = {
  id: string
  name: string
  email: string
  avatar: string | null
  coverPhoto: string | null
  role: string
  department: string
}

export function AdminSidebar({ 
  children, 
  user 
}: { 
  children: React.ReactNode
  user: ManagementUser
}) {
  const pathname = usePathname()

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
    
    await signOut({ callbackUrl: '/login', redirect: true })
  }

  // Get user initials for fallback
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-800/50 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-800/50 px-6">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 shadow-lg shadow-indigo-500/20">
            <span className="text-sm font-bold text-white">SA</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Shore Agents</div>
            <div className="text-xs text-slate-400">Admin Portal</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item, index) => {
            const IconComponent = Icons[item.icon as keyof typeof Icons]
            const isActive = pathname === item.href
            return (
              <Link
                key={index}
                href={item.href}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white font-semibold shadow-lg"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-full" />
                )}
                <IconComponent className={`h-4 w-4 transition-colors duration-200 ${
                  isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-indigo-400"
                }`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className={`${
                      isActive ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/50" : "bg-slate-700 text-slate-300"
                    } h-5 min-w-5 px-1.5 text-xs font-bold`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Portal Switcher */}
        <div className="border-t border-slate-800/50 p-3 space-y-1">
          <div className="text-xs font-semibold text-slate-400 px-3 py-2">Switch Portal</div>
          <Link
            href="/"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <span>Staff Portal</span>
          </Link>
          <Link
            href="/client"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
              <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            </svg>
            <span>Client Portal</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-rose-600/20 hover:text-red-300 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200"
          >
            <Icons.LogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icons.Search />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-64 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Icons.Bell />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500" />
            </Button>
            <Link href="/admin/profile">
              <Button variant="ghost" className="gap-2">
                <Avatar className="size-7">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.name}</span>
                <Icons.ChevronDown />
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-background p-6">{children}</div>
      </main>
    </div>
  )
}
