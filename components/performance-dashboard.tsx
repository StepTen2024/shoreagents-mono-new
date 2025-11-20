"use client"

import { useState, useEffect } from "react"
import {
  Activity, TrendingUp, Clock, Target, Zap, Award, 
  AlertCircle, CheckCircle, Star, Flame, Trophy, 
  RefreshCw, Sparkles, Heart, ThumbsUp, Brain, Coffee,
  Calendar, BarChart3, TrendingDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

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

type TimePeriod = 'today' | 'week' | 'month'

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [todayMetrics, setTodayMetrics] = useState<PerformanceMetric | null>(null)
  const [liveMetrics, setLiveMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isElectron, setIsElectron] = useState(false)
  const [hasLoadedBaseline, setHasLoadedBaseline] = useState(false)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today')
  const [weekStats, setWeekStats] = useState<any>(null)
  const [monthStats, setMonthStats] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    const inElectron = typeof window !== 'undefined' && window.electron?.isElectron
    setIsElectron(!!inElectron)
    
    fetchMetrics(true)
    const refreshInterval = setInterval(() => fetchMetrics(false), 10000) // Live updates every 10s
    
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
      
      // Calculate week and month stats
      calculatePeriodStats(data.metrics)
      
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

  const calculatePeriodStats = (allMetrics: PerformanceMetric[]) => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const weekMetrics = allMetrics.filter(m => new Date(m.date) >= sevenDaysAgo)
    const monthMetrics = allMetrics.filter(m => new Date(m.date) >= thirtyDaysAgo)
    
    setWeekStats({
      totalActiveTime: weekMetrics.reduce((sum, m) => sum + m.activeTime, 0),
      totalIdleTime: weekMetrics.reduce((sum, m) => sum + m.idleTime, 0),
      avgProductivity: Math.round(weekMetrics.reduce((sum, m) => sum + calculateProductivityScore(m), 0) / (weekMetrics.length || 1)),
      daysActive: weekMetrics.length,
      totalInteractions: weekMetrics.reduce((sum, m) => sum + m.mouseClicks + m.keystrokes, 0)
    })
    
    setMonthStats({
      totalActiveTime: monthMetrics.reduce((sum, m) => sum + m.activeTime, 0),
      totalIdleTime: monthMetrics.reduce((sum, m) => sum + m.idleTime, 0),
      avgProductivity: Math.round(monthMetrics.reduce((sum, m) => sum + calculateProductivityScore(m), 0) / (monthMetrics.length || 1)),
      daysActive: monthMetrics.length,
      totalInteractions: monthMetrics.reduce((sum, m) => sum + m.mouseClicks + m.keystrokes, 0),
      trend: calculateTrend(monthMetrics)
    })
  }

  const calculateTrend = (metrics: PerformanceMetric[]) => {
    if (metrics.length < 2) return 0
    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2))
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2))
    const firstAvg = firstHalf.reduce((sum, m) => sum + calculateProductivityScore(m), 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, m) => sum + calculateProductivityScore(m), 0) / secondHalf.length
    return Math.round(((secondAvg - firstAvg) / firstAvg) * 100)
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
    
    if (idleTime > 1800) {
      return {
        icon: Coffee,
        color: "text-amber-400",
        title: "Take a Quick Break?",
        message: "You've been idle for a while. A short walk can boost your energy! 🚶‍♂️",
        type: "warning"
      }
    }
    
    if (activePercent > 85) {
      return {
        icon: Heart,
        color: "text-pink-400",
        title: "Amazing Focus!",
        message: "You're in the zone! Keep this momentum going! 🔥",
        type: "success"
      }
    }
    
    if (score < 40) {
      return {
        icon: Brain,
        color: "text-purple-400",
        title: "Focus Tip",
        message: "Try the Pomodoro technique: 25 min work, 5 min break. Works wonders! ⏰",
        type: "tip"
      }
    }
    
    return {
      icon: ThumbsUp,
      color: "text-blue-400",
      title: "You're Doing Great!",
      message: "Keep your workspace organized and minimize distractions! 👍",
      type: "tip"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-48 rounded-3xl bg-slate-800/50 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-slate-800/50 animate-pulse" />
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
          <div className="p-8 bg-red-500/10 border border-red-500/30 ring-1 ring-red-500/30 rounded-2xl">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <div>
                <h2 className="text-xl font-bold text-red-400">Oops! Something went wrong</h2>
                <p className="mt-2 text-red-300">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4 bg-red-600 hover:bg-red-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header with Time Period Tabs */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-purple-900/50 p-8 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="absolute top-0 right-0 opacity-5">
            <Sparkles className="h-64 w-64" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                  <Flame className="h-10 w-10 animate-pulse text-orange-400" />
                  Your Productivity Journey
                </h1>
                <p className="mt-2 text-purple-200 text-lg">
                  {isElectron && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50 mr-2"><Activity className="h-3 w-3 mr-1 animate-pulse" />LIVE</Badge>}
                  Level up your focus and crush your goals! 🚀
                </p>
              </div>
            </div>

            {/* Time Period Tabs */}
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-5 w-5 text-purple-300" />
              <div className="flex gap-2">
                <button
                  onClick={() => setTimePeriod('today')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    timePeriod === 'today'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  TODAY
                </button>
                <button
                  onClick={() => setTimePeriod('week')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    timePeriod === 'week'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  LAST WEEK
                </button>
                <button
                  onClick={() => setTimePeriod('month')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    timePeriod === 'month'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  LAST MONTH
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TODAY VIEW - Hyper-focused on current session */}
        {timePeriod === 'today' && displayMetrics && (
          <>
            {/* Live Score Card */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 ring-1 ring-white/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-200 font-semibold text-lg">Right Now</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-xs text-emerald-300">LIVE</span>
                  </div>
                </div>
                <div className="flex items-end gap-4 mb-4">
                  <div className="text-7xl font-bold text-white">{productivity}</div>
                  <div className="text-2xl text-slate-300 mb-2">/100</div>
                  <span className="text-6xl mb-1">{level.emoji}</span>
                </div>
                <Progress value={productivity} className="h-4 bg-white/20 mb-3" />
                <Badge className={`bg-gradient-to-r ${level.color} text-white border-none px-4 py-1`}>
                  {level.level}
                </Badge>
                <p className="text-slate-200 font-medium mt-2">{level.message}</p>
              </div>

              {/* Live Time Stats */}
              <div className="space-y-3">
                <div className="bg-emerald-900/40 backdrop-blur-md rounded-2xl p-5 ring-1 ring-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500/30 rounded-xl">
                        <Clock className="h-6 w-6 text-emerald-300" />
                      </div>
                      <div>
                        <div className="text-sm text-emerald-200">Active Time</div>
                        <div className="text-2xl font-bold text-white">
                          {formatTime(displayMetrics.activeTime)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse mb-1"></div>
                      <div className="text-xs text-emerald-300">Updating</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900/40 backdrop-blur-md rounded-2xl p-5 ring-1 ring-blue-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/30 rounded-xl">
                        <Target className="h-6 w-6 text-blue-300" />
                      </div>
                      <div>
                        <div className="text-sm text-blue-200">Focus Level</div>
                        <div className="text-2xl font-bold text-white">
                          {(displayMetrics.activeTime + displayMetrics.idleTime) > 0
                            ? `${Math.round((displayMetrics.activeTime / (displayMetrics.activeTime + displayMetrics.idleTime)) * 100)}%`
                            : '0%'}
                        </div>
                      </div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-400" />
                  </div>
                </div>

                <div className="bg-purple-900/40 backdrop-blur-md rounded-2xl p-5 ring-1 ring-purple-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-500/30 rounded-xl">
                        <Zap className="h-6 w-6 text-purple-300" />
                      </div>
                      <div>
                        <div className="text-sm text-purple-200">Session Length</div>
                        <div className="text-2xl font-bold text-white">
                          {formatTime(displayMetrics.activeTime + displayMetrics.idleTime)}
                        </div>
                      </div>
                    </div>
                    <Clock className="h-8 w-8 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Tip */}
            {tip && (
              <div className={`rounded-2xl p-6 ring-1 ${
                tip.type === 'warning' ? 'bg-amber-900/30 ring-amber-500/30' :
                tip.type === 'success' ? 'bg-emerald-900/30 ring-emerald-500/30' :
                'bg-blue-900/30 ring-blue-500/30'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    tip.type === 'warning' ? 'bg-amber-500/30' :
                    tip.type === 'success' ? 'bg-emerald-500/30' :
                    'bg-blue-500/30'
                  }`}>
                    <tip.icon className={`h-6 w-6 ${tip.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white">{tip.title}</h3>
                    <p className="mt-1 text-slate-300">{tip.message}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* WEEK VIEW - Weekly summary */}
        {timePeriod === 'week' && weekStats && (
          <>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-gradient-to-br from-blue-900/40 to-cyan-900/40 p-6 ring-1 ring-blue-500/30">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-500/30 rounded-2xl">
                    <BarChart3 className="h-8 w-8 text-blue-300" />
                  </div>
                  <div>
                    <div className="text-sm text-blue-200">Avg Productivity</div>
                    <div className="text-3xl font-bold text-white">{weekStats.avgProductivity}%</div>
                    <div className="text-xs text-blue-300 mt-1">This Week</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-emerald-900/40 to-teal-900/40 p-6 ring-1 ring-emerald-500/30">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-500/30 rounded-2xl">
                    <Clock className="h-8 w-8 text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-sm text-emerald-200">Total Active Time</div>
                    <div className="text-3xl font-bold text-white">{formatTime(weekStats.totalActiveTime)}</div>
                    <div className="text-xs text-emerald-300 mt-1">{weekStats.daysActive} days active</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-6 ring-1 ring-purple-500/30">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-purple-500/30 rounded-2xl">
                    <Zap className="h-8 w-8 text-purple-300" />
                  </div>
                  <div>
                    <div className="text-sm text-purple-200">Interactions</div>
                    <div className="text-3xl font-bold text-white">{(weekStats.totalInteractions / 1000).toFixed(1)}k</div>
                    <div className="text-xs text-purple-300 mt-1">Last 7 days</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-indigo-900/40 to-blue-900/40 p-6 ring-1 ring-indigo-500/30">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-indigo-400" />
                Weekly Insights
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-sm text-slate-300 mb-2">Average Focus Level</div>
                  <div className="text-2xl font-bold text-white mb-2">
                    {weekStats.totalActiveTime > 0 
                      ? Math.round((weekStats.totalActiveTime / (weekStats.totalActiveTime + weekStats.totalIdleTime)) * 100)
                      : 0}%
                  </div>
                  <Progress value={weekStats.totalActiveTime > 0 
                      ? Math.round((weekStats.totalActiveTime / (weekStats.totalActiveTime + weekStats.totalIdleTime)) * 100)
                      : 0} className="h-2 bg-white/20" />
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-sm text-slate-300 mb-2">Days Active</div>
                  <div className="text-2xl font-bold text-white mb-2">{weekStats.daysActive} / 7 days</div>
                  <div className="text-xs text-emerald-300">Keep up the consistency! 💪</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MONTH VIEW - Monthly trends */}
        {timePeriod === 'month' && monthStats && (
          <>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-6 ring-1 ring-purple-500/30">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-purple-500/30 rounded-2xl">
                    <Trophy className="h-8 w-8 text-purple-300" />
                  </div>
                  <div>
                    <div className="text-sm text-purple-200">Avg Productivity</div>
                    <div className="text-3xl font-bold text-white">{monthStats.avgProductivity}%</div>
                    <div className="text-xs text-purple-300 mt-1">This Month</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-emerald-900/40 to-teal-900/40 p-6 ring-1 ring-emerald-500/30">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-500/30 rounded-2xl">
                    <Clock className="h-8 w-8 text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-sm text-emerald-200">Total Active Time</div>
                    <div className="text-3xl font-bold text-white">{formatTime(monthStats.totalActiveTime)}</div>
                    <div className="text-xs text-emerald-300 mt-1">{monthStats.daysActive} days active</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-amber-900/40 to-orange-900/40 p-6 ring-1 ring-amber-500/30">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-amber-500/30 rounded-2xl">
                    {monthStats.trend >= 0 ? (
                      <TrendingUp className="h-8 w-8 text-amber-300" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-amber-300" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-amber-200">Trend</div>
                    <div className="text-3xl font-bold text-white">
                      {monthStats.trend >= 0 ? '+' : ''}{monthStats.trend}%
                    </div>
                    <div className="text-xs text-amber-300 mt-1">vs last month</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-6 ring-1 ring-indigo-500/30">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-indigo-400" />
                Monthly Overview
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-sm text-slate-300 mb-2">Monthly Focus Level</div>
                  <div className="text-2xl font-bold text-white mb-2">
                    {monthStats.totalActiveTime > 0 
                      ? Math.round((monthStats.totalActiveTime / (monthStats.totalActiveTime + monthStats.totalIdleTime)) * 100)
                      : 0}%
                  </div>
                  <Progress value={monthStats.totalActiveTime > 0 
                      ? Math.round((monthStats.totalActiveTime / (monthStats.totalActiveTime + monthStats.totalIdleTime)) * 100)
                      : 0} className="h-2 bg-white/20" />
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-sm text-slate-300 mb-2">Active Days</div>
                  <div className="text-2xl font-bold text-white mb-2">{monthStats.daysActive} / 30 days</div>
                  <div className="text-xs text-emerald-300">
                    {monthStats.daysActive >= 20 ? "Excellent consistency! 🌟" : "Keep building that habit! 💪"}
                  </div>
                </div>
              </div>
            </div>

            {monthStats.trend >= 10 && (
              <div className="rounded-2xl p-6 ring-1 bg-emerald-900/30 ring-emerald-500/30">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/30">
                    <Star className="h-6 w-6 text-emerald-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white">Amazing Growth! 🚀</h3>
                    <p className="mt-1 text-slate-300">
                      You've improved by {monthStats.trend}% this month! Keep this momentum going! 🔥
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Pro Tips - Show on all tabs */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 p-6 ring-1 ring-indigo-500/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="h-6 w-6 text-indigo-400" />
            Pro Tips to Boost Your Productivity
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-indigo-300" />
              </div>
              <div>
                <div className="font-semibold text-white">Minimize Distractions</div>
                <div className="text-sm text-slate-300">Close unnecessary tabs and apps. Focus on one task at a time!</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-indigo-300" />
              </div>
              <div>
                <div className="font-semibold text-white">Take Short Breaks</div>
                <div className="text-sm text-slate-300">5-minute breaks every hour keep your mind fresh and focused!</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-indigo-300" />
              </div>
              <div>
                <div className="font-semibold text-white">Set Clear Goals</div>
                <div className="text-sm text-slate-300">Know what you want to accomplish today. Clarity = productivity!</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-indigo-300" />
              </div>
              <div>
                <div className="font-semibold text-white">Stay Hydrated</div>
                <div className="text-sm text-slate-300">Drink water regularly. Your brain needs it to perform at its best! 💧</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-slate-300 text-lg">
            Keep going! Every day is a new opportunity to improve. 💪✨
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Remember: Progress, not perfection!
          </p>
        </div>
      </div>
    </div>
  )
}
