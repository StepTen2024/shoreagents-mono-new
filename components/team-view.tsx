"use client"

import { useState, useEffect } from "react"
import {
  Users, Mail, Phone, MapPin, Briefcase, MessageSquare,
  Trophy, Target, TrendingUp, Award, Heart, Flame
} from "lucide-react"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar: string
  client: string
  status: "online" | "away" | "offline"
  currentTask: string | null
  mood: string | null
  tasksCompleted: number
  pointsEarned: number
  streakDays: number
}

export default function TeamView() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [clientName, setClientName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/team")
      if (!response.ok) throw new Error("Failed to fetch team members")
      const data = await response.json()
      setTeamMembers(data.members || [])
      setClientName(data.clientName || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team")
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    online: { label: "Online", color: "bg-emerald-500", dotColor: "bg-emerald-500" },
    away: { label: "Away", color: "bg-amber-500", dotColor: "bg-amber-500" },
    offline: { label: "Offline", color: "bg-slate-500", dotColor: "bg-slate-500" },
  }

  const teamStats = {
    totalMembers: teamMembers.length,
    online: teamMembers.filter(m => m.status === "online").length,
    totalPoints: teamMembers.reduce((acc, m) => acc + m.pointsEarned, 0),
    totalTasks: teamMembers.reduce((acc, m) => acc + m.tasksCompleted, 0),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-700">
          <div className="h-32 rounded-xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 rounded-xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Team</h2>
            <p className="mt-2 text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-700">
        {/* Header with Team Stats */}
        <div className="rounded-2xl bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                <Users className="h-8 w-8 text-blue-400" />
                {clientName ? `${clientName} Team` : "Team Overview"}
              </h1>
              <p className="mt-1 text-slate-300">
                {clientName 
                  ? `Your teammates working on ${clientName}` 
                  : "Your team's activity and performance"}
              </p>
            </div>
          </div>

          {/* Team Stats Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-white/10 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{teamStats.totalMembers}</div>
              <div className="text-xs text-slate-400">Total Members</div>
            </div>
            <div className="rounded-xl bg-emerald-500/20 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{teamStats.online}</div>
              <div className="text-xs text-emerald-300">Online Now</div>
            </div>
            <div className="rounded-xl bg-purple-500/20 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{teamStats.totalPoints.toLocaleString()}</div>
              <div className="text-xs text-purple-300">Total Points</div>
            </div>
            <div className="rounded-xl bg-blue-500/20 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{teamStats.totalTasks}</div>
              <div className="text-xs text-blue-300">Tasks Completed</div>
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className={`space-y-4 rounded-2xl bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 transition-all hover:scale-[1.02] ${
                member.status === "online" ? "ring-emerald-500/50" : "ring-white/10"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 text-xl font-bold text-white ring-1 ring-white/20 overflow-hidden">
                    {member.avatar && member.avatar !== "/placeholder-user.jpg" ? (
                      <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{member.name.split(" ").map(n => n[0]).join("").toUpperCase()}</span>
                    )}
                    <div
                      className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-slate-900 ${statusConfig[member.status].dotColor}`}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{member.name}</h3>
                    <p className="text-sm text-slate-400">{member.role}</p>
                  </div>
                </div>
              </div>

              {/* Current Task & Mood */}
              <div className="space-y-2">
                {member.currentTask && (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 p-3 ring-1 ring-white/5">
                    <Briefcase className="h-5 w-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-400">Working On</div>
                      <div className="font-semibold text-white line-clamp-1">{member.currentTask}</div>
                    </div>
                  </div>
                )}
                {member.mood && (
                  <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 p-3 ring-1 ring-white/5">
                    <Heart className="h-5 w-5 text-slate-400" />
                    <div>
                      <div className="text-xs text-slate-400">Mood</div>
                      <div className="font-semibold text-white">{member.mood}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-blue-500/10 p-2 text-center ring-1 ring-blue-500/30">
                  <div className="text-lg font-bold text-white">{member.pointsEarned}</div>
                  <div className="text-xs text-blue-400">Points</div>
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-2 text-center ring-1 ring-emerald-500/30">
                  <div className="text-lg font-bold text-white">{member.tasksCompleted}</div>
                  <div className="text-xs text-emerald-400">Tasks</div>
                </div>
                <div className="rounded-lg bg-orange-500/10 p-2 text-center ring-1 ring-orange-500/30">
                  <div className="text-lg font-bold text-white">{member.streakDays}</div>
                  <div className="text-xs text-orange-400">Streak</div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Briefcase className="h-4 w-4" />
                  <span>{member.client}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-400 ring-1 ring-blue-500/30 transition-all hover:bg-blue-500/20">
                  <MessageSquare className="h-4 w-4" />
                  Message
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-500/10 px-3 py-2 text-sm font-medium text-purple-400 ring-1 ring-purple-500/30 transition-all hover:bg-purple-500/20">
                  <Award className="h-4 w-4" />
                  Kudos
                </button>
              </div>
            </div>
          ))}
        </div>

        {teamMembers.length === 0 && (
          <div className="rounded-xl bg-slate-900/50 p-12 text-center backdrop-blur-xl ring-1 ring-white/10">
            <p className="text-slate-400">No team members found</p>
          </div>
        )}

        {/* Team Goals */}
        <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
            <Target className="h-6 w-6 text-blue-400" />
            Team Goals & Milestones
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Weekly Task Target</div>
                  <div className="text-sm text-slate-400">Complete 100 tasks as a team</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{teamStats.totalTasks}/100</div>
                  <div className="text-xs text-slate-400">{Math.round((teamStats.totalTasks / 100) * 100)}%</div>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${Math.min((teamStats.totalTasks / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
            <Trophy className="h-6 w-6 text-amber-400" />
            Top Performers This Week
          </h2>
          <div className="space-y-2">
            {teamMembers
              .sort((a, b) => b.pointsEarned - a.pointsEarned)
              .slice(0, 5)
              .map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold ${
                      index === 0 ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white" :
                      index === 1 ? "bg-gradient-to-br from-slate-400 to-slate-500 text-white" :
                      index === 2 ? "bg-gradient-to-br from-orange-600 to-orange-700 text-white" :
                      "bg-slate-700 text-slate-300"
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{member.name}</div>
                      <div className="text-sm text-slate-400">{member.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">{member.pointsEarned}</div>
                    <div className="text-xs text-slate-400">points</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
