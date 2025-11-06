import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/tasks/[id]/responses - Get all responses for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if task exists
    const task = await prisma.tasks.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Get all responses for this task
    const responses = await prisma.task_responses.findMany({
      where: { taskId: id },
      orderBy: { createdAt: 'asc' },
    })

    // For each response, fetch the user details based on createdByType
    const responsesWithUsers = await Promise.all(
      responses.map(async (response) => {
        let user = null

        if (response.createdByType === "STAFF") {
          user = await prisma.staff_users.findUnique({
            where: { id: response.createdById },
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          })
        } else if (response.createdByType === "CLIENT") {
          user = await prisma.client_users.findUnique({
            where: { id: response.createdById },
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          })
        } else if (response.createdByType === "ADMIN") {
          user = await prisma.management_users.findUnique({
            where: { id: response.createdById },
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          })
        }

        return {
          ...response,
          user,
        }
      })
    )

    return NextResponse.json({ success: true, responses: responsesWithUsers })
  } catch (error) {
    console.error("❌ [Get Task Responses Error]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/responses - Add response/comment to task
export async function POST(
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

    // Allow either content OR attachments (or both!)
    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: "Please add a comment or attach images" }, { status: 400 })
    }

    // Check if task exists
    const task = await prisma.tasks.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Determine if user is staff, client, or admin
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
    })

    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
    })

    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!staffUser && !clientUser && !managementUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Determine user type and ID
    let createdByType: "STAFF" | "CLIENT" | "ADMIN" = "STAFF"
    let createdById = ""
    let user = null

    if (staffUser) {
      createdByType = "STAFF"
      createdById = staffUser.id
      user = {
        id: staffUser.id,
        name: staffUser.name,
        email: staffUser.email,
        avatar: staffUser.avatar,
        role: staffUser.role,
      }
    } else if (clientUser) {
      createdByType = "CLIENT"
      createdById = clientUser.id
      user = {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        avatar: clientUser.avatar,
      }
    } else if (managementUser) {
      createdByType = "ADMIN"
      createdById = managementUser.id
      user = {
        id: managementUser.id,
        name: managementUser.name,
        email: managementUser.email,
        avatar: managementUser.avatar,
        role: managementUser.role,
      }
    }

    // Create response (content can be empty if there are attachments)
    const response = await prisma.task_responses.create({
      data: {
        taskId: id,
        content: content || "", // Allow empty content if attachments exist
        createdByType,
        createdById,
        attachments: attachments || [],
      },
    })

    return NextResponse.json({ 
      success: true, 
      response: {
        ...response,
        user,
      }
    }, { status: 201 })
  } catch (error) {
    console.error("❌ [Create Task Response Error]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

