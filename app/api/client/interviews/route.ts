import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCandidateById } from '@/lib/bpoc-db'

/**
 * GET /api/client/interviews
 * Fetch all interview requests for the authenticated client
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate client user
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get client user record
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!clientUser) {
      return NextResponse.json({ error: 'Client user not found' }, { status: 404 })
    }

    // 3. Fetch all interview requests from this client
    const interviewRequests = await prisma.interview_requests.findMany({
      where: {
        clientUserId: clientUser.id
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // 4. Enrich with candidate data (avatar) from BPOC database
    const enrichedInterviews = await Promise.all(
      interviewRequests.map(async (interview) => {
        try {
          const candidate = await getCandidateById(interview.bpocCandidateId)
          console.log(`🖼️ Candidate ${interview.bpocCandidateId} avatar_url:`, candidate?.avatar_url)
          return {
            ...interview,
            candidateAvatar: candidate?.avatar_url || null
          }
        } catch (error) {
          console.error(`❌ Failed to fetch candidate ${interview.bpocCandidateId}:`, error)
          return {
            ...interview,
            candidateAvatar: null
          }
        }
      })
    )
    
    console.log(`📋 [CLIENT] Sample interview with avatar:`, enrichedInterviews[0]?.candidateAvatar)

    console.log(`📋 [CLIENT] Fetched ${enrichedInterviews.length} interview requests for client ${clientUser.id}`)

    return NextResponse.json({
      success: true,
      interviews: enrichedInterviews
    })

  } catch (error) {
    console.error('❌ Error fetching interview requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interview requests' },
      { status: 500 }
    )
  }
}

