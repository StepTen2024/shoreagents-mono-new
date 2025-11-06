import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { isReviewOverdue, isCriticalScore } from "@/lib/review-utils"

// GET /api/admin/reviews/stats - Get review statistics for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all reviews
    const allReviews = await prisma.reviews.findMany({
      select: {
        id: true,
        status: true,
        dueDate: true,
        overallScore: true,
        type: true,
        createdAt: true
      }
    })

    // Count by status
    const pending = allReviews.filter(r => r.status === "PENDING").length
    const submitted = allReviews.filter(r => r.status === "SUBMITTED").length
    const underReview = allReviews.filter(r => r.status === "UNDER_REVIEW").length
    const completed = allReviews.filter(r => r.status === "COMPLETED").length

    // Count overdue reviews (PENDING or SUBMITTED past due date)
    const overdue = allReviews.filter(r => 
      (r.status === "PENDING" || r.status === "SUBMITTED") && 
      isReviewOverdue(r.dueDate)
    ).length

    // Count critical scores (< 50% and SUBMITTED or UNDER_REVIEW)
    const critical = allReviews.filter(r => 
      r.overallScore && 
      (r.status === "SUBMITTED" || r.status === "UNDER_REVIEW") &&
      isCriticalScore(Number(r.overallScore))
    ).length

    // Count by review type
    const month1 = allReviews.filter(r => r.type === "MONTH_1").length
    const month3 = allReviews.filter(r => r.type === "MONTH_3").length
    const month5 = allReviews.filter(r => r.type === "MONTH_5").length
    const recurring = allReviews.filter(r => r.type === "RECURRING").length

    // Get recent reviews (last 5)
    const recentReviews = await prisma.reviews.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    const stats = {
      total: allReviews.length,
      byStatus: {
        pending,
        submitted,
        underReview,
        completed
      },
      alerts: {
        overdue,
        critical
      },
      byType: {
        month1,
        month3,
        month5,
        recurring
      },
      recent: recentReviews
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching review stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

