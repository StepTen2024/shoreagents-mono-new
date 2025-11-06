/**
 * Client Candidates API
 * GET /api/client/candidates
 * 
 * Fetch anonymized candidate profiles from BPOC database
 * Supports advanced filtering by skills, location, experience, DISC type, cultural fit
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCandidates } from '@/lib/bpoc-db'
import { anonymizeCandidateForList } from '@/lib/anonymize-candidate'

export async function GET(request: NextRequest) {
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

    // Parse query parameters for filters
    const { searchParams } = new URL(request.url)
    
    const filters = {
      skills: searchParams.get('skills')?.split(',').filter(Boolean) || undefined,
      location: searchParams.get('location') || undefined,
      minExperience: searchParams.get('minExperience') 
        ? parseInt(searchParams.get('minExperience')!) 
        : undefined,
      discType: searchParams.get('discType') || undefined,
      culturalFitMin: searchParams.get('culturalFitMin')
        ? parseInt(searchParams.get('culturalFitMin')!)
        : undefined,
      searchQuery: searchParams.get('search') || undefined,
    }

    console.log('🔍 Fetching candidates with filters:', filters)

    // Fetch candidates from BPOC database with graceful error handling
    let candidates = []
    try {
      candidates = await getCandidates(filters)
      console.log(`✅ Found ${candidates.length} candidates`)
    } catch (dbError) {
      console.warn('⚠️ BPOC database unavailable, returning empty candidates list:', dbError instanceof Error ? dbError.message : 'Unknown error')
      // Return empty list instead of error - allows UI to still function
      return NextResponse.json({
        success: true,
        candidates: [],
        count: 0,
        warning: 'BPOC database temporarily unavailable. Please try again later.'
      })
    }

    // Anonymize all candidates (remove personal details)
    const anonymizedCandidates = candidates.map(anonymizeCandidateForList)

    return NextResponse.json({
      success: true,
      candidates: anonymizedCandidates,
      count: anonymizedCandidates.length,
    })
  } catch (error) {
    console.error('❌ Error fetching candidates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}





