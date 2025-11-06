import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const { id } = resolvedParams

    // Get staff user first
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Fetch the review with all related data - ensure it belongs to the staff user
    const review = await prisma.reviews.findFirst({
      where: {
        id: id,
        staffUserId: staffUser.id,
        status: {
          in: ["UNDER_REVIEW", "COMPLETED"]
        }
      },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Fetch reviewer names from ClientUser table
    const reviewerEmails = [review.reviewer]
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
    const adminReviewerEmails = review.reviewedBy ? [review.reviewedBy] : []
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

    // Convert Decimal fields to numbers and add reviewer names
    const reviewWithNames = {
      ...review,
      reviewerName: reviewerMap.get(review.reviewer) || review.reviewer.split('@')[0],
      reviewedByName: review.reviewedBy ? adminReviewerMap.get(review.reviewedBy) || review.reviewedBy : null,
      overallScore: review.overallScore ? Number(review.overallScore) : null,
    }

    return NextResponse.json({ review: reviewWithNames })
  } catch (error) {
    console.error("Error fetching review:", error)
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    )
  }
}
