import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/comments?type=TICKET&id=123 - Get all comments for an entity
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentableType = searchParams.get("type")
    const commentableId = searchParams.get("id")
    const includeDeleted = searchParams.get("includeDeleted") === "true"

    if (!commentableType || !commentableId) {
      return NextResponse.json(
        { error: "Missing required parameters: type and id" },
        { status: 400 }
      )
    }

    console.log(`[Comments API] Fetching comments for ${commentableType}:${commentableId}`)

    const comments = await prisma.comments.findMany({
      where: {
        commentableType,
        commentableId,
        ...(includeDeleted ? {} : { isDeleted: false }),
      },
      include: {
        reactions: true,
        replies: {
          where: includeDeleted ? {} : { isDeleted: false },
          include: {
            reactions: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ comments, count: comments.length })
  } catch (error) {
    console.error("[Comments API] Error fetching comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
}

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      commentableType,
      commentableId,
      content,
      attachments = [],
      parentId = null,
    } = body

    if (!commentableType || !commentableId || !content) {
      return NextResponse.json(
        { error: "Missing required fields: commentableType, commentableId, content" },
        { status: 400 }
      )
    }

    // Determine author type and ID based on session
    let authorType: string
    let authorId: string

    // Check if user is management
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (managementUser) {
      authorType = "MANAGEMENT"
      authorId = managementUser.id
    } else {
      // Check if user is staff
      const staffUser = await prisma.staff_users.findUnique({
        where: { authUserId: session.user.id },
      })

      if (staffUser) {
        authorType = "STAFF"
        authorId = staffUser.id
      } else {
        // Check if user is client
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
      `[Comments API] Creating comment: ${authorType}:${authorId} on ${commentableType}:${commentableId}`
    )

    // If parentId provided, verify it exists
    if (parentId) {
      const parentComment = await prisma.comments.findUnique({
        where: { id: parentId },
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        )
      }
    }

    const comment = await prisma.comments.create({
      data: {
        commentableType,
        commentableId,
        content,
        attachments,
        authorType,
        authorId,
        parentId,
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

    console.log(`[Comments API] ✅ Comment created: ${comment.id}`)

    return NextResponse.json({ success: true, comment }, { status: 201 })
  } catch (error) {
    console.error("[Comments API] Error creating comment:", error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}

