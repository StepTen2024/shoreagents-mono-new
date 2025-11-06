import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/client/breaks - Fetch breaks for client's assigned staff
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')
    const staffId = searchParams.get('staffId')

    // Get assigned staff IDs for this company
    const staffUsers = await prisma.staff_users.findMany({
      where: { companyId: clientUser.company.id },
      select: { id: true }
    })
    
    const staffIds = staffUsers.map(s => s.id)

    if (staffIds.length === 0) {
      return NextResponse.json({ breaks: [] })
    }

    // Parse date or use today
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Build where clause
    const whereClause: any = {
      staffUserId: { in: staffIds },
      actualStart: {
        gte: startOfDay,
        lte: endOfDay,
      },
    }

    // Filter by specific staff if requested
    if (staffId && staffIds.includes(staffId)) {
      whereClause.staffUserId = staffId
    }

    const breaks = await prisma.breaks.findMany({
      where: whereClause,
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
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
      user: b.user
    }))

    return NextResponse.json({ breaks: formattedBreaks })
  } catch (error) {
    console.error("Error fetching client breaks:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

