import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/management (allow both ADMIN and MANAGER)
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser || (managementUser.role !== "ADMIN" && managementUser.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden. Admin or Manager role required." }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter") || "all"

    // Build where clause based on filter
    let whereClause: any = {}
    
    if (filter === "pending") {
      whereClause = {
        staff_onboarding: {
          isComplete: false,
          OR: [
            { personalInfoStatus: "SUBMITTED" },
            { govIdStatus: "SUBMITTED" },
            { documentsStatus: "SUBMITTED" },
            { signatureStatus: "SUBMITTED" },
            { emergencyContactStatus: "SUBMITTED" },
            { resumeStatus: "SUBMITTED" },
            { educationStatus: "SUBMITTED" },
            { medicalStatus: "SUBMITTED" },
            { dataPrivacyStatus: "SUBMITTED" }
          ]
        }
      }
    } else if (filter === "incomplete") {
      whereClause = {
        staff_onboarding: {
          isComplete: false
        }
      }
    } else if (filter === "complete") {
      whereClause = {
        staff_onboarding: {
          isComplete: true
        }
      }
    }

    // Get all staff with onboarding status
    const staffList = await prisma.staff_users.findMany({
      where: whereClause,
      include: {
        staff_onboarding: {
          select: {
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
            updatedAt: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform and calculate admin-specific progress
    const transformedStaff = staffList.map(staff => {
      let adminProgress = 0
      
      if (staff.staff_onboarding) {
        const sections = [
          staff.staff_onboarding.personalInfoStatus,
          staff.staff_onboarding.resumeStatus,
          staff.staff_onboarding.govIdStatus,
          staff.staff_onboarding.documentsStatus,
          staff.staff_onboarding.educationStatus,
          staff.staff_onboarding.medicalStatus,
          staff.staff_onboarding.dataPrivacyStatus,
          staff.staff_onboarding.signatureStatus,
          staff.staff_onboarding.emergencyContactStatus
        ]

        // Admin progress: Only count APPROVED sections (11.11% each for 9 sections)
        sections.forEach(status => {
          if (status === "APPROVED") {
            adminProgress += 11.11
          }
        })
        
        // Round to nearest whole number
        adminProgress = Math.round(adminProgress)
      }

      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        onboarding: staff.staff_onboarding ? {
          ...staff.staff_onboarding,
          completionPercent: adminProgress // Override with admin-specific progress
        } : null
      }
    })

    return NextResponse.json({ staff: transformedStaff })

  } catch (error) {
    console.error("Admin onboarding list error:", error)
    return NextResponse.json(
      { error: "Failed to fetch staff onboarding list" },
      { status: 500 }
    )
  }
}

