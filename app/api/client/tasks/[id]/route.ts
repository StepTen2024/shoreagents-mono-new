import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/client/tasks/[id] - Update task
export async function PATCH(
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
    const { title, description, status, priority, deadline, tags } = body

    // Get client user
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    // Verify task exists and belongs to client
    const existingTask = await prisma.tasks.findUnique({
      where: { id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (existingTask.clientUserId !== clientUser.id) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own tasks" }, { status: 403 })
    }

    // Update task
    const task = await prisma.tasks.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        ...(tags && { tags }),
        ...(status === "COMPLETED" && { completedAt: new Date() }),
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
    })

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error("Error updating client task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/client/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get client user
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    // Verify task exists and belongs to client
    const existingTask = await prisma.tasks.findUnique({
      where: { id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (existingTask.clientUserId !== clientUser.id) {
      return NextResponse.json({ error: "Forbidden: You can only delete your own tasks" }, { status: 403 })
    }

    // Delete task (cascade will delete TaskAssignments)
    await prisma.tasks.delete({
      where: { id },
    })

    console.log(`✅ Client ${clientUser.name} deleted task ${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting client task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
