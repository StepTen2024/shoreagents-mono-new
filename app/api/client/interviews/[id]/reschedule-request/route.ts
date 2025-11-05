import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
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
    const { notes, preferred_times } = body

    console.log(`📅 [CLIENT] Reschedule request for interview ${id}`)
    console.log(`🔑 Session user ID: ${session.user.id}`)

    // Fetch existing interview
    const existing = await prisma.interview_requests.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    console.log(`🔑 Interview clientUserId: ${existing.clientUserId}`)

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

    console.log(`✅ Authorization successful: Same company (${sessionClientUser.companyId})`)

    // Prepare update data
    const timestamp = new Date().toLocaleString('en-US')
    const trimmedNotes = notes ? notes.trim() : ''
    const existingClientNotes = existing.clientNotes?.trim() || ''
    const rescheduleNote = trimmedNotes 
      ? (existingClientNotes ? `\n\n(Reschedule Request) ${timestamp} - ${trimmedNotes}` : `(Reschedule Request) ${timestamp} - ${trimmedNotes}`)
      : (existingClientNotes ? `\n\n(Reschedule Request) ${timestamp} - New preferred times provided` : `(Reschedule Request) ${timestamp} - New preferred times provided`)
    const updatedClientNotes = existingClientNotes + rescheduleNote

    // Update interview with reschedule request in client notes and optionally update preferred times
    const updateData: any = {
      clientNotes: updatedClientNotes,
      status: 'RESCHEDULE_REQUESTED',
      updatedAt: new Date()
    }

    // If new preferred times are provided, update them
    if (preferred_times && Array.isArray(preferred_times) && preferred_times.length > 0) {
      updateData.preferredTimes = preferred_times
    }

    const interview = await prisma.interview_requests.update({
      where: { 
        id
      },
      data: updateData
    })

    console.log(`✅ [CLIENT] Reschedule request sent: ${id}`)

    return NextResponse.json({ 
      success: true, 
      interview 
    })
  } catch (error) {
    console.error('❌ [CLIENT] Error sending reschedule request:', error)
    return NextResponse.json(
      { error: 'Failed to send reschedule request' },
      { status: 500 }
    )
  }
}



