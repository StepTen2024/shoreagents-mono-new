import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify client user
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client access required" }, { status: 403 })
    }

    // Get offboardings for staff in this client's company
    const offboardings = await prisma.staff_offboarding.findMany({
      where: {
        staff_users: {
          companyId: clientUser.companyId
        }
      },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform response to camelCase for frontend
    const transformedOffboardings = offboardings.map(offboarding => ({
      ...offboarding,
      staffUser: offboarding.staff_users,
      staff_users: undefined
    }))

    return NextResponse.json({ offboardings: transformedOffboardings })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}
