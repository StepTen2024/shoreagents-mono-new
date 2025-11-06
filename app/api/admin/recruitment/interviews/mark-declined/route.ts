/**
 * Admin Recruitment - Mark Offer as Declined API
 * POST /api/admin/recruitment/interviews/mark-declined
 * 
 * Updates interview status from OFFER_SENT to OFFER_DECLINED when candidate declines
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verify admin is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin/manager
    const userRole = session.user.role?.toUpperCase()
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    const body = await request.json()
    const { interviewRequestId, declineReason } = body

    // Validation
    if (!interviewRequestId) {
      return NextResponse.json({ error: 'Interview request ID is required' }, { status: 400 })
    }

    if (!declineReason) {
      return NextResponse.json({ error: 'Decline reason is required' }, { status: 400 })
    }

    console.log('❌ [ADMIN] Marking offer as declined for interview:', interviewRequestId)

    // Get interview request
    const interview = await prisma.interview_requests.findUnique({
      where: { id: interviewRequestId }
    })

    if (!interview) {
      return NextResponse.json({ error: 'Interview request not found' }, { status: 404 })
    }

    // Check if interview is in OFFER_SENT status
    if (interview.status !== 'OFFER_SENT') {
      return NextResponse.json({ 
        error: `Interview must be in OFFER_SENT status. Current status: ${interview.status}` 
      }, { status: 400 })
    }

    // Format timestamp consistently with other status changes
    const timestamp = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    })
    const existingAdminNotes = interview.adminNotes?.trim() || ''
    const trimmedReason = declineReason.trim()
    const declineNote = `(Offer Declined) ${timestamp} - ${trimmedReason}`
    const updatedAdminNotes = existingAdminNotes 
      ? `${existingAdminNotes}\n\n${declineNote}` 
      : declineNote

    // Update interview request status to OFFER_DECLINED
    const updatedInterview = await prisma.interview_requests.update({
      where: { id: interviewRequestId },
      data: {
        status: 'OFFER_DECLINED',
        adminNotes: updatedAdminNotes,
        updatedAt: new Date()
      }
    })

    console.log('❌ [ADMIN] Offer marked as declined')

    return NextResponse.json({
      success: true,
      message: 'Offer marked as declined',
      interview: updatedInterview,
      note: 'You can now close this interview request or search for another candidate.'
    })

  } catch (error: any) {
    console.error('❌ [ADMIN] Error marking offer as declined:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to mark offer as declined' 
    }, { status: 500 })
  }
}
