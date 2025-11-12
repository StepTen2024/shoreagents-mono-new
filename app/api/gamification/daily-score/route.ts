import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"

/**
 * GET /api/gamification/daily-score
 * 
 * Fetches gamification scores
 * Query params:
 * - date: specific date (optional, defaults to today)
 * - staffUserId: specific staff (optional, defaults to current user)
 * - range: "week" | "month" (optional, gets multiple days)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date")
    const staffUserIdParam = searchParams.get("staffUserId")
    const range = searchParams.get("range")

    // Get staff user
    let targetStaffUserId = staffUserIdParam
    if (!targetStaffUserId) {
      const staffUser = await getStaffUser()
      if (!staffUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      targetStaffUserId = staffUser.id
    }

    // Parse date
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    targetDate.setHours(0, 0, 0, 0)

    // ==========================================
    // FETCH BASED ON RANGE
    // ==========================================
    if (range === "week" || range === "month") {
      // Get multiple days
      const daysBack = range === "week" ? 7 : 30
      const startDate = new Date(targetDate)
      startDate.setDate(startDate.getDate() - daysBack)

      const scores = await prisma.staff_gamified_daily.findMany({
        where: {
          staffUserId: targetStaffUserId,
          date: {
            gte: startDate,
            lte: targetDate,
          },
        },
        orderBy: { date: "desc" },
      })

      // Calculate averages
      const totalScoreAvg = scores.length > 0 
        ? Math.round(scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length)
        : 0

      const attendanceAvg = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s.attendanceScore, 0) / scores.length)
        : 0

      const breakAvg = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s.breakScore, 0) / scores.length)
        : 0

      const activityAvg = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s.activityScore, 0) / scores.length)
        : 0

      const focusAvg = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s.focusScore, 0) / scores.length)
        : 0

      return NextResponse.json({
        success: true,
        scores,
        summary: {
          totalScoreAvg,
          attendanceAvg,
          breakAvg,
          activityAvg,
          focusAvg,
          daysTracked: scores.length,
          period: range,
        },
      })
    } else {
      // Get single day
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)

      const score = await prisma.staff_gamified_daily.findFirst({
        where: {
          staffUserId: targetStaffUserId,
          date: {
            gte: targetDate,
            lt: nextDay,
          },
        },
      })

      if (!score) {
        return NextResponse.json({
          success: false,
          message: "No score found for this date. Score may not be generated yet.",
          score: null,
        })
      }

      return NextResponse.json({
        success: true,
        score,
      })
    }
  } catch (error) {
    console.error("❌ Error fetching daily score:", error)
    return NextResponse.json(
      { error: "Failed to fetch score", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

