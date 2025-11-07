"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  User,
  CheckSquare,
  Coffee,
  Activity,
  Star,
  Users,
  MessageSquare,
  FileText,
  Menu,
  X,
  Headphones,
  Trophy,
  LogOut,
  Clock,
  Building2,
  ClipboardCheck,
  Settings,
  UserMinus,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NotificationBadge } from "@/components/notification-badge"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/profile", icon: User, label: "My Profile" },
  { href: "/client-company", icon: Building2, label: "Client" },
  { href: "/onboarding", icon: ClipboardCheck, label: "Onboarding" },
  { href: "/team", icon: Users, label: "Staff" },
  { href: "/time-tracking", icon: Clock, label: "Time Tracking" },
  { href: "/analytics", icon: Activity, label: "Analytics" },
  { href: "/staff/tickets", icon: Headphones, label: "Tickets" },
  { href: "/performance-reviews", icon: Star, label: "Performance Reviews" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/ai-assistant", icon: MessageSquare, label: "AI Assistant" },
  { href: "/activity", icon: FileText, label: "The Feed" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/offboarding", icon: UserMinus, label: "Offboarding" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [todayActivity, setTodayActivity] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [onboardingStatus, setOnboardingStatus] = useState<{ completionPercent: number } | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfileData()
      fetchOnboardingStatus()
    }
  }, [status])

  const fetchProfileData = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
        
        // Check if user has started (start date has passed)
        if (data.profile?.startDate) {
          const startDate = new Date(data.profile.startDate)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          setHasStarted(startDate <= today)
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error)
    } finally {
      setLoadingProfile(false)
    }
  }

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/onboarding/status")
      if (response.ok) {
        const data = await response.json()
        setOnboardingStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch onboarding status:", error)
    }
  }

  // Filter nav items - hide onboarding after start date
  const filteredNavItems = hasStarted 
    ? navItems.filter(item => item.label !== "Onboarding")
    : navItems

  const handleLogout = async () => {
    setIsOpen(false)
    
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

  // Get user initials
  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    const parts = name.split(" ")
    if (parts.length >= 2) return parts[0][0] + parts[1][0]
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass fixed left-4 top-4 z-50 rounded-xl p-3 text-white shadow-xl transition-transform hover:scale-105 lg:hidden"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform shadow-2xl transition-transform duration-300 lg:translate-x-0 bg-linear-to-b from-slate-900 via-purple-900/20 to-slate-900 border-r border-purple-200/20 backdrop-blur-sm ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ScrollArea className="h-full">
          <div className="space-y-6 p-6">
            <div className="space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white shadow-lg bg-linear-to-r from-cyan-600 via-blue-600 to-purple-600">
                SP
              </div>
              <h1 className="bg-linear-to-r from-white via-cyan-200 to-white bg-clip-text text-2xl font-bold text-transparent">Staff Portal</h1>
              <p className="text-sm text-white/60">Performance Dashboard</p>
            </div>

            <div className="space-y-3 rounded-xl p-4 bg-linear-to-br from-purple-50/10 to-cyan-50/10 backdrop-blur-sm border border-purple-200/20">
              <div className="flex items-center gap-3">
                {loadingProfile ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg bg-linear-to-r from-cyan-600 via-blue-600 to-purple-600">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                ) : profileData?.user?.avatar ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-cyan-400/30">
                    <Image
                      src={profileData.user.avatar}
                      alt={profileData.user.name || "User"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg bg-linear-to-r from-cyan-600 via-blue-600 to-purple-600">
                    {getUserInitials(session?.user?.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">
                    {status === "loading" ? "Loading..." : session?.user?.name || "Guest"}
                  </div>
                  <div className="text-xs text-white/60 break-all">
                    {session?.user?.email || "Not logged in"}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-purple-200/20 pt-3">
                <span className="text-xs text-white/60">
                  {session?.user?.role || "STAFF"}
                </span>
                {/* Check if user is active based on profile data or session status */}
                {isMounted && (
                  /* @ts-ignore - active field exists but not in generated types yet */
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white border ${
                    profileData?.user?.active === false
                      ? "bg-linear-to-r from-red-500/20 to-red-600/20 border-red-400/30"
                      : "bg-linear-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400/30"
                  }`}>
                    {status === "authenticated" ? (profileData?.user?.active === false ? "Inactive" : "Active") : "Offline"}
                  </span>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                     className={`group relative flex items-center gap-3 rounded-lg px-4 py-2.5 font-medium transition-all duration-300 ${
                       isActive 
                         ? "bg-linear-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 text-white shadow-lg border-l-4 border-cyan-400"  
                         : "text-white/70 hover:bg-slate-800/30 hover:text-white"
                     }`}
                   >
                    <Icon className={`h-5 w-5 transition-colors duration-300 ${
                      isActive ? "text-cyan-400" : "text-white/70 group-hover:text-cyan-400"
                    }`} />
                    <span className={isActive ? "font-semibold" : ""}>{item.label}</span>
                    {item.label === "The Feed" && (
                      <NotificationBadge className="ml-auto" />
                    )}
                    {item.label === "Onboarding" && onboardingStatus && onboardingStatus.completionPercent < 100 && (
                      <span className="ml-auto flex h-2 w-2 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse" />
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="space-y-3 rounded-xl p-4 bg-linear-to-br from-slate-900/80 via-blue-900/20 to-slate-900/80 backdrop-blur-sm border border-purple-200/20">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Today's Activity</div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Active Time</span>
                  <span className="rounded-full bg-linear-to-r from-cyan-500 via-blue-500 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    {todayActivity 
                      ? `${Math.floor(todayActivity.activeTime / 3600)}h ${Math.floor((todayActivity.activeTime % 3600) / 60)}m`
                      : "0h 0m"
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Tasks Done</span>
                  <span className="rounded-full bg-linear-to-r from-cyan-500 via-blue-500 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    {todayActivity?.tasksDone || "0/0"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Breaks Taken</span>
                  <span className="rounded-full bg-linear-to-r from-cyan-500 via-blue-500 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    {todayActivity?.breaksTaken || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Portal Switcher - Dev Only */}
            <Link
              href="/client"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg border border-purple-200/20 bg-linear-to-r from-purple-500/10 to-cyan-500/10 px-4 py-3 font-medium text-white/70 transition-all hover:bg-linear-to-r hover:from-purple-500/20 hover:to-cyan-500/20 hover:text-white active:scale-95"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Client Portal →</span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-lg bg-linear-to-r from-red-500/10 to-pink-500/10 px-4 py-3 font-medium text-red-400 transition-all hover:bg-linear-to-r hover:from-red-500/20 hover:to-pink-500/20 hover:text-red-300 hover:shadow-lg hover:shadow-red-500/30 active:scale-95"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </ScrollArea>
      </aside>
    </>
  )
}
