import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getApplicationsForJobRequest } from "@/lib/bpoc-db"

/**
 * GET /api/client/job-requests/[id]/applications
 * Fetch applications for a specific job request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a client
    if (session.user.role?.toUpperCase() !== 'CLIENT') {
      return NextResponse.json({ error: 'Access denied. Client role required.' }, { status: 403 })
    }

    // Get client's company_id
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!clientUser || !clientUser.company) {
      return NextResponse.json({ error: "Client user or company not found" }, { status: 404 })
    }

    const resolvedParams = await params
    const jobRequestId = resolvedParams.id

    console.log(`📋 [CLIENT] Fetching applications for job request ${jobRequestId}`)

    // Fetch applications from BPOC database
    const applications = await getApplicationsForJobRequest(jobRequestId)

    console.log(`✅ [CLIENT] Found ${applications.length} applications for job ${jobRequestId}`)

    return NextResponse.json({
      success: true,
      applications
    })
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json(
      { error: "Failed to fetch applications", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
