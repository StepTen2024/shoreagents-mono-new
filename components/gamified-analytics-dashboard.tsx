"use client"

import { useState, useEffect } from "react"
import { Trophy, Zap, Award, Flame, Activity, MousePointer, Keyboard, Clock, Coffee } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface LiveMetrics {
  keystrokes: number
  mouseClicks: number
  activeTime: number // minutes
  idleTime: number // minutes
  clockedInAt: Date | null
  wasEarly: boolean
  earlyBy: number | null
  wasLate: boolean
  lateBy: number | null
  totalBreaks: number
}

interface LiveScore {
  totalScore: number
  attendanceScore: number
  breakScore: number
  activityScore: number
  focusScore: number
  energyLevel: "HIGH" | "MEDIUM" | "LOW"
  achievements: string[]
}

export default function GamifiedAnalyticsDashboard() {
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null)
  const [liveScore, setLiveScore] = useState<LiveScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchLiveData()
    
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchLiveData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchLiveData = async () => {
    try {
      // Fetch live performance metrics
      const response = await fetch("/api/analytics")
      if (!response.ok) throw new Error("Failed to fetch analytics")
      
      const data = await response.json()
      const todayMetrics = data.today
      
      if (!todayMetrics) {
        setLoading(false)
        return
      }

      // Get time entry data for attendance
      const timeResponse = await fetch("/api/time-tracking/status")
      const timeData = await timeResponse.json()
      
      const metrics: LiveMetrics = {
        keystrokes: todayMetrics.keystrokes || 0,
        mouseClicks: todayMetrics.mouseClicks || 0,
        activeTime: Math.floor((todayMetrics.activeTime || 0) / 60), // Convert seconds to minutes
        idleTime: Math.floor((todayMetrics.idleTime || 0) / 60), // Convert seconds to minutes
        clockedInAt: timeData.activeEntry?.clockIn ? new Date(timeData.activeEntry.clockIn) : null,
        wasEarly: timeData.activeEntry?.wasEarly || false,
        earlyBy: timeData.activeEntry?.earlyBy || null,
        wasLate: timeData.activeEntry?.wasLate || false,
        lateBy: timeData.activeEntry?.lateBy || null,
        totalBreaks: 0, // TODO: Get from breaks API
      }
      
      setLiveMetrics(metrics)
      setLiveScore(calculateLiveScore(metrics))
      setLastUpdate(new Date())
      setLoading(false)
    } catch (err) {
      console.error("Error fetching live data:", err)
      setLoading(false)
    }
  }

  const calculateLiveScore = (metrics: LiveMetrics): LiveScore => {
    const achievements: string[] = []
    
    // 1️⃣ ATTENDANCE SCORE (0-25 points)
    let attendanceScore = 0
    if (metrics.wasEarly && metrics.earlyBy && metrics.earlyBy >= 10) {
      attendanceScore = 25
      achievements.push("Early Bird")
    } else if (metrics.wasEarly && metrics.earlyBy && metrics.earlyBy >= 5) {
      attendanceScore = 20
    } else if (!metrics.wasLate && !metrics.wasEarly) {
      attendanceScore = 20
      achievements.push("Perfect Timing")
    } else if (metrics.wasLate && metrics.lateBy && metrics.lateBy <= 15) {
      attendanceScore = 10
    } else if (metrics.wasLate) {
      attendanceScore = 0
    } else {
      attendanceScore = 15
    }

    // 2️⃣ BREAK SCORE (0-15 points)
    let breakScore = 0
    if (metrics.totalBreaks === 0) {
      breakScore = 5
    } else if (metrics.totalBreaks >= 2 && metrics.totalBreaks <= 3) {
      breakScore = 15
      achievements.push("Break Balance")
    } else if (metrics.totalBreaks === 1 || metrics.totalBreaks === 4) {
      breakScore = 10
    } else {
      breakScore = 5
    }

    // 3️⃣ ACTIVITY SCORE (0-30 points) - REAL-TIME
    let activityScore = 0
    
    // Keystrokes (0-10 points)
    if (metrics.keystrokes >= 8000) {
      activityScore += 10
      achievements.push("Productive Typer")
    } else if (metrics.keystrokes >= 5000) {
      activityScore += 7
    } else if (metrics.keystrokes >= 2000) {
      activityScore += 4
    }
    
    // Mouse clicks (0-10 points)
    if (metrics.mouseClicks >= 2000) {
      activityScore += 10
      achievements.push("Engaged Worker")
    } else if (metrics.mouseClicks >= 1000) {
      activityScore += 7
    } else if (metrics.mouseClicks >= 500) {
      activityScore += 4
    }
    
    // Active time (0-10 points)
    const activeHours = metrics.activeTime / 60
    if (activeHours >= 7) {
      activityScore += 10
      achievements.push("Marathon Runner")
    } else if (activeHours >= 6) {
      activityScore += 7
    } else if (activeHours >= 5) {
      activityScore += 4
    }

    // 4️⃣ FOCUS SCORE (0-30 points)
    let focusScore = 0
    const totalTime = metrics.activeTime + metrics.idleTime
    const idlePercentage = totalTime > 0 ? (metrics.idleTime / totalTime) * 100 : 0
    
    if (idlePercentage < 10) {
      focusScore = 30
      achievements.push("Focus Master")
    } else if (idlePercentage < 20) {
      focusScore = 20
    } else if (idlePercentage < 30) {
      focusScore = 10
    } else {
      focusScore = 0
    }

    const totalScore = attendanceScore + breakScore + activityScore + focusScore

    let energyLevel: "HIGH" | "MEDIUM" | "LOW"
    if (totalScore >= 85) {
      energyLevel = "HIGH"
      achievements.push("Full Day Warrior")
    } else if (totalScore >= 70) {
      energyLevel = "MEDIUM"
    } else {
      energyLevel = "LOW"
    }

    return {
      totalScore,
      attendanceScore,
      breakScore,
      activityScore,
      focusScore,
      energyLevel,
      achievements,
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your live performance...</div>
      </div>
    )
  }

  if (!liveMetrics || !liveScore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center space-y-4">
          <div className="text-xl">No activity tracked yet today</div>
          <div className="text-sm text-slate-400">Clock in and start working to see your live score!</div>
        </div>
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

  const secondsSinceUpdate = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000)
  const updateText = secondsSinceUpdate < 60 
    ? `Updated ${secondsSinceUpdate}s ago`
    : `Updated ${Math.floor(secondsSinceUpdate / 60)}m ago`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Zap className="h-10 w-10 text-yellow-400" />
            Your Energy Today (LIVE)
          </h1>
          <p className="text-slate-300">Real-time productivity tracking • {updateText}</p>
        </div>

        {/* Main Score Card */}
        <Card className="p-8 bg-slate-800/50 backdrop-blur-xl border-2 border-purple-500/30 text-white">
          <div className="text-center space-y-6">
            
            {/* Energy Level Badge */}
            <div className="flex justify-center">
              <Badge 
                className={`text-2xl px-8 py-3 bg-gradient-to-r ${energyColor[liveScore.energyLevel]} text-white font-bold`}
              >
                {energyEmoji[liveScore.energyLevel]} {liveScore.energyLevel} ENERGY
              </Badge>
            </div>

            {/* Score Display */}
            <div className="space-y-2">
              <div className="text-7xl font-bold text-white">{liveScore.totalScore}</div>
              <div className="text-slate-400 text-lg">out of 100 (updating live)</div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${energyColor[liveScore.energyLevel]} transition-all duration-500`}
                style={{ width: `${liveScore.totalScore}%` }}
              />
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="space-y-2">
                <div className="text-slate-400 text-sm">⏰ Attendance</div>
                <div className="text-2xl font-bold">{liveScore.attendanceScore}/25</div>
                {liveMetrics.wasEarly && (
                  <div className="text-xs text-green-400">
                    {liveMetrics.earlyBy}m early!
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-slate-400 text-sm">☕ Breaks</div>
                <div className="text-2xl font-bold">{liveScore.breakScore}/15</div>
              </div>
              <div className="space-y-2">
                <div className="text-slate-400 text-sm">💪 Activity</div>
                <div className="text-2xl font-bold">{liveScore.activityScore}/30</div>
              </div>
              <div className="space-y-2">
                <div className="text-slate-400 text-sm">🎯 Focus</div>
                <div className="text-2xl font-bold">{liveScore.focusScore}/30</div>
              </div>
            </div>

            {/* Achievements */}
            {liveScore.achievements.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 justify-center">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                  Achievements Unlocked Today!
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {liveScore.achievements.map((achievement) => (
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

          </div>
        </Card>

        {/* Live Activity Metrics */}
        <Card className="p-6 bg-slate-800/50 backdrop-blur-xl border-2 border-blue-500/30 text-white">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-400" />
            Live Activity Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400">
                <Keyboard className="h-4 w-4" />
                <span className="text-sm">Keystrokes</span>
              </div>
              <div className="text-3xl font-bold text-blue-400">{liveMetrics.keystrokes.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400">
                <MousePointer className="h-4 w-4" />
                <span className="text-sm">Mouse Clicks</span>
              </div>
              <div className="text-3xl font-bold text-green-400">{liveMetrics.mouseClicks.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Active Time</span>
              </div>
              <div className="text-3xl font-bold text-yellow-400">{liveMetrics.activeTime}m</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400">
                <Coffee className="h-4 w-4" />
                <span className="text-sm">Idle Time</span>
              </div>
              <div className="text-3xl font-bold text-slate-400">{liveMetrics.idleTime}m</div>
            </div>
          </div>
        </Card>

        {/* Motivation Footer */}
        <div className="text-center text-slate-400 text-sm space-y-2 mt-8">
          <p>💡 <strong>Tip:</strong> Clock in early, take balanced breaks, and stay focused to maximize your score!</p>
          <p>🏆 High scores can lead to bonuses and rewards!</p>
          <p className="text-xs text-slate-500">Auto-refreshes every 30 seconds</p>
        </div>

      </div>
    </div>
  )
}
