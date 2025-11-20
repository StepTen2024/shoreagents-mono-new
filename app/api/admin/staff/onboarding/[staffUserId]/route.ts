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

    // Check if user is admin/management
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser || managementUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { staffUserId } = await context.params

    // Get staff user with full onboarding details
    const staffUser = await prisma.staff_users.findUnique({
      where: { id: staffUserId },
      include: {
        staff_onboarding: true,
        staff_profiles: {
          include: {
            work_schedules: true
          }
        }
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Get job acceptance data (for custom hours and employment details)
    const jobAcceptance = await prisma.job_acceptances.findFirst({
      where: { 
        candidateEmail: staffUser.email,
        staffUserId: staffUser.id
      },
      include: {
        interview_requests: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate admin-specific progress based on APPROVED/REJECTED statuses only
    let adminProgress = 0
    if (staffUser.staff_onboarding) {
      const sections = [
        staffUser.staff_onboarding.personalInfoStatus,
        staffUser.staff_onboarding.govIdStatus,
        staffUser.staff_onboarding.documentsStatus,
        staffUser.staff_onboarding.signatureStatus,
        staffUser.staff_onboarding.emergencyContactStatus,
        staffUser.staff_onboarding.resumeStatus,
        staffUser.staff_onboarding.educationStatus,
        staffUser.staff_onboarding.medicalStatus,
        staffUser.staff_onboarding.dataPrivacyStatus
      ]

      // Admin progress: Only count APPROVED/REJECTED sections (11.11% each for 9 sections)
      sections.forEach(status => {
        if (status === "APPROVED" || status === "REJECTED") {
          adminProgress += 11.11
        }
      })
      
      // Round to nearest whole number
      adminProgress = Math.round(adminProgress)
    }

    // Parse customHours if available
    let customHours = null
    if (jobAcceptance?.customHours) {
      customHours = typeof jobAcceptance.customHours === 'string' 
        ? JSON.parse(jobAcceptance.customHours) 
        : jobAcceptance.customHours
    }

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
      jobAcceptance: jobAcceptance ? {
        position: jobAcceptance.position,
        companyId: jobAcceptance.companyId,
        workDays: jobAcceptance.workDays,
        workStartTime: jobAcceptance.workStartTime,
        workEndTime: jobAcceptance.workEndTime,
        customHours: customHours,
        clientTimezone: jobAcceptance.clientTimezone,
        isDefaultSchedule: jobAcceptance.isDefaultSchedule,
        salary: jobAcceptance.salary ? Number(jobAcceptance.salary) : null,
        shiftType: jobAcceptance.shiftType,
        workLocation: jobAcceptance.workLocation,
        hmoIncluded: jobAcceptance.hmoIncluded,
        leaveCredits: jobAcceptance.leaveCredits,
        preferredStartDate: jobAcceptance.preferredStartDate,
        finalStartDate: jobAcceptance.interview_requests?.finalStartDate || null
      } : null,
      workSchedules: staffUser.staff_profiles?.work_schedules || []
    })

  } catch (error) {
    console.error("Admin onboarding detail error:", error)
    return NextResponse.json(
      { error: "Failed to fetch onboarding details" },
      { status: 500 }
    )
  }
}
