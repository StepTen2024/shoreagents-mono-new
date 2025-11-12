import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

if (!apiKey) {
  console.error('❌ [CHAT API] MISSING API KEY! Check .env.local file for ANTHROPIC_API_KEY or CLAUDE_API_KEY')
} else {
  console.log('✅ [CHAT API] API key loaded')
  console.log('   Length:', apiKey.length)
  console.log('   Starts with:', apiKey.substring(0, 11))
  console.log('   Has spaces?', apiKey.includes(' '))
  console.log('   Has quotes?', apiKey.includes('"') || apiKey.includes("'"))
  console.log('   Trimmed length:', apiKey.trim().length)
}

const anthropic = new Anthropic({
  apiKey: apiKey?.trim() || 'dummy-key-to-prevent-sdk-error',
})

// POST /api/chat - AI chat endpoint
export async function POST(request: NextRequest) {
  try {
    // Check API key first
    if (!apiKey) {
      console.error('❌ [CHAT API] Request blocked: No API key configured')
      return NextResponse.json({ 
        error: 'AI service not configured',
        details: 'API key is missing. Check .env.local for ANTHROPIC_API_KEY or CLAUDE_API_KEY'
      }, { status: 500 })
    }

    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user details for personalization
    // Try StaffUser first (with interests and profile!)
    let user = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      select: { 
        id: true, 
        name: true,
        email: true,
        companyId: true,
        staff_interests: true,  // Get all interests!
        staff_profiles: {
          select: {
            currentRole: true,
            daysEmployed: true,
            timezone: true,
            startDate: true,
            employmentStatus: true,
          }
        }
      },
    })

    let userType = 'STAFF'

    // If not staff, try ClientUser
    if (!user) {
      const clientUser = await prisma.client_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true, email: true, companyId: true },
      })
      if (clientUser) {
        user = clientUser as any
        userType = 'CLIENT'
      }
    }

    // If not client, try ManagementUser
    if (!user) {
      const managementUser = await prisma.management_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true, email: true },
      })
      if (managementUser) {
        user = managementUser as any
        userType = 'ADMIN'
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
      const docs = await prisma.documents.findMany({
        where: {
          id: { in: documentIds },
          // Only show APPROVED documents to staff, all to client/admin
          ...(userType === 'STAFF' ? { status: 'APPROVED' } : {}),
        },
        select: {
          title: true,
          category: true,
          content: true,
          status: true,
          uploadedByRole: true,
          uploadedBy: true,
        },
      })

      if (docs.length > 0) {
        documentContext = '\n\nREFERENCED DOCUMENTS:\n' + docs.map(doc => {
          const docType = doc.uploadedByRole === 'ADMIN' ? '📋 COMPANY POLICY' : 
                         doc.uploadedByRole === 'CLIENT' ? '📄 CLIENT PROCEDURE' : 
                         '📝 WORK DOCUMENT'
          return `\n---\n${docType}\nTitle: ${doc.title}\nCategory: ${doc.category}\nUploaded By: ${doc.uploadedBy}\n${doc.content || 'Content not available yet (file only)'}\n---`
        }).join('\n')
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

    // Build personalization context for STAFF users
    let personalizationContext = ''
    if (userType === 'STAFF' && (user as any).staff_interests) {
      const interests = (user as any).staff_interests
      const profile = (user as any).staff_profiles
      
      personalizationContext = `\n\nPERSONAL CONTEXT FOR ${firstName.toUpperCase()}:\n`
      
      // Interests
      if (interests.favoriteGame) personalizationContext += `- Loves gaming: ${interests.favoriteGame}\n`
      if (interests.hobby) personalizationContext += `- Hobby: ${interests.hobby}\n`
      if (interests.favoriteSport) personalizationContext += `- Sports: ${interests.favoriteSport}\n`
      if (interests.favoriteMusic) personalizationContext += `- Music taste: ${interests.favoriteMusic}\n`
      if (interests.favoriteMovie) personalizationContext += `- Favorite movie: ${interests.favoriteMovie}\n`
      if (interests.favoriteBook) personalizationContext += `- Favorite book: ${interests.favoriteBook}\n`
      if (interests.favoriteColor) personalizationContext += `- Favorite color: ${interests.favoriteColor}\n`
      if (interests.favoriteFastFood) personalizationContext += `- Food: ${interests.favoriteFastFood}\n`
      if (interests.dreamDestination) personalizationContext += `- Dream travel: ${interests.dreamDestination}\n`
      if (interests.funFact) personalizationContext += `- Fun fact: ${interests.funFact}\n`
      if (interests.favoriteQuote) personalizationContext += `- Favorite quote: "${interests.favoriteQuote}"\n`
      if (interests.petName) personalizationContext += `- Pet: ${interests.petName}\n`
      
      // Profile
      if (profile) {
        if (profile.currentRole) personalizationContext += `- Role: ${profile.currentRole}\n`
        if (profile.daysEmployed) personalizationContext += `- Days employed: ${profile.daysEmployed}\n`
        if (profile.timezone) personalizationContext += `- Timezone: ${profile.timezone}\n`
        if (profile.employmentStatus) personalizationContext += `- Status: ${profile.employmentStatus}\n`
        if (profile.startDate) {
          const startDate = new Date(profile.startDate)
          personalizationContext += `- Started: ${startDate.toLocaleDateString()}\n`
        }
      }
      
      personalizationContext += `\nUSE THIS INFO to make conversations more personal and relatable! Reference their interests when appropriate (e.g., "I know you love ${interests.favoriteGame}, this task is like leveling up!"). Keep it natural and authentic.\n`
    }

    // System prompt for BPO training assistant
    const systemPrompt = `You are a friendly AI assistant helping ${firstName} with their BPO work. You're here to help them understand training materials, manage tasks, and bring more value to their clients.

IMPORTANT: Always greet ${firstName} by their first name when starting your responses (e.g., "Hi ${firstName}," or "Hey ${firstName},").${personalizationContext}

RESPONSE STYLE:
- Write naturally and conversationally, like a helpful colleague
- Keep responses concise and easy to scan
- Use simple paragraphs and occasional bullet points when listing things
- Avoid heavy marketing language or excessive enthusiasm
- Be warm but professional

DOCUMENT TYPES:
- 📋 COMPANY POLICY: HR policies, leave policies, SOPs uploaded by Admin (accessible to all staff)
- 📄 CLIENT PROCEDURE: Client-specific processes uploaded by clients (only for their staff)
- 📝 WORK DOCUMENT: Staff work samples, drafts (needs client approval before being used)

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
    console.log('🤖 [CHAT API] Calling Claude...')
    console.log('   System prompt length:', systemPrompt.length)
    console.log('   Messages:', messages.length)
    console.log('   Model:', process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022')
    
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      timeout: 60000, // 60 second timeout
    })
    
    console.log('✅ [CHAT API] Claude response received')

    const assistantMessage = response.content[0].type === 'text' 
      ? response.content[0].text 
      : ''

    return NextResponse.json({ 
      message: assistantMessage,
      sources: documentIds || [],
    })
  } catch (error) {
    console.error('❌ [CHAT API] Error:', error)
    console.error('❌ [CHAT API] Error details:', JSON.stringify(error, null, 2))
    
    // Check if it's an Anthropic API error
    if (error instanceof Error) {
      console.error('❌ [CHAT API] Error message:', error.message)
      console.error('❌ [CHAT API] Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}










