import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the staff user
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        company: {
          include: {
            client_users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            management_users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                department: true,
              },
            },
          },
        },
      },
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    if (!staffUser.company) {
      return NextResponse.json({ 
        error: "No client company assigned",
        message: "You are not currently assigned to a client company."
      }, { status: 404 })
    }

    // Transform response to match frontend expectations (camelCase)
    return NextResponse.json({
      company: {
        id: staffUser.company.id,
        companyName: staffUser.company.companyName,
        tradingName: staffUser.company.tradingName,
        logo: staffUser.company.logo,
        industry: staffUser.company.industry,
        location: staffUser.company.location,
        billingEmail: staffUser.company.billingEmail,
        phone: staffUser.company.phone,
        website: staffUser.company.website,
        bio: staffUser.company.bio,
        clientUsers: staffUser.company.client_users || [], // Transform snake_case to camelCase
        accountManager: staffUser.company.management_users || null
      },
      clientUsersCount: staffUser.company.client_users?.length || 0,
    })
  } catch (error) {
    console.error("Error fetching client company:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

