import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()

    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const today = now.toLocaleDateString('en-US', { weekday: 'long' })
    
    // Get today's work schedule
    const workSchedule = await prisma.work_schedules.findFirst({
      where: {
        staff_profiles: { staffUserId: staffUser.id },
        dayOfWeek: today
      },
      include: { staff_profiles: true }
    })
    
    if (!workSchedule || !workSchedule.endTime) {
      return NextResponse.json({ 
        work_schedules: null,
        message: "No schedule found for today" 
      })
    }
    
    // Parse end time (format: "HH:MM:SS" or "HH:MM")
    try {
      const timeParts = workSchedule.endTime.split(':')
      const hours = parseInt(timeParts[0], 10)
      const minutes = parseInt(timeParts[1], 10)
      
      // Validate hours and minutes
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.error("Invalid time format:", workSchedule.endTime)
        return NextResponse.json({ 
          work_schedules: null,
          message: "Invalid schedule time format" 
        })
      }
      
      const scheduledEndTime = new Date(now)
      scheduledEndTime.setHours(hours, minutes, 0, 0)
      
      return NextResponse.json({
        work_schedules: {
          dayOfWeek: workSchedule.dayOfWeek,
          startTime: workSchedule.startTime,
          endTime: scheduledEndTime.toISOString(),
          isWorkDay: workSchedule.isWorkday
        }
      })
    } catch (parseError) {
      console.error("Error parsing end time:", parseError)
      return NextResponse.json({ 
        work_schedules: null,
        message: "Error parsing schedule time" 
      })
    }
  } catch (error) {
    console.error("Error checking work schedule:", error)
    return NextResponse.json(
      { error: "Failed to check work schedule" },
      { status: 500 }
    )
  }
}

