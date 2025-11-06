import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: { staff_onboarding: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    if (!staffUser.staff_onboarding) {
      return NextResponse.json({ error: "No onboarding found" }, { status: 404 })
    }

    // Check if documents section is locked
    if (staffUser.staff_onboarding.documentsStatus === "APPROVED") {
      return NextResponse.json({ 
        error: "Documents section has been approved and is locked" 
      }, { status: 403 })
    }

    // Allow submission even without documents (staff can skip for now)
    // const hasRequiredDocs = 
    //   staffUser.staff_onboarding.validIdUrl ||
    //   staffUser.staff_onboarding.birthCertUrl ||
    //   staffUser.staff_onboarding.nbiClearanceUrl
    //
    // if (!hasRequiredDocs) {
    //   return NextResponse.json({ 
    //     error: "Please upload at least one required document before submitting" 
    //   }, { status: 400 })
    // }

    // Mark documents section as submitted
    const onboarding = await prisma.staff_onboarding.update({
      where: { id: staffUser.staff_onboarding.id },
      data: {
        documentsStatus: "SUBMITTED",
        updatedAt: new Date()
      }
    })

    // Recalculate completion percentage
    await updateCompletionPercent(onboarding.id)

    return NextResponse.json({ 
      success: true,
      message: "Documents submitted for review" 
    })

  } catch (error) {
    console.error("Documents submit error:", error)
    return NextResponse.json(
      { error: "Failed to submit documents" },
      { status: 500 }
    )
  }
}

// Helper function to calculate completion percentage
async function updateCompletionPercent(onboardingId: string) {
  const onboarding = await prisma.staff_onboarding.findUnique({
    where: { id: onboardingId }
  })

  if (!onboarding) return

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

  // Each section = 12.5% when APPROVED (8 sections total)
  let totalProgress = 0
  sections.forEach(status => {
    if (status === "APPROVED") {
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
}

