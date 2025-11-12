import { NextRequest, NextResponse } from "next/server"
import { getStaffUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()
    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { timeEntryId, breaks } = await request.json()
    // breaks = [{ type: 'MORNING', scheduledStart: '10:00 AM', scheduledEnd: '10:15 AM' }, ...]
    
    // Verify timeEntry belongs to user and is today's active session
    const timeEntry = await prisma.time_entries.findUnique({
      where: { id: timeEntryId }
    })
    
    if (!timeEntry || timeEntry.staffUserId !== staffUser.id) {
      return NextResponse.json({ error: "Invalid time entry" }, { status: 403 })
    }
    
    if (timeEntry.clockOut) {
      return NextResponse.json({ error: "Cannot schedule breaks after clocking out" }, { status: 400 })
    }
    
    // Create scheduled break records
    const now = new Date()
    const createdBreaks = await Promise.all(
      breaks.map((b: any) => 
        prisma.breaks.create({
          data: {
            id: crypto.randomUUID(),
            staffUserId: staffUser.id,
            timeEntryId,
            type: b.type,
            scheduledStart: b.scheduledStart,
            scheduledEnd: b.scheduledEnd,
            updatedAt: now
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

