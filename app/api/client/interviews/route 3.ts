import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        createdAt: 'desc'
      }
    })

    console.log(`📋 [CLIENT] Fetched ${interviewRequests.length} interview requests for client ${clientUser.id}`)

    return NextResponse.json({
      success: true,
      interviews: interviewRequests
    })

  } catch (error) {
    console.error('❌ Error fetching interview requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interview requests' },
      { status: 500 }
    )
  }
}

