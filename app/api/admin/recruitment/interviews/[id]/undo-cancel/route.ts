import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { notes } = body

    console.log(`🔄 [ADMIN] Undoing cancellation for interview ${id}`)

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

    // Append undo cancellation note to admin notes with timestamp
    const timestamp = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    })
    const trimmedNotes = notes ? notes.trim() : ''
    const existingNotes = existing.adminNotes?.trim() || ''
    
    // Create undo note with optional custom notes
    const undoNote = trimmedNotes 
      ? `(Reopened) ${timestamp} - ${trimmedNotes}` 
      : `(Reopened) ${timestamp} - Cancellation undone, interview request reopened by admin`
    const updatedAdminNotes = existingNotes 
      ? `${existingNotes}\n\n${undoNote}` 
      : undoNote

    // Update interview status back to PENDING and add note
    const interview = await prisma.interview_requests.update({
      where: { id },
      data: {
        status: 'PENDING',
        adminNotes: updatedAdminNotes,
        updatedAt: new Date()
      }
    })

    console.log(`✅ [ADMIN] Interview cancellation undone: ${id}`)

    return NextResponse.json({ 
      success: true, 
      interview 
    })
  } catch (error) {
    console.error('❌ [ADMIN] Error undoing cancellation:', error)
    return NextResponse.json(
      { error: 'Failed to undo cancellation' },
      { status: 500 }
    )
  }
}



