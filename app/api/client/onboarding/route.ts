import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client user with profile to get timezone
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: { 
        company: true,
        client_profiles: true
      }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    if (!clientUser.companyId) {
      return NextResponse.json({ error: "No company assigned to client user" }, { status: 404 })
    }

    // Get client's timezone from profile, default to UTC
    const clientTimezone = clientUser.client_profiles?.timezone || 'UTC'

    console.log('🔍 [CLIENT ONBOARDING] Fetching staff for company:', {
      companyId: clientUser.companyId,
      companyName: clientUser.company?.name,
      clientEmail: clientUser.email,
      clientTimezone
    })

    // Get all staff for this company with their onboarding status
    // Get current date in client's timezone
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: clientTimezone }))
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
            resumeStatus: true,
            govIdStatus: true,
            educationStatus: true,
            medicalStatus: true,
            dataPrivacyStatus: true,
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
    // Conversion flow: UTC (database) → PH timezone → Client timezone
    const staffWithCountdown = staffList.map(staff => {
      let daysUntilStart = null
      let startDateFormatted = null

      if (staff.staff_profiles?.startDate) {
        // Step 1: Get the stored start date (UTC from database)
        const startDateUTC = new Date(staff.staff_profiles.startDate)
        startDateFormatted = startDateUTC.toISOString().split('T')[0] // YYYY-MM-DD
        
        // Step 2: Convert UTC to PH timezone (Asia/Manila)
        const startDateInPH = new Date(startDateUTC.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
        startDateInPH.setHours(0, 0, 0, 0) // Midnight in PH time
        
        // Step 3: Get today's date in PH timezone (where staff actually is)
        const todayInPH = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
        todayInPH.setHours(0, 0, 0, 0)
        
        // Step 4: Calculate days difference in PH timezone
        // This ensures countdown is based on staff's local time, not client's
        const diffTime = startDateInPH.getTime() - todayInPH.getTime()
        daysUntilStart = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        console.log(`📅 [Date Conversion] ${staff.name}:`, {
          utc: startDateUTC.toISOString(),
          phStartDate: startDateInPH.toLocaleString('en-US', { timeZone: 'Asia/Manila' }),
          phToday: todayInPH.toLocaleString('en-US', { timeZone: 'Asia/Manila' }),
          daysUntilStart,
          clientTimezone: clientTimezone
        })
      }

      // Calculate overall onboarding progress (8 sections total)
      let sectionsApproved = 0
      if (staff.staff_onboarding) {
        const statuses = [
          staff.staff_onboarding.personalInfoStatus,
          staff.staff_onboarding.resumeStatus,
          staff.staff_onboarding.govIdStatus,
          staff.staff_onboarding.educationStatus,
          staff.staff_onboarding.medicalStatus,
          staff.staff_onboarding.dataPrivacyStatus,
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
          totalSections: 8,
          sections: {
            personalInfo: staff.staff_onboarding.personalInfoStatus,
            resume: staff.staff_onboarding.resumeStatus,
            govId: staff.staff_onboarding.govIdStatus,
            education: staff.staff_onboarding.educationStatus,
            medical: staff.staff_onboarding.medicalStatus,
            dataPrivacy: staff.staff_onboarding.dataPrivacyStatus,
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

