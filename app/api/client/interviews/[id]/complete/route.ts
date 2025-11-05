import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { notes } = body

    console.log(`✅ [CLIENT] Marking interview ${id} as completed`)

    // Fetch existing interview
    const existing = await prisma.interview_requests.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Fetch the client user who created the interview and the current session user
    const [interviewCreator, sessionClientUser] = await Promise.all([
      prisma.client_users.findUnique({
        where: { id: existing.clientUserId },
        select: { companyId: true }
      }),
      prisma.client_users.findUnique({
        where: { authUserId: session.user.id },
        select: { companyId: true }
      })
    ])

    if (!interviewCreator || !sessionClientUser) {
      console.log(`❌ Client user not found`)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure client belongs to the same company as the interview creator
    if (interviewCreator.companyId !== sessionClientUser.companyId) {
      console.log(`❌ Authorization failed: Different companies`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update interview status to COMPLETED and add feedback to client notes
    // Always add a completion note with optional feedback
    const timestamp = new Date().toLocaleString()
    const trimmedNotes = notes ? notes.trim() : ''
    const existingNotes = existing.clientNotes?.trim() || ''
    
    // Create feedback note with default message if no feedback provided
    const feedbackNote = trimmedNotes
      ? `(Feedback) ${timestamp} - ${trimmedNotes}`
      : `(Feedback) ${timestamp} - Interview completed by client`
    
    const updatedClientNotes = existingNotes 
      ? `${existingNotes}\n\n${feedbackNote}` 
      : feedbackNote

    const updateData: any = {
      status: 'COMPLETED',
      clientNotes: updatedClientNotes,
      updatedAt: new Date()
    }

    const interview = await prisma.interview_requests.update({
      where: { id },
      data: updateData
    })

    console.log(`✅ [CLIENT] Interview marked as completed: ${id}`)

    return NextResponse.json({ 
      success: true, 
      interview 
    })
  } catch (error) {
    console.error('❌ [CLIENT] Error marking interview as completed:', error)
    return NextResponse.json(
      { error: 'Failed to mark interview as completed' },
      { status: 500 }
    )
  }
}



