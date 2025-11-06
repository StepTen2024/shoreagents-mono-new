import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/reviews - Get reviews for staff (only UNDER_REVIEW and COMPLETED)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user first
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Get reviews - only UNDER_REVIEW and COMPLETED
    // Staff cannot see PENDING or SUBMITTED reviews
    const reviews = await prisma.reviews.findMany({
      where: {
        staffUserId: staffUser.id,
        status: {
          in: ["UNDER_REVIEW", "COMPLETED"]
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

    // Add reviewer names to reviews and convert Decimal fields to numbers
    const reviewsWithNames = reviews.map(review => ({
      ...review,
      reviewerName: reviewerMap.get(review.reviewer) || review.reviewer.split('@')[0],
      reviewedByName: adminReviewerMap.get(review.reviewedBy) || review.reviewedBy,
      overallScore: review.overallScore ? Number(review.overallScore) : null,
    }))

    return NextResponse.json({ reviews: reviewsWithNames, count: reviewsWithNames.length })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
