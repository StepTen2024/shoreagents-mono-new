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

    console.log(`✅ [ADMIN] Found ${companies.length} companies`)
    companies.forEach(company => {
      console.log(`   📦 ${company.companyName}:`)
      console.log(`      - Client Users: ${company.client_users.length}`)
      console.log(`      - Staff Users: ${company.staff_users.length}`)
      console.log(`      - Management: ${company.management_users ? 'Yes' : 'No'}`)
      company.client_users.forEach(user => {
        console.log(`         👤 ${user.name} (${user.email}) - ${user.role}`)
      })
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

