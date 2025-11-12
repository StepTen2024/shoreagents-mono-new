import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/admin/clients - Get all companies for management
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is management
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!managementUser) {
      return NextResponse.json(
        { error: "Management user not found" },
        { status: 404 }
      )
    }

    const companies = await prisma.company.findMany({
      include: {
        client_users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        management_users: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ companies })
  } catch (error) {
    console.error("Error fetching companies:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

