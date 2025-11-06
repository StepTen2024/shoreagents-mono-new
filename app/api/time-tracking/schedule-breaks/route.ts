import { NextRequest, NextResponse } from "next/server"
import { getStaffUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()
    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { timeEntryId, breaks } = await request.json()
    // breaks = [{ type: 'MORNING', scheduledStart: '10:00 AM', scheduledEnd: '10:15 AM' }, ...]
    
    // ✅ Verify timeEntry belongs to user and fetch shift info
    const timeEntry = await prisma.time_entries.findUnique({
      where: { id: timeEntryId },
      select: {
        id: true,
        staffUserId: true,
        clockOut: true,
        shiftDate: true,          // ✅ Get shift date
        shiftDayOfWeek: true      // ✅ Get shift day of week
      }
    })
    
    if (!timeEntry || timeEntry.staffUserId !== staffUser.id) {
      return NextResponse.json({ error: "Invalid time entry" }, { status: 403 })
    }
    
    if (timeEntry.clockOut) {
      return NextResponse.json({ error: "Cannot schedule breaks after clocking out" }, { status: 400 })
    }
    
    console.log(`📅 Scheduling breaks for shift:`, {
      shiftDate: timeEntry.shiftDate,
      shiftDayOfWeek: timeEntry.shiftDayOfWeek,
      breakCount: breaks.length
    })
    
    // ✅ Create scheduled break records with shift info
    const createdBreaks = await Promise.all(
      breaks.map((b: any) => 
        prisma.breaks.create({
          data: {
            staffUserId: staffUser.id,
            timeEntryId,
            type: b.type,
            scheduledStart: b.scheduledStart,
            scheduledEnd: b.scheduledEnd,
            shiftDate: timeEntry.shiftDate,          // ✅ Inherit from time entry
            shiftDayOfWeek: timeEntry.shiftDayOfWeek // ✅ Inherit from time entry
          }
        })
      )
    )
    
    // Mark time entry as having breaks scheduled
    await prisma.time_entries.update({
      where: { id: timeEntryId },
      data: { breaksScheduled: true }
    })
    
    return NextResponse.json({ 
      success: true, 
      breaks: createdBreaks,
      message: "Breaks scheduled successfully. These are now locked in for your shift."
    })
  } catch (error) {
    console.error("Error scheduling breaks:", error)
    return NextResponse.json({ error: "Failed to schedule breaks" }, { status: 500 })
  }
}

