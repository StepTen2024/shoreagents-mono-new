import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// GET /api/breaks - Get breaks for a specific date
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date")

    // Parse date or use today
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const breaks = await prisma.breaks.findMany({
      where: {
        staffUserId: staffUser.id,
        actualStart: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { actualStart: "asc" },
    })

    // Format breaks for frontend
    const formattedBreaks = breaks.map((b) => ({
      id: b.id,
      type: b.type,
      startTime: b.actualStart?.toISOString() || "",
      endTime: b.actualEnd?.toISOString() || null,
      duration: b.duration,
      reason: b.awayReason || null,
      date: b.actualStart?.toISOString().split("T")[0] || "",
      notes: b.notes,
    }))

    return NextResponse.json({ breaks: formattedBreaks })
  } catch (error) {
    console.error("Error fetching breaks:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/breaks - Start a new break
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { type, reason, notes } = body

    if (!type) {
      return NextResponse.json(
        { error: "Break type is required" },
        { status: 400 }
      )
    }

    // Check if there's already an active break
    const activeBreak = await prisma.breaks.findFirst({
      where: {
        staffUserId: staffUser.id,
        actualEnd: null,
      },
    })

    if (activeBreak) {
      return NextResponse.json(
        { error: "You already have an active break. Please end it first." },
        { status: 400 }
      )
    }

    const now = new Date()
    const breakRecord = await prisma.breaks.create({
      data: {
        id: crypto.randomUUID(),
        staffUserId: staffUser.id,
        type,
        awayReason: reason || null,
        actualStart: now,
        notes: notes || null,
        updatedAt: now,
      },
    })

    return NextResponse.json(
      {
        success: true,
        break: {
          id: breakRecord.id,
          type: breakRecord.type,
          startTime: breakRecord.actualStart?.toISOString() || "",
          endTime: null,
          duration: null,
          reason: breakRecord.awayReason,
          date: breakRecord.actualStart?.toISOString().split("T")[0] || "",
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error starting break:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
