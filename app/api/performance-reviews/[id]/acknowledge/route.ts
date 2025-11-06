import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logReviewCompleted } from "@/lib/activity-generator"

// POST /api/reviews/[id]/acknowledge - Acknowledge a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    const { id } = await params

    // Verify review belongs to staff user
    const existingReview = await prisma.reviews.findUnique({
      where: { id },
    })

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    if (existingReview.staffUserId !== staffUser.id) {
      return NextResponse.json({ error: "Forbidden - Review does not belong to you" }, { status: 403 })
    }

    // Only acknowledge if status is UNDER_REVIEW
    if (existingReview.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        { error: "Review must be in UNDER_REVIEW status to acknowledge" },
        { status: 400 }
      )
    }

    // Update review: UNDER_REVIEW → COMPLETED
    const review = await prisma.reviews.update({
      where: { id },
      data: {
        status: "COMPLETED",
        acknowledgedDate: new Date(),
      },
    })

    // ✨ Auto-generate activity post (only if score >= 75%)
    if (existingReview.overallScore && Number(existingReview.overallScore) >= 75) {
      await logReviewCompleted(
        staffUser.id,
        staffUser.name,
        Number(existingReview.overallScore),
        existingReview.type || "Review"
      )
    }

    // TODO: Create notification for client
    // await createNotification({
    //   type: "REVIEW_ACKNOWLEDGED",
    //   recipientEmail: review.reviewer,
    //   title: "Review Acknowledged",
    //   message: `${staffUser.name} has acknowledged their ${review.type} review`,
    //   link: `/client/reviews`
    // })

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error("Error acknowledging review:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
