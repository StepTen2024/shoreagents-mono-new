import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logTaskCompleted } from "@/lib/activity-generator"

// PUT /api/tasks/[id] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const {
      title,
      description,
      status,
      priority,
      deadline,
      tags,
      timeSpent,
    } = body

    // Get staff user first
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Verify task belongs to user (check both legacy and new assignment methods)
    const existingTask = await prisma.tasks.findUnique({
      where: { id },
      include: {
        task_assignments: true,
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if staff is assigned (via legacy staffUserId OR new TaskAssignment)
    const isAssigned = existingTask.staffUserId === staffUser.id || 
                      existingTask.task_assignments.some(assignment => assignment.staffUserId === staffUser.id)

    if (!isAssigned) {
      return NextResponse.json({ error: "Forbidden: Task not assigned to you" }, { status: 403 })
    }

    // Check if task is being marked as completed (status changing to COMPLETED)
    const isBeingCompleted = status === "COMPLETED" && existingTask.status !== "COMPLETED"

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
        ...(timeSpent !== undefined && { timeSpent }),
        ...(status === "COMPLETED" && { completedAt: new Date() }),
        updatedAt: new Date(),
      },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
          }
        },
        client_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
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
              }
            }
          }
        }
      }
    })

    // 🎉 Auto-generate activity post when task is completed
    if (isBeingCompleted) {
      await logTaskCompleted(
        staffUser.id,
        staffUser.name,
        title || existingTask.title,
        priority || existingTask.priority
      )
    }

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error("❌ [Task Update Error]:", error)
    console.error("Error details:", JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Delete a task (only if self-created)
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

    // Get staff user first
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Verify task exists and was self-created (staff can only delete their own tasks)
    const existingTask = await prisma.tasks.findUnique({
      where: { id },
      include: {
        assignedStaff: true,
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Only allow deletion if self-created
    if (existingTask.source !== "SELF" || existingTask.createdById !== staffUser.id) {
      return NextResponse.json({ error: "Forbidden: You can only delete self-created tasks" }, { status: 403 })
    }

    await prisma.tasks.delete({
      where: { id },
    })

    console.log(`✅ Staff ${staffUser.name} deleted self-task ${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

