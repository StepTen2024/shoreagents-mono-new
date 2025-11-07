import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/reactions?type=COMMENT&id=123 - Get all reactions for an entity
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reactableType = searchParams.get("type")
    const reactableId = searchParams.get("id")

    if (!reactableType || !reactableId) {
      return NextResponse.json(
        { error: "Missing required parameters: type and id" },
        { status: 400 }
      )
    }

    console.log(`[Reactions API] Fetching reactions for ${reactableType}:${reactableId}`)

    const reactions = await prisma.reactions.findMany({
      where: {
        reactableType,
        reactableId,
      },
      orderBy: { createdAt: "desc" },
    })

    // Group reactions by emoji for easy display
    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = []
      }
      acc[reaction.emoji].push({
        authorType: reaction.authorType,
        authorId: reaction.authorId,
        createdAt: reaction.createdAt,
      })
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      reactions,
      grouped,
      count: reactions.length,
    })
  } catch (error) {
    console.error("[Reactions API] Error fetching reactions:", error)
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    )
  }
}

// POST /api/reactions - Add a reaction
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reactableType, reactableId, emoji } = body

    if (!reactableType || !reactableId || !emoji) {
      return NextResponse.json(
        { error: "Missing required fields: reactableType, reactableId, emoji" },
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
      `[Reactions API] Adding reaction: ${authorType}:${authorId} → ${emoji} on ${reactableType}:${reactableId}`
    )

    // Check if reaction already exists (unique constraint will prevent duplicates anyway)
    const existingReaction = await prisma.reactions.findFirst({
      where: {
        reactableType,
        reactableId,
        authorType,
        authorId,
        emoji,
      },
    })

    if (existingReaction) {
      return NextResponse.json(
        { error: "You already reacted with this emoji" },
        { status: 400 }
      )
    }

    const reaction = await prisma.reactions.create({
      data: {
        reactableType,
        reactableId,
        emoji,
        authorType,
        authorId,
      },
    })

    console.log(`[Reactions API] ✅ Reaction added: ${reaction.id}`)

    return NextResponse.json({ success: true, reaction }, { status: 201 })
  } catch (error) {
    console.error("[Reactions API] Error adding reaction:", error)
    return NextResponse.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    )
  }
}

// DELETE /api/reactions?type=COMMENT&id=123&emoji=👍 - Remove a reaction
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reactableType = searchParams.get("type")
    const reactableId = searchParams.get("id")
    const emoji = searchParams.get("emoji")

    if (!reactableType || !reactableId || !emoji) {
      return NextResponse.json(
        { error: "Missing required parameters: type, id, emoji" },
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
      `[Reactions API] Removing reaction: ${authorType}:${authorId} → ${emoji} from ${reactableType}:${reactableId}`
    )

    // Find and delete the reaction
    const reaction = await prisma.reactions.findFirst({
      where: {
        reactableType,
        reactableId,
        authorType,
        authorId,
        emoji,
      },
    })

    if (!reaction) {
      return NextResponse.json(
        { error: "Reaction not found" },
        { status: 404 }
      )
    }

    await prisma.reactions.delete({
      where: { id: reaction.id },
    })

    console.log(`[Reactions API] ✅ Reaction removed: ${reaction.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Reactions API] Error removing reaction:", error)
    return NextResponse.json(
      { error: "Failed to remove reaction" },
      { status: 500 }
    )
  }
}

