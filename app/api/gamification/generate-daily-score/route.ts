import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateDailyScore } from "@/lib/gamification-calculator"
import { getStaffUser } from "@/lib/auth-helpers"

/**
 * POST /api/gamification/generate-daily-score
 * 
 * Generates gamification score for a specific date
 * Can be called by staff (for today) or admin (for any date/staff)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staffUserId, date } = body

    // Parse date or use today
    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)

    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // If staffUserId not provided, get from session (staff calling for themselves)
    let targetStaffUserId = staffUserId
    if (!targetStaffUserId) {
      const staffUser = await getStaffUser()
      if (!staffUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      targetStaffUserId = staffUser.id
    }

    console.log(`🎮 Generating score for staff ${targetStaffUserId} on ${targetDate.toLocaleDateString()}`)

    // ==========================================
    // 📊 FETCH DATA FOR THE DAY
    // ==========================================

    // Get time entry for the day
    const timeEntry = await prisma.time_entries.findFirst({
      where: {
        staffUserId: targetStaffUserId,
        clockIn: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      orderBy: { clockIn: "asc" },
    })

    // Get breaks for the day
    const breaks = await prisma.breaks.findMany({
      where: {
        staffUserId: targetStaffUserId,
        actualStart: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    })

    // Get performance metrics for the day
    const performanceMetrics = await prisma.performance_metrics.findFirst({
      where: {
        staffUserId: targetStaffUserId,
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    })

    // Get previous day's record to calculate streak
    const yesterday = new Date(targetDate)
    yesterday.setDate(yesterday.getDate() - 1)
    const previousDayRecord = await prisma.staff_gamified_daily.findFirst({
      where: {
        staffUserId: targetStaffUserId,
        date: yesterday,
      },
    })

    const previousStreak = previousDayRecord?.streak || 0

    // ==========================================
    // 🧮 CALCULATE SCORE
    // ==========================================
    const score = calculateDailyScore(
      timeEntry,
      breaks,
      performanceMetrics,
      previousStreak
    )

    // ==========================================
    // 💾 SAVE TO DATABASE
    // ==========================================
    const gamifiedRecord = await prisma.staff_gamified_daily.upsert({
      where: {
        staffUserId_date: {
          staffUserId: targetStaffUserId,
          date: targetDate,
        },
      },
      update: {
        totalScore: score.totalScore,
        attendanceScore: score.attendanceScore,
        breakScore: score.breakScore,
        activityScore: score.activityScore,
        focusScore: score.focusScore,
        achievements: score.achievements,
        clockedInAt: score.clockedInAt,
        clockedOutAt: score.clockedOutAt,
        wasLate: score.wasLate,
        lateBy: score.lateBy,
        wasEarly: score.wasEarly,
        earlyBy: score.earlyBy,
        totalBreaks: score.totalBreaks,
        activeTime: score.activeTime,
        idleTime: score.idleTime,
        keystrokes: score.keystrokes,
        mouseClicks: score.mouseClicks,
        energyLevel: score.energyLevel,
        streak: score.streak,
        updatedAt: new Date(),
      },
      create: {
        staffUserId: targetStaffUserId,
        date: targetDate,
        totalScore: score.totalScore,
        attendanceScore: score.attendanceScore,
        breakScore: score.breakScore,
        activityScore: score.activityScore,
        focusScore: score.focusScore,
        achievements: score.achievements,
        clockedInAt: score.clockedInAt,
        clockedOutAt: score.clockedOutAt,
        wasLate: score.wasLate,
        lateBy: score.lateBy,
        wasEarly: score.wasEarly,
        earlyBy: score.earlyBy,
        totalBreaks: score.totalBreaks,
        activeTime: score.activeTime,
        idleTime: score.idleTime,
        keystrokes: score.keystrokes,
        mouseClicks: score.mouseClicks,
        energyLevel: score.energyLevel,
        streak: score.streak,
      },
    })

    console.log(`✅ Score generated: ${score.totalScore}/100 (${score.energyLevel})`)

    return NextResponse.json({
      success: true,
      score: gamifiedRecord,
    })
  } catch (error) {
    console.error("❌ Error generating daily score:", error)
    return NextResponse.json(
      { error: "Failed to generate score", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

