import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/video-calls - Get call history
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userType = searchParams.get("userType") // "staff" or "client"
    const userId = searchParams.get("userId") || session.user.id

    let calls

    if (userType === "staff") {
      calls = await prisma.videoCalls.findMany({
        where: { staffId: userId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true
            }
          }
        },
        orderBy: { startedAt: "desc" },
        take: 50
      })
    } else if (userType === "client") {
      calls = await prisma.videoCalls.findMany({
        where: { clientId: userId },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true
            }
          }
        },
        orderBy: { startedAt: "desc" },
        take: 50
      })
    } else {
      return NextResponse.json({ error: "userType required (staff or client)" }, { status: 400 })
    }

    return NextResponse.json({ calls })
  } catch (error) {
    console.error("Error fetching call history:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/video-calls - Create new call record
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      roomName, 
      roomUrl, 
      clientId, 
      staffId, 
      clientName, 
      staffName, 
      initiatedBy 
    } = body

    if (!roomName || !roomUrl || !clientId || !staffId || !initiatedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const call = await prisma.videoCalls.create({
      data: {
        roomName,
        roomUrl,
        clientId,
        staffId,
        clientName,
        staffName,
        initiatedBy,
        status: "INITIATED"
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ call })
  } catch (error) {
    console.error("Error creating call record:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

