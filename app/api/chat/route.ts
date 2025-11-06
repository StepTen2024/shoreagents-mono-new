import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

// POST /api/chat - AI chat endpoint
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user details for personalization
    // Try StaffUser first
    let user = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, name: true },
    })

    // If not staff, try ClientUser
    if (!user) {
      const clientUser = await prisma.client_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true },
      })
      if (clientUser) {
        user = clientUser
      }
    }

    // If not client, try ManagementUser
    if (!user) {
      const managementUser = await prisma.management_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true },
      })
      if (managementUser) {
        user = managementUser
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { messages, documentIds, taskIds } = await request.json()
    
    console.log('📬 AI Chat API received:')
    console.log('  - documentIds:', documentIds?.length || 0)
    console.log('  - taskIds:', taskIds?.length || 0)
    
    // Get referenced documents if any
    let documentContext = ''
    if (documentIds && documentIds.length > 0) {
      const docs = await prisma.document.findMany({
        where: {
          id: { in: documentIds },
          // Documents are accessible based on sharing permissions
        },
        select: {
          title: true,
          category: true,
          content: true,
        },
      })

      if (docs.length > 0) {
        documentContext = '\n\nREFERENCED DOCUMENTS:\n' + docs.map(doc => 
          `\n---\nTitle: ${doc.title}\nCategory: ${doc.category}\n${doc.content || 'Content not available yet (file only)'}\n---`
        ).join('\n')
      }
    }
    
    // Get referenced tasks if any
    let taskContext = ''
    if (taskIds && taskIds.length > 0) {
      console.log(`📋 Fetching ${taskIds.length} tasks for AI context...`)
      const tasks = await prisma.tasks.findMany({
        where: {
          id: { in: taskIds },
        },
        select: {
          title: true,
          description: true,
          status: true,
          priority: true,
          deadline: true,
          tags: true,
          company: {
            select: {
              companyName: true,
            },
          },
          client_users: {
            select: {
              name: true,
            },
          },
          responses: {
            select: {
              content: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
          subtasks: {
            select: {
              title: true,
              completed: true,
            },
          },
        },
      })

      if (tasks.length > 0) {
        console.log(`📋 Building context for ${tasks.length} tasks`)
        // Check if this is a request for ALL tasks (report mode)
        const isReportMode = tasks.length > 5
        console.log(`📊 Report mode: ${isReportMode ? 'YES' : 'NO'}`)
        
        if (isReportMode) {
          // Provide summary statistics and grouped tasks for reports
          const tasksByStatus = {
            TODO: tasks.filter(t => t.status === 'TODO'),
            IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
            FOR_REVIEW: tasks.filter(t => t.status === 'FOR_REVIEW' || t.status === 'IN_REVIEW'),
            DONE: tasks.filter(t => t.status === 'DONE'),
          }
          
          const tasksByPriority = {
            URGENT: tasks.filter(t => t.priority === 'URGENT'),
            HIGH: tasks.filter(t => t.priority === 'HIGH'),
            MEDIUM: tasks.filter(t => t.priority === 'MEDIUM'),
            LOW: tasks.filter(t => t.priority === 'LOW'),
          }
          
          const tasksWithDeadlineToday = tasks.filter(t => {
            if (!t.deadline) return false
            const today = new Date()
            const deadline = new Date(t.deadline)
            return deadline.toDateString() === today.toDateString()
          })
          
          taskContext = `\n\n📊 ALL TASKS OVERVIEW (${tasks.length} total):\n
SUMMARY:
- TODO: ${tasksByStatus.TODO.length}
- IN PROGRESS: ${tasksByStatus.IN_PROGRESS.length}
- FOR REVIEW: ${tasksByStatus.FOR_REVIEW.length}
- DONE: ${tasksByStatus.DONE.length}

PRIORITY BREAKDOWN:
- URGENT: ${tasksByPriority.URGENT.length}
- HIGH: ${tasksByPriority.HIGH.length}
- MEDIUM: ${tasksByPriority.MEDIUM.length}
- LOW: ${tasksByPriority.LOW.length}

${tasksWithDeadlineToday.length > 0 ? `⚠️ DUE TODAY: ${tasksWithDeadlineToday.length} tasks\n` : ''}

TASK DETAILS:\n` + tasks.map(task => {
            const taskDetails = [
              `\n---`,
              `Title: ${task.title}`,
              `Status: ${task.status} | Priority: ${task.priority}`,
              task.deadline ? `Deadline: ${new Date(task.deadline).toLocaleDateString()}` : null,
              task.company ? `Company: ${task.company.companyName}` : null,
              task.subtasks.length > 0 ? `Subtasks: ${task.subtasks.filter(st => st.completed).length}/${task.subtasks.length} completed` : null,
            ].filter(Boolean).join('\n')
            
            return taskDetails
          }).join('\n')
        } else {
          // Detailed view for individual tasks
          taskContext = '\n\nREFERENCED TASKS:\n' + tasks.map(task => {
            const taskDetails = [
              `\n---`,
              `Title: ${task.title}`,
              `Status: ${task.status}`,
              `Priority: ${task.priority}`,
              task.description ? `Description: ${task.description}` : null,
              task.deadline ? `Deadline: ${new Date(task.deadline).toLocaleDateString()}` : null,
              task.tags.length > 0 ? `Tags: ${task.tags.join(', ')}` : null,
              task.company ? `Company: ${task.company.companyName}` : null,
              task.client_users ? `Client: ${task.client_users.name}` : null,
              task.subtasks.length > 0 ? `\nSubtasks:\n${task.subtasks.map(st => `- [${st.completed ? 'x' : ' '}] ${st.title}`).join('\n')}` : null,
              task.responses.length > 0 ? `\nRecent Comments:\n${task.responses.slice(0, 3).map(r => `- ${r.content} (${new Date(r.createdAt).toLocaleDateString()})`).join('\n')}` : null,
              `---`,
            ].filter(Boolean).join('\n')
            
            return taskDetails
          }).join('\n')
        }
      }
    }
    
    // Combine all context
    const fullContext = documentContext + taskContext

    // Get user's first name
    const firstName = user.name.split(' ')[0]

    // System prompt for BPO training assistant
    const systemPrompt = `You are a friendly AI assistant helping ${firstName} with their BPO work. You're here to help them understand training materials, manage tasks, and bring more value to their clients.

IMPORTANT: Always greet ${firstName} by their first name when starting your responses (e.g., "Hi ${firstName}," or "Hey ${firstName},").

RESPONSE STYLE:
- Write naturally and conversationally, like a helpful colleague
- Keep responses concise and easy to scan
- Use simple paragraphs and occasional bullet points when listing things
- Avoid heavy marketing language or excessive enthusiasm
- Be warm but professional

WHEN DOCUMENTS OR TASKS ARE REFERENCED:
- For documents: Stick to the information in those specific documents, quote or paraphrase relevant sections
- For tasks: Help with task planning, prioritization, breaking down work, suggesting next steps
- If the answer isn't in the referenced material, say so
- When a task is referenced, you can see its status, description, subtasks, and recent comments

WHEN ALL TASKS ARE REFERENCED (Reports):
- Provide clear, actionable daily/weekly reports
- Highlight urgent items and deadlines
- Suggest priorities based on status, deadline, and priority level
- Identify potential blockers or tasks needing attention
- Keep the report concise but comprehensive
- Group by status or priority as appropriate

WHEN NO DOCUMENTS/TASKS ARE REFERENCED:
- Provide helpful BPO guidance and best practices
- Help with general work processes and logic
- Give practical, actionable advice
- Assist with task management and time management strategies${fullContext}`

    // Call Claude API
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    const assistantMessage = response.content[0].type === 'text' 
      ? response.content[0].text 
      : ''

    return NextResponse.json({ 
      message: assistantMessage,
      sources: documentIds || [],
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}










