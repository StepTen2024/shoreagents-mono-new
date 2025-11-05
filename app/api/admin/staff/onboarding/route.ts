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

    // Transform to match frontend expectations (camelCase)
    const transformedStaff = staffList.map(staff => ({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      onboarding: staff.staff_onboarding // Transform snake_case to camelCase
    }))

    return NextResponse.json({ staff: transformedStaff })

  } catch (error) {
    console.error("Admin onboarding list error:", error)
    return NextResponse.json(
      { error: "Failed to fetch staff onboarding list" },
      { status: 500 }
    )
  }
}

