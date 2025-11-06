import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/client/tasks/bulk - Create multiple tasks for staff
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tasks, staffUserIds, attachments } = body

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "Tasks array is required" }, { status: 400 })
    }

    if (!staffUserIds || staffUserIds.length === 0) {
      return NextResponse.json({ error: "At least one staff member must be assigned" }, { status: 400 })
    }

    // Validate that all tasks have required fields
    const validTasks = tasks.filter((task: any) => task.title && task.title.trim())
    if (validTasks.length === 0) {
      return NextResponse.json({ error: "At least one task must have a title" }, { status: 400 })
    }

    // Get client user
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true },
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    // Verify all staff users belong to the client's company
    const staffUsers = await prisma.staff_users.findMany({
      where: {
        id: { in: staffUserIds },
        companyId: clientUser.companyId,
      },
    })

    if (staffUsers.length !== staffUserIds.length) {
      return NextResponse.json(
        { error: "One or more staff members do not belong to your company" },
        { status: 403 }
      )
    }

    // Create multiple tasks using a transaction
    const createdTasks = await prisma.$transaction(
      validTasks.map((task: any) =>
        prisma.tasks.create({
          data: {
            title: task.title.trim(),
            description: task.description || "",
            status: "TODO",
            priority: task.priority || "MEDIUM",
            deadline: task.deadline ? new Date(task.deadline) : null,
            tags: [],
            attachments: attachments || [],
            source: "CLIENT",
            createdByType: "CLIENT",
            createdById: clientUser.id,
            clientUserId: clientUser.id,
            companyId: clientUser.companyId,
            // Create assignments for all selected staff
            task_assignments: {
              create: staffUserIds.map((staffUserId: string) => ({
                staffUserId,
              })),
            },
          },
          include: {
            company: {
              select: {
                id: true,
                companyName: true,
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
        })
      )
    )

    console.log(`✅ Client ${clientUser.name} created ${createdTasks.length} bulk task(s) for ${staffUserIds.length} staff member(s)`)

    return NextResponse.json({ 
      success: true, 
      tasks: createdTasks,
      count: createdTasks.length 
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating bulk client tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


