/**
 * AI ACTION EXECUTOR
 * Executes actions that the AI requests
 */

import { prisma } from './prisma'
import { randomUUID } from 'crypto'

type ActionResult = {
  success: boolean
  message: string
  data?: any
  error?: string
}

/**
 * Execute an AI-requested action
 */
export async function executeAIAction(
  toolName: string,
  toolInput: any,
  userId: string,
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT'
): Promise<ActionResult> {
  console.log(`🤖 [AI-ACTION] Executing: ${toolName}`, { toolInput, userId, userType })

  try {
    switch (toolName) {
      case 'create_task':
        return await createTask(toolInput, userId, userType)
      
      case 'update_task_status':
        return await updateTaskStatus(toolInput, userId, userType)
      
      case 'add_task_subtask':
        return await addTaskSubtask(toolInput, userId, userType)
      
      case 'create_ticket':
        return await createTicket(toolInput, userId, userType)
      
      case 'update_ticket_status':
        return await updateTicketStatus(toolInput, userId, userType)
      
      case 'create_post':
        return await createPost(toolInput, userId, userType)
      
      default:
        return {
          success: false,
          message: `Unknown action: ${toolName}`,
          error: 'UNKNOWN_ACTION'
        }
    }
  } catch (error) {
    console.error(`❌ [AI-ACTION] Error executing ${toolName}:`, error)
    return {
      success: false,
      message: `Failed to execute action: ${error instanceof Error ? error.message : String(error)}`,
      error: 'EXECUTION_ERROR'
    }
  }
}

// ========================================
// TASK ACTIONS
// ========================================

async function createTask(input: any, userId: string, userType: string): Promise<ActionResult> {
  // Parse deadline if provided
  let deadline: Date | null = null
  if (input.deadline) {
    const deadlineStr = input.deadline.toLowerCase()
    if (deadlineStr.includes('tomorrow')) {
      deadline = new Date()
      deadline.setDate(deadline.getDate() + 1)
      deadline.setHours(23, 59, 59, 999) // End of day
    } else if (deadlineStr.includes('next week')) {
      deadline = new Date()
      deadline.setDate(deadline.getDate() + 7)
      deadline.setHours(23, 59, 59, 999)
    } else if (deadlineStr.match(/in (\d+) day/)) {
      // "in 3 days", "in 1 day"
      const match = deadlineStr.match(/in (\d+) day/)
      if (match) {
        const days = parseInt(match[1])
        deadline = new Date()
        deadline.setDate(deadline.getDate() + days)
        deadline.setHours(23, 59, 59, 999)
      }
    } else if (deadlineStr.match(/in (\d+) week/)) {
      // "in 2 weeks"
      const match = deadlineStr.match(/in (\d+) week/)
      if (match) {
        const weeks = parseInt(match[1])
        deadline = new Date()
        deadline.setDate(deadline.getDate() + (weeks * 7))
        deadline.setHours(23, 59, 59, 999)
      }
    } else {
      // Try parsing as ISO or standard date
      try {
        deadline = new Date(input.deadline)
      } catch (e) {
        console.warn(`⚠️ Could not parse deadline: ${input.deadline}`)
        deadline = null
      }
    }
  }

  const task = await prisma.tasks.create({
    data: {
      id: randomUUID(),
      title: input.title,
      description: input.description || '',
      priority: input.priority,
      status: 'TODO',
      deadline: deadline,
      tags: input.tags || [],
      staffUserId: userType === 'STAFF' ? userId : null,
      clientUserId: userType === 'CLIENT' ? userId : null,
      createdById: userId,
      createdByType: userType as any,
      source: 'AI_AGENT' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })

  // Auto-assign to creator if staff
  if (userType === 'STAFF') {
    await prisma.task_assignments.create({
      data: {
        id: randomUUID(),
        taskId: task.id,
        staffUserId: userId,
        createdAt: new Date(),
      }
    })
  }

  // Create subtasks if provided
  let subtasksCreated = 0
  if (input.subtasks && Array.isArray(input.subtasks) && input.subtasks.length > 0) {
    for (let i = 0; i < input.subtasks.length; i++) {
      await prisma.subtasks.create({
        data: {
          id: randomUUID(),
          taskId: task.id,
          title: input.subtasks[i],
          order: i,
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })
      subtasksCreated++
    }
  }

  return {
    success: true,
    message: `✅ Created task "${input.title}" with ${input.priority} priority${deadline ? ` (due ${deadline.toLocaleDateString()})` : ''}${subtasksCreated > 0 ? ` and ${subtasksCreated} subtask(s)` : ''}`,
    data: { taskId: task.id, title: task.title, subtasksCreated }
  }
}

async function updateTaskStatus(input: any, userId: string, userType: string): Promise<ActionResult> {
  const task = await prisma.tasks.findUnique({
    where: { id: input.task_id }
  })

  if (!task) {
    return {
      success: false,
      message: `Task not found with ID: ${input.task_id}`,
      error: 'NOT_FOUND'
    }
  }

  await prisma.tasks.update({
    where: { id: input.task_id },
    data: {
      status: input.status,
      updatedAt: new Date(),
      ...(input.status === 'DONE' && { completedAt: new Date() })
    }
  })

  return {
    success: true,
    message: `✅ Moved task "${task.title}" to ${input.status}`,
    data: { taskId: task.id, status: input.status }
  }
}

async function addTaskSubtask(input: any, userId: string, userType: string): Promise<ActionResult> {
  const task = await prisma.tasks.findUnique({
    where: { id: input.task_id }
  })

  if (!task) {
    return {
      success: false,
      message: `Task not found with ID: ${input.task_id}`,
      error: 'NOT_FOUND'
    }
  }

  const subtask = await prisma.subtasks.create({
    data: {
      id: randomUUID(),
      taskId: input.task_id,
      title: input.title,
      completed: false,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })

  return {
    success: true,
    message: `✅ Added subtask "${input.title}" to task "${task.title}"`,
    data: { subtaskId: subtask.id, taskId: task.id }
  }
}

// ========================================
// TICKET ACTIONS
// ========================================

async function createTicket(input: any, userId: string, userType: string): Promise<ActionResult> {
  const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`
  
  const ticket = await prisma.tickets.create({
    data: {
      id: randomUUID(),
      ticketId: ticketNumber,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      status: 'OPEN',
      createdByType: userType,
      staffUserId: userType === 'STAFF' ? userId : null,
      clientUserId: userType === 'CLIENT' ? userId : null,
      managementUserId: userType === 'MANAGEMENT' ? userId : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })

  return {
    success: true,
    message: `✅ Created ticket ${ticketNumber} "${input.title}" (${input.category}, ${input.priority} priority)`,
    data: { ticketId: ticket.id, ticketNumber }
  }
}

async function updateTicketStatus(input: any, userId: string, userType: string): Promise<ActionResult> {
  // Support both UUID and ticket number (TKT-123456)
  const ticket = await prisma.tickets.findFirst({
    where: {
      OR: [
        { id: input.ticket_id },
        { ticketId: input.ticket_id }
      ]
    }
  })

  if (!ticket) {
    return {
      success: false,
      message: `Ticket not found: ${input.ticket_id}`,
      error: 'NOT_FOUND'
    }
  }

  await prisma.tickets.update({
    where: { id: ticket.id },
    data: {
      status: input.status,
      updatedAt: new Date(),
      ...(input.status === 'RESOLVED' && { resolvedDate: new Date() })
    }
  })

  return {
    success: true,
    message: `✅ Updated ticket ${ticket.ticketId} "${ticket.title}" to ${input.status}`,
    data: { ticketId: ticket.id, status: input.status }
  }
}

// ========================================
// ACTIVITY FEED ACTIONS
// ========================================

async function createPost(input: any, userId: string, userType: string): Promise<ActionResult> {
  const post = await prisma.activity_posts.create({
    data: {
      id: randomUUID(),
      content: input.content,
      type: input.type,
      staffUserId: userType === 'STAFF' ? userId : null,
      clientUserId: userType === 'CLIENT' ? userId : null,
      managementUserId: userType === 'MANAGEMENT' ? userId : null,
      audience: 'ALL',
      images: [],
      taggedUserIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })

  return {
    success: true,
    message: `✅ Posted to activity feed: "${input.content.substring(0, 50)}${input.content.length > 50 ? '...' : ''}"`,
    data: { postId: post.id, type: input.type }
  }
}

