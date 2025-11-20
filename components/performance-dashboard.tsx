"use client"

import { useState, useEffect } from "react"
import {
  Activity, TrendingUp, Clock, Target, Zap, Award, 
  AlertCircle, CheckCircle, Star, Flame, Trophy, Gift,
  RefreshCw, Sparkles, Heart, ThumbsUp, Brain, Coffee
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"

interface PerformanceMetric {
  id: string
  date: string
  shiftDate?: string
  shiftDayOfWeek?: string
  mouseMovements: number
  mouseClicks: number
  keystrokes: number
  idleTime: number
  activeTime: number
  screenshotCount: number
  applicationsUsed: string[]
  urlsVisited: number
  visitedUrlsList?: string[]
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [todayMetrics, setTodayMetrics] = useState<PerformanceMetric | null>(null)
  const [liveMetrics, setLiveMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isElectron, setIsElectron] = useState(false)
  const [hasLoadedBaseline, setHasLoadedBaseline] = useState(false)

  useEffect(() => {
    setMounted(true)
    const inElectron = typeof window !== 'undefined' && window.electron?.isElectron
    setIsElectron(!!inElectron)
    
    fetchMetrics(true)
    const refreshInterval = setInterval(() => fetchMetrics(false), 10000)
    
    if (inElectron) {
      fetchLiveMetrics()
      const unsubscribe = window.electron?.performance?.onMetricsUpdate((data) => {
        if (data.metrics) setLiveMetrics(data.metrics)
      })
      return () => {
        clearInterval(refreshInterval)
        unsubscribe?.()
      }
    }
    
    return () => clearInterval(refreshInterval)
  }, [])

  const fetchMetrics = async (shouldLoadBaseline = false) => {
    try {
      const response = await fetch("/api/analytics")
      if (!response.ok) throw new Error("Failed to fetch performance metrics")
      const data = await response.json()
      setMetrics(data.metrics)
      setTodayMetrics(data.today || null)
      
      if (shouldLoadBaseline && !hasLoadedBaseline && data.today) {
        const metricsCreatedAt = new Date(data.today.date)
        const now = new Date()
        const ageInSeconds = (now.getTime() - metricsCreatedAt.getTime()) / 1000
        
        if (ageInSeconds > 120) {
          const electronSync = (window as any).electron?.sync
          if (electronSync && typeof electronSync.loadFromDatabase === 'function') {
            await electronSync.loadFromDatabase(data.today)
            setHasLoadedBaseline(true)
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load performance data")
    } finally {
      setLoading(false)
    }
  }

  const fetchLiveMetrics = async () => {
    if (!window.electron?.performance) return
    try {
      const metrics = await window.electron.performance.getCurrentMetrics()
      setLiveMetrics(metrics)
    } catch (err) {
      console.error('Error fetching live metrics:', err)
    }
  }

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds)
    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const calculateProductivityScore = (metric: PerformanceMetric) => {
    if (!metric) return 0
    const totalTime = metric.activeTime + metric.idleTime
    if (totalTime === 0) return 0
    const activePercent = (metric.activeTime / totalTime) * 40
    const keystrokesScore = Math.min((metric.keystrokes / 5000) * 30, 30)
    const clicksScore = Math.min((metric.mouseClicks / 1000) * 30, 30)
    return Math.round(activePercent + keystrokesScore + clicksScore)
  }

  const getProductivityLevel = (score: number) => {
    if (score >= 80) return { level: "Superstar", color: "from-yellow-400 to-orange-500", emoji: "🌟", message: "You're crushing it!" }
    if (score >= 60) return { level: "Great Work", color: "from-green-400 to-emerald-500", emoji: "🎯", message: "Keep up the momentum!" }
    if (score >= 40) return { level: "Good Effort", color: "from-blue-400 to-cyan-500", emoji: "💪", message: "You're doing well!" }
    return { level: "Getting Started", color: "from-purple-400 to-pink-500", emoji: "🚀", message: "Let's boost your focus!" }
  }

  const getMotivationalTip = (score: number, activeTime: number, idleTime: number) => {
    const totalTime = activeTime + idleTime
    const activePercent = totalTime > 0 ? (activeTime / totalTime) * 100 : 0
    
    if (idleTime > 1800) { // More than 30 min idle
      return {
        icon: Coffee,
        color: "text-amber-500",
        title: "Take a Quick Break?",
        message: "You've been idle for a while. A short walk can boost your energy! 🚶‍♂️",
        type: "warning"
      }
    }
    
    if (activePercent > 85) {
      return {
        icon: Heart,
        color: "text-pink-500",
        title: "Amazing Focus!",
        message: "You're in the zone! Keep this momentum going! 🔥",
        type: "success"
      }
    }
    
    if (score < 40) {
      return {
        icon: Brain,
        color: "text-purple-500",
        title: "Focus Tip",
        message: "Try the Pomodoro technique: 25 min work, 5 min break. Works wonders! ⏰",
        type: "tip"
      }
    }
    
    return {
      icon: ThumbsUp,
      color: "text-blue-500",
      title: "You're Doing Great!",
      message: "Keep your workspace organized and minimize distractions! 👍",
      type: "tip"
    }
  }

  const getStreakData = (productivity: number) => {
    // Mock streak data - in production, you'd track this in DB
    return {
      current: 3,
      best: 7,
      thisWeek: 5
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-48 rounded-3xl bg-gradient-to-r from-purple-100 to-blue-100 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <Card className="p-8 border-red-200 bg-red-50">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-red-900">Oops! Something went wrong</h2>
                <p className="mt-2 text-red-700">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4 bg-red-600 hover:bg-red-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const displayMetrics = (isElectron && liveMetrics) 
    ? { ...liveMetrics, screenshotCount: todayMetrics?.screenshotCount || 0 }
    : todayMetrics
  
  const productivity = displayMetrics ? calculateProductivityScore(displayMetrics) : 0
  const level = getProductivityLevel(productivity)
  const tip = displayMetrics ? getMotivationalTip(productivity, displayMetrics.activeTime, displayMetrics.idleTime) : null
  const streak = getStreakData(productivity)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Hero Header - Gamified */}
        <Card className="relative overflow-hidden border-none bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 opacity-10">
            <Sparkles className="h-64 w-64" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                  <Flame className="h-10 w-10 animate-pulse" />
                  Your Productivity Journey
                </h1>
                <p className="mt-2 text-white/90 text-lg">
                  Level up your focus and crush your goals! 🚀
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl">
                  <Star className="h-6 w-6 text-yellow-300" />
                  <div>
                    <div className="text-3xl font-bold text-white">{streak.current}</div>
                    <div className="text-xs text-white/80">Day Streak 🔥</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Productivity Score - BIG & FUN */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 border-2 border-white/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/90 font-semibold text-lg">Today's Score</span>
                  <span className="text-6xl">{level.emoji}</span>
                </div>
                <div className="flex items-end gap-4 mb-4">
                  <div className="text-7xl font-bold text-white">{productivity}</div>
                  <div className="text-2xl text-white/80 mb-2">/100</div>
                </div>
                <Progress value={productivity} className="h-4 bg-white/20" />
                <div className="mt-3 flex items-center gap-2">
                  <Badge className={`bg-gradient-to-r ${level.color} text-white border-none px-4 py-1`}>
                    {level.level}
                  </Badge>
                  <span className="text-white/90 font-medium">{level.message}</span>
                </div>
              </div>

              {/* Time Stats - Simplified */}
              <div className="space-y-3">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-500/30 rounded-xl">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-white/80">Active Time</div>
                        <div className="text-2xl font-bold text-white">
                          {displayMetrics ? formatTime(displayMetrics.activeTime) : '0m'}
                        </div>
                      </div>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-300" />
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/30 rounded-xl">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-white/80">Focus Level</div>
                        <div className="text-2xl font-bold text-white">
                          {displayMetrics && (displayMetrics.activeTime + displayMetrics.idleTime) > 0
                            ? `${Math.round((displayMetrics.activeTime / (displayMetrics.activeTime + displayMetrics.idleTime)) * 100)}%`
                            : '0%'}
                        </div>
                      </div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Motivational Tip Card */}
        {tip && (
          <Card className={`p-6 border-2 ${
            tip.type === 'warning' ? 'border-amber-300 bg-amber-50' :
            tip.type === 'success' ? 'border-green-300 bg-green-50' :
            'border-blue-300 bg-blue-50'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                tip.type === 'warning' ? 'bg-amber-200' :
                tip.type === 'success' ? 'bg-green-200' :
                'bg-blue-200'
              }`}>
                <tip.icon className={`h-6 w-6 ${tip.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{tip.title}</h3>
                <p className="mt-1 text-gray-700">{tip.message}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Achievement Cards - Gamified */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-yellow-500 rounded-2xl">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Best Streak</div>
                <div className="text-3xl font-bold text-gray-900">{streak.best} days</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-500 rounded-2xl">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">This Week</div>
                <div className="text-3xl font-bold text-gray-900">{streak.thisWeek} days</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-500 rounded-2xl">
                <Award className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Productivity Rank</div>
                <div className="text-3xl font-bold text-gray-900">Top 25%</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Tips Section */}
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-600" />
            Pro Tips to Boost Your Productivity
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-indigo-700" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Minimize Distractions</div>
                <div className="text-sm text-gray-600">Close unnecessary tabs and apps. Focus on one task at a time!</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-indigo-700" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Take Short Breaks</div>
                <div className="text-sm text-gray-600">5-minute breaks every hour keep your mind fresh and focused!</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-indigo-700" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Set Clear Goals</div>
                <div className="text-sm text-gray-600">Know what you want to accomplish today. Clarity = productivity!</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-indigo-700" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Stay Hydrated</div>
                <div className="text-sm text-gray-600">Drink water regularly. Your brain needs it to perform at its best! 💧</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer - Encouraging */}
        <div className="text-center py-8">
          <p className="text-gray-600 text-lg">
            Keep going! Every day is a new opportunity to improve. 💪✨
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Remember: Progress, not perfection!
          </p>
        </div>
      </div>
    </div>
  )
}
