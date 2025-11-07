import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"

/**
 * UNIVERSAL COMMENTS API
 * 
 * Handles comments for ANY entity in the system:
 * - TICKET, TASK, POST, DOCUMENT, CANDIDATE, INTERVIEW, 
 * - ONBOARDING, JOB_ACCEPTANCE, REVIEW, TIME_ENTRY, etc.
 * 
 * Uses polymorphic pattern: commentableType + commentableId
 */

// ============================================================================
// GET - Fetch all comments for an entity
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentableType = searchParams.get("commentableType")
    const commentableId = searchParams.get("commentableId")

    if (!commentableType || !commentableId) {
      return NextResponse.json(
        { error: "commentableType and commentableId are required" },
        { status: 400 }
      )
    }

    console.log(`📖 [COMMENTS] Fetching comments for ${commentableType}:${commentableId}`)

    // Fetch comments (direct SQL query since table exists but not in Prisma schema yet)
    const comments = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        "commentableType",
        "commentableId",
        "authorType",
        "authorId",
        "authorName",
        "authorAvatar",
        content,
        attachments,
        "parentId",
        "createdAt",
        "updatedAt"
      FROM comments
      WHERE "commentableType" = ${commentableType}
        AND "commentableId" = ${commentableId}
      ORDER BY "createdAt" ASC
    `

    console.log(`✅ [COMMENTS] Found ${comments.length} comments`)

    return NextResponse.json({ 
      success: true, 
      comments 
    }, { status: 200 })

  } catch (error: any) {
    console.error("❌ [COMMENTS] Error fetching comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments", details: error.message },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create a new comment
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { commentableType, commentableId, content, attachments, parentId } = body

    // Validation
    if (!commentableType || !commentableId) {
      return NextResponse.json(
        { error: "commentableType and commentableId are required" },
        { status: 400 }
      )
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      )
    }

    // Determine user type and get user info
    const [staffUser, clientUser, managementUser] = await Promise.all([
      prisma.staff_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true, avatar: true }
      }),
      prisma.client_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true, avatar: true }
      }),
      prisma.management_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true, avatar: true }
      })
    ])

    let authorType: string
    let authorId: string
    let authorName: string
    let authorAvatar: string | null

    if (staffUser) {
      authorType = "STAFF"
      authorId = staffUser.id
      authorName = staffUser.name
      authorAvatar = staffUser.avatar
    } else if (clientUser) {
      authorType = "CLIENT"
      authorId = clientUser.id
      authorName = clientUser.name
      authorAvatar = clientUser.avatar
    } else if (managementUser) {
      authorType = "MANAGEMENT"
      authorId = managementUser.id
      authorName = managementUser.name
      authorAvatar = managementUser.avatar
    } else {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log(`💬 [COMMENTS] Creating comment on ${commentableType}:${commentableId} by ${authorType}:${authorName}`)

    const commentId = randomUUID()
    const now = new Date()

    // Insert comment (direct SQL since table exists but not in Prisma schema yet)
    await prisma.$executeRaw`
      INSERT INTO comments (
        id,
        "commentableType",
        "commentableId",
        "authorType",
        "authorId",
        "authorName",
        "authorAvatar",
        content,
        attachments,
        "parentId",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${commentId},
        ${commentableType},
        ${commentableId},
        ${authorType},
        ${authorId},
        ${authorName},
        ${authorAvatar},
        ${content.trim()},
        ${attachments ? JSON.stringify(attachments) : '[]'}::jsonb,
        ${parentId || null},
        ${now},
        ${now}
      )
    `

    // Fetch the created comment
    const comment = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        "commentableType",
        "commentableId",
        "authorType",
        "authorId",
        "authorName",
        "authorAvatar",
        content,
        attachments,
        "parentId",
        "createdAt",
        "updatedAt"
      FROM comments
      WHERE id = ${commentId}
    `

    console.log(`✅ [COMMENTS] Comment created: ${commentId}`)

    return NextResponse.json({
      success: true,
      comment: comment[0]
    }, { status: 201 })

  } catch (error: any) {
    console.error("❌ [COMMENTS] Error creating comment:", error)
    return NextResponse.json(
      { error: "Failed to create comment", details: error.message },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Delete a comment (only author or admin)
// ============================================================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get("commentId")

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 }
      )
    }

    // Fetch the comment
    const comments = await prisma.$queryRaw<any[]>`
      SELECT "authorId", "authorType"
      FROM comments
      WHERE id = ${commentId}
    `

    if (!comments || comments.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    const comment = comments[0]

    // Check if user is the author or an admin
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, role: true }
    })

    const isAdmin = managementUser && 
      (managementUser.role === "ADMIN" || managementUser.role === "CEO_EXECUTIVE")

    const isAuthor = comment.authorId === (
      await prisma.staff_users.findUnique({ where: { authUserId: session.user.id }, select: { id: true } })?.then(u => u?.id) ||
      await prisma.client_users.findUnique({ where: { authUserId: session.user.id }, select: { id: true } })?.then(u => u?.id) ||
      await prisma.management_users.findUnique({ where: { authUserId: session.user.id }, select: { id: true } })?.then(u => u?.id)
    )

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      )
    }

    console.log(`🗑️ [COMMENTS] Deleting comment: ${commentId}`)

    // Delete the comment
    await prisma.$executeRaw`
      DELETE FROM comments
      WHERE id = ${commentId}
    `

    console.log(`✅ [COMMENTS] Comment deleted: ${commentId}`)

    return NextResponse.json({
      success: true,
      message: "Comment deleted"
    }, { status: 200 })

  } catch (error: any) {
    console.error("❌ [COMMENTS] Error deleting comment:", error)
    return NextResponse.json(
      { error: "Failed to delete comment", details: error.message },
      { status: 500 }
    )
  }
}

