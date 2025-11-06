import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/tasks - Get all tasks across all companies (Management view)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is management
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!managementUser) {
      return NextResponse.json({ error: "Management access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const companyId = searchParams.get("companyId")
    const staffUserId = searchParams.get("staffUserId")
    const clientUserId = searchParams.get("clientUserId")
    const source = searchParams.get("source")
    const priority = searchParams.get("priority")

    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (companyId) where.companyId = companyId
    if (clientUserId) where.clientUserId = clientUserId
    if (source) where.source = source
    if (priority) where.priority = priority

    // Get all tasks with full details
    const tasks = await prisma.tasks.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            logo: true,
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
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        task_assignments: {
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // If filtering by staffUserId, do it manually (can be in legacy or new assignments)
    let filteredTasks = tasks
    if (staffUserId) {
      filteredTasks = tasks.filter(
        (task) =>
          task.staffUserId === staffUserId ||
          task.assignedStaff.some((assignment) => assignment.staffUserId === staffUserId)
      )
    }

    // Calculate stats
    const stats = {
      total: filteredTasks.length,
      byStatus: {
        TODO: filteredTasks.filter((t) => t.status === "TODO").length,
        IN_PROGRESS: filteredTasks.filter((t) => t.status === "IN_PROGRESS").length,
        STUCK: filteredTasks.filter((t) => t.status === "STUCK").length,
        FOR_REVIEW: filteredTasks.filter((t) => t.status === "FOR_REVIEW").length,
        COMPLETED: filteredTasks.filter((t) => t.status === "COMPLETED").length,
      },
      byPriority: {
        LOW: filteredTasks.filter((t) => t.priority === "LOW").length,
        MEDIUM: filteredTasks.filter((t) => t.priority === "MEDIUM").length,
        HIGH: filteredTasks.filter((t) => t.priority === "HIGH").length,
        URGENT: filteredTasks.filter((t) => t.priority === "URGENT").length,
      },
      bySource: {
        SELF: filteredTasks.filter((t) => t.source === "SELF").length,
        CLIENT: filteredTasks.filter((t) => t.source === "CLIENT").length,
        MANAGEMENT: filteredTasks.filter((t) => t.source === "MANAGEMENT").length,
      },
    }

    return NextResponse.json({ tasks: filteredTasks, stats })
  } catch (error) {
    console.error("Error fetching admin tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
