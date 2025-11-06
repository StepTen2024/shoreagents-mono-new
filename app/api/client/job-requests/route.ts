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

    // First, let's check the actual structure of the job_requests table
    try {
      const tableStructure = await bpocPool.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = 'job_requests' 
         ORDER BY ordinal_position`
      )
      console.log("📋 BPOC job_requests table structure:", tableStructure.rows)
    } catch (structureError) {
      console.error("Error checking table structure:", structureError)
    }

    // For now, use a default company ID since BPOC database schema is different
    // TODO: Map Supabase company IDs to BPOC company IDs properly
    let bpocCompanyId = '1' // Default company ID for BPOC database
    
    try {
      // Check if we can find any existing company in BPOC
      const companyCheck = await bpocPool.query(
        `SELECT company_id FROM job_requests LIMIT 1`
      )
      
      if (companyCheck.rows.length > 0) {
        bpocCompanyId = companyCheck.rows[0].company_id
        console.log("✅ Using existing company ID from BPOC:", bpocCompanyId)
      } else {
        console.log("✅ Using default company ID:", bpocCompanyId)
      }
    } catch (companyError) {
      console.error("Error checking BPOC companies:", companyError)
      // Use default company ID
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

    // Use the same company ID logic as POST method
    let bpocCompanyId = '1' // Default company ID for BPOC database
    
    try {
      // Check if we can find any existing company in BPOC
      const companyCheck = await bpocPool.query(
        `SELECT company_id FROM job_requests LIMIT 1`
      )
      
      if (companyCheck.rows.length > 0) {
        bpocCompanyId = companyCheck.rows[0].company_id
        console.log("✅ GET: Using existing company ID from BPOC:", bpocCompanyId)
      } else {
        console.log("✅ GET: Using default company ID:", bpocCompanyId)
      }
    } catch (companyError) {
      console.error("Error checking BPOC companies in GET:", companyError)
      // Use default company ID
    }

    // Fetch job requests from BPOC database
    const result = await bpocPool.query(
      `SELECT * FROM job_requests 
       WHERE company_id = $1 
       ORDER BY created_at DESC`,
      [bpocCompanyId]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching job requests:", error)
    // Return empty array instead of error to allow form to show
    return NextResponse.json([])
  }
}
