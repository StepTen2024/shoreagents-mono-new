import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/leaderboard - Get leaderboard rankings
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timePeriod = searchParams.get("period") || "all_time" // this_week, this_month, all_time

    // Get all staff users with their gamification profiles
    const staffUsers = await prisma.staff_users.findMany({
      where: {
        role: "STAFF", // Only show staff members in leaderboard
      },
      include: {
        gamification_profiles: true,
        reviews: {
          select: {
            overallScore: true,
          },
        },
      },
    })

    // Calculate rankings
    const rankings = staffUsers
      .map((user) => {
        const avgReviewScore =
          user.reviews.length > 0
            ? user.reviews.reduce(
                (sum, review) => sum + Number(review.overallScore || 0),
                0
              ) / user.reviews.length
            : 0

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          points: user.gamification_profiles?.points || 0,
          level: user.gamification_profiles?.level || 1,
          tasksCompleted: user.gamification_profiles?.tasksCompleted || 0,
          performanceScore: user.gamification_profiles?.performanceScore || 0,
          reviewRating: Number(avgReviewScore.toFixed(1)),
          streakDays: user.gamification_profiles?.streak || 0,
          badges: [],
          rankChange: 0,
        }
      })
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({ ...user, rank: index + 1 }))

    // Find current user in rankings
    const currentUser = rankings.find((user) => user.id === session.user.id) || null

    return NextResponse.json({ rankings, currentUser })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

