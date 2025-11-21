/**
 * Admin Recruitment - Single Job Request API
 * GET /api/admin/recruitment/job-requests/[id]
 * 
 * Fetch a specific job request with full details, company info, client info, and applications
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { bpocPool, getApplicationsForJobRequest } from '@/lib/bpoc-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params (Next.js 15 requirement)
    const resolvedParams = await params
    const jobRequestId = resolvedParams.id

    console.log(`🔍 [ADMIN] Fetching job request ${jobRequestId} with full details`)

    // Fetch job request from BPOC database
    const jobResult = await bpocPool.query(
      `SELECT * FROM job_requests WHERE id = $1`,
      [jobRequestId]
    )

    if (jobResult.rows.length === 0) {
      return NextResponse.json({ error: 'Job request not found' }, { status: 404 })
    }

    const jobRequest = jobResult.rows[0]

    console.log(`🔍 [ADMIN] Job request ${jobRequestId} has company_id:`, jobRequest.company_id)
    console.log(`🔍 [ADMIN] Job request company_id type:`, typeof jobRequest.company_id)

    // Get company and client user from Shore Agents DB
    const company = await prisma.companies.findUnique({
      where: { id: String(jobRequest.company_id) }, // Ensure it's a string
      include: {
        client_users: {
          take: 1,
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    console.log(`🔍 [ADMIN] Found company:`, company ? company.companyName : 'NOT FOUND')
    console.log(`🔍 [ADMIN] Found client user:`, company?.client_users?.[0] ? `${company.client_users[0].firstName} ${company.client_users[0].lastName}` : 'NOT FOUND')

    const clientUser = company?.client_users?.[0]

    // Get applications for this job
    console.log(`🔍 [ADMIN] Fetching applications for job_request_id: ${jobRequestId} (type: ${typeof jobRequestId})`)
    const applications = await getApplicationsForJobRequest(jobRequestId)
    console.log(`🔍 [ADMIN] Applications result:`, applications.length, applications)

    const enrichedJobRequest = {
      ...jobRequest,
      company_name: company?.companyName || 'Unknown Company',
      company_id: company?.id || null,
      client_user_name: clientUser ? `${clientUser.firstName} ${clientUser.lastName}` : 'Unknown Client',
      client_user_email: clientUser?.email || null,
      client_user_id: clientUser?.id || null,
      applicants: applications.length,
      applications
    }

    console.log(`✅ [ADMIN] Retrieved job ${jobRequestId} with ${applications.length} applications`)

    return NextResponse.json({
      success: true,
      jobRequest: enrichedJobRequest
    })
  } catch (error) {
    console.error('❌ [ADMIN] Error fetching job request details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
