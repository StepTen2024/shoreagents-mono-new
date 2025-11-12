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
      firstName,
      middleName,
      lastName,
      gender,
      civilStatus,
      dateOfBirth,
      contactNo,
      email
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
    if (staffUser.staff_onboarding?.personalInfoStatus === "APPROVED") {
      return NextResponse.json({ 
        error: "This section has been approved and is locked" 
      }, { status: 403 })
    }

    // Update or create onboarding
    const onboarding = await prisma.staff_onboarding.upsert({
      where: { staffUserId: staffUser.id },
      update: {
        firstName,
        middleName,
        lastName,
        gender,
        civilStatus,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        contactNo,
        email,
        personalInfoStatus: "SUBMITTED",
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        staffUserId: staffUser.id,
        firstName,
        middleName,
        lastName,
        gender,
        civilStatus,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        contactNo,
        email,
        personalInfoStatus: "SUBMITTED",
        updatedAt: new Date()
      }
    })

    // Recalculate completion percentage
    await updateCompletionPercent(onboarding.id)

    return NextResponse.json({ 
      success: true,
      message: "Personal information saved successfully" 
    })

  } catch (error) {
    console.error("Personal info save error:", error)
    return NextResponse.json(
      { error: "Failed to save personal information" },
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

  // Each section = 12.5% when SUBMITTED or APPROVED (8 sections total)
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
}

