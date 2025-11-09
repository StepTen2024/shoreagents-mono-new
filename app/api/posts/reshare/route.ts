import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"

/**
 * 🔁 RESHARE POST API
 * Allows staff, management, and clients to reshare existing posts
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { originalPostId, reshareComment, audience } = body

    if (!originalPostId) {
      return NextResponse.json(
        { error: "Original post ID is required" },
        { status: 400 }
      )
    }

    // Check if original post exists
    const originalPost = await prisma.activity_posts.findUnique({
      where: { id: originalPostId },
      include: {
        staff_users: { select: { id: true, name: true } },
        client_users: { select: { id: true, name: true } },
        management_users: { select: { id: true, name: true } },
      }
    })

    if (!originalPost) {
      return NextResponse.json({ error: "Original post not found" }, { status: 404 })
    }

    // Determine user type
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id }
    })

    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser && !clientUser && !managementUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const currentUser = staffUser || clientUser || managementUser
    const userType = staffUser ? "STAFF" : clientUser ? "CLIENT" : "MANAGEMENT"

    // Create reshare post
    const resharePost = await prisma.activity_posts.create({
      data: {
        id: randomUUID(),
        staffUserId: staffUser?.id || null,
        clientUserId: clientUser?.id || null,
        managementUserId: managementUser?.id || null,
        content: originalPost.content, // Keep original content
        type: "RESHARE",
        images: originalPost.images,
        taggedUserIds: [],
        audience: audience || originalPost.audience, // Use provided audience or original
        originalPostId: originalPost.id,
        resharedBy: currentUser!.id,
        resharedByType: userType,
        reshareComment: reshareComment || null,
        updatedAt: new Date(),
      },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        client_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        management_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    })

    // 🔔 Notify the original poster
    const originalPostUser = originalPost.staff_users || originalPost.client_users || originalPost.management_users
    if (originalPostUser) {
      await prisma.notifications.create({
        data: {
          userId: originalPostUser.id,
          type: 'SYSTEM',
          title: `${currentUser!.name} reshared your post`,
          message: reshareComment || originalPost.content.substring(0, 100),
          postId: resharePost.id,
          actionUrl: `/activity?postId=${resharePost.id}`,
          read: false
        }
      })
      console.log(`🔔 [RESHARE] Notified ${originalPostUser.name} about reshare`)
    }

    // 🔥 Emit real-time event
    const io = global.socketServer
    if (io) {
      io.emit('activity:newPost', {
        id: resharePost.id,
        content: resharePost.content,
        type: 'RESHARE',
        images: resharePost.images,
        audience: resharePost.audience,
        createdAt: resharePost.createdAt.toISOString(),
        user: {
          id: currentUser!.id,
          name: currentUser!.name,
          avatar: (currentUser as any).avatar,
          role: staffUser?.role || managementUser?.role || 'Client'
        },
        isReshare: true,
        reshareComment,
        originalPost: {
          id: originalPost.id,
          content: originalPost.content,
          user: originalPostUser ? {
            id: originalPostUser.id,
            name: originalPostUser.name,
            avatar: (originalPostUser as any).avatar
          } : null
        },
        reactions: [],
        commentCount: 0,
      })
      console.log('🔥 [WebSocket] Reshare emitted:', resharePost.id)
    }

    return NextResponse.json({ success: true, post: resharePost }, { status: 201 })
  } catch (error) {
    console.error("❌ [RESHARE] Error creating reshare:", error)
    console.error("❌ [RESHARE] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: JSON.stringify(error, null, 2)
    })
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

