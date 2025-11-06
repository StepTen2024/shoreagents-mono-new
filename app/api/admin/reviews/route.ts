import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// GET /api/admin/reviews - Get ALL reviews (admin view) with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get("reviewId")
    const staffId = searchParams.get("staffId")
    const clientId = searchParams.get("clientId")
    const status = searchParams.get("status")
    const type = searchParams.get("type")

    let where: any = {}

    // If reviewId is provided, ONLY filter by that (most specific filter)
    if (reviewId) {
      where = { id: reviewId }
    } else {
      // Apply other filters only if reviewId is not provided
      // Filter by specific staff
      if (staffId) {
        where.staffUserId = staffId
      }

      // Filter by client/company
      if (clientId) {
        const staffUsers = await prisma.staff_users.findMany({
          where: { companyId: clientId },
          select: { id: true }
        })
        where.staffUserId = { in: staffUsers.map(s => s.id) }
      }

      // Filter by status
      if (status) {
        where.status = status
      }

      // Filter by type
      if (type) {
        where.type = type
      }
    }

    const reviews = await prisma.reviews.findMany({
      where,
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            companyId: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    // Fetch reviewer names from ClientUser table
    const reviewerEmails = [...new Set(reviews.map(r => r.reviewer))]
    const clientUsers = await prisma.client_users.findMany({
      where: {
        email: { in: reviewerEmails }
      },
      select: {
        email: true,
        name: true
      }
    })

    // Fetch admin reviewer names from ManagementUser table
    const adminReviewerEmails = [...new Set(reviews.map(r => r.reviewedBy).filter(Boolean))]
    const managementUsers = await prisma.management_users.findMany({
      where: {
        email: { in: adminReviewerEmails }
      },
      select: {
        email: true,
        name: true
      }
    })

    // Create maps of email to name
    const reviewerMap = new Map(
      clientUsers.map(cu => [cu.email, cu.name])
    )
    const adminReviewerMap = new Map(
      managementUsers.map(mu => [mu.email, mu.name])
    )

    // Add reviewer names to reviews
    const reviewsWithNames = reviews.map(review => ({
      ...review,
      reviewerName: reviewerMap.get(review.reviewer) || review.reviewer.split('@')[0],
      reviewedByName: adminReviewerMap.get(review.reviewedBy) || review.reviewedBy
    }))

    return NextResponse.json({ reviews: reviewsWithNames, count: reviewsWithNames.length })
  } catch (error) {
    console.error("Error fetching admin reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

// PUT /api/admin/reviews - Process review (mark as reviewed)
export async function PUT(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reviewId, managementNotes, reviewedBy } = body

    if (!reviewId) {
      return NextResponse.json({ error: "Missing reviewId" }, { status: 400 })
    }

    // Get the review
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Only process if status is SUBMITTED
    if (review.status !== "SUBMITTED") {
      return NextResponse.json({ 
        error: "Review must be in SUBMITTED status to process" 
      }, { status: 400 })
    }

    // Update review: SUBMITTED → UNDER_REVIEW
    const updatedReview = await prisma.reviews.update({
      where: { id: reviewId },
      data: { 
        status: "UNDER_REVIEW",
        managementNotes: managementNotes || null,
        reviewedBy: reviewedBy || user.email,
        reviewedDate: new Date()
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

    // TODO: Create notification for staff
    // await createNotification({
    //   type: "REVIEW_PROCESSED",
    //   recipientUserId: review.staff_users.id,
    //   title: "Your Performance Review is Ready",
    //   message: `Your ${review.type} review has been completed`,
    //   link: `/reviews`
    // })

    return NextResponse.json({ success: true, review: updatedReview })
  } catch (error) {
    console.error("Error processing review:", error)
    return NextResponse.json({ error: "Failed to process review" }, { status: 500 })
  }
}
