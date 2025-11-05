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
    let reason = ''
    try {
      const body = await request.json()
      reason = body.reason || ''
    } catch {
      // No body or invalid JSON - that's okay, reason will be empty
    }

    console.log(`🚫 Cancelling interview ${id}`)

    // Fetch existing interview to get current notes
    const existing = await prisma.interview_requests.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Add cancellation note to admin notes
    const timestamp = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    })
    const existingAdminNotes = existing.adminNotes?.trim() || ''
    const trimmedReason = reason ? reason.trim() : ''
    const cancellationNote = trimmedReason 
      ? `(Cancelled) ${timestamp} - ${trimmedReason}` 
      : `(Cancelled) ${timestamp} - Interview cancelled by admin`
    const updatedAdminNotes = existingAdminNotes 
      ? `${existingAdminNotes}\n\n${cancellationNote}` 
      : cancellationNote

    // Update interview status to CANCELLED and add note
    const interview = await prisma.interview_requests.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        adminNotes: updatedAdminNotes,
        updatedAt: new Date()
      }
    })

    console.log(`✅ Interview cancelled: ${id}`)

    return NextResponse.json({ 
      success: true, 
      interview 
    })
  } catch (error) {
    console.error('❌ Error cancelling interview:', error)
    return NextResponse.json(
      { error: 'Failed to cancel interview' },
      { status: 500 }
    )
  }
}



