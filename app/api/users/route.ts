import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * 🎯 USERS API FOR MENTIONS
 * 
 * Returns available users based on role and context:
 * - Clients: Only their staff
 * - Staff: Their team + their client + management
 * - Management: Everyone
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'staff', 'client', 'management', 'all'
    const companyId = searchParams.get('companyId')
    const forStaff = searchParams.get('forStaff') === 'true'

    let users: any[] = []

    // CLIENT requesting users (only their staff)
    if (type === 'staff' && companyId) {
      const staffUsers = await prisma.staff_users.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true
        }
      })
      users = staffUsers.map(u => ({ ...u, type: 'STAFF' }))
    }

    // STAFF requesting users (their team + client + management)
    else if (type === 'all' && forStaff) {
      const staffUser = await prisma.staff_users.findUnique({
        where: { authUserId: session.user.id },
        include: { company: true }
      })

      if (!staffUser) {
        return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
      }

      // Get their team (same company)
      const teamStaff = await prisma.staff_users.findMany({
        where: { 
          companyId: staffUser.companyId,
          id: { not: staffUser.id } // Exclude self
        },
        select: { id: true, name: true, avatar: true, email: true }
      })

      // Get their client
      const client = staffUser.companyId ? await prisma.client_users.findMany({
        where: { companyId: staffUser.companyId },
        select: { id: true, name: true, avatar: true, email: true }
      }) : []

      // Get management
      const management = await prisma.management_users.findMany({
        select: { id: true, name: true, avatar: true, email: true }
      })

      users = [
        ...teamStaff.map(u => ({ ...u, type: 'STAFF' })),
        ...client.map(u => ({ ...u, type: 'CLIENT' })),
        ...management.map(u => ({ ...u, type: 'MANAGEMENT' }))
      ]
    }

    // MANAGEMENT requesting users (everyone)
    else if (type === 'all') {
      const [staffUsers, clientUsers, managementUsers] = await Promise.all([
        prisma.staff_users.findMany({
          select: { id: true, name: true, avatar: true, email: true }
        }),
        prisma.client_users.findMany({
          select: { id: true, name: true, avatar: true, email: true }
        }),
        prisma.management_users.findMany({
          select: { id: true, name: true, avatar: true, email: true }
        })
      ])

      users = [
        ...staffUsers.map(u => ({ ...u, type: 'STAFF' })),
        ...clientUsers.map(u => ({ ...u, type: 'CLIENT' })),
        ...managementUsers.map(u => ({ ...u, type: 'MANAGEMENT' }))
      ]
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("❌ [USERS API] Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

