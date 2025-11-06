import { NextRequest, NextResponse } from "next/server"
import { getStaffUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()
    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find today's active time entry
    const activeTimeEntry = await prisma.time_entries.findFirst({
      where: {
        staffUserId: staffUser.id,
        clockOut: null,
      },
    })

    if (!activeTimeEntry) {
      return NextResponse.json({ breaks: [] })
    }

    // Fetch ALL breaks for this time entry (both scheduled and manual)
    const breaks = await prisma.breaks.findMany({
      where: {
        timeEntryId: activeTimeEntry.id,
      },
      orderBy: { 
        scheduledStart: "asc" 
      },
    })

    return NextResponse.json({ breaks })
  } catch (error) {
    console.error("Error fetching scheduled breaks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

