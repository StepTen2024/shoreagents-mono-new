import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client user
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    if (!clientUser.companyId) {
      return NextResponse.json({ error: "No company assigned to client user" }, { status: 404 })
    }

    console.log('🔍 [CLIENT ONBOARDING] Fetching staff for company:', {
      companyId: clientUser.companyId,
      companyName: clientUser.company?.name,
      clientEmail: clientUser.email
    })

    // Get all staff for this company with their onboarding status
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const staffList = await prisma.staff_users.findMany({
      where: { 
        companyId: clientUser.companyId,
        // Show staff who have onboarding records (any status)
        staff_onboarding: {
          isNot: null
        }
      },
      include: {
        staff_onboarding: {
          select: {
            id: true,
            completionPercent: true,
            isComplete: true,
            personalInfoStatus: true,
            govIdStatus: true,
            documentsStatus: true,
            signatureStatus: true,
            emergencyContactStatus: true,
            updatedAt: true,
            firstName: true,
            lastName: true,
          }
        },
        staff_profiles: {
          select: {
            startDate: true,
            employmentStatus: true,
            currentRole: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Format the response with countdown calculations
    const staffWithCountdown = staffList.map(staff => {
      let daysUntilStart = null
      let startDateFormatted = null

      if (staff.staff_profiles?.startDate) {
        const startDate = new Date(staff.staff_profiles.startDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const diffTime = startDate.getTime() - today.getTime()
        daysUntilStart = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        startDateFormatted = startDate.toISOString().split('T')[0] // YYYY-MM-DD
      }

      // Calculate overall onboarding progress
      let sectionsApproved = 0
      if (staff.staff_onboarding) {
        const statuses = [
          staff.staff_onboarding.personalInfoStatus,
          staff.staff_onboarding.govIdStatus,
          staff.staff_onboarding.documentsStatus,
          staff.staff_onboarding.signatureStatus,
          staff.staff_onboarding.emergencyContactStatus
        ]
        sectionsApproved = statuses.filter(s => s === "APPROVED").length
      }

      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        avatar: staff.avatar,
        onboarding: staff.staff_onboarding ? {
          completionPercent: staff.staff_onboarding.completionPercent,
          isComplete: staff.staff_onboarding.isComplete,
          sectionsApproved,
          totalSections: 5,
          sections: {
            personalInfo: staff.staff_onboarding.personalInfoStatus,
            govId: staff.staff_onboarding.govIdStatus,
            documents: staff.staff_onboarding.documentsStatus,
            signature: staff.staff_onboarding.signatureStatus,
            emergencyContact: staff.staff_onboarding.emergencyContactStatus,
          },
          updatedAt: staff.staff_onboarding.updatedAt
        } : null,
        profile: staff.staff_profiles ? {
          startDate: startDateFormatted,
          daysUntilStart,
          employmentStatus: staff.staff_profiles.employmentStatus,
          currentRole: staff.staff_profiles.currentRole,
        } : null,
        createdAt: staff.createdAt
      }
    })

    console.log('✅ [CLIENT ONBOARDING] Found staff:', {
      count: staffWithCountdown.length,
      staffNames: staffWithCountdown.map(s => s.name)
    })

    return NextResponse.json({ staff: staffWithCountdown })

  } catch (error) {
    console.error("Client onboarding error:", error)
    return NextResponse.json(
      { error: "Failed to fetch onboarding data" },
      { status: 500 }
    )
  }
}

