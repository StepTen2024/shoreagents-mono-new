import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper function to retry Prisma queries
async function retryQuery<T>(queryFn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await queryFn()
    } catch (error) {
      console.error(`[ONBOARDING-STATUS] Query attempt ${i + 1}/${retries} failed:`, error)
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))) // 1s, 2s, 4s
    }
  }
  throw new Error('Retry limit exceeded')
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user with retry logic
    const staffUser = await retryQuery(() => prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        staff_onboarding: true
      }
    }))

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Check if onboarding exists
    if (!staffUser.staff_onboarding) {
      return NextResponse.json({ 
        exists: false,
        shouldRedirect: true,
        completionPercent: 0
      })
    }

    return NextResponse.json({ 
      exists: true,
      shouldRedirect: !staffUser.staff_onboarding.isComplete,
      completionPercent: staffUser.staff_onboarding.completionPercent,
      isComplete: staffUser.staff_onboarding.isComplete
    })

  } catch (error) {
    console.error("Onboarding status check error:", error)
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    )
  }
}

