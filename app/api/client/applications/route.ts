import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// BPOC Database connection
const bpocPool = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL
})

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

    const companyId = clientUser.company.id

    // Fetch applications for job requests belonging to this company
    // Join with processed_job_requests (which references job_requests) and users to get full details
    const result = await bpocPool.query(
      `SELECT 
        a.id,
        a.user_id,
        a.job_id,
        a.resume_id,
        a.resume_slug,
        a.status,
        a.created_at,
        a.updated_at,
        a.position,
        pjr.id as job_request_id,
        pjr.job_title,
        pjr.company_id,
        u.first_name,
        u.last_name,
        u.full_name,
        u.email,
        u.avatar_url,
        u.location,
        u.position as user_position,
        u.bio
      FROM applications a
      INNER JOIN processed_job_requests pjr ON a.job_id = pjr.id
      INNER JOIN users u ON a.user_id = u.id
      WHERE pjr.company_id = $1
      ORDER BY a.created_at DESC`,
      [companyId]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json([])
  }
}

