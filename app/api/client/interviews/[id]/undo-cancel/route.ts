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
    const body = await request.json().catch(() => ({}))
    const { notes } = body

    console.log(`🔄 [CLIENT] Undoing cancellation for interview ${id}`)

    // Fetch existing interview
    const existing = await prisma.interview_requests.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Verify it's currently cancelled
    if (existing.status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Interview is not cancelled' }, { status: 400 })
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

    // Append undo cancellation note to client notes with timestamp
    const timestamp = new Date().toLocaleString('en-US')
    const trimmedNotes = notes ? notes.trim() : ''
    const existingNotes = existing.clientNotes?.trim() || ''
    
    // Create undo note with optional custom notes
    const undoNote = trimmedNotes 
      ? `[${timestamp}] Reopening Reason: ${trimmedNotes}` 
      : `[${timestamp}] Cancellation undone - Interview reopened by client`
    const updatedClientNotes = existingNotes 
      ? `${existingNotes}\n\n${undoNote}` 
      : undoNote

    // Update interview status back to PENDING and add note
    const interview = await prisma.interview_requests.update({
      where: { id },
      data: {
        status: 'PENDING',
        clientNotes: updatedClientNotes,
        updatedAt: new Date()
      }
    })

    console.log(`✅ [CLIENT] Interview cancellation undone: ${id}`)

    return NextResponse.json({ 
      success: true, 
      interview 
    })
  } catch (error) {
    console.error('❌ [CLIENT] Error undoing cancellation:', error)
    return NextResponse.json(
      { error: 'Failed to undo cancellation' },
      { status: 500 }
    )
  }
}

