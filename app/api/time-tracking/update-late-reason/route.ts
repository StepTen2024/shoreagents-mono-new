import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()

    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { timeEntryId, lateReason } = body

    if (!timeEntryId || !lateReason) {
      return NextResponse.json(
        { error: "Time entry ID and late reason are required" },
        { status: 400 }
      )
    }

    // Verify the time entry belongs to this staff user
    const timeEntry = await prisma.time_entries.findFirst({
      where: {
        id: timeEntryId,
        staffUserId: staffUser.id,
      },
    })

    if (!timeEntry) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      )
    }

    // Update the late reason
    const updated = await prisma.time_entries.update({
      where: {
        id: timeEntryId,
      },
      data: {
        lateReason,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      timeEntry: updated,
      message: "Late reason saved successfully",
    })
  } catch (error) {
    console.error("Error updating late reason:", error)
    return NextResponse.json(
      { error: "Failed to update late reason" },
      { status: 500 }
    )
  }
}

