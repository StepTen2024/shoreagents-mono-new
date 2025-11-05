/**
 * Admin Recruitment - Send Job Offer API
 * POST /api/admin/recruitment/interviews/hire
 * 
 * Admin sends job offer to candidate (does NOT immediately hire)
 * Sets status to OFFER_SENT and waits for candidate acceptance
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Verify admin is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin/manager
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    // Allow both ADMIN and MANAGER roles
    if (!managementUser || (managementUser.role !== 'ADMIN' && managementUser.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Access denied. Admin or Manager role required.' }, { status: 403 })
    }

    const body = await request.json()
    const {
      interviewRequestId,
      position,
      companyId,
      candidateEmail,
      candidatePhone,
      bpocCandidateId,
      clientPreferredStart, // Optional: client's preferred start date
      // New comprehensive offer details
      salary,
      shiftType,
      workLocation,
      hmoIncluded,
      leaveCredits,
      clientTimezone,
      workHours,
      // Work schedule data from client
      workSchedule
    } = body

    // Validation
    if (!interviewRequestId) {
      return NextResponse.json({ error: 'Interview request ID is required' }, { status: 400 })
    }

    if (!position) {
      return NextResponse.json({ error: 'Position is required' }, { status: 400 })
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    if (!candidateEmail) {
      return NextResponse.json({ error: 'Candidate email is required' }, { status: 400 })
    }

    if (!bpocCandidateId) {
      return NextResponse.json({ error: 'BPOC candidate ID is required' }, { status: 400 })
    }

    console.log(`📧 [ADMIN] Sending job offer to candidate for position: ${position}`)

    // Check if interview request exists
    const interviewRequest = await prisma.interview_requests.findUnique({
      where: { id: interviewRequestId },
      include: {
        client_users: {
          include: {
            company: true
          }
        }
      }
    })

    if (!interviewRequest) {
      return NextResponse.json({ error: 'Interview request not found' }, { status: 404 })
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check if already has a job acceptance (offer sent)
    const existingJobAcceptance = await prisma.job_acceptances.findUnique({
      where: { interviewRequestId }
    })

    if (existingJobAcceptance) {
      return NextResponse.json({ error: 'Job offer has already been sent to this candidate' }, { status: 400 })
    }

    // Add offer sent note to admin notes
    const timestamp = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    })
    const existingAdminNotes = interviewRequest.adminNotes?.trim() || ''
    const offerNote = `(Offer Sent) ${timestamp} - Job offer sent to candidate for ${position} position`
    const updatedAdminNotes = existingAdminNotes 
      ? `${existingAdminNotes}\n\n${offerNote}` 
      : offerNote

    // Update interview request status to OFFER_SENT
    await prisma.interview_requests.update({
      where: { id: interviewRequestId },
      data: {
        status: 'OFFER_SENT',
        hireRequestedBy: 'admin',
        hireRequestedAt: new Date(),
        offerSentAt: new Date(),
        clientPreferredStart: clientPreferredStart ? new Date(clientPreferredStart) : null,
        adminNotes: updatedAdminNotes,
        updatedAt: new Date()
      }
    })

    // Parse work schedule from client's hire request
    let workDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    let workStartTime = "09:00"
    let workEndTime = "18:00"
    let scheduleTimezone = clientTimezone || "UTC"
    let isDefaultSchedule = true

    if (workSchedule) {
      workDays = workSchedule.workDays || workDays
      workStartTime = workSchedule.workStartTime || workStartTime
      isDefaultSchedule = workSchedule.isMonToFri !== false
      scheduleTimezone = workSchedule.clientTimezone || scheduleTimezone
      
      // Calculate end time (start + 9 hours)
      const [startHour, startMinute] = workStartTime.split(':').map(Number)
      const endHour = (startHour + 9) % 24
      workEndTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`
      
      console.log(`📅 [ADMIN] Work schedule from client:`, {
        workDays,
        workStartTime,
        workEndTime,
        scheduleTimezone,
        isDefaultSchedule
      })
    }

    // Create job acceptance record (pending candidate acceptance)
    const jobAcceptance = await prisma.job_acceptances.create({
      data: {
        id: crypto.randomUUID(),
        interviewRequestId,
        bpocCandidateId,
        candidateEmail,
        candidatePhone: candidatePhone || null,
        position,
        companyId,
        acceptedByAdminId: managementUser.id,
        workDays,
        workStartTime,
        workEndTime,
        clientTimezone: scheduleTimezone,
        isDefaultSchedule,
        updatedAt: new Date()
      }
    })

    console.log(`✅ [ADMIN] Job offer sent: ${jobAcceptance.id}`)

    // Prepare comprehensive offer details
    const offerDetails = {
      position,
      companyName: company.companyName,
      salary: salary || 'TBD',
      shiftType: shiftType || 'DAY_SHIFT',
      workLocation: workLocation || 'WORK_FROM_HOME',
      hmoIncluded: hmoIncluded || false,
      leaveCredits: leaveCredits || 12,
      clientTimezone: clientTimezone || 'UTC',
      workHours: workHours || '9 hours (includes 1 hour break, 15 min either side)',
      preferredStartDate: clientPreferredStart || 'To be negotiated'
    }

    console.log('📋 [ADMIN] Offer Details:', offerDetails)

    // Generate offer acceptance link (not signup yet!)
    const offerLink = `${process.env.NEXT_PUBLIC_APP_URL}/offer/accept?jobId=${jobAcceptance.id}`
    console.log(`📧 [ADMIN] Offer acceptance link (email to be sent): ${offerLink}`)

    // TODO: Send email to candidate with comprehensive offer details and acceptance link
    // Email will include:
    // - Position & Company details
    // - Salary: ${offerDetails.salary} PHP/month
    // - Shift Type: ${offerDetails.shiftType}
    // - Work Location: ${offerDetails.workLocation}
    // - HMO: ${offerDetails.hmoIncluded ? 'Included from Day 1 🎉' : 'After regularization'}
    // - Leave Credits: ${offerDetails.leaveCredits} days/year
    // - Work Hours: ${offerDetails.workHours} aligned with ${offerDetails.clientTimezone}
    // - Preferred Start: ${offerDetails.preferredStartDate}
    // - Accept/Decline buttons

    // Log activity
    console.log(`🎉 [ADMIN] Job offer sent for ${position} at ${company.companyName}`)
    console.log(`💰 Salary: ₱${salary}/month | 🏥 HMO: ${hmoIncluded ? 'Day 1' : 'Post-regularization'} | 🏖️ Leave: ${leaveCredits} days`)

    return NextResponse.json({
      success: true,
      message: 'Job offer sent to candidate. Waiting for their response.',
      jobAcceptance,
      offerDetails, // Include all offer details in response
      offerLink, // Return this for now until email is implemented
      nextSteps: 'Candidate will receive an email to accept or decline the offer. Once accepted, you can finalize the start date and they will be able to create their account.'
    })
  } catch (error) {
    console.error('❌ [ADMIN] Error sending job offer:', error)
    return NextResponse.json(
      { error: 'Failed to send job offer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
