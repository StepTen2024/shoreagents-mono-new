import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateReviewScore } from "@/lib/review-templates"
import { getPerformanceLevel } from "@/lib/review-utils"

// GET /api/client/reviews - Fetch reviews for client's staff
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") // Filter by status
    const month = searchParams.get("month") // Filter by month (1-12)
    const year = searchParams.get("year") // Filter by year (e.g., 2024)

    // Build where clause
    const where: any = {
      reviewer: clientUser.email
    }

    if (status) {
      where.status = status
    }

    // Add month/year filtering for completed reviews
    if ((month !== "all" || year !== "all") && status === "SUBMITTED") {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      
      const filterYear = year && year !== "all" ? parseInt(year) : currentYear
      const filterMonth = month && month !== "all" ? parseInt(month) : currentMonth
      
      const startDate = new Date(filterYear, filterMonth - 1, 1)
      const endDate = new Date(filterYear, filterMonth, 0, 23, 59, 59)
      
      where.submittedDate = {
        gte: startDate,
        lte: endDate
      }
    }

    // Get all reviews submitted BY this client user
    const reviews = await prisma.reviews.findMany({
      where,
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ reviews, count: reviews.length })
  } catch (error) {
    console.error("Error fetching client reviews:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/client/reviews - Submit new review for staff member
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    const body = await req.json()
    const { 
      reviewId,
      ratings, 
      strengths, 
      improvements, 
      additionalComments 
    } = body

    if (!reviewId || !ratings || !strengths || !improvements) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify review exists and is PENDING
    const existingReview = await prisma.reviews.findUnique({
      where: { id: reviewId },
      include: {
        staff_users: true
      }
    })

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Check if review is pending
    if (existingReview.status !== "PENDING") {
      return NextResponse.json({ error: "Review already submitted" }, { status: 400 })
    }

    // Verify staff is assigned to this client (check companyId directly on staffUser)
    if (existingReview.staff_users.companyId !== clientUser.company.id) {
      return NextResponse.json({ error: "Staff not assigned to your organization" }, { status: 403 })
    }

    // Calculate overall score
    const scoreCalc = calculateReviewScore(ratings)
    const performanceLevel = getPerformanceLevel(scoreCalc.percentage)

    // Update review with submission
    const review = await prisma.reviews.update({
      where: { id: reviewId },
      data: {
        status: "SUBMITTED",
        ratings,
        overallScore: scoreCalc.percentage,
        performanceLevel,
        strengths,
        improvements,
        additionalComments: additionalComments || null,
        submittedDate: new Date()
      },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    // TODO: Create notification for management
    // await createNotification({
    //   type: "REVIEW_SUBMITTED",
    //   recipientRole: "ADMIN",
    //   title: "New Review Submitted",
    //   message: `${clientUser.name} completed review for ${review.staff_users.name}`,
    //   link: `/admin/reviews/${review.id}`
    // })

    return NextResponse.json({ success: true, review }, { status: 200 })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
