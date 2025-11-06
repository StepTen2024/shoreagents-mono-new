import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Update signature status to SUBMITTED without requiring new upload
    // Since the signature already exists from contract signing
    const onboarding = await prisma.staff_onboarding.update({
      where: { staffUserId: staffUser.id },
      data: {
        signatureStatus: "SUBMITTED",
        updatedAt: new Date()
      }
    })

    console.log('✅ [ONBOARDING] Signature confirmed for staff:', staffUser.name)

    return NextResponse.json({ 
      success: true, 
      signatureStatus: onboarding.signatureStatus 
    })

  } catch (error) {
    console.error("Signature confirmation error:", error)
    return NextResponse.json(
      { error: "Failed to confirm signature" },
      { status: 500 }
    )
  }
}

