import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"

// PUT & PATCH /api/breaks/[id] - End a break
async function endBreak(
  request: NextRequest,
  params: Promise<{ id: string }>
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the StaffUser record using authUserId
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    const { id: breakId } = await params

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Find the break
    const existingBreak = await prisma.breaks.findUnique({
      where: { id: breakId },
    })

    if (!existingBreak) {
      return NextResponse.json({ error: "Break not found" }, { status: 404 })
    }

    if (existingBreak.staffUserId !== staffUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (existingBreak.actualEnd) {
      return NextResponse.json(
        { error: "Break already ended" },
        { status: 400 }
      )
    }

    const endTime = new Date()
    const startTime = existingBreak.actualStart || new Date()
    
    // Calculate total elapsed time minus paused duration
    const totalElapsedMs = endTime.getTime() - startTime.getTime()
    const pausedDurationMs = (existingBreak.pausedduration || 0) * 1000 // Convert seconds to ms
    const actualBreakDurationMs = totalElapsedMs - pausedDurationMs
    const duration = Math.floor(actualBreakDurationMs / 60000) // minutes

    // Update the break with end time and duration
    const updatedBreak = await prisma.breaks.update({
      where: { id: breakId },
      data: {
        actualEnd: endTime,
        duration,
      },
    })

    return NextResponse.json({
      success: true,
      break: {
        id: updatedBreak.id,
        type: updatedBreak.type,
        startTime: updatedBreak.actualStart?.toISOString() || "",
        endTime: updatedBreak.actualEnd?.toISOString() || null,
        duration: updatedBreak.duration,
        reason: updatedBreak.awayReason,
        date: updatedBreak.actualStart?.toISOString().split("T")[0] || "",
      },
    })
  } catch (error) {
    console.error("Error ending break:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/breaks/[id] - Get a specific break
export async function GET(
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
    const breakRecord = await prisma.breaks.findUnique({
      where: { id: breakId }
    })

    if (!breakRecord) {
      return NextResponse.json({ error: "Break not found" }, { status: 404 })
    }

    if (breakRecord.staffUserId !== staffUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      break: breakRecord
    })
  } catch (error) {
    console.error("Error fetching break:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Export both PUT and PATCH
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endBreak(request, params)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return endBreak(request, params)
}

