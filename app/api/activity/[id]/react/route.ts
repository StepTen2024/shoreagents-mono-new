import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/activity/[id]/react - Add or remove a reaction to a post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const body = await request.json()
    const { type } = body

    if (!type) {
      return NextResponse.json(
        { error: "Reaction type is required" },
        { status: 400 }
      )
    }

    // Check if post exists
    const post = await prisma.activity_posts.findUnique({
      where: { id: params.id },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if user already reacted
    const existingReaction = await prisma.post_reactions.findFirst({
      where: {
        postId: params.id,
        staffUserId: staffUser.id,
      },
    })

    if (existingReaction) {
      // If same reaction, remove it (toggle)
      if (existingReaction.type === type) {
        await prisma.post_reactions.delete({
          where: { id: existingReaction.id },
        })
        return NextResponse.json({ success: true, action: "removed" })
      } else {
        // Update to new reaction type
        const reaction = await prisma.post_reactions.update({
          where: { id: existingReaction.id },
          data: { type },
        })
        return NextResponse.json({ success: true, action: "updated", reaction })
      }
    }

    // Create new reaction
    const reaction = await prisma.post_reactions.create({
      data: {
        postId: params.id,
        staffUserId: staffUser.id,
        type,
      },
    })

    return NextResponse.json({ success: true, action: "added", reaction })
  } catch (error) {
    console.error("Error adding reaction:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

