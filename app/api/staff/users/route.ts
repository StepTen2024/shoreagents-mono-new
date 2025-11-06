import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET: Fetch all staff users
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all staff users
    const staffUsers = await prisma.staff_users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        companyId: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`📋 [STAFF/USERS] Fetched ${staffUsers.length} staff users`)

    return NextResponse.json({ staffUsers }, { status: 200 })
  } catch (error: any) {
    console.error('❌ [STAFF/USERS] Error fetching staff users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

