import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/client/reviews/debug - Debug endpoint to check data
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No session" }, { status: 401 })
    }

    // Check client user
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ 
        error: "Client user not found",
        email: session.user.email 
      }, { status: 404 })
    }

    // Check staff users
    const allStaffUsers = await prisma.staff_users.findMany({
      where: {
        companyId: clientUser.company.id
      },
      include: {
        staff_profiles: true
      }
    })

    // Filter to only include staff with startDate
    const staffUsers = allStaffUsers.filter(staff => staff.staff_profiles?.startDate)

    return NextResponse.json({
      success: true,
      client_users: {
        email: clientUser.email,
        company: clientUser.company?.companyName,
        companyId: clientUser.company?.id
      },
      staffCount: staffUsers.length,
      staffUsers: staffUsers.map(staff => ({
        name: staff.name,
        email: staff.email,
        startDate: staff.staff_profiles?.startDate,
        companyId: staff.companyId
      }))
    })

  } catch (error) {
    console.error("❌ Debug error:", error)
    return NextResponse.json({
      error: "Debug failed",
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
