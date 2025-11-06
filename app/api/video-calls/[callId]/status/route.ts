import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/video-calls/[callId]/status - Update call status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { callId } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "Status required" }, { status: 400 })
    }

    const validStatuses = ["INITIATED", "RINGING", "ANSWERED", "ENDED", "MISSED", "DECLINED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const updateData: any = { status }

    // Set timestamps based on status
    if (status === "ANSWERED" && !updateData.answeredAt) {
      updateData.answeredAt = new Date()
    }
    if (status === "ENDED" || status === "MISSED" || status === "DECLINED") {
      updateData.endedAt = new Date()
      
      // Calculate duration if call was answered
      const call = await prisma.videoCalls.findUnique({
        where: { id: callId },
        select: { answeredAt: true }
      })
      
      if (call?.answeredAt && status === "ENDED") {
        const duration = Math.floor((new Date().getTime() - new Date(call.answeredAt).getTime()) / 1000)
        updateData.duration = duration
      }
    }

    const updatedCall = await prisma.videoCalls.update({
      where: { id: callId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({ call: updatedCall })
  } catch (error) {
    console.error("Error updating call status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

