/**
 * Client Single Candidate API
 * GET /api/client/candidates/[id]
 * 
 * Fetch full anonymized profile for a specific candidate
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCandidateById } from '@/lib/bpoc-db'
import { anonymizeCandidateForProfile } from '@/lib/anonymize-candidate'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const candidateId = id

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID required' }, { status: 400 })
    }

    console.log(`🔍 Fetching candidate profile: ${candidateId}`)

    // Fetch candidate from BPOC database
    const candidate = await getCandidateById(candidateId)

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Anonymize candidate (remove personal details)
    const anonymizedCandidate = anonymizeCandidateForProfile(candidate)

    console.log(`✅ Fetched candidate: ${anonymizedCandidate.firstName}`)

    return NextResponse.json({
      success: true,
      candidate: anonymizedCandidate,
    })
  } catch (error) {
    console.error('❌ Error fetching candidate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidate', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}





