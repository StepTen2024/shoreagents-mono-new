import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if JSON request (skip for now) or FormData (actual upload)
    const contentType = req.headers.get("content-type") || ""
    
    if (contentType.includes("application/json")) {
      // Skip for now - just mark as submitted
      const staffUser = await prisma.staff_users.findUnique({
        where: { authUserId: session.user.id },
        include: { staff_onboarding: true }
      })

      if (!staffUser) {
        return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
      }

      const onboarding = await prisma.staff_onboarding.upsert({
        where: { staffUserId: staffUser.id },
        update: {
          signatureStatus: "SUBMITTED",
          updatedAt: new Date()
        },
        create: {
          id: crypto.randomUUID(),
          staffUserId: staffUser.id,
          signatureStatus: "SUBMITTED",
          updatedAt: new Date()
        }
      })

      await updateCompletionPercent(onboarding.id)

      return NextResponse.json({ 
        success: true,
        message: "Signature section marked for review" 
      })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get staff user
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: { staff_onboarding: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Check if signature section is locked
    if (staffUser.staff_onboarding?.signatureStatus === "APPROVED") {
      return NextResponse.json({ 
        error: "Signature section has been approved and is locked" 
      }, { status: 403 })
    }

    // Validate file type (signature should be PNG or JPG)
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only PNG and JPG are allowed" 
      }, { status: 400 })
    }

    // Validate file size (2MB max for signature)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 2MB" 
      }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `signature.${fileExt}`
    // New structure: staff_onboarding/{userId}/signature.ext
    const filePath = `staff_onboarding/${staffUser.authUserId}/${fileName}`

    // Upload to Supabase
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("staff")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      return NextResponse.json({ 
        error: "Failed to upload signature" 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("staff")
      .getPublicUrl(filePath)

    // Update onboarding record
    const onboarding = await prisma.staff_onboarding.upsert({
      where: { staffUserId: staffUser.id },
      update: {
        signatureUrl: publicUrl,
        signatureStatus: "SUBMITTED",
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        staffUserId: staffUser.id,
        signatureUrl: publicUrl,
        signatureStatus: "SUBMITTED",
        updatedAt: new Date()
      }
    })

    // Recalculate completion percentage
    await updateCompletionPercent(onboarding.id)

    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      message: "Signature uploaded successfully" 
    })

  } catch (error) {
    console.error("Signature upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload signature" },
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
  // 100% just means staff has submitted everything, not that it's verified

  await prisma.staff_onboarding.update({
    where: { id: onboardingId },
    data: { 
      completionPercent
      // isComplete is NOT updated here - only in admin complete route!
    }
  })
}

