/**
 * 🎮 GAMIFICATION SCORE CALCULATOR
 * 
 * Calculates daily productivity scores based on:
 * - Attendance (clock in/out timing)
 * - Break discipline
 * - Activity metrics (mouse, keyboard)
 * - Focus (low idle time)
 */

interface TimeEntry {
  id: string
  clockIn: Date
  clockOut: Date | null
  wasLate: boolean
  lateBy: number | null
  wasEarly: boolean
  earlyBy: number | null
  totalHours: number | null
}

interface Break {
  id: string
  type: string
  actualStart: Date | null
  actualEnd: Date | null
  duration: number | null
}

interface PerformanceMetrics {
  mouseMovements: number
  mouseClicks: number
  keystrokes: number
  activeTime: number // in minutes
  idleTime: number // in minutes
  screenTime: number // in minutes
}

interface DailyScore {
  totalScore: number
  attendanceScore: number
  breakScore: number
  activityScore: number
  focusScore: number
  energyLevel: "HIGH" | "MEDIUM" | "LOW"
  achievements: string[]
  clockedInAt: Date | null
  clockedOutAt: Date | null
  wasLate: boolean
  lateBy: number | null
  wasEarly: boolean
  earlyBy: number | null
  totalBreaks: number
  activeTime: number
  idleTime: number
  keystrokes: number
  mouseClicks: number
  streak: number
}

export function calculateDailyScore(
  timeEntry: TimeEntry | null,
  breaks: Break[],
  performanceMetrics: PerformanceMetrics | null,
  previousStreak: number = 0
): DailyScore {
  const achievements: string[] = []

  // ==========================================
  // 1️⃣ ATTENDANCE SCORE (0-25 points)
  // ==========================================
  let attendanceScore = 0
  let clockedInAt = null
  let clockedOutAt = null
  let wasLate = false
  let lateBy = null
  let wasEarly = false
  let earlyBy = null

  if (timeEntry) {
    clockedInAt = timeEntry.clockIn
    clockedOutAt = timeEntry.clockOut
    wasLate = timeEntry.wasLate
    lateBy = timeEntry.lateBy
    wasEarly = timeEntry.wasEarly
    earlyBy = timeEntry.earlyBy

    if (wasEarly && earlyBy && earlyBy >= 5) {
      // Clocked in 5+ mins early
      attendanceScore = 25
      achievements.push("Early Bird")
    } else if (!wasLate && !wasEarly) {
      // On time (within ±5 mins)
      attendanceScore = 20
      achievements.push("Perfect Timing")
    } else if (wasLate && lateBy && lateBy <= 15) {
      // Late by 5-15 mins
      attendanceScore = 10
    } else if (wasLate && lateBy && lateBy > 15) {
      // Late by 15+ mins
      attendanceScore = 0
    } else {
      // Default: decent score
      attendanceScore = 15
    }
  }

  // ==========================================
  // 2️⃣ BREAK SCORE (0-15 points)
  // ==========================================
  let breakScore = 0
  const totalBreaks = breaks.filter(b => b.actualStart && b.actualEnd).length

  if (totalBreaks === 0) {
    // No breaks = not good for health
    breakScore = 5
  } else if (totalBreaks >= 2 && totalBreaks <= 3) {
    // Ideal: 2-3 breaks
    breakScore = 15
    achievements.push("Break Balance")
  } else if (totalBreaks === 1 || totalBreaks === 4) {
    // Acceptable
    breakScore = 10
  } else {
    // Too many breaks (5+)
    breakScore = 5
  }

  // ==========================================
  // 3️⃣ ACTIVITY SCORE (0-30 points)
  // ==========================================
  let activityScore = 0
  let keystrokes = 0
  let mouseClicks = 0
  let activeTime = 0

  if (performanceMetrics) {
    keystrokes = performanceMetrics.keystrokes
    mouseClicks = performanceMetrics.mouseClicks
    activeTime = performanceMetrics.activeTime

    // Keystrokes (0-10 points)
    if (keystrokes >= 8000) {
      activityScore += 10
      achievements.push("Productive Typer")
    } else if (keystrokes >= 5000) {
      activityScore += 7
    } else if (keystrokes >= 2000) {
      activityScore += 4
    }

    // Mouse clicks (0-10 points)
    if (mouseClicks >= 2000) {
      activityScore += 10
      achievements.push("Engaged Worker")
    } else if (mouseClicks >= 1000) {
      activityScore += 7
    } else if (mouseClicks >= 500) {
      activityScore += 4
    }

    // Active time (0-10 points)
    const activeHours = activeTime / 60
    if (activeHours >= 7) {
      activityScore += 10
      achievements.push("Marathon Runner")
    } else if (activeHours >= 6) {
      activityScore += 7
    } else if (activeHours >= 5) {
      activityScore += 4
    }
  }

  // ==========================================
  // 4️⃣ FOCUS SCORE (0-30 points)
  // ==========================================
  let focusScore = 0
  let idleTime = 0

  if (performanceMetrics) {
    idleTime = performanceMetrics.idleTime
    const totalTime = performanceMetrics.activeTime + performanceMetrics.idleTime
    const idlePercentage = totalTime > 0 ? (idleTime / totalTime) * 100 : 0

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
  }

  // ==========================================
  // 🎯 TOTAL SCORE
  // ==========================================
  const totalScore = attendanceScore + breakScore + activityScore + focusScore

  // ==========================================
  // 🔥 ENERGY LEVEL
  // ==========================================
  let energyLevel: "HIGH" | "MEDIUM" | "LOW"
  if (totalScore >= 85) {
    energyLevel = "HIGH"
    achievements.push("Full Day Warrior")
  } else if (totalScore >= 70) {
    energyLevel = "MEDIUM"
  } else {
    energyLevel = "LOW"
  }

  // ==========================================
  // 🔥 STREAK CALCULATION
  // ==========================================
  let streak = 1
  if (totalScore >= 85) {
    // High score = continue streak
    streak = previousStreak + 1
    if (streak >= 5) {
      achievements.push("Consistency King")
    }
  } else {
    // Low score = reset streak
    streak = 1
  }

  return {
    totalScore,
    attendanceScore,
    breakScore,
    activityScore,
    focusScore,
    energyLevel,
    achievements,
    clockedInAt,
    clockedOutAt,
    wasLate,
    lateBy,
    wasEarly,
    earlyBy,
    totalBreaks,
    activeTime,
    idleTime,
    keystrokes,
    mouseClicks,
    streak,
  }
}

/**
 * Get achievement descriptions for display
 */
export const ACHIEVEMENT_DESCRIPTIONS: Record<string, string> = {
  "Early Bird": "Clocked in 10+ minutes early",
  "Perfect Timing": "Clocked in exactly on time",
  "Break Balance": "Perfect break discipline (2-3 breaks)",
  "Productive Typer": "8,000+ keystrokes today",
  "Engaged Worker": "2,000+ mouse clicks today",
  "Marathon Runner": "7+ hours active work",
  "Focus Master": "Less than 10% idle time",
  "Full Day Warrior": "Score 85+ today",
  "Consistency King": "5+ day perfect streak",
}

