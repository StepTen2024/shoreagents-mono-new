/**
 * Client Hire Request API
 * POST /api/client/interviews/hire-request
 * 
 * Allows client to request to hire a candidate
 * This triggers a notification to admin who then processes the hire
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verify client is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get client user
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        company: true
      }
    })

    if (!clientUser) {
      return NextResponse.json({ error: 'Client user not found' }, { status: 404 })
    }

    const body = await request.json()
    const { interviewRequestId, preferredStartDate, notes, workSchedule } = body

    // Validation
    if (!interviewRequestId) {
      return NextResponse.json({ error: 'Interview request ID is required' }, { status: 400 })
    }

    console.log(`🎯 [CLIENT] ${clientUser.name} requesting to hire candidate`)

    // Check if interview request exists and belongs to this client
    const interviewRequest = await prisma.interview_requests.findUnique({
      where: { id: interviewRequestId }
    })

    if (!interviewRequest) {
      return NextResponse.json({ error: 'Interview request not found' }, { status: 404 })
    }

    if (interviewRequest.clientUserId !== clientUser.id) {
      return NextResponse.json({ error: 'This interview request does not belong to you' }, { status: 403 })
    }

    // Check if already requested/hired
    if (interviewRequest.status === 'HIRE_REQUESTED' || 
        interviewRequest.status === 'OFFER_SENT' ||
        interviewRequest.status === 'OFFER_ACCEPTED' ||
        interviewRequest.status === 'HIRED') {
      return NextResponse.json({ 
        error: 'Hire process already initiated for this candidate',
        currentStatus: interviewRequest.status
      }, { status: 400 })
    }

    // Append hire request notes to existing client notes
    const existingNotes = interviewRequest.clientNotes?.trim() || ''
    const updatedClientNotes = notes 
      ? (existingNotes ? `${existingNotes}\n\n${notes}` : notes)
      : existingNotes

    // Update interview request status to HIRE_REQUESTED
    await prisma.interview_requests.update({
      where: { id: interviewRequestId },
      data: {
        status: 'HIRE_REQUESTED',
        hireRequestedBy: 'client',
        hireRequestedAt: new Date(),
        clientPreferredStart: preferredStartDate ? new Date(preferredStartDate) : null,
        clientNotes: updatedClientNotes,
        workSchedule: workSchedule || null,
        updatedAt: new Date()
      }
    })

    console.log(`📅 [CLIENT] Work schedule saved:`, workSchedule)

    console.log(`✅ [CLIENT] Hire request submitted for ${interviewRequest.candidateFirstName}`)

    // TODO: Send notification to admin
    // Notification should include:
    // - Client name and company
    // - Candidate name
    // - Preferred start date
    // - Any additional notes

    return NextResponse.json({
      success: true,
      message: 'Hire request submitted successfully',
      nextSteps: 'Admin will contact the candidate and send a job offer. You will be notified when the candidate responds.',
      candidateName: interviewRequest.candidateFirstName,
      preferredStartDate
    })
  } catch (error) {
    console.error('❌ [CLIENT] Error requesting hire:', error)
    return NextResponse.json(
      { error: 'Failed to submit hire request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

