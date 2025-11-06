import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin
    const adminUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'all'

    let where: any = {}
    if (filter === 'active') {
      where.status = { in: ['INITIATED', 'PENDING_EXIT', 'PROCESSING'] }
    } else if (filter === 'completed') {
      where.status = 'COMPLETED'
    }

    const offboardings = await prisma.staff_offboarding.findMany({
      where,
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ offboardings })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}
