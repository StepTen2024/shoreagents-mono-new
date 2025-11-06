"use client"

import { useState, useEffect } from "react"
import { Trophy, Zap, Calendar, TrendingUp, Award, Flame, Target, Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface DailyScore {
  id: string
  date: string
  totalScore: number
  attendanceScore: number
  breakScore: number
  activityScore: number
  focusScore: number
  energyLevel: "HIGH" | "MEDIUM" | "LOW"
  achievements: string[]
  streak: number
  clockedInAt: string | null
  wasEarly: boolean
  earlyBy: number | null
}

interface WeekSummary {
  totalScoreAvg: number
  attendanceAvg: number
  breakAvg: number
  activityAvg: number
  focusAvg: number
  daysTracked: number
}

export default function GamifiedAnalyticsDashboard() {
  const [todayScore, setTodayScore] = useState<DailyScore | null>(null)
  const [weekScores, setWeekScores] = useState<DailyScore[]>([])
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchScores()
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchScores()
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchScores = async () => {
    try {
      // Fetch today's score
      const todayResponse = await fetch("/api/gamification/daily-score")
      const todayData = await todayResponse.json()
      if (todayData.success) {
        setTodayScore(todayData.score)
      }

      // Fetch week scores
      const weekResponse = await fetch("/api/gamification/daily-score?range=week")
      const weekData = await weekResponse.json()
      if (weekData.success) {
        setWeekScores(weekData.scores)
        setWeekSummary(weekData.summary)
      }
    } catch (err) {
      console.error("Error fetching scores:", err)
    } finally {
      setLoading(false)
    }
  }

  const generateTodayScore = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/gamification/generate-daily-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await response.json()
      if (data.success) {
        setTodayScore(data.score)
        // Refresh week scores too
        fetchScores()
      }
    } catch (err) {
      console.error("Error generating score:", err)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your performance...</div>
      </div>
    )
  }

  const energyEmoji = {
    HIGH: "🔥",
    MEDIUM: "⚡",
    LOW: "💤",
  }

  const energyColor = {
    HIGH: "from-green-500 to-emerald-500",
    MEDIUM: "from-yellow-500 to-orange-500",
    LOW: "from-gray-500 to-slate-500",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Zap className="h-10 w-10 text-yellow-400" />
            Your Energy Today
          </h1>
          <p className="text-slate-300">Track your productivity and unlock achievements!</p>
        </div>

        {/* Main Score Card */}
        {todayScore ? (
          <Card className="p-8 bg-slate-800/50 backdrop-blur-xl border-2 border-purple-500/30 text-white">
            <div className="text-center space-y-6">
              
              {/* Energy Level Badge */}
              <div className="flex justify-center">
                <Badge 
                  className={`text-2xl px-8 py-3 bg-gradient-to-r ${energyColor[todayScore.energyLevel]} text-white font-bold`}
                >
                  {energyEmoji[todayScore.energyLevel]} {todayScore.energyLevel} ENERGY
                </Badge>
              </div>

              {/* Score Display */}
              <div className="space-y-2">
                <div className="text-7xl font-bold text-white">{todayScore.totalScore}</div>
                <div className="text-slate-400 text-lg">out of 100</div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${energyColor[todayScore.energyLevel]} transition-all duration-500`}
                  style={{ width: `${todayScore.totalScore}%` }}
                />
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="space-y-2">
                  <div className="text-slate-400 text-sm">⏰ Attendance</div>
                  <div className="text-2xl font-bold">{todayScore.attendanceScore}/25</div>
                  {todayScore.wasEarly && (
                    <div className="text-xs text-green-400">
                      {todayScore.earlyBy}m early!
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-slate-400 text-sm">☕ Breaks</div>
                  <div className="text-2xl font-bold">{todayScore.breakScore}/15</div>
                </div>
                <div className="space-y-2">
                  <div className="text-slate-400 text-sm">💪 Activity</div>
                  <div className="text-2xl font-bold">{todayScore.activityScore}/30</div>
                </div>
                <div className="space-y-2">
                  <div className="text-slate-400 text-sm">🎯 Focus</div>
                  <div className="text-2xl font-bold">{todayScore.focusScore}/30</div>
                </div>
              </div>

              {/* Achievements */}
              {todayScore.achievements.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2 justify-center">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                    Achievements Unlocked Today!
                  </h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {todayScore.achievements.map((achievement) => (
                      <Badge 
                        key={achievement}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 text-sm"
                      >
                        ✅ {achievement}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Streak */}
              {todayScore.streak > 1 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border-2 border-orange-500/30">
                  <div className="flex items-center justify-center gap-3">
                    <Flame className="h-8 w-8 text-orange-400" />
                    <div>
                      <div className="text-2xl font-bold">{todayScore.streak} Day Streak!</div>
                      <div className="text-sm text-slate-300">Keep up the high energy!</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Performer Badge */}
              {todayScore.totalScore >= 90 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border-2 border-purple-500/30">
                  <div className="text-lg font-bold">
                    🎉 You're in the top 10% today! Amazing work!
                  </div>
                </div>
              )}

            </div>
          </Card>
        ) : (
          <Card className="p-8 bg-slate-800/50 backdrop-blur-xl border-2 border-purple-500/30 text-white text-center">
            <div className="space-y-4">
              <div className="text-xl text-slate-400">No score for today yet</div>
              <p className="text-sm text-slate-500">Your score will be calculated based on your work activity</p>
              <Button 
                onClick={generateTodayScore}
                disabled={generating}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {generating ? "Generating..." : "Generate Today's Score"}
              </Button>
            </div>
          </Card>
        )}

        {/* Week Summary */}
        {weekSummary && weekSummary.daysTracked > 0 && (
          <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-2 border-blue-500/30 text-white">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-400" />
              Your Week Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-400">{weekSummary.totalScoreAvg}</div>
                <div className="text-sm text-slate-400">Avg Score</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">{weekSummary.attendanceAvg}</div>
                <div className="text-sm text-slate-400">Attendance</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">{weekSummary.breakAvg}</div>
                <div className="text-sm text-slate-400">Breaks</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">{weekSummary.activityAvg}</div>
                <div className="text-sm text-slate-400">Activity</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">{weekSummary.focusAvg}</div>
                <div className="text-sm text-slate-400">Focus</div>
              </div>
            </div>
          </Card>
        )}

        {/* Week Timeline */}
        {weekScores.length > 0 && (
          <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-2 border-green-500/30 text-white">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-400" />
              Last 7 Days
            </h3>
            <div className="space-y-3">
              {weekScores.slice(0, 7).map((score) => {
                const date = new Date(score.date)
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
                const dayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                
                return (
                  <div key={score.id} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl">
                    <div className="w-24 text-sm">
                      <div className="font-bold">{dayName}</div>
                      <div className="text-slate-400">{dayDate}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl font-bold">{score.totalScore}</div>
                        <Badge className={`bg-gradient-to-r ${energyColor[score.energyLevel]}`}>
                          {energyEmoji[score.energyLevel]} {score.energyLevel}
                        </Badge>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${energyColor[score.energyLevel]}`}
                          style={{ width: `${score.totalScore}%` }}
                        />
                      </div>
                    </div>
                    {score.achievements.length > 0 && (
                      <div className="flex gap-1">
                        {score.achievements.slice(0, 3).map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Motivation Footer */}
        <div className="text-center text-slate-400 text-sm space-y-2 mt-8">
          <p>💡 <strong>Tip:</strong> Clock in early, take balanced breaks, and stay focused to maximize your score!</p>
          <p>🏆 High scores can lead to bonuses and rewards!</p>
        </div>

      </div>
    </div>
  )
}

