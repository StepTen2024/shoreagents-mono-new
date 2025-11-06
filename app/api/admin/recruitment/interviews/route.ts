/**
 * Admin Recruitment - Interview Requests API
 * GET /api/admin/recruitment/interviews
 * 
 * Fetch all interview requests from database for admin view
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCandidateById } from '@/lib/bpoc-db'

export async function GET(request: NextRequest) {
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

    console.log('🔍 [ADMIN] Fetching all interview requests')

    // Fetch ALL interview requests with client user info using Prisma ORM
    const interviews = await prisma.interview_requests.findMany({
      include: {
        client_users: {
          include: {
            company: true,
            client_profiles: true // ✅ Include client profile to get timezone
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Fetch candidate data from BPOC for each interview
    const formattedInterviews = await Promise.all(interviews.map(async (interview) => {
      let candidateData = null
      try {
        // Fetch candidate from BPOC database
        candidateData = await getCandidateById(interview.bpocCandidateId)
        console.log(`📧 Candidate data for ${interview.candidateFirstName}:`, {
          email: candidateData?.email,
          phone: candidateData?.phone,
          position: candidateData?.position,
          location: candidateData?.location_city
        })
      } catch (error) {
        console.warn(`⚠️ Could not fetch candidate ${interview.bpocCandidateId} from BPOC:`, error)
      }

      return {
        ...interview,
        status: interview.status.toLowerCase().replace('_', '-'), // Normalize: OFFER_SENT → offer-sent
        client_name: interview.client_users?.name || 'Unknown',
        client_email: interview.client_users?.email || 'Unknown',
        client_phone: interview.client_users?.client_profiles?.mobilePhone || interview.client_users?.client_profiles?.directPhone || null,
        client_address: interview.client_users?.company?.location || null,
        company_name: interview.client_users?.company?.companyName || 'Unknown',
        // Add candidate data from BPOC
        candidate_avatar_url: candidateData?.avatar_url || null,
        candidate_position: candidateData?.position || null,
        candidate_location: candidateData ? `${candidateData.location_city}, ${candidateData.location_country}` : null,
        candidate_email: candidateData?.email || null,
        candidate_phone: candidateData?.phone || null,
      }
    }))

    console.log(`✅ [ADMIN] Found ${interviews.length} interview requests`)
    console.log(`📊 [ADMIN] Interview statuses:`, formattedInterviews.map(i => ({ name: i.candidateFirstName, status: i.status })))
    console.log(`🕒 [ADMIN] Sample preferredTimes:`, formattedInterviews[0]?.preferredTimes)
    console.log(`🌍 [ADMIN] Sample client timezone:`, formattedInterviews[0]?.client_users?.client_profiles?.timezone)
    console.log(`📅 [ADMIN] Sample workSchedule:`, formattedInterviews[0]?.workSchedule)

    return NextResponse.json({
      success: true,
      interviews: formattedInterviews,
      count: formattedInterviews.length,
    })
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching interview requests:', error)
    
    // If table doesn't exist, return empty array
    if (error instanceof Error && error.message.includes('relation "interview_requests" does not exist')) {
      console.log('⚠️ [ADMIN] interview_requests table does not exist, returning empty array')
      return NextResponse.json({
        success: true,
        interviews: [],
        count: 0,
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch interview requests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

