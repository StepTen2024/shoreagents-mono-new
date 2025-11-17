import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user with profile, work schedule, company, personal record, and onboarding status
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        staff_profiles: {
          include: {
            work_schedules: true
          }
        },
        company: {
          include: {
            management_users: true // Fetch account manager (e.g., Jinemva)
          }
        },
        staff_personal_records: true,
        staff_onboarding: {
          select: {
            isComplete: true,
            completionPercent: true
          }
        }
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      user: {
        id: staffUser.id,
        name: staffUser.name,
        email: staffUser.email,
        role: staffUser.role,
        avatar: staffUser.avatar,
        coverPhoto: staffUser.coverPhoto,
      },
      company: staffUser.company ? {
        name: staffUser.company.companyName,
        accountManager: staffUser.company.management_users?.name || null, // Jinemva or other management user
      } : null,
      profile: staffUser.staff_profiles ? {
        phone: staffUser.staff_profiles.phone,
        location: staffUser.staff_profiles.location,
        gender: staffUser.staff_profiles.gender,
        civilStatus: staffUser.staff_profiles.civilStatus,
        dateOfBirth: staffUser.staff_profiles.dateOfBirth,
        employmentStatus: staffUser.staff_profiles.employmentStatus,
        startDate: staffUser.staff_profiles.startDate,
        daysEmployed: (() => {
          const daysDiff = Math.floor((new Date().getTime() - new Date(staffUser.staff_profiles.startDate).getTime()) / (1000 * 60 * 60 * 24))
          return daysDiff >= 0 ? daysDiff : 0 // Return 0 if start date is in the future
        })(),
        currentRole: staffUser.staff_profiles.currentRole,
        salary: Number(staffUser.staff_profiles.salary),
        lastPayIncrease: staffUser.staff_profiles.lastPayIncrease,
        lastIncreaseAmount: staffUser.staff_profiles.lastIncreaseAmount ? Number(staffUser.staff_profiles.lastIncreaseAmount) : null,
        totalLeave: staffUser.staff_profiles.totalLeave,
        usedLeave: staffUser.staff_profiles.usedLeave,
        vacationUsed: staffUser.staff_profiles.vacationUsed,
        sickUsed: staffUser.staff_profiles.sickUsed,
        hmo: staffUser.staff_profiles.hmo,
      } : null,
      personalRecords: staffUser.staff_personal_records || null,
      workSchedules: staffUser.staff_profiles?.work_schedules || [],
      onboarding: staffUser.staff_onboarding ? {
        isComplete: staffUser.staff_onboarding.isComplete,
        completionPercent: staffUser.staff_onboarding.completionPercent
      } : null
    })

  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
