/**
 * Candidate Offer Response API
 * POST /api/offer/respond
 * 
 * Allows candidate to accept or decline a job offer
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobAcceptanceId, action, declineReason, proposedStartDate } = body

    // Validation
    if (!jobAcceptanceId) {
      return NextResponse.json({ error: 'Job acceptance ID is required' }, { status: 400 })
    }

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Action must be either "accept" or "decline"' }, { status: 400 })
    }

    if (action === 'decline' && !declineReason) {
      return NextResponse.json({ error: 'Decline reason is required when declining an offer' }, { status: 400 })
    }

    console.log(`📝 [OFFER] Candidate ${action}ing offer: ${jobAcceptanceId}`)

    // Find the job acceptance and interview request
    const jobAcceptance = await prisma.job_acceptances.findUnique({
      where: { id: jobAcceptanceId },
      include: {
        interview_requests: {
          include: {
            client_users: {
              include: {
                company: true
              }
            }
          }
        },
        company: true
      }
    })

    if (!jobAcceptance) {
      return NextResponse.json({ error: 'Job offer not found' }, { status: 404 })
    }

    // Check if already responded
    const currentStatus = jobAcceptance.interview_requests?.status
    if (currentStatus === 'OFFER_ACCEPTED' || currentStatus === 'OFFER_DECLINED') {
      return NextResponse.json({ 
        error: 'This offer has already been responded to',
        status: currentStatus
      }, { status: 400 })
    }

    if (action === 'accept') {
      // ACCEPT OFFER
      await prisma.interview_requests.update({
        where: { id: jobAcceptance.interviewRequestId },
        data: {
          status: 'OFFER_ACCEPTED',
          offerResponseAt: new Date(),
          finalStartDate: proposedStartDate ? new Date(proposedStartDate) : null,
          updatedAt: new Date()
        }
      })

      console.log(`✅ [OFFER] Candidate accepted offer for ${jobAcceptance.position}`)

      // TODO: Send notifications to admin and client
      // TODO: Send signup link email to candidate

      const signupLink = `${process.env.NEXT_PUBLIC_APP_URL}/login/staff/signup?jobAcceptanceId=${jobAcceptance.id}`

      return NextResponse.json({
        success: true,
        action: 'accepted',
        message: 'Congratulations! You have accepted the job offer.',
        nextSteps: 'You will receive an email shortly with instructions to create your account and complete onboarding.',
        signupLink,
        company: jobAcceptance.company.companyName,
        position: jobAcceptance.position
      })

    } else {
      // DECLINE OFFER
      // Get existing interview to append notes
      const interview = await prisma.interview_requests.findUnique({
        where: { id: jobAcceptance.interviewRequestId }
      })

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
      const existingAdminNotes = interview?.adminNotes?.trim() || ''
      const trimmedReason = declineReason.trim()
      const declineNote = `(Offer Declined) ${timestamp} - ${trimmedReason}`
      const updatedAdminNotes = existingAdminNotes 
        ? `${existingAdminNotes}\n\n${declineNote}` 
        : declineNote

      await prisma.interview_requests.update({
        where: { id: jobAcceptance.interviewRequestId },
        data: {
          status: 'OFFER_DECLINED',
          offerResponseAt: new Date(),
          offerDeclineReason: declineReason,
          adminNotes: updatedAdminNotes,
          updatedAt: new Date()
        }
      })

      console.log(`❌ [OFFER] Candidate declined offer for ${jobAcceptance.position}. Reason: ${declineReason}`)

      // TODO: Send notification to admin and client

      return NextResponse.json({
        success: true,
        action: 'declined',
        message: 'We appreciate you taking the time to consider our offer.',
        feedback: 'Your feedback has been recorded and will help us improve.'
      })
    }

  } catch (error) {
    console.error('❌ [OFFER] Error processing offer response:', error)
    return NextResponse.json(
      { error: 'Failed to process offer response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

