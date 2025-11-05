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
    const { reason } = body

    console.log(`🚫 [CLIENT] Cancelling interview ${id}`)

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

    // Update interview status to CANCELLED and append cancellation reason to client notes
    const timestamp = new Date().toLocaleString('en-US')
    const trimmedReason = reason ? reason.trim() : ''
    const existingNotes = existing.clientNotes?.trim() || ''
    
    // Append cancellation note with timestamp to existing notes
    const cancellationNote = trimmedReason 
      ? `(Cancelled) ${timestamp} - ${trimmedReason}` 
      : `(Cancelled) ${timestamp} - Interview cancelled by client`
    const updatedClientNotes = existingNotes 
      ? `${existingNotes}\n\n${cancellationNote}` 
      : cancellationNote
    
    const interview = await prisma.interview_requests.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        clientNotes: updatedClientNotes,
        updatedAt: new Date()
      }
    })

    console.log(`✅ [CLIENT] Interview cancelled: ${id}`)

    return NextResponse.json({ 
      success: true, 
      interview 
    })
  } catch (error) {
    console.error('❌ [CLIENT] Error cancelling interview:', error)
    return NextResponse.json(
      { error: 'Failed to cancel interview' },
      { status: 500 }
    )
  }
}



