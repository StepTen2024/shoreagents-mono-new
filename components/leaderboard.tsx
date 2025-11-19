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
        return "from-amber-100 to-orange-100 ring-amber-400 border-amber-300"
      case 2:
        return "from-slate-100 to-slate-200 ring-slate-400 border-slate-300"
      case 3:
        return "from-orange-100 to-orange-200 ring-orange-400 border-orange-300"
      default:
        return "from-slate-50 to-slate-100 ring-slate-300 border-slate-200"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-32 rounded-xl bg-slate-200 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl bg-red-50 p-6 ring-1 ring-red-200 border border-red-200">
            <h2 className="text-xl font-bold text-red-700">Error Loading Leaderboard</h2>
            <p className="mt-2 text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const currentUser = rankings.find((entry) => entry.name === "Maria Santos")
  const topThree = rankings.slice(0, 3)

  return (
    <div className="min-h-screen p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 p-6 shadow-xl ring-1 ring-amber-200 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                <Trophy className="h-8 w-8 text-amber-600" />
                Leaderboard
              </h1>
              <p className="mt-1 text-gray-700">Team rankings and achievements</p>
            </div>
            <div className="flex gap-2">
              {(["this_week", "this_month", "all_time"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    timePeriod === period
                      ? "bg-amber-600 text-white"
                      : "text-gray-700 hover:bg-amber-100 hover:text-gray-900"
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
          <div className="rounded-2xl bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 p-6 shadow-xl ring-1 ring-purple-200 border border-purple-200">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Your Current Rank</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-3xl font-bold text-white ring-4 ring-blue-300">
                  #{currentUser.rank}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{currentUser.points} points</p>
                  <p className="text-gray-700">Level {currentUser.level} • {currentUser.streakDays} day streak</p>
                  {currentUser.rankChange !== 0 && (
                    <div className="mt-1 flex items-center gap-1">
                      {currentUser.rankChange > 0 ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={currentUser.rankChange > 0 ? "text-emerald-600" : "text-red-600"}>
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
            <div className={`h-48 w-full rounded-t-2xl bg-gradient-to-br p-6 ring-2 border ${getRankStyle(2)}`}>
              <div className="flex flex-col items-center text-center">
                {getRankIcon(2)}
                <div className="mt-2 text-4xl font-bold text-slate-700">2nd</div>
                <div className="mt-2 font-semibold text-gray-900">{topThree[1].name}</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">{topThree[1].points}</div>
                <div className="text-xs text-gray-600">points</div>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className={`z-10 h-60 w-full rounded-t-2xl bg-gradient-to-br p-6 ring-2 border ${getRankStyle(1)}`}>
              <div className="flex flex-col items-center text-center">
                {getRankIcon(1)}
                <div className="mt-2 text-5xl font-bold text-amber-600">1st</div>
                <div className="mt-2 font-semibold text-gray-900">{topThree[0].name}</div>
                <div className="mt-1 text-3xl font-bold text-gray-900">{topThree[0].points}</div>
                <div className="text-xs text-gray-600">points</div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className={`h-40 w-full rounded-t-2xl bg-gradient-to-br p-6 ring-2 border ${getRankStyle(3)}`}>
              <div className="flex flex-col items-center text-center">
                {getRankIcon(3)}
                <div className="mt-2 text-3xl font-bold text-orange-600">3rd</div>
                <div className="mt-2 font-semibold text-gray-900">{topThree[2].name}</div>
                <div className="mt-1 text-xl font-bold text-gray-900">{topThree[2].points}</div>
                <div className="text-xs text-gray-600">points</div>
              </div>
            </div>
          )}
        </div>

        {/* Full Rankings */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 border border-slate-200 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Full Rankings</h2>
          <div className="space-y-2">
            {rankings.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between rounded-xl p-4 ring-1 transition-all hover:shadow-md ${
                  entry.name === "Maria Santos"
                    ? "bg-blue-50 ring-blue-200 border border-blue-200"
                    : "bg-slate-50 ring-slate-200 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${
                    entry.rank <= 3 ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white" : "bg-slate-200 text-slate-700"
                  }`}>
                    #{entry.rank}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{entry.name}</div>
                    <div className="text-sm text-gray-600">Level {entry.level}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{entry.points}</div>
                    <div className="text-gray-600">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{entry.tasksCompleted}</div>
                    <div className="text-gray-600">Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{entry.performanceScore}%</div>
                    <div className="text-gray-600">Performance</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-0.5 font-bold text-gray-900">
                      <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
                      {entry.reviewRating.toFixed(1)}
                    </div>
                    <div className="text-gray-600">Review</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 font-bold text-gray-900">
                      <Flame className="h-4 w-4 text-orange-500" />
                      {entry.streakDays}
                    </div>
                    <div className="text-gray-600">Streak</div>
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
