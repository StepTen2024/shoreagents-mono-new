import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/posts - Get all activity posts
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const audienceFilter = searchParams.get('audience')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '15')
    
    // Validate pagination params
    const validPage = Math.max(1, page)
    const validLimit = Math.min(Math.max(1, limit), 50) // Max 50 posts per page
    const skip = (validPage - 1) * validLimit

    // Build where clause based on audience filter
    // If filtering by a specific audience, show posts for that audience AND posts for ALL
    const whereClause: any = {}
    if (audienceFilter && audienceFilter !== 'ALL_FILTER') {
      whereClause.audience = {
        in: [audienceFilter, 'ALL']
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.activity_posts.count({
      where: whereClause
    })

    const posts = await prisma.activity_posts.findMany({
      where: whereClause,
      skip,
      take: validLimit,
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
      orderBy: { createdAt: "desc" },
    })

    // Fetch real comment counts and reactions using UNIVERSAL system
    const postsWithData = await Promise.all(posts.map(async (post) => {
      // Fetch comment count
      const commentCount = await prisma.comments.count({
        where: {
          commentableType: "POST",
          commentableId: post.id,
        },
      })

      // Fetch top reactions
      const reactions = await prisma.reactions.findMany({
        where: {
          reactableType: "POST",
          reactableId: post.id,
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      })

      return {
        ...post,
        commentCount,
        reactions,
      }
    }))

    // Fetch tagged users if any posts have them
    const allTaggedUserIds = [...new Set(postsWithData.flatMap(p => p.taggedUserIds || []).filter(Boolean))]
    const taggedUsers = allTaggedUserIds.length > 0 
      ? await prisma.staff_users.findMany({
          where: { id: { in: allTaggedUserIds } },
          select: { id: true, name: true, avatar: true }
        })
      : []
    
    const taggedUsersMap = new Map(taggedUsers.map(u => [u.id, u]))

    // Transform data to match frontend expectations
    const transformedPosts = postsWithData.map(post => {
      const postUser = post.staff_users || post.client_users || post.management_users
      
      if (!postUser) {
        return null
      }

      // Map reactions to emoji format
      const reactionEmojis = post.reactions.map(r => {
        const emojiMap: Record<string, string> = {
          LIKE: "👍",
          LOVE: "❤️",
          CELEBRATE: "🎉",
          LAUGH: "😂",
          FIRE: "🔥",
          ROCKET: "🚀"
        }
        return { 
          id: r.id,
          emoji: emojiMap[r.type] || "👍", 
          type: r.type,
          authorType: r.authorType,
          authorId: r.authorId,
        }
      })
      
      return {
        id: post.id,
        content: post.content,
        type: post.type,
        images: post.images,
        taggedUsers: (post.taggedUserIds || []).map(id => taggedUsersMap.get(id)).filter(Boolean),
        audience: post.audience,
        createdAt: post.createdAt.toISOString(),
        user: {
          id: postUser.id,
          name: postUser.name,
          avatar: postUser.avatar,
          role: post.staff_users?.role || post.management_users?.role || 'Client'
        },
        commentCount: post.commentCount,
        reactions: reactionEmojis,
      }
    }).filter(Boolean)

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validLimit)
    const hasMore = validPage < totalPages

    return NextResponse.json({ 
      posts: transformedPosts,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: totalCount,
        totalPages,
        hasMore
      }
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create a new activity post
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, type, achievement, images, taggedUserIds, audience } = body

    if (!content || !type) {
      return NextResponse.json(
        { error: "Content and type are required" },
        { status: 400 }
      )
    }

    // Check if it's a staff user, client user, or management user
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

    const post = await prisma.activity_posts.create({
      data: {
        staffUserId: staffUser?.id || null,
        clientUserId: clientUser?.id || null,
        managementUserId: managementUser?.id || null,
        content,
        type,
        achievement: achievement || null,
        images: images || [],
        taggedUserIds: taggedUserIds || [],
        audience: audience || 'ALL',
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

    // 🔔 Create notifications for tagged users
    if (taggedUserIds && taggedUserIds.length > 0) {
      const postUser = staffUser || clientUser || managementUser
      const postUserName = postUser?.name || 'Someone'
      
      // Create notification for each tagged user
      const notificationPromises = taggedUserIds.map((userId: string) =>
        prisma.notifications.create({
          data: {
            userId,
            type: 'TAG',
            title: `${postUserName} tagged you in a post`,
            message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            postId: post.id,
            actionUrl: `/activity?postId=${post.id}`,
            read: false
          }
        })
      )
      
      await Promise.all(notificationPromises)
      console.log(`🔔 [Notifications] Created ${taggedUserIds.length} tag notifications for post ${post.id}`)
    }

    // 🔥 Emit real-time event to all connected clients
    const io = global.socketServer
    if (io) {
      const postUser = staffUser || clientUser || managementUser
      if (postUser) {
        io.emit('activity:newPost', {
          id: post.id,
          content: post.content,
          type: post.type,
          images: post.images,
          audience: post.audience,
          createdAt: post.createdAt.toISOString(),
          user: {
            id: postUser.id,
            name: postUser.name,
            avatar: postUser.avatar,
            role: staffUser?.role || managementUser?.role || 'Client'
          },
          reactions: [],
          comments: []
        })
        console.log('🔥 [WebSocket] New post emitted:', post.id)
        
        // 🔔 Emit notification events to tagged users
        if (taggedUserIds && taggedUserIds.length > 0) {
          taggedUserIds.forEach((userId: string) => {
            io.to(`user:${userId}`).emit('notification:new', {
              userId,
              postId: post.id,
              title: `${postUser.name} tagged you in a post`,
              message: content.substring(0, 100) + (content.length > 100 ? '...' : '')
            })
          })
          console.log(`🔔 [WebSocket] Notification emitted to ${taggedUserIds.length} tagged users`)
        }
      }
    }

    return NextResponse.json({ success: true, post }, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

