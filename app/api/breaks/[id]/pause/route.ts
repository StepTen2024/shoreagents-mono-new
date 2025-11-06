import { NextRequest, NextResponse } from "next/server"
import { getStaffUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// Global declaration for socket server
declare global {
  var socketServer: any
}

// PATCH /api/breaks/[id]/pause - Pause a break
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staffUser = await getStaffUser()
    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: breakId } = await params

    // Find the break
    const existingBreak = await prisma.breaks.findUnique({
      where: { id: breakId }
    })

    if (!existingBreak) {
      return NextResponse.json({ error: "Break not found" }, { status: 404 })
    }

    if (existingBreak.staffUserId !== staffUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (existingBreak.actualEnd) {
      return NextResponse.json({ error: "Break already ended" }, { status: 400 })
    }

    if (existingBreak.ispaused) {
      return NextResponse.json({ error: "Break already paused" }, { status: 400 })
    }

    if (existingBreak.pauseused) {
      return NextResponse.json({ error: "Break pause already used for this break" }, { status: 400 })
    }

    // Calculate remaining break time when pausing
    const now = new Date()
    const breakStartTime = existingBreak.actualStart ? new Date(existingBreak.actualStart) : now
    const elapsedTime = Math.floor((now.getTime() - breakStartTime.getTime()) / 1000) // seconds
    
    // Calculate remaining time (15 minutes = 900 seconds, 60 minutes = 3600 seconds)
    const expectedDuration = existingBreak.type === 'LUNCH' ? 3600 : 900 // 60 min for lunch, 15 min for others
    const remainingTime = Math.max(0, expectedDuration - elapsedTime) // Ensure it's not negative

    // Pause the break
    const updatedBreak = await prisma.breaks.update({
      where: { id: breakId },
      data: {
        ispaused: true,
        pausedat: now,
        pauseused: true,
        pausedduration: remainingTime // Store the remaining break time
      }
    })

    // Emit WebSocket event for real-time updates
    const io = global.socketServer
    if (io) {
      io.to(`user:${staffUser.authUserId}`).emit('break:paused', {
        break: updatedBreak,
        message: "Break paused successfully"
      })
      console.log('📡 [WebSocket] Break paused event emitted for user:', staffUser.authUserId)
    }

    return NextResponse.json({
      success: true,
      break: updatedBreak,
      message: "Break paused successfully"
    })
  } catch (error) {
    console.error("Error pausing break:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
