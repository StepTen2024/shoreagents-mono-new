import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * 🎯 POSTS FEED API with Advanced Filtering
 * 
 * Supports audience-based filtering based on user role:
 * - Staff: ALL_STAFF, MY_TEAM, MY_CLIENT
 * - Management: EVERYONE, ALL_CLIENTS, ALL_STAFF_MGMT, MANAGEMENT_ONLY
 * - Clients: MY_TEAM_AND_MANAGEMENT
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const filterType = searchParams.get('filter') || 'all' // all, my_team, my_client, management_only, etc.
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '15')
    
    // Validate pagination
    const validPage = Math.max(1, page)
    const validLimit = Math.min(Math.max(1, limit), 50)
    const skip = (validPage - 1) * validLimit

    // Determine user type and build audience filter
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        staff_profiles: {
          select: { departmentId: true }
        },
        company: {
          select: { id: true }
        }
      }
    })

    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        company: {
          select: { id: true }
        }
      }
    })

    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        department: {
          select: { id: true }
        }
      }
    })

    if (!staffUser && !clientUser && !managementUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Build where clause based on user type and filter
    let whereClause: any = {}

    // 👨‍💼 STAFF USER FILTERING
    if (staffUser) {
      const departmentId = staffUser.staff_profiles?.[0]?.departmentId
      const companyId = staffUser.company?.id

      if (filterType === 'all_staff') {
        whereClause.audience = { in: ['ALL_STAFF', 'ALL', 'EVERYONE'] }
      } else if (filterType === 'my_team' && departmentId) {
        // Posts from same department OR targeted to my team
        whereClause.OR = [
          { audience: 'MY_TEAM', staffUserId: { in: await prisma.staff_users.findMany({
            where: { staff_profiles: { some: { departmentId } } },
            select: { id: true }
          }).then(users => users.map(u => u.id)) } },
          { audience: 'ALL_STAFF' },
          { audience: 'EVERYONE' }
        ]
      } else if (filterType === 'my_client' && companyId) {
        // Posts from my client OR posts I made for my client
        whereClause.OR = [
          { audience: 'MY_CLIENT', clientUserId: companyId },
          { audience: 'MY_CLIENT', staffUserId: staffUser.id },
          { audience: 'EVERYONE' }
        ]
      } else {
        // Default: Show all staff-visible posts
        whereClause.audience = { in: ['ALL_STAFF', 'ALL', 'EVERYONE', 'MY_TEAM', 'MY_CLIENT'] }
      }
    }

    // 👔 MANAGEMENT USER FILTERING
    else if (managementUser) {
      if (filterType === 'everyone') {
        whereClause.audience = { in: ['EVERYONE', 'ALL'] }
      } else if (filterType === 'all_clients') {
        whereClause.audience = { in: ['ALL_CLIENTS', 'EVERYONE'] }
      } else if (filterType === 'all_staff') {
        whereClause.audience = { in: ['ALL_STAFF_MGMT', 'ALL_STAFF', 'EVERYONE'] }
      } else if (filterType === 'management_only') {
        whereClause.audience = 'MANAGEMENT_ONLY'
      } else {
        // Default: Show everything management can see
        whereClause.audience = { in: ['EVERYONE', 'ALL', 'MANAGEMENT_ONLY', 'ALL_CLIENTS', 'ALL_STAFF_MGMT'] }
      }
    }

    // 🏢 CLIENT USER FILTERING
    else if (clientUser) {
      const companyId = clientUser.company?.id

      if (filterType === 'my_team' && companyId) {
        // Posts from my team (staff assigned to my company) OR posts from management
        whereClause.OR = [
          { audience: 'MY_TEAM_AND_MANAGEMENT', clientUserId: clientUser.id },
          { audience: 'ALL_CLIENTS' },
          { audience: 'EVERYONE' }
        ]
      } else {
        // Default: Show all client-visible posts
        whereClause.audience = { in: ['MY_TEAM_AND_MANAGEMENT', 'ALL_CLIENTS', 'EVERYONE', 'ALL'] }
      }
    }

    // Get total count
    const totalCount = await prisma.activity_posts.count({ where: whereClause })

    // Fetch posts
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

    // Fetch comments & reactions for each post using UNIVERSAL system
    const postsWithData = await Promise.all(posts.map(async (post) => {
      const commentCount = await prisma.comments.count({
        where: { commentableType: "POST", commentableId: post.id },
      })

      const reactions = await prisma.reactions.findMany({
        where: { reactableType: "POST", reactableId: post.id },
        take: 20,
        orderBy: { createdAt: "desc" },
      })

      // If this is a reshare, fetch original post
      let originalPost = null
      if (post.originalPostId) {
        originalPost = await prisma.activity_posts.findUnique({
          where: { id: post.originalPostId },
          include: {
            staff_users: { select: { id: true, name: true, avatar: true } },
            client_users: { select: { id: true, name: true, avatar: true } },
            management_users: { select: { id: true, name: true, avatar: true } },
          }
        })
      }

      return { ...post, commentCount, reactions, originalPost }
    }))

    // Fetch tagged users
    const allTaggedUserIds = [...new Set(postsWithData.flatMap(p => p.taggedUserIds || []).filter(Boolean))]
    const taggedUsers = allTaggedUserIds.length > 0 
      ? await prisma.staff_users.findMany({
          where: { id: { in: allTaggedUserIds } },
          select: { id: true, name: true, avatar: true }
        })
      : []
    
    const taggedUsersMap = new Map(taggedUsers.map(u => [u.id, u]))

    // Transform posts
    const transformedPosts = postsWithData.map(post => {
      const postUser = post.staff_users || post.client_users || post.management_users
      
      if (!postUser) return null

      // Map reactions
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

      // Transform original post if reshare
      let originalPostData = null
      if (post.originalPost) {
        const originalUser = post.originalPost.staff_users || post.originalPost.client_users || post.originalPost.management_users
        originalPostData = {
          id: post.originalPost.id,
          content: post.originalPost.content,
          type: post.originalPost.type,
          images: post.originalPost.images,
          createdAt: post.originalPost.createdAt.toISOString(),
          user: originalUser ? {
            id: originalUser.id,
            name: originalUser.name,
            avatar: originalUser.avatar,
          } : null
        }
      }
      
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
        // Reshare data
        isReshare: !!post.originalPostId,
        reshareComment: post.reshareComment,
        originalPost: originalPostData,
      }
    }).filter(Boolean)

    // Pagination metadata
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
    console.error("❌ [POSTS FEED] Error fetching posts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

