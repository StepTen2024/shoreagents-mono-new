"use client"

import { useState, useEffect } from "react"
import { Trophy, TrendingUp, TrendingDown, Award, Zap, Crown, Medal, Star, Flame } from "lucide-react"

interface LeaderboardEntry {
  id: string
  name: string
  points: number
  level: number
  tasksCompleted: number
  performanceScore: number
  reviewRating: number
  streakDays: number
  rank: number
  rankChange: number
}

export default function Leaderboard() {
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timePeriod, setTimePeriod] = useState<"this_week" | "this_month" | "all_time">("all_time")

  useEffect(() => {
    fetchLeaderboard()
  }, [timePeriod])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leaderboard?period=${timePeriod}`)
      if (!response.ok) throw new Error("Failed to fetch leaderboard")
      const data = await response.json()
      setRankings(data.rankings)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard")
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-8 w-8 text-amber-300" />
      case 2:
        return <Medal className="h-8 w-8 text-slate-300" />
      case 3:
        return <Award className="h-8 w-8 text-orange-400" />
      default:
        return null
    }
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "from-amber-500/30 to-orange-500/30 ring-amber-400/50"
      case 2:
        return "from-slate-600/30 to-slate-700/30 ring-slate-500/50"
      case 3:
        return "from-orange-600/30 to-orange-700/30 ring-orange-500/50"
      default:
        return "from-slate-800/50 to-slate-900/50 ring-white/10"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-slate-800/50 animate-pulse" />
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
            <h2 className="text-xl font-bold text-red-400">Error Loading Leaderboard</h2>
            <p className="mt-2 text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const currentUser = rankings.find((entry) => entry.name === "Maria Santos")
  const topThree = rankings.slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-900/50 via-orange-900/50 to-amber-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                <Trophy className="h-8 w-8 text-amber-400" />
                Leaderboard
              </h1>
              <p className="mt-1 text-slate-300">Team rankings and achievements</p>
            </div>
            <div className="flex gap-2">
              {(["this_week", "this_month", "all_time"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    timePeriod === period
                      ? "bg-white/20 text-white"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {period === "this_week" && "This Week"}
                  {period === "this_month" && "This Month"}
                  {period === "all_time" && "All Time"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current User Rank */}
        {currentUser && (
          <div className="rounded-2xl bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-purple-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
            <h2 className="mb-4 text-xl font-bold text-white">Your Current Rank</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-3xl font-bold text-white ring-4 ring-blue-400/50">
                  #{currentUser.rank}
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{currentUser.points} points</p>
                  <p className="text-slate-300">Level {currentUser.level} • {currentUser.streakDays} day streak</p>
                  {currentUser.rankChange !== 0 && (
                    <div className="mt-1 flex items-center gap-1">
                      {currentUser.rankChange > 0 ? (
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      <span className={currentUser.rankChange > 0 ? "text-emerald-400" : "text-red-400"}>
                        {Math.abs(currentUser.rankChange)} from last week
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        <div className="relative flex items-end justify-center gap-4">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className={`h-48 w-full rounded-t-2xl bg-gradient-to-br p-6 ring-2 ${getRankStyle(2)}`}>
              <div className="flex flex-col items-center text-center">
                {getRankIcon(2)}
                <div className="mt-2 text-4xl font-bold text-slate-300">2nd</div>
                <div className="mt-2 font-semibold text-white">{topThree[1].name}</div>
                <div className="mt-1 text-2xl font-bold text-white">{topThree[1].points}</div>
                <div className="text-xs text-slate-400">points</div>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className={`z-10 h-60 w-full rounded-t-2xl bg-gradient-to-br p-6 ring-2 ${getRankStyle(1)}`}>
              <div className="flex flex-col items-center text-center">
                {getRankIcon(1)}
                <div className="mt-2 text-5xl font-bold text-amber-300">1st</div>
                <div className="mt-2 font-semibold text-white">{topThree[0].name}</div>
                <div className="mt-1 text-3xl font-bold text-white">{topThree[0].points}</div>
                <div className="text-xs text-slate-400">points</div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className={`h-40 w-full rounded-t-2xl bg-gradient-to-br p-6 ring-2 ${getRankStyle(3)}`}>
              <div className="flex flex-col items-center text-center">
                {getRankIcon(3)}
                <div className="mt-2 text-3xl font-bold text-orange-400">3rd</div>
                <div className="mt-2 font-semibold text-white">{topThree[2].name}</div>
                <div className="mt-1 text-xl font-bold text-white">{topThree[2].points}</div>
                <div className="text-xs text-slate-400">points</div>
              </div>
            </div>
          )}
        </div>

        {/* Full Rankings */}
        <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
          <h2 className="mb-4 text-xl font-bold text-white">Full Rankings</h2>
          <div className="space-y-2">
            {rankings.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between rounded-xl p-4 ring-1 transition-all hover:bg-slate-800/50 ${
                  entry.name === "Maria Santos"
                    ? "bg-blue-500/10 ring-blue-500/30"
                    : "bg-slate-800/30 ring-white/5"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${
                    entry.rank <= 3 ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white" : "bg-slate-700 text-slate-300"
                  }`}>
                    #{entry.rank}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{entry.name}</div>
                    <div className="text-sm text-slate-400">Level {entry.level}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-white">{entry.points}</div>
                    <div className="text-slate-400">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-white">{entry.tasksCompleted}</div>
                    <div className="text-slate-400">Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-white">{entry.performanceScore}%</div>
                    <div className="text-slate-400">Performance</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-0.5 font-bold text-white">
                      <Star className="h-4 w-4 text-amber-400" fill="currentColor" />
                      {entry.reviewRating.toFixed(1)}
                    </div>
                    <div className="text-slate-400">Review</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 font-bold text-white">
                      <Flame className="h-4 w-4 text-orange-400" />
                      {entry.streakDays}
                    </div>
                    <div className="text-slate-400">Streak</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
