import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// PATCH /api/comments/[id] - Edit a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { content, attachments } = body

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    // Find the comment
    const comment = await prisma.comments.findUnique({
      where: { id },
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Verify ownership - get current user's type and ID
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

    // Check if user owns this comment
    if (comment.authorType !== authorType || comment.authorId !== authorId) {
      return NextResponse.json(
        { error: "You can only edit your own comments" },
        { status: 403 }
      )
    }

    console.log(`[Comments API] Editing comment: ${id}`)

    const updatedComment = await prisma.comments.update({
      where: { id },
      data: {
        content,
        ...(attachments && { attachments }),
        editedAt: new Date(),
        isEdited: true,
      },
      include: {
        reactions: true,
        replies: {
          include: {
            reactions: true,
          },
        },
      },
    })

    console.log(`[Comments API] ✅ Comment edited: ${id}`)

    return NextResponse.json({ success: true, comment: updatedComment })
  } catch (error) {
    console.error("[Comments API] Error editing comment:", error)
    return NextResponse.json(
      { error: "Failed to edit comment" },
      { status: 500 }
    )
  }
}

// DELETE /api/comments/[id] - Soft delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Find the comment
    const comment = await prisma.comments.findUnique({
      where: { id },
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Verify ownership - get current user's type and ID
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

    // Check if user owns this comment OR is management (can delete any)
    if (
      comment.authorType !== authorType ||
      (comment.authorId !== authorId && authorType !== "MANAGEMENT")
    ) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      )
    }

    console.log(`[Comments API] Deleting comment: ${id}`)

    // Soft delete
    const deletedComment = await prisma.comments.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })

    console.log(`[Comments API] ✅ Comment deleted: ${id}`)

    return NextResponse.json({ success: true, comment: deletedComment })
  } catch (error) {
    console.error("[Comments API] Error deleting comment:", error)
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    )
  }
}

