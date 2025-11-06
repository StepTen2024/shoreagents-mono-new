/**
 * Admin Recruitment - Get Single Candidate API
 * GET /api/admin/recruitment/candidates/[id]
 * 
 * Fetches a single candidate's details from BPOC database
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCandidateById } from '@/lib/bpoc-db'

export async function GET(
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

    // Verify user is admin/manager
    const userRole = session.user.role?.toUpperCase()
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    console.log(`🔍 [ADMIN] Fetching candidate: ${id}`)

    // Get candidate from BPOC database
    const candidate = await getCandidateById(id)

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    console.log(`✅ [ADMIN] Found candidate: ${candidate.first_name}`)
    console.log(`📧 [ADMIN] Candidate email: ${candidate.email}`)
    console.log(`📱 [ADMIN] Candidate phone: ${candidate.phone}`)
    console.log(`💼 [ADMIN] Candidate position: ${candidate.position}`)

    // Return in the format the frontend expects
    return NextResponse.json({ 
      success: true, 
      candidate: {
        email: candidate.email,
        phone: candidate.phone,
        position: candidate.position,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        ...candidate
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('❌ [ADMIN] Error fetching candidate:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch candidate' 
    }, { status: 500 })
  }
}
