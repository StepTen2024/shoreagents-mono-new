/**
 * Schedule Interview API
 * PATCH /api/admin/recruitment/interviews/[id]/schedule
 * 
 * Admin schedules an interview (sets time, meeting link, notes)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params
    
    // Verify admin is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is an admin
    if (session.user.role?.toUpperCase() !== 'ADMIN' && session.user.role?.toUpperCase() !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    const body = await request.json()
    const { scheduledTime, meetingLink, adminNotes } = body

    // Validation
    if (!scheduledTime) {
      return NextResponse.json({ error: 'Scheduled time is required' }, { status: 400 })
    }

    // Convert scheduledTime string to Date
    const scheduledDate = new Date(scheduledTime)
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduled time format' }, { status: 400 })
    }

    console.log(`📅 Scheduling interview ${id} for ${scheduledDate.toISOString()}`)

    // Fetch existing interview to append notes
    const existing = await prisma.interview_requests.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Append admin notes with timestamp if provided
    let updatedAdminNotes = existing.adminNotes
    if (adminNotes && adminNotes.trim()) {
      const timestamp = new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
      })
      const trimmedNotes = adminNotes.trim()
      const existingAdminNotes = existing.adminNotes?.trim() || ''
      const newNote = existingAdminNotes ? `\n\n(Scheduled) ${timestamp} - ${trimmedNotes}` : `(Scheduled) ${timestamp} - ${trimmedNotes}`
      updatedAdminNotes = existingAdminNotes + newNote
    }

    // Update interview request
    const updatedInterview = await prisma.interview_requests.update({
      where: { id },
      data: {
        scheduledTime: scheduledDate,
        meetingLink: meetingLink || null,
        adminNotes: updatedAdminNotes,
        status: 'SCHEDULED', // Change status from PENDING to SCHEDULED
        updatedAt: new Date()
      }
    })

    console.log(`✅ Interview scheduled successfully:`, updatedInterview.id)

    return NextResponse.json({
      success: true,
      message: 'Interview scheduled successfully',
      interview: updatedInterview,
    })
  } catch (error) {
    console.error('❌ Error scheduling interview:', error)
    return NextResponse.json(
      { error: 'Failed to schedule interview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

