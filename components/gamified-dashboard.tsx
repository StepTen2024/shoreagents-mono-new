"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CheckSquare, Coffee, Star, Headphones, Trophy, Activity, MessageSquare,
  Calendar, Clock, TrendingUp, AlertCircle, Users
} from "lucide-react"
import { TimeTrackingWidget } from "./dashboard/time-tracking-widget"
import { ScheduleWidget } from "./dashboard/schedule-widget"

interface DashboardData {
  tasks: any[]
  reviews: any[]
  tickets: any[]
  posts: any[]
  leaderboard: any
}

interface OnboardingStatus {
  exists: boolean
  completionPercent: number
  isComplete: boolean
}

export default function GamifiedDashboard() {
  const [data, setData] = useState<DashboardData>({
    tasks: [],
    reviews: [],
    tickets: [],
    posts: [],
    leaderboard: null,
  })
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)
  const [userName, setUserName] = useState("there")
  const [welcomeFormStatus, setWelcomeFormStatus] = useState<{ needsCompletion: boolean } | null>(null)

  useEffect(() => {
    // Update time
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)

    // Fetch all dashboard data
    fetchDashboardData()
    fetchOnboardingStatus()
    fetchUserName()

    return () => clearInterval(interval)
  }, [])

  // Check welcome form status
  const checkWelcomeFormStatus = async () => {
    // Only check once - if we already have a status, don't check again
    if (welcomeFormStatus !== null) return
    
    try {
      const response = await fetch('/api/welcome')
      const data = await response.json()
      
      // Handle both 200 (not submitted) and 400 (already submitted) responses
      if (response.ok || response.status === 400) {
        setWelcomeFormStatus({ needsCompletion: !data.alreadySubmitted })
        console.log('✅ [WELCOME CHECK] Status cached:', !data.alreadySubmitted ? 'needs completion' : 'already submitted')
      }
    } catch (error) {
      console.error('Failed to check welcome form status:', error)
    }
  }

  // Check if onboarding is complete and redirect to welcome form
  useEffect(() => {
    if (onboardingStatus?.isComplete && onboardingStatus.completionPercent === 100 && welcomeFormStatus === null) {
      checkWelcomeFormStatus()
    }
  }, [onboardingStatus, welcomeFormStatus])

  const fetchUserName = async () => {
    try {
      const response = await fetch("/api/onboarding")
      if (response.ok) {
        const data = await response.json()
        if (data.onboarding?.firstName) {
          setUserName(data.onboarding.firstName)
        } else if (data.user?.name) {
          // Fallback to user name from session
          const firstName = data.user.name.split(' ')[0]
          setUserName(firstName)
        }
      }
    } catch (err) {
      console.error("Error fetching user name:", err)
    }
  }

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/onboarding/status")
      if (response.ok) {
        const data = await response.json()
        setOnboardingStatus(data)
      }
    } catch (err) {
      console.error("Error fetching onboarding status:", err)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, reviewsRes, ticketsRes, postsRes, leaderboardRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/performance-reviews"),
        fetch("/api/tickets"),
        fetch("/api/posts"),
        fetch("/api/leaderboard?period=all_time"),
      ])

      const [tasks, reviews, tickets, posts, leaderboard] = await Promise.all([
        tasksRes.json(),
        reviewsRes.json(),
        ticketsRes.json(),
        postsRes.json(),
        leaderboardRes.json(),
      ])

      setData({
        tasks: tasks.tasks || [],
        reviews: reviews.reviews || [],
        tickets: tickets.tickets || [],
        posts: posts.posts || [],
        leaderboard: leaderboard.currentUser || null,
      })
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { href: "/time-tracking", icon: Clock, label: "Time Tracking" },
    { href: "/tasks", icon: CheckSquare, label: "Manage Tasks" },
    { href: "/performance-reviews", icon: Star, label: "View Reviews" },
    { href: "/tickets", icon: Headphones, label: "Support Tickets" },
  ]

  const todaysTasks = data.tasks.filter(t => t.status !== "COMPLETED").slice(0, 5)
  const pendingReviews = data.reviews.filter(r => r.status === "PENDING")
  const openTickets = data.tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS")
  const recentPosts = data.posts.slice(0, 3)

  const quickStats = [
    { value: todaysTasks.length, label: "Tasks Open" },
    { value: pendingReviews.length, label: "Reviews Pending" },
    { value: openTickets.length, label: "Tickets Open" },
    { value: data.leaderboard?.rank || "-", label: "Your Rank" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="h-32 rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 animate-pulse" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 animate-pulse" />
              <div className="h-64 rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-48 rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 animate-pulse" />
              <div className="h-48 rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-700">
        {/* Welcome Header & Quick Stats */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white md:text-5xl">Welcome back, {userName}!</h1>
            <p className="text-lg text-slate-400">{currentDate} • {currentTime}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {quickStats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center justify-center rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 p-4 text-center shadow-xl transition-all duration-500 hover:scale-[1.02] hover:ring-white/20 hover:shadow-indigo-500/30">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs font-medium uppercase tracking-wider text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Tracking Widget */}
        <TimeTrackingWidget />

        {/* Schedule Widget */}
        <ScheduleWidget />

        {/* Welcome Form Banner */}
        {onboardingStatus?.isComplete && welcomeFormStatus?.needsCompletion && (
          <Link href="/welcome" className="block mb-6">
            <div className="cursor-pointer rounded-2xl border-2 p-5 shadow-xl backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] border-purple-500/50 bg-linear-to-r from-purple-900/30 to-pink-900/30 hover:border-purple-500 hover:shadow-purple-500/30">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="shrink-0 rounded-full p-2.5 bg-purple-500">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-white mb-0.5">
                      🎉 Welcome to the Team!
                    </h3>
                    <p className="text-xs text-slate-300 leading-tight">
                      Your onboarding is complete! Let's get to know you better with a quick welcome form.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="rounded-full px-5 py-2 text-sm font-semibold whitespace-nowrap transition-colors bg-purple-500 text-white hover:bg-purple-400">
                    Complete Welcome Form →
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Onboarding Banner */}
        {onboardingStatus && !onboardingStatus.isComplete && (
          <Link href={onboardingStatus.completionPercent === 100 ? "/onboarding/status" : "/onboarding"} className="block mb-6">
            <div className={`cursor-pointer rounded-2xl border-2 p-5 shadow-xl backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] ${
              onboardingStatus.completionPercent === 100
                ? "border-blue-500/50 bg-linear-to-r from-blue-900/30 to-indigo-900/30 hover:border-blue-500 hover:shadow-blue-500/30"
                : "border-yellow-500/50 bg-linear-to-r from-yellow-900/30 to-orange-900/30 hover:border-yellow-500 hover:shadow-yellow-500/30"
            }`}>
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`shrink-0 rounded-full p-2.5 ${
                    onboardingStatus.completionPercent === 100 ? "bg-blue-500" : "bg-yellow-500"
                  }`}>
                    {onboardingStatus.completionPercent === 100 ? (
                      <Clock className="h-5 w-5 text-white" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-900" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-white mb-0.5">
                      {onboardingStatus.completionPercent === 100 
                        ? "⏳ Awaiting Admin Verification" 
                        : "Complete Your Onboarding"}
                    </h3>
                    <p className="text-xs text-slate-300 leading-tight">
                      {onboardingStatus.completionPercent === 100
                        ? "You've completed all sections! Our team is reviewing your documents. Click to view detailed status."
                        : `You're ${onboardingStatus.completionPercent}% done! Complete your profile to unlock all features.`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white leading-none">
                      {onboardingStatus.completionPercent}%
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {onboardingStatus.completionPercent === 100 ? "Submitted" : "Complete"}
                    </div>
                  </div>
                  <div className={`rounded-full px-5 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                    onboardingStatus.completionPercent === 100 
                      ? "bg-blue-500 text-white hover:bg-blue-400"
                      : "bg-yellow-500 text-yellow-900 hover:bg-yellow-400"
                  }`}>
                    {onboardingStatus.completionPercent === 100 ? "View Status →" : "Continue →"}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                  <div
                    className={`h-full transition-all duration-500 ${
                      onboardingStatus.completionPercent === 100
                        ? "bg-linear-to-r from-blue-500 to-indigo-500"
                        : "bg-linear-to-r from-yellow-500 to-orange-500"
                    }`}
                    style={{ width: `${onboardingStatus.completionPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="flex items-center justify-center gap-3 rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 p-5 text-lg font-bold text-white shadow-xl transition-all duration-500 hover:scale-[1.02] hover:ring-white/20 hover:shadow-indigo-500/30"
            >
              <action.icon className="h-6 w-6" />
              {action.label}
            </Link>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-8 lg:col-span-2">
            {/* Today's Tasks */}
            <div className="space-y-4 rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 p-6 shadow-xl transition-all duration-500 hover:ring-white/20 hover:shadow-indigo-500/30">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Today's Tasks</h2>
                <Link href="/tasks" className="text-sm text-blue-400 hover:underline">View All →</Link>
              </div>
              {todaysTasks.length === 0 ? (
                <p className="text-slate-400">No open tasks. Great job! 🎉</p>
              ) : (
                <div className="space-y-2">
                  {todaysTasks.map((task) => (
                    <div key={task.id} className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{task.title}</h3>
                          <p className="mt-1 text-sm text-slate-400 line-clamp-1">{task.description}</p>
                        </div>
                        <span className={`ml-2 rounded-full px-2 py-1 text-xs font-semibold ${
                          task.status === "TODO" ? "bg-slate-500/20 text-slate-400" :
                          task.status === "IN_PROGRESS" ? "bg-blue-500/20 text-blue-400" :
                          task.status === "STUCK" ? "bg-red-500/20 text-red-400" :
                          "bg-purple-500/20 text-purple-400"
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Team Activity */}
            <div className="space-y-4 rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 p-6 shadow-xl transition-all duration-500 hover:ring-white/20 hover:shadow-indigo-500/30">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Recent Team Activity</h2>
                {/* <Link href="/activity" className="text-sm text-blue-400 hover:underline">View Feed →</Link> */}
              </div>
              {recentPosts.length === 0 ? (
                <p className="text-slate-400">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                      <p className="text-sm text-white line-clamp-2">{post.content}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8 lg:col-span-1">
            {/* Your Rank */}
            {data.leaderboard && (
              <div className="space-y-4 rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 p-6 shadow-xl transition-all duration-500 hover:ring-white/20 hover:shadow-indigo-500/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Your Rank</h2>
                  <Link href="/leaderboard" className="text-sm text-blue-400 hover:underline">Full Board →</Link>
                </div>
                <div className="text-center">
                  <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-500 text-3xl font-bold text-white ring-4 ring-blue-400/50">
                    #{data.leaderboard.rank}
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold text-white">{data.leaderboard.points} pts</div>
                    <div className="text-sm text-slate-400">Level {data.leaderboard.level}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Reviews */}
            {pendingReviews.length > 0 && (
              <div className="space-y-4 rounded-2xl p-6 shadow-xl backdrop-blur-xl ring-1 ring-amber-500/50 bg-amber-900/20 transition-all duration-500 hover:ring-amber-500 hover:shadow-amber-500/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Pending Reviews</h2>
                  <Link href="/performance-reviews" className="text-sm text-blue-400 hover:underline">View All →</Link>
                </div>
                <div className="space-y-2">
                  {pendingReviews.slice(0, 2).map((review) => (
                    <div key={review.id} className="rounded-xl bg-amber-500/10 p-4 ring-1 ring-amber-500/30">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-400" />
                        <div>
                          <p className="font-semibold text-white">{review.type.replace('_', ' ')} Review</p>
                          <p className="text-xs text-slate-400">{review.client}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support Tickets */}
            <div className="space-y-4 rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 p-6 shadow-xl transition-all duration-500 hover:ring-white/20 hover:shadow-indigo-500/30">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Support Tickets</h2>
                <Link href="/tickets" className="text-sm text-blue-400 hover:underline">View All →</Link>
              </div>
              {openTickets.length === 0 ? (
                <p className="text-slate-400">No open tickets</p>
              ) : (
                <div className="space-y-2">
                  {openTickets.slice(0, 3).map((ticket) => (
                    <div key={ticket.id} className="rounded-xl bg-slate-800/50 p-3 ring-1 ring-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white line-clamp-1">{ticket.title}</p>
                          <p className="text-xs text-slate-400">{ticket.category.replace('_', ' ')}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                          ticket.status === "OPEN" ? "bg-blue-500" :
                          ticket.status === "IN_PROGRESS" ? "bg-amber-500" :
                          "bg-emerald-500"
                        } text-white`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
