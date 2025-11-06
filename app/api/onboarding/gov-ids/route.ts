import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      sss,
      tin,
      philhealthNo,
      pagibigNo,
      sssDocUrl,
      tinDocUrl,
      philhealthDocUrl,
      pagibigDocUrl
    } = body

    // Get staff user
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: { staff_onboarding: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Check if section is locked (already approved)
    if (staffUser.staff_onboarding?.govIdStatus === "APPROVED") {
      return NextResponse.json({ 
        error: "This section has been approved and is locked" 
      }, { status: 403 })
    }

    // Validate ID formats (COMMENTED OUT FOR TESTING - RE-ENABLE LATER)
    // const errors: string[] = []
    // 
    // if (sss && !/^\d{2}-\d{7}-\d$/.test(sss)) {
    //   errors.push("SSS format should be XX-XXXXXXX-X")
    // }
    // 
    // if (tin && !/^\d{3}-\d{3}-\d{3}-\d{3}$/.test(tin)) {
    //   errors.push("TIN format should be XXX-XXX-XXX-XXX")
    // }
    // 
    // if (philhealthNo && !/^\d{2}-\d{9}-\d$/.test(philhealthNo)) {
    //   errors.push("PhilHealth format should be XX-XXXXXXXXX-X")
    // }
    // 
    // if (pagibigNo && !/^\d{4}-\d{4}-\d{4}$/.test(pagibigNo)) {
    //   errors.push("Pag-IBIG format should be XXXX-XXXX-XXXX")
    // }
    //
    // if (errors.length > 0) {
    //   return NextResponse.json({ 
    //     error: "Invalid ID format", 
    //     details: errors 
    //   }, { status: 400 })
    // }

    // Update or create onboarding
    const onboarding = await prisma.staff_onboarding.upsert({
      where: { staffUserId: staffUser.id },
      update: {
        sss,
        tin,
        philhealthNo,
        pagibigNo,
        sssDocUrl,
        tinDocUrl,
        philhealthDocUrl,
        pagibigDocUrl,
        govIdStatus: "SUBMITTED",
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        staffUserId: staffUser.id,
        sss,
        tin,
        philhealthNo,
        pagibigNo,
        sssDocUrl,
        tinDocUrl,
        philhealthDocUrl,
        pagibigDocUrl,
        govIdStatus: "SUBMITTED",
        updatedAt: new Date()
      }
    })

    // Recalculate completion percentage
    const completionPercent = await updateCompletionPercent(onboarding.id)

    return NextResponse.json({ 
      success: true,
      message: "Government IDs saved successfully",
      completionPercent
    })

  } catch (error) {
    console.error("Gov IDs save error:", error)
    return NextResponse.json(
      { error: "Failed to save government IDs" },
      { status: 500 }
    )
  }
}

// Helper function to calculate completion percentage
async function updateCompletionPercent(onboardingId: string): Promise<number> {
  const onboarding = await prisma.staff_onboarding.findUnique({
    where: { id: onboardingId }
  })

  if (!onboarding) return 0

  const sections = [
    onboarding.personalInfoStatus,
    onboarding.resumeStatus,
    onboarding.govIdStatus,
    onboarding.educationStatus,
    onboarding.medicalStatus,
    onboarding.dataPrivacyStatus,
    onboarding.signatureStatus,
    onboarding.emergencyContactStatus
  ]

  // Each section = 12.5% when SUBMITTED (8 sections total)
  let totalProgress = 0
  sections.forEach(status => {
    if (status === "SUBMITTED" || status === "APPROVED") {
      totalProgress += Math.round(100 / sections.length)
    }
  })

  const completionPercent = Math.min(totalProgress, 100)

  // DON'T set isComplete here - only admin can complete via complete route!
  await prisma.staff_onboarding.update({
    where: { id: onboardingId },
    data: { 
      completionPercent
      // isComplete is NOT updated here - only in admin complete route!
    }
  })

  return completionPercent
}

