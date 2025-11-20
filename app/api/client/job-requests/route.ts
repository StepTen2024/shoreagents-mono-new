import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Use the client's actual company ID from Shore Agents database
    const companyId = clientUser.company.id
    console.log("📋 Creating job request for company:", companyId, clientUser.company.companyName)

    // Ensure company exists in BPOC members table (create if doesn't exist)
    try {
      const memberCheck = await bpocPool.query(
        `SELECT company_id FROM members WHERE company_id = $1`,
        [companyId]
      )

      if (memberCheck.rows.length === 0) {
        console.log("🏢 Company not found in BPOC members, creating...")
        await bpocPool.query(
          `INSERT INTO members (company_id, company, created_at, updated_at) 
           VALUES ($1, $2, NOW(), NOW())
           ON CONFLICT (company_id) DO NOTHING`,
          [companyId, clientUser.company.companyName]
        )
        console.log("✅ Company created in BPOC members")
      } else {
        console.log("✅ Company already exists in BPOC members")
      }
    } catch (memberError) {
      console.error("Error ensuring company in BPOC members:", memberError)
      // Continue anyway - the INSERT might still work
    }

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
        companyId, // Use the client's actual company ID
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
    console.error("❌ Error creating job request:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: "Failed to create job request",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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

    // Use the client's actual company ID from Shore Agents database
    const companyId = clientUser.company.id

    // Fetch job requests from BPOC database
    const result = await bpocPool.query(
      `SELECT * FROM job_requests 
       WHERE company_id = $1 
       ORDER BY created_at DESC`,
      [companyId]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching job requests:", error)
    // Return empty array instead of error to allow form to show
    return NextResponse.json([])
  }
}
