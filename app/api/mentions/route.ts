import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"

/**
 * 🎯 UNIVERSAL MENTIONS API
 * 
 * Just like comments and reactions, this handles mentions across ALL entities:
 * - POST, TICKET, TASK, COMMENT, DOCUMENT, REVIEW
 * 
 * Can mention: STAFF, CLIENT, MANAGEMENT
 */

// GET /api/mentions - Get mentions for a specific entity OR for a user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mentionableType = searchParams.get('mentionableType')
    const mentionableId = searchParams.get('mentionableId')
    const mentionedUserId = searchParams.get('mentionedUserId')
    const limit = parseInt(searchParams.get('limit') || '50')

    let whereClause: any = {}

    // Query mentions for a specific entity (e.g., "get all mentions in this post")
    if (mentionableType && mentionableId) {
      whereClause = {
        mentionableType,
        mentionableId
      }
    }
    // Query mentions for a specific user (e.g., "where was I mentioned?")
    else if (mentionedUserId) {
      whereClause = {
        mentionedUserId
      }
    }

    const mentions = await prisma.mentions.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    // Fetch mentioned users' details
    const mentionedUserIds = [...new Set(mentions.map(m => m.mentionedUserId))]
    
    const [staffUsers, clientUsers, managementUsers] = await Promise.all([
      prisma.staff_users.findMany({
        where: { id: { in: mentionedUserIds } },
        select: { id: true, name: true, avatar: true, email: true }
      }),
      prisma.client_users.findMany({
        where: { id: { in: mentionedUserIds } },
        select: { id: true, name: true, avatar: true, email: true }
      }),
      prisma.management_users.findMany({
        where: { id: { in: mentionedUserIds } },
        select: { id: true, name: true, avatar: true, email: true }
      })
    ])

    const usersMap = new Map([
      ...staffUsers.map(u => [u.id, { ...u, type: 'STAFF' }]),
      ...clientUsers.map(u => [u.id, { ...u, type: 'CLIENT' }]),
      ...managementUsers.map(u => [u.id, { ...u, type: 'MANAGEMENT' }])
    ])

    const mentionsWithUsers = mentions.map(mention => ({
      ...mention,
      mentionedUser: usersMap.get(mention.mentionedUserId) || null
    }))

    return NextResponse.json({ mentions: mentionsWithUsers })
  } catch (error) {
    console.error("❌ [MENTIONS] Error fetching mentions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/mentions - Create a new mention
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      mentionableType,
      mentionableId,
      mentionedUserId,
      mentionedUserType
    } = body

    // Validation
    const validTypes = ['POST', 'TICKET', 'TASK', 'COMMENT', 'DOCUMENT', 'REVIEW']
    const validUserTypes = ['STAFF', 'CLIENT', 'MANAGEMENT']

    if (!mentionableType || !validTypes.includes(mentionableType)) {
      return NextResponse.json(
        { error: "Invalid mentionableType. Must be: " + validTypes.join(', ') },
        { status: 400 }
      )
    }

    if (!mentionableId || !mentionedUserId || !mentionedUserType) {
      return NextResponse.json(
        { error: "mentionableId, mentionedUserId, and mentionedUserType are required" },
        { status: 400 }
      )
    }

    if (!validUserTypes.includes(mentionedUserType)) {
      return NextResponse.json(
        { error: "Invalid mentionedUserType. Must be: " + validUserTypes.join(', ') },
        { status: 400 }
      )
    }

    // Determine mentioner type
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id }
    })

    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    let mentionerUserId: string
    let mentionerUserType: string

    if (staffUser) {
      mentionerUserId = staffUser.id
      mentionerUserType = 'STAFF'
    } else if (clientUser) {
      mentionerUserId = clientUser.id
      mentionerUserType = 'CLIENT'
    } else if (managementUser) {
      mentionerUserId = managementUser.id
      mentionerUserType = 'MANAGEMENT'
    } else {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if mention already exists
    const existingMention = await prisma.mentions.findFirst({
      where: {
        mentionableType,
        mentionableId,
        mentionedUserId,
        mentionerUserId
      }
    })

    if (existingMention) {
      return NextResponse.json(
        { message: "Mention already exists", mention: existingMention },
        { status: 200 }
      )
    }

    // Create mention
    const mention = await prisma.mentions.create({
      data: {
        id: randomUUID(),
        mentionableType,
        mentionableId,
        mentionedUserId,
        mentionedUserType,
        mentionerUserId,
        mentionerUserType,
        notificationSent: false
      }
    })

    console.log(`✅ [MENTIONS] Created mention: ${mentionerUserType} mentioned ${mentionedUserType} in ${mentionableType}`)

    // 🔔 Create notification (ONLY for STAFF users - notifications table is staff-only)
    if (mentionedUserType === 'STAFF') {
      const mentioner = staffUser || clientUser || managementUser
      const mentionerName = mentioner?.name || 'Someone'

      // Get entity name for notification
      let entityName = ''
      let actionUrl = ''

      switch (mentionableType) {
        case 'POST':
          entityName = 'a post'
          actionUrl = `/posts?postId=${mentionableId}`
          break
        case 'TICKET':
          entityName = 'a ticket'
          actionUrl = `/tickets?ticketId=${mentionableId}`
          break
        case 'TASK':
          entityName = 'a task'
          actionUrl = `/tasks?taskId=${mentionableId}`
          break
        case 'COMMENT':
          entityName = 'a comment'
          actionUrl = `/activity?commentId=${mentionableId}`
          break
        case 'DOCUMENT':
          entityName = 'a document'
          actionUrl = `/documents?documentId=${mentionableId}`
          break
        case 'REVIEW':
          entityName = 'a performance review'
          actionUrl = `/performance-reviews?reviewId=${mentionableId}`
          break
      }

      try {
        await prisma.notifications.create({
          data: {
            userId: mentionedUserId,
            type: 'MENTION',
            title: `${mentionerName} mentioned you in ${entityName}`,
            message: `You were mentioned in ${entityName}`,
            actionUrl,
            read: false
          }
        })

        // Update notification sent flag
        await prisma.mentions.update({
          where: { id: mention.id },
          data: { notificationSent: true }
        })

        console.log(`🔔 [MENTIONS] Notification sent to ${mentionedUserId}`)
      } catch (notifError) {
        console.error(`⚠️ [MENTIONS] Failed to create notification (non-fatal):`, notifError)
        // Don't fail the whole request if notification fails
      }
    } else {
      console.log(`ℹ️ [MENTIONS] Skipped notification for ${mentionedUserType} user (notifications are staff-only)`)
    }

    return NextResponse.json({ success: true, mention }, { status: 201 })
  } catch (error) {
    console.error("❌ [MENTIONS] Error creating mention:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/mentions/:id - Delete a mention
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mentionId = searchParams.get('id')

    if (!mentionId) {
      return NextResponse.json(
        { error: "Mention ID is required" },
        { status: 400 }
      )
    }

    // Check if mention exists
    const mention = await prisma.mentions.findUnique({
      where: { id: mentionId }
    })

    if (!mention) {
      return NextResponse.json(
        { error: "Mention not found" },
        { status: 404 }
      )
    }

    // Verify user is the mentioner (only they can delete)
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id }
    })

    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    const currentUserId = staffUser?.id || clientUser?.id || managementUser?.id

    if (mention.mentionerUserId !== currentUserId) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own mentions" },
        { status: 403 }
      )
    }

    // Delete mention
    await prisma.mentions.delete({
      where: { id: mentionId }
    })

    console.log(`🗑️ [MENTIONS] Deleted mention: ${mentionId}`)

    return NextResponse.json({ success: true, message: "Mention deleted" })
  } catch (error) {
    console.error("❌ [MENTIONS] Error deleting mention:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

