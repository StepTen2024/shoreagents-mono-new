import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const whereClause: any = {
      userId: staffUser.id
    }

    if (unreadOnly) {
      whereClause.read = false
    }

    // Fetch notifications - with null check
    const notifications = await prisma?.notification?.findMany({
      where: whereClause,
      include: {
        post: {
          select: {
            id: true,
            content: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    }) || []

    // Get unread count - with null check
    const unreadCount = await prisma?.notification?.count({
      where: {
        userId: staffUser.id,
        read: false
      }
    }) || 0

    return NextResponse.json({
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.notifications.updateMany({
        where: {
          userId: staffUser.id,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      })

      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      )
    }

    // Mark single notification as read
    const notification = await prisma.notifications.findUnique({
      where: { id: notificationId }
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    if (notification.userId !== staffUser.id) {
      return NextResponse.json(
        { error: "You can only mark your own notifications as read" },
        { status: 403 }
      )
    }

    await prisma.notifications.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications - Delete notification(s)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    if (deleteAll) {
      // Delete all read notifications
      await prisma.notifications.deleteMany({
        where: {
          userId: staffUser.id,
          read: true
        }
      })

      return NextResponse.json({ success: true, message: "All read notifications deleted" })
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      )
    }

    // Delete single notification
    const notification = await prisma.notifications.findUnique({
      where: { id: notificationId }
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    if (notification.userId !== staffUser.id) {
      return NextResponse.json(
        { error: "You can only delete your own notifications" },
        { status: 403 }
      )
    }

    await prisma.notifications.delete({
      where: { id: notificationId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

