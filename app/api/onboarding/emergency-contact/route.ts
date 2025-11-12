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
      emergencyContactName,
      emergencyContactNo,
      emergencyRelationship
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
    if (staffUser.staff_onboarding?.emergencyContactStatus === "APPROVED") {
      return NextResponse.json({ 
        error: "This section has been approved and is locked" 
      }, { status: 403 })
    }

    // Update or create onboarding
    const onboarding = await prisma.staff_onboarding.upsert({
      where: { staffUserId: staffUser.id },
      update: {
        emergencyContactName,
        emergencyContactNo,
        emergencyRelationship,
        emergencyContactStatus: "SUBMITTED",
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        staffUserId: staffUser.id,
        email: staffUser.email,
        emergencyContactName,
        emergencyContactNo,
        emergencyRelationship,
        emergencyContactStatus: "SUBMITTED",
        updatedAt: new Date()
      }
    })

    // Recalculate completion percentage
    await updateCompletionPercent(onboarding.id)

    // Fetch updated onboarding to get completion percent
    const updatedOnboarding = await prisma.staff_onboarding.findUnique({
      where: { id: onboarding.id }
    })

    return NextResponse.json({ 
      success: true,
      message: "Emergency contact saved successfully",
      completionPercent: updatedOnboarding?.completionPercent || 0
    })

  } catch (error) {
    console.error("Emergency contact save error:", error)
    return NextResponse.json(
      { error: "Failed to save emergency contact" },
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

  const totalSteps = 8
  let completedSteps = 0

  // Count each step as completed if it's SUBMITTED or APPROVED
  if (onboarding.personalInfoStatus === 'SUBMITTED' || onboarding.personalInfoStatus === 'APPROVED') completedSteps++
  if (onboarding.resumeStatus === 'SUBMITTED' || onboarding.resumeStatus === 'APPROVED') completedSteps++
  if (onboarding.govIdStatus === 'SUBMITTED' || onboarding.govIdStatus === 'APPROVED') completedSteps++
  if (onboarding.educationStatus === 'SUBMITTED' || onboarding.educationStatus === 'APPROVED') completedSteps++
  if (onboarding.medicalStatus === 'SUBMITTED' || onboarding.medicalStatus === 'APPROVED') completedSteps++
  if (onboarding.dataPrivacyStatus === 'SUBMITTED' || onboarding.dataPrivacyStatus === 'APPROVED') completedSteps++
  if (onboarding.signatureStatus === 'SUBMITTED' || onboarding.signatureStatus === 'APPROVED') completedSteps++
  if (onboarding.emergencyContactStatus === 'SUBMITTED' || onboarding.emergencyContactStatus === 'APPROVED') completedSteps++

  const totalProgress = Math.floor((completedSteps / totalSteps) * 100)
  const completionPercent = Math.min(totalProgress, 100)
  
  // DON'T set isComplete here - only admin can complete via complete route!
  // 100% just means staff has submitted everything, not that it's verified

  await prisma.staff_onboarding.update({
    where: { id: onboardingId },
    data: { 
      completionPercent
      // isComplete is NOT updated here - only in admin complete route!
    }
  })
}

