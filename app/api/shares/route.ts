import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/shares?sharedTo=FEED - Get all shares (for The Feed)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sharedTo = searchParams.get("sharedTo") || "FEED"
    const limit = parseInt(searchParams.get("limit") || "50")

    console.log(`[Shares API] Fetching shares for ${sharedTo}`)

    const shares = await prisma.shares.findMany({
      where: {
        sharedTo,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({ shares, count: shares.length })
  } catch (error) {
    console.error("[Shares API] Error fetching shares:", error)
    return NextResponse.json(
      { error: "Failed to fetch shares" },
      { status: 500 }
    )
  }
}

// POST /api/shares - Share something to The Feed or direct message
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      shareableType,
      shareableId,
      message = null,
      sharedTo = "FEED",
      targetUserId = null,
      targetType = null,
    } = body

    if (!shareableType || !shareableId) {
      return NextResponse.json(
        { error: "Missing required fields: shareableType, shareableId" },
        { status: 400 }
      )
    }

    // If sharing to DIRECT, require targetUserId and targetType
    if (sharedTo === "DIRECT" && (!targetUserId || !targetType)) {
      return NextResponse.json(
        { error: "Direct shares require targetUserId and targetType" },
        { status: 400 }
      )
    }

    // Determine author type and ID based on session
    let authorType: string
    let authorId: string

    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (managementUser) {
      authorType = "MANAGEMENT"
      authorId = managementUser.id
    } else {
      const staffUser = await prisma.staff_users.findUnique({
        where: { authUserId: session.user.id },
      })

      if (staffUser) {
        authorType = "STAFF"
        authorId = staffUser.id
      } else {
        const clientUser = await prisma.client_users.findUnique({
          where: { authUserId: session.user.id },
        })

        if (clientUser) {
          authorType = "CLIENT"
          authorId = clientUser.id
        } else {
          return NextResponse.json(
            { error: "User type not found" },
            { status: 404 }
          )
        }
      }
    }

    console.log(
      `[Shares API] Sharing: ${authorType}:${authorId} → ${shareableType}:${shareableId} to ${sharedTo}`
    )

    const share = await prisma.shares.create({
      data: {
        shareableType,
        shareableId,
        message,
        authorType,
        authorId,
        sharedTo,
        targetUserId,
        targetType,
      },
    })

    console.log(`[Shares API] ✅ Shared: ${share.id}`)

    return NextResponse.json({ success: true, share }, { status: 201 })
  } catch (error) {
    console.error("[Shares API] Error sharing:", error)
    return NextResponse.json(
      { error: "Failed to share" },
      { status: 500 }
    )
  }
}

// DELETE /api/shares/[id] is in separate file

