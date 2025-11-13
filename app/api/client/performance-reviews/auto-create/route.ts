import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getReviewDueDate, ReviewType } from "@/lib/review-templates"
import { getDaysSinceStart } from "@/lib/review-utils"

// POST /api/client/reviews/auto-create - Auto-create reviews for client's staff
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
      console.error("❌ Client user not found:", session.user.email)
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    if (!clientUser.company) {
      console.error("❌ Client user has no company:", clientUser.email)
      return NextResponse.json({ error: "Client user has no company assigned" }, { status: 400 })
    }

    console.log(`🔄 Auto-creating reviews for client: ${clientUser.email}`)
    console.log(`🏢 Company: ${clientUser.company.companyName} (ID: ${clientUser.company.id})`)

    // Get all staff users for this client's company
    const staffUsers = await prisma.staff_users.findMany({
      where: {
        companyId: clientUser.company.id
      },
      include: {
        staff_profiles: true
      }
    })

    // Filter to only include staff with startDate
    const staffWithStartDate = staffUsers.filter(staff => staff.staff_profiles?.startDate)

    console.log(`👥 Found ${staffUsers.length} total staff users, ${staffWithStartDate.length} with start dates`)

    let created = 0
    let skipped = 0
    const results: any[] = []

    for (const staff of staffWithStartDate) {
      if (!staff.staff_profiles?.startDate) {
        console.log(`⚠️  ${staff.name}: No start date in profile`)
        continue
      }
      
      const startDate = staff.staff_profiles.startDate
      const daysSinceStart = getDaysSinceStart(startDate)
      
      console.log(`\n🔍 Checking ${staff.name}:`)
      console.log(`   Start Date: ${startDate.toLocaleDateString()}`)
      console.log(`   Days Since Start: ${daysSinceStart}`)
      
      // Check each review type to see if it should be created (7 days before due)
      const reviewTypes: ReviewType[] = ["MONTH_1", "MONTH_3", "MONTH_5"]
      let reviewType: ReviewType | null = null
      let recurringDueDate: Date | null = null
      
      // Check probation reviews (Month 1, 3, 5)
      for (const type of reviewTypes) {
        const dueDate = getReviewDueDate(startDate, type)
        const createDate = new Date(dueDate)
        createDate.setDate(createDate.getDate() - 7) // 7 days before due
        
        const now = new Date()
        
        console.log(`   ${type}:`)
        console.log(`     Due Date: ${dueDate.toLocaleDateString()}`)
        console.log(`     Create Date: ${createDate.toLocaleDateString()}`)
        console.log(`     Today: ${now.toLocaleDateString()}`)
        
        // Check if today is on or after the create date AND before the due date
        const shouldCreate = now >= createDate && now < dueDate
        console.log(`     Should Create: ${shouldCreate}`)
        
        if (shouldCreate) {
          // Check if this review type already exists
          const exists = await prisma.reviews.findFirst({
            where: {
              staffUserId: staff.id,
              type: type,
              reviewer: clientUser.email
            }
          })
          
          console.log(`     Already Exists: ${!!exists}`)
          
          if (!exists) {
            reviewType = type
            console.log(`📅 ${staff.name}: ${type} review ready for creation!`)
            break // Only create one review at a time
          } else {
            console.log(`⏭️  ${staff.name}: ${type} review already exists`)
          }
        } else {
          const daysUntilCreate = Math.ceil((createDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (daysUntilCreate > 0) {
            console.log(`⏳ ${staff.name}: ${type} review will be created in ${daysUntilCreate} days`)
          } else {
            console.log(`⏭️  ${staff.name}: ${type} review due date has passed`)
          }
        }
      }
      
      // Check for RECURRING reviews (after regularisation at day 150)
      if (!reviewType && daysSinceStart >= 323) {
        console.log(`   Checking RECURRING reviews (post-regularisation)...`)
        
        // Get all existing recurring reviews for this staff member
        const existingRecurring = await prisma.reviews.findMany({
          where: {
            staffUserId: staff.id,
            type: "RECURRING"
          },
          orderBy: { dueDate: 'desc' }
        })
        
        console.log(`     Existing RECURRING reviews: ${existingRecurring.length}`)
        
        // Calculate which recurring review should be due
        // First recurring: day 330 (150 + 180)
        // Second recurring: day 510 (330 + 180)
        // Third recurring: day 690 (510 + 180)
        const recurringNumber = existingRecurring.length + 1
        const daysUntilDue = 330 + (existingRecurring.length * 180) // 330, 510, 690, etc.
        recurringDueDate = new Date(startDate)
        recurringDueDate.setDate(recurringDueDate.getDate() + daysUntilDue)
        
        const createDate = new Date(recurringDueDate)
        createDate.setDate(createDate.getDate() - 7)
        
        const now = new Date()
        const shouldCreate = now >= createDate && now < recurringDueDate
        
        console.log(`     Recurring #${recurringNumber}:`)
        console.log(`     Due Date: ${recurringDueDate.toLocaleDateString()} (day ${daysUntilDue})`)
        console.log(`     Create Date: ${createDate.toLocaleDateString()}`)
        console.log(`     Should Create: ${shouldCreate}`)
        
        if (shouldCreate) {
          reviewType = "RECURRING"
          console.log(`📅 ${staff.name}: RECURRING review #${recurringNumber} ready for creation!`)
        }
      }
      
      if (!reviewType) {
        console.log(`⏭️  Skipping ${staff.name} (${daysSinceStart} days - no review needed or already exists)`)
        skipped++
        continue
      }

      // Create the review
      const dueDate = recurringDueDate || getReviewDueDate(startDate, reviewType)
      const evaluationPeriod = reviewType === "RECURRING" ? "Past 6 months" : `Day 1 to Day ${daysSinceStart}`

      const review = await prisma.reviews.create({
        data: {
          id: require('crypto').randomUUID(),
          staffUserId: staff.id,
          type: reviewType,
          status: "PENDING",
          client: clientUser.company.companyName,
          reviewer: clientUser.email,
          reviewerTitle: clientUser.role,
          dueDate,
          evaluationPeriod,
          updatedAt: new Date()
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
    }

    console.log(`🎉 Auto-creation complete: ${created} created, ${skipped} skipped`)

    return NextResponse.json({
      success: true,
      created,
      skipped,
      results
    })

  } catch (error) {
    console.error("❌ Error in auto-review creation:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
