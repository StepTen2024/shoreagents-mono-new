/**
 * Interview Request API
 * POST /api/client/interviews/request
 * 
 * Client requests an interview with a candidate
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCandidateById } from '@/lib/bpoc-db'

export async function POST(request: NextRequest) {
  try {
    // Verify client is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a client
    if (session.user.role?.toUpperCase() !== 'CLIENT') {
      return NextResponse.json({ error: 'Access denied. Client role required.' }, { status: 403 })
    }

    const body = await request.json()
    const { bpoc_candidate_id, preferred_times, client_notes, client_timezone } = body

    // Validation
    if (!bpoc_candidate_id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 })
    }

    if (!preferred_times || !Array.isArray(preferred_times) || preferred_times.length === 0) {
      return NextResponse.json({ error: 'At least one preferred time is required' }, { status: 400 })
    }

    console.log(`📅 Interview request from client ${session.user.id} for candidate ${bpoc_candidate_id}`)
    console.log(`🌍 Client timezone: ${client_timezone || 'Not provided'}`)

    // Get the client user record (session.user.id is authUserId, we need clientUser.id)
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!clientUser) {
      return NextResponse.json({ error: 'Client user not found' }, { status: 404 })
    }

    // Verify candidate exists in BPOC database
    const candidate = await getCandidateById(bpoc_candidate_id)
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Create interview request using Prisma ORM (handles column mapping automatically)
    const interviewRequest = await prisma.interview_requests.create({
      data: {
        id: crypto.randomUUID(),
        clientUserId: clientUser.id,  // Use clientUser.id, not session.user.id!
        bpocCandidateId: bpoc_candidate_id,
        candidateFirstName: candidate.first_name || 'Unknown',
        preferredTimes: preferred_times,
        clientNotes: client_notes || null,
        clientTimezone: client_timezone || null,
        status: 'PENDING',
        updatedAt: new Date()
      }
    })

    console.log(`✅ Interview request created successfully:`, interviewRequest.id)

    return NextResponse.json({
      success: true,
      message: 'Interview request submitted successfully',
      request: interviewRequest,
    })
  } catch (error) {
    console.error('❌ Error creating interview request:', error)
    return NextResponse.json(
      { error: 'Failed to create interview request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}





