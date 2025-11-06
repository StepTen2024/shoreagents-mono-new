/**
 * Admin Recruitment - Job Requests API
 * GET /api/admin/recruitment/job-requests
 * 
 * Fetch all job requests from BPOC database for admin view
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Pool } from 'pg'

// BPOC Database connection
const bpocPool = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL
})

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

    // Check if BPOC database is configured
    if (!process.env.BPOC_DATABASE_URL) {
      console.log('⚠️ [ADMIN] BPOC database not configured, returning empty array')
      return NextResponse.json({ success: true, jobRequests: [], count: 0 })
    }

    console.log('🔍 [ADMIN] Fetching all job requests from BPOC database')

    // Fetch ALL job requests from BPOC database
    const result = await bpocPool.query(
      `SELECT * FROM job_requests 
       ORDER BY created_at DESC`
    )

    console.log(`✅ [ADMIN] Found ${result.rows.length} job requests`)

    return NextResponse.json({
      success: true,
      jobRequests: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching job requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job requests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

