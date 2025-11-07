import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ staffUserId: string }> }
) {
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

    const { staffUserId } = await context.params

    // Get staff user with full onboarding details
    const staffUser = await prisma.staff_users.findUnique({
      where: { id: staffUserId },
      include: {
        staff_onboarding: true,
        staff_profiles: true,
        employment_contracts: true,
        job_acceptances: {
          include: {
            company: true
          }
        }
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Calculate admin-specific progress based on APPROVED/REJECTED statuses only
    let adminProgress = 0
    if (staffUser.staff_onboarding) {
      const sections = [
        staffUser.staff_onboarding.personalInfoStatus,
        staffUser.staff_onboarding.resumeStatus,
        staffUser.staff_onboarding.govIdStatus,
        staffUser.staff_onboarding.documentsStatus,
        staffUser.staff_onboarding.educationStatus,
        staffUser.staff_onboarding.medicalStatus,
        staffUser.staff_onboarding.dataPrivacyStatus,
        staffUser.staff_onboarding.signatureStatus,
        staffUser.staff_onboarding.emergencyContactStatus
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

    // Get contract data for auto-fill
    const contract = staffUser.employment_contracts
    const jobAcceptance = staffUser.job_acceptances

    // Transform to match frontend expectations (camelCase)
    return NextResponse.json({ 
      staff: {
        id: staffUser.id,
        name: staffUser.name,
        email: staffUser.email,
        avatar: staffUser.avatar,
        createdAt: staffUser.createdAt
      },
      onboarding: staffUser.staff_onboarding ? {
        ...staffUser.staff_onboarding,
        completionPercent: adminProgress // Override with admin-specific progress
      } : null,
      profile: staffUser.staff_profiles ? {
        ...staffUser.staff_profiles,
        daysEmployed: staffUser.staff_profiles.startDate 
          ? Math.floor((new Date().getTime() - new Date(staffUser.staff_profiles.startDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0
      } : null,
      // Auto-fill data from contract and job acceptance
      autoFillData: {
        companyId: contract?.companyId || jobAcceptance?.companyId || staffUser.companyId || "",
        position: contract?.position || jobAcceptance?.position || "",
        startDate: contract?.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        workSchedule: contract?.workSchedule || "",
        workDays: jobAcceptance?.workDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        hasCustomHours: (jobAcceptance as any)?.hasCustomHours || false,
        customHours: (jobAcceptance as any)?.customHours || null,
        clientTimezone: (jobAcceptance as any)?.clientTimezone || "UTC",
        salary: contract?.totalMonthlyGross ? parseFloat(contract.totalMonthlyGross.toString()) : 0,
        basicSalary: contract?.basicSalary ? parseFloat(contract.basicSalary.toString()) : 0,
        deMinimis: contract?.deMinimis ? parseFloat(contract.deMinimis.toString()) : 0,
        totalMonthlyGross: contract?.totalMonthlyGross ? parseFloat(contract.totalMonthlyGross.toString()) : 0,
        hmo: contract?.hmoOffer ? (contract.hmoOffer !== "None" && contract.hmoOffer !== "No HMO") : true,
        employmentStatus: contract?.probationaryPeriod ? "PROBATION" : "PROBATION", // Default to PROBATION
        contractSigned: contract?.signed || false,
        contractSignedAt: contract?.signedAt ? contract.signedAt.toISOString() : null
      }
    })

  } catch (error) {
    console.error("Admin onboarding detail error:", error)
    return NextResponse.json(
      { error: "Failed to fetch onboarding details" },
      { status: 500 }
    )
  }
}
