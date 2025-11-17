import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/staff/profile
 * Get the currently logged-in staff user's profile
 * Used by Electron app to fetch staff user ID for screenshot authentication
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the staff user profile
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        companyId: true,
        coverImage: true,
        bio: true,
        skills: true
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    console.log(`👤 [STAFF/PROFILE] Fetched profile for staff user: ${staffUser.id}`)

    return NextResponse.json({ 
      success: true,
      staffUser 
    }, { status: 200 })
  } catch (error: any) {
    console.error('❌ [STAFF/PROFILE] Error fetching staff profile:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}

