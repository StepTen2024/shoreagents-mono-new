import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { getReviewDueDate, shouldCreateReview, ReviewType } from "@/lib/review-templates"
import { getDaysSinceStart } from "@/lib/review-utils"

// POST /api/admin/reviews/trigger-creation - Manual trigger for review creation (local dev)
export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔄 Starting review auto-creation check...")

    // Get all active staff users with their profiles (which contain startDate)
    const staffUsers = await prisma.staff_users.findMany({
      where: {
        staff_profiles: {
          startDate: { not: null }
        }
      },
      include: {
        company: true,
        staff_profiles: true
      }
    })

    let created = 0
    let skipped = 0
    const results: any[] = []

    for (const staff of staffUsers) {
      if (!staff.staff_profiles?.startDate) {
        skipped++
        continue
      }

      const startDate = staff.staff_profiles.startDate
      const daysSinceStart = getDaysSinceStart(startDate)
      
      // Get existing reviews for this staff
      const existingReviews = await prisma.reviews.findMany({
        where: { staffUserId: staff.id },
        select: { type: true, status: true }
      })

      const completedTypes = existingReviews
        .filter(r => r.status !== "PENDING")
        .map(r => r.type)

      // Check each review type
      const reviewTypes: ReviewType[] = ["MONTH_1", "MONTH_3", "MONTH_5", "RECURRING"]

      for (const reviewType of reviewTypes) {
        // Skip if already exists (pending or completed)
        const alreadyExists = existingReviews.some(r => r.type === reviewType)
        if (alreadyExists) {
          continue
        }

        // Check if we should create this review type
        const shouldCreate = shouldCreateReview(startDate, reviewType)

        if (shouldCreate) {
          // Get client user for this company
          const clientUser = await prisma.client_users.findFirst({
            where: { companyId: staff.companyId },
            orderBy: { createdAt: "asc" } // Get first/primary client user
          })

          if (!clientUser) {
            console.log(`⚠️  No client user found for company ${staff.companyId}`)
            skipped++
            continue
          }

          const dueDate = getReviewDueDate(startDate, reviewType)
          const evaluationPeriod = `${startDate.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`

          // Create review
          const review = await prisma.reviews.create({
            data: {
              staffUserId: staff.id,
              type: reviewType,
              status: "PENDING",
              client: staff.company?.name || "Unknown Company",
              reviewer: clientUser.email,
              reviewerTitle: clientUser.role,
              dueDate,
              evaluationPeriod
            }
          })

          created++
          results.push({
            action: "created",
            staffName: staff.name,
            reviewType,
            dueDate,
            daysSinceStart
          })

          console.log(`✅ Created ${reviewType} review for ${staff.name} (${daysSinceStart} days employed)`)

          // TODO: Create notification for client
          // await createNotification({
          //   type: "REVIEW_CREATED",
          //   recipientEmail: clientUser.email,
          //   title: `Performance Review Due for ${staff.name}`,
          //   message: `${staff.name}'s ${reviewType} review is due on ${dueDate.toLocaleDateString()}`,
          //   link: `/client/reviews/submit/${review.id}`
          // })
        }
      }

      // Handle recurring reviews for regularized staff
      if (daysSinceStart >= 173) { // 7 days before 180 days
        const recurringExists = existingReviews.some(r => r.type === "RECURRING")
        if (!recurringExists) {
          const clientUser = await prisma.client_users.findFirst({
            where: { companyId: staff.companyId },
            orderBy: { createdAt: "asc" }
          })

          if (clientUser) {
            const dueDate = getReviewDueDate(startDate, "RECURRING")
            const evaluationPeriod = `Past 6 months`

            const review = await prisma.reviews.create({
              data: {
                staffUserId: staff.id,
                type: "RECURRING",
                status: "PENDING",
                client: staff.company?.name || "Unknown Company",
                reviewer: clientUser.email,
                reviewerTitle: clientUser.role,
                dueDate,
                evaluationPeriod
              }
            })

            created++
            results.push({
              action: "created",
              staffName: staff.name,
              reviewType: "RECURRING",
              dueDate,
              daysSinceStart
            })

            console.log(`✅ Created RECURRING review for ${staff.name}`)
          }
        }
      }
    }

    console.log(`✅ Review creation complete: ${created} created, ${skipped} skipped`)

    return NextResponse.json({ 
      success: true,
      created,
      skipped,
      results
    })
  } catch (error) {
    console.error("Error creating reviews:", error)
    return NextResponse.json({ 
      error: "Failed to create reviews",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

