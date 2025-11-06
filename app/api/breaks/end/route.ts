import { NextRequest, NextResponse } from "next/server"
import { getStaffUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { logBreakEnded } from "@/lib/activity-generator"

// POST /api/breaks/end - End the active break
export async function POST(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()
    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find active break (only breaks that have been started but not ended)
    const activeBreak = await prisma.breaks.findFirst({
      where: {
        staffUserId: staffUser.id,
        actualStart: { not: null }, // Must have been started
        actualEnd: null, // Not ended yet
      },
    })
    
    if (!activeBreak) {
      return NextResponse.json({ error: "No active break found" }, { status: 404 })
    }

    const endTime = new Date()
    const startTime = activeBreak.actualStart || new Date()
    
    // Calculate total elapsed time minus paused duration
    const totalElapsedMs = endTime.getTime() - startTime.getTime()
    const pausedDurationMs = (activeBreak.pausedduration || 0) * 1000 // Convert seconds to ms
    const actualBreakDurationMs = totalElapsedMs - pausedDurationMs
    const duration = Math.floor(actualBreakDurationMs / 60000) // in minutes

    let isLate = false
    let lateBy = 0
    
    // Check if returned late from scheduled break
    if (activeBreak.scheduledEnd) {
      const [time, period] = activeBreak.scheduledEnd.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours)
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      
      const expectedEnd = new Date(endTime)
      expectedEnd.setHours(hour, parseInt(minutes), 0, 0)
      
      if (endTime > expectedEnd) {
        isLate = true
        lateBy = Math.floor((endTime.getTime() - expectedEnd.getTime()) / 60000)
      }
    }
    
    const updatedBreak = await prisma.breaks.update({
      where: { id: activeBreak.id },
      data: {
        actualEnd: endTime,
        duration,
        isLate,
        lateBy: lateBy || null,
      },
    })

    // ✨ Auto-generate activity post (skip AWAY breaks)
    if (activeBreak.type !== "AWAY") {
      await logBreakEnded(staffUser.id, staffUser.name)
    }

    return NextResponse.json({
      success: true,
      break: updatedBreak,
      message: "Break ended successfully"
    })
  } catch (error) {
    console.error("Error ending break:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

