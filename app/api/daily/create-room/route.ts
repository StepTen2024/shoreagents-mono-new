import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { staffId, staffName, clientId, clientName, initiatedBy = "client" } = body

    // Determine who is calling whom based on initiatedBy
    let finalClientId: string
    let finalStaffId: string
    let finalClientName: string | undefined
    let finalStaffName: string | undefined
    let roomNamePrefix: string

    if (initiatedBy === "staff") {
      // Staff is calling client
      if (!clientId) {
        return NextResponse.json({ error: "Client ID required" }, { status: 400 })
      }
      
      // Get staff user ID from auth
      const staffUser = await prisma.staff_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true }
      })
      
      if (!staffUser) {
        return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
      }
      
      finalClientId = clientId
      finalStaffId = staffUser.id
      finalClientName = clientName
      finalStaffName = staffUser.name
      roomNamePrefix = `staff-call-${finalStaffId}-${finalClientId}`
    } else {
      // Client is calling staff
      if (!staffId) {
        return NextResponse.json({ error: "Staff ID required" }, { status: 400 })
      }
      
      // Get client user ID from auth
      const clientUser = await prisma.client_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true }
      })
      
      if (!clientUser) {
        return NextResponse.json({ error: "Client user not found" }, { status: 404 })
      }
      
      finalClientId = clientUser.id
      finalStaffId = staffId
      finalClientName = clientUser.name
      finalStaffName = staffName
      roomNamePrefix = `client-call-${finalClientId}-${finalStaffId}`
    }

    // Generate unique room name
    const timestamp = Date.now()
    const roomName = `${roomNamePrefix}-${timestamp}`

    const DAILY_API_KEY = process.env.DAILY_API_KEY
    const NEXT_PUBLIC_DAILY_DOMAIN = process.env.NEXT_PUBLIC_DAILY_DOMAIN
    
    if (!DAILY_API_KEY || !NEXT_PUBLIC_DAILY_DOMAIN) {
      return NextResponse.json({ error: "Daily.co API keys not configured" }, { status: 500 })
    }

    // Create a temporary Daily.co room
    const response = await fetch(`https://api.daily.co/v1/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `quick-call-${finalStaffId}-${finalClientId}-${Date.now()}`,
        properties: {
          exp: Math.round(Date.now() / 1000) + 60 * 60, // 1 hour expiration
          enable_screenshare: true,
          enable_chat: true,
          max_participants: 2, // 1-on-1 call
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Daily.co room creation failed:", errorData)
      return NextResponse.json({ error: "Failed to create video room" }, { status: 500 })
    }

    const room = await response.json()

    // Log the call to database
    const call = await prisma.videoCalls.create({
      data: {
        roomName: room.name,
        roomUrl: room.url,
        clientId: finalClientId,
        staffId: finalStaffId,
        clientName: finalClientName,
        staffName: finalStaffName,
        initiatedBy: initiatedBy,
        status: "INITIATED"
      }
    })

    console.log("📞 CALL CREATED:", {
      callId: call.id,
      roomName: room.name,
      initiatedBy: initiatedBy,
      client: finalClientName,
      staff: finalStaffName
    })

    // Send WebSocket notification to the recipient
    try {
      const io = global.socketServer
      
      if (io) {
        if (initiatedBy === "client") {
          // Notify staff about incoming call from client
          const staff = await prisma.staff_users.findUnique({
            where: { id: finalStaffId },
            select: { authUserId: true, avatar: true }
          })
          
          if (staff) {
            io.to(`user:${staff.authUserId}`).emit("incoming-call", {
              callId: call.id,
              callerName: finalClientName || "Client",
              callerAvatar: undefined, // TODO: Get client avatar
              roomUrl: room.url,
              roomName: room.name
            })
            console.log(`📤 Sent incoming-call notification to staff ${staff.authUserId}`)
          }
        } else {
          // Notify client about incoming call from staff
          const client = await prisma.client_users.findUnique({
            where: { id: finalClientId },
            select: { authUserId: true, avatar: true }
          })
          
          if (client) {
            io.to(`user:${client.authUserId}`).emit("incoming-call", {
              callId: call.id,
              callerName: finalStaffName || "Staff Member",
              callerAvatar: undefined, // TODO: Get staff avatar
              roomUrl: room.url,
              roomName: room.name
            })
            console.log(`📤 Sent incoming-call notification to client ${client.authUserId}`)
          }
        }
      } else {
        console.warn("⚠️ Socket server not available for notifications")
      }
    } catch (wsError) {
      console.error("❌ Error sending WebSocket notification:", wsError)
      // Don't fail the request if WebSocket notification fails
    }

    return NextResponse.json({
      success: true,
      roomUrl: room.url,
      roomName: room.name,
      staffName: finalStaffName || "Staff Member",
      clientName: finalClientName || "Client",
      callId: call.id,
      expiresAt: Math.round(Date.now() / 1000) + 60 * 60
    })
  } catch (error) {
    console.error("Error creating Daily.co room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
