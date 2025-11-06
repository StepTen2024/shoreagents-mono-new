"use client"

import { useState, useEffect } from "react"
import { Trophy, Crown, Medal, Award, Flame, Star, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export default function AdminLeaderboardPage() {
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timePeriod, setTimePeriod] = useState<"all_time" | "this_month" | "this_week">("all_time")

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
        return <Crown className="h-6 w-6 text-foreground" />
      case 2:
        return <Medal className="h-6 w-6 text-muted-foreground" />
      case 3:
        return <Award className="h-6 w-6 text-muted-foreground" />
      default:
        return <div className="h-6 w-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</div>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
      case 2:
        return "bg-muted text-foreground border border-border"
      case 3:
        return "bg-muted text-foreground border border-border"
      default:
        return "bg-muted text-muted-foreground border border-border"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <h2 className="text-lg font-semibold text-red-900">Error Loading Leaderboard</h2>
          <p className="mt-2 text-red-700">{error}</p>
        </Card>
      </div>
    )
  }

  const topThree = rankings.slice(0, 3)
  const restOfRankings = rankings.slice(3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Staff performance rankings and achievements
          </p>
        </div>
        <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as any)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_time">All Time</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Top 3 Stats Cards */}
      {topThree.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* 2nd Place */}
          {topThree[1] && (
            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                <Medal className="h-12 w-12 text-muted-foreground mb-3" />
                <Badge className="mb-3 bg-muted text-foreground border-border">2nd Place</Badge>
                <h3 className="font-bold text-lg text-foreground">{topThree[1].name}</h3>
                <div className="mt-4 space-y-2 w-full">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Points:</span>
                    <span className="font-semibold text-foreground">{topThree[1].points.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Level:</span>
                    <span className="font-semibold text-foreground">{topThree[1].level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tasks:</span>
                    <span className="font-semibold text-foreground">{topThree[1].tasksCompleted}</span>
                  </div>
                  {topThree[1].streakDays > 0 && (
                    <div className="flex items-center justify-center gap-1 text-sm text-foreground mt-2">
                      <Flame className="h-4 w-4" />
                      <span className="font-semibold">{topThree[1].streakDays} day streak</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <Card className="p-6 md:order-first md:col-start-1 md:row-span-1">
              <div className="flex flex-col items-center text-center">
                <Crown className="h-16 w-16 text-foreground mb-3" />
                <Badge className="mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">🏆 Champion</Badge>
                <h3 className="font-bold text-xl text-foreground">{topThree[0].name}</h3>
                <div className="mt-4 space-y-2 w-full">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Points:</span>
                    <span className="font-bold text-foreground">{topThree[0].points.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Level:</span>
                    <span className="font-semibold text-foreground">{topThree[0].level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tasks:</span>
                    <span className="font-semibold text-foreground">{topThree[0].tasksCompleted}</span>
                  </div>
                  {topThree[0].reviewRating > 0 && (
                    <div className="flex items-center justify-center gap-1 text-sm text-foreground mt-2">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold">{topThree[0].reviewRating}/5.0</span>
                    </div>
                  )}
                  {topThree[0].streakDays > 0 && (
                    <div className="flex items-center justify-center gap-1 text-sm text-foreground">
                      <Flame className="h-4 w-4" />
                      <span className="font-semibold">{topThree[0].streakDays} day streak</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                <Award className="h-12 w-12 text-muted-foreground mb-3" />
                <Badge className="mb-3 bg-muted text-foreground border-border">3rd Place</Badge>
                <h3 className="font-bold text-lg text-foreground">{topThree[2].name}</h3>
                <div className="mt-4 space-y-2 w-full">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Points:</span>
                    <span className="font-semibold text-foreground">{topThree[2].points.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Level:</span>
                    <span className="font-semibold text-foreground">{topThree[2].level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tasks:</span>
                    <span className="font-semibold text-foreground">{topThree[2].tasksCompleted}</span>
                  </div>
                  {topThree[2].streakDays > 0 && (
                    <div className="flex items-center justify-center gap-1 text-sm text-foreground mt-2">
                      <Flame className="h-4 w-4" />
                      <span className="font-semibold">{topThree[2].streakDays} day streak</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Full Rankings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Full Rankings</h2>
        <div className="space-y-3">
          {rankings.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                entry.rank <= 3
                  ? "bg-muted/50 border-border"
                  : "bg-card border-border hover:bg-muted/50"
              }`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-12">
                {getRankIcon(entry.rank)}
              </div>

              {/* Staff Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{entry.name}</h3>
                  <Badge className={`${getRankBadgeColor(entry.rank)} text-xs border`}>
                    Level {entry.level}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {entry.points.toLocaleString()} pts
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {entry.tasksCompleted} tasks
                  </span>
                  {entry.reviewRating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {entry.reviewRating}/5.0
                    </span>
                  )}
                  {entry.streakDays > 0 && (
                    <span className="flex items-center gap-1 text-orange-600">
                      <Flame className="h-3 w-3" />
                      {entry.streakDays} days
                    </span>
                  )}
                </div>
              </div>

              {/* Performance Score */}
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">
                  {entry.performanceScore}%
                </div>
                <div className="text-xs text-muted-foreground">Performance</div>
              </div>
            </div>
          ))}

          {rankings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rankings available for this period</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

