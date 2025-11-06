import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()

    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user with profile and work schedule
    const staffUserWithSchedule = await prisma.staff_users.findUnique({
      where: { id: staffUser.id },
      include: {
        profile: {
          include: {
            work_schedules: true
          }
        }
      }
    })

    const workSchedules = staffUserWithSchedule?.profile?.work_schedules || []
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todaySchedule = workSchedules.find(s => s.dayOfWeek === today)

    return NextResponse.json({
      success: true,
      user: {
        id: staffUser.id,
        name: staffUser.name,
        email: staffUser.email
      },
      profile: {
        exists: !!staffUserWithSchedule?.profile,
        id: staffUserWithSchedule?.profile?.id
      },
      work_schedules: {
        configured: workSchedules.length > 0,
        totalDays: workSchedules.length,
        schedules: workSchedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          isWorkday: s.isWorkday,
          startTime: s.startTime,
          endTime: s.endTime
        })),
        today: {
          day: today,
          exists: !!todaySchedule,
          isWorkday: todaySchedule?.isWorkday || false,
          startTime: todaySchedule?.startTime || null,
          endTime: todaySchedule?.endTime || null
        }
      }
    })
  } catch (error) {
    console.error("Error checking work schedule:", error)
    return NextResponse.json(
      { 
        error: "Failed to check work schedule",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}


