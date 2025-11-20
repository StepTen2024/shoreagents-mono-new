import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getApplicationCounts } from "@/lib/bpoc-db"

// BPOC Database connection
const bpocPool = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL
})

// Check if BPOC database URL is configured
if (!process.env.BPOC_DATABASE_URL) {
  console.error("❌ BPOC_DATABASE_URL environment variable is not set")
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a client
    if (session.user.role?.toUpperCase() !== 'CLIENT') {
      return NextResponse.json({ error: 'Access denied. Client role required.' }, { status: 403 })
    }

    // Check if BPOC database is configured
    if (!process.env.BPOC_DATABASE_URL) {
      return NextResponse.json(
        { error: "BPOC database not configured. Please contact administrator." },
        { status: 503 }
      )
    }

    // Get client's company_id
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!clientUser || !clientUser.company) {
      return NextResponse.json({ error: "Client user or company not found" }, { status: 404 })
    }

    const body = await request.json()

    // ✅ FIX: Use Shore Agents company ID as BPOC company ID
    // This ensures each client only sees THEIR job requests
    const bpocCompanyId = clientUser.companyId // Use actual Shore Agents company ID
    
    console.log(`✅ POST Job Request for company: ${clientUser.company.companyName} (ID: ${bpocCompanyId})`)

    // Insert into BPOC database
    const result = await bpocPool.query(
      `INSERT INTO job_requests (
        company_id,
        job_title,
        job_description,
        work_type,
        work_arrangement,
        experience_level,
        salary_min,
        salary_max,
        currency,
        salary_type,
        department,
        industry,
        shift,
        priority,
        application_deadline,
        requirements,
        responsibilities,
        benefits,
        skills,
        status,
        views,
        applicants,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        'active', 0, 0, NOW(), NOW()
      )
      RETURNING *`,
      [
        bpocCompanyId, // Use the verified company ID
        body.job_title,
        body.job_description,
        body.work_type,
        body.work_arrangement,
        body.experience_level,
        body.salary_min,
        body.salary_max,
        body.currency,
        body.salary_type,
        body.department,
        body.industry,
        body.shift,
        body.priority,
        body.application_deadline,
        body.requirements,
        body.responsibilities,
        body.benefits,
        body.skills
      ]
    )

    console.log("✅ Job request created in BPOC:", result.rows[0].id)

    return NextResponse.json({
      success: true,
      jobRequest: result.rows[0]
    })
  } catch (error) {
    console.error("Error creating job request:", error)
    return NextResponse.json(
      { error: "Failed to create job request" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a client
    if (session.user.role?.toUpperCase() !== 'CLIENT') {
      return NextResponse.json({ error: 'Access denied. Client role required.' }, { status: 403 })
    }

    // Check if BPOC database is configured
    if (!process.env.BPOC_DATABASE_URL) {
      console.log("⚠️ BPOC database not configured, returning empty array")
      return NextResponse.json([])
    }

    // Get client's company_id
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!clientUser || !clientUser.company) {
      return NextResponse.json({ error: "Client user or company not found" }, { status: 404 })
    }

    // ✅ FIX: Use Shore Agents company ID as BPOC company ID
    // This ensures each client only sees THEIR job requests
    const bpocCompanyId = clientUser.companyId // Use actual Shore Agents company ID
    
    console.log(`✅ GET Job Requests for company: ${clientUser.company.companyName} (ID: ${bpocCompanyId})`)

    // Fetch job requests from BPOC database - FILTERED BY CLIENT'S COMPANY
    const result = await bpocPool.query(
      `SELECT * FROM job_requests 
       WHERE company_id = $1 
       ORDER BY created_at DESC`,
      [bpocCompanyId]
    )

    console.log(`📊 Found ${result.rows.length} job requests for ${clientUser.company.companyName}`)

    // Fetch application counts for these job requests
    const jobRequestIds = result.rows.map(job => job.id.toString())
    const applicationCounts = await getApplicationCounts(jobRequestIds)

    // Merge application counts into job requests
    const enrichedJobRequests = result.rows.map(job => ({
      ...job,
      applicants: applicationCounts.get(job.id.toString()) || 0
    }))

    console.log(`✅ Enriched ${enrichedJobRequests.length} job requests with application counts`)

    return NextResponse.json(enrichedJobRequests)
  } catch (error) {
    console.error("Error fetching job requests:", error)
    // Return empty array instead of error to allow form to show
    return NextResponse.json([])
  }
}
