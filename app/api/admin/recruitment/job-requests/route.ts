/**
 * Admin Recruitment - Job Requests API
 * GET /api/admin/recruitment/job-requests
 * 
 * Fetch all job requests from BPOC database for admin view
 * Includes company info, client user info, and application counts
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { getApplicationCounts } from '@/lib/bpoc-db'

// Initialize Prisma Client directly
const prisma = new PrismaClient()

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

    // Get application counts for all job requests
    const jobRequestIds = result.rows.map(job => job.id.toString())
    const applicationCounts = await getApplicationCounts(jobRequestIds)

    // Enrich each job request with company, client user, and application count
    const enrichedJobRequests = await Promise.all(
      result.rows.map(async (job) => {
        try {
          console.log(`🔍 [ADMIN] Job ${job.id} has company_id: ${job.company_id} (type: ${typeof job.company_id})`)
          
          // The job.company_id is the Shore Agents company.id
          const company = await prisma.companies.findUnique({
            where: { id: String(job.company_id) }, // Ensure it's a string
            include: {
              client_users: {
                take: 1, // Get the first client user for this company
                orderBy: { createdAt: 'asc' }
              }
            }
          })

          console.log(`🔍 [ADMIN] Job ${job.id} -> Company: ${company ? company.companyName : 'NOT FOUND'}`)

          const clientUser = company?.client_users?.[0]

          return {
            ...job,
            applicants: applicationCounts.get(job.id.toString()) || 0,
            company_name: company?.companyName || 'Unknown Company',
            client_user_name: clientUser ? `${clientUser.firstName} ${clientUser.lastName}` : 'Unknown Client',
            client_user_email: clientUser?.email || null
          }
        } catch (error) {
          console.error(`❌ [ADMIN] Error enriching job ${job.id}:`, error)
          return {
            ...job,
            applicants: applicationCounts.get(job.id.toString()) || 0,
            company_name: 'Unknown Company',
            client_user_name: 'Unknown Client',
            client_user_email: null
          }
        }
      })
    )

    console.log(`✅ [ADMIN] Enriched ${enrichedJobRequests.length} job requests with company/client info`)

    return NextResponse.json({
      success: true,
      jobRequests: enrichedJobRequests,
      count: enrichedJobRequests.length,
    })
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching job requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job requests', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

