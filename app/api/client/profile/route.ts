import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// GET /api/client/profile - Fetch client profile details
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser with profile
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      include: {
        client_profiles: true,
        company: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            location: true
          }
        }
      }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Calculate real statistics
    const [tasksCreated, reviewsSubmitted] = await Promise.all([
      // Count tasks created by this client
      prisma.tasks.count({
        where: { 
          createdById: clientUser.id,
          createdByType: 'CLIENT'
        }
      }),
      // Count reviews submitted by this client (where client is the reviewer)
      prisma.reviews.count({
        where: { reviewedBy: clientUser.id }
      })
    ])

    // Prepare profile data with calculated stats
    // If profile exists, merge with stats; if not, create a basic object with stats
    const profileData = clientUser.client_profiles ? {
      ...clientUser.client_profiles,
      tasksCreated,
      reviewsSubmitted
    } : {
      id: crypto.randomUUID(),
      clientUserId: clientUser.id,
      position: null,
      department: null,
      directPhone: null,
      mobilePhone: null,
      timezone: null,
      bio: null,
      notifyTaskCreate: true,
      notifyTaskComplete: true,
      notifyReviews: true,
      notifyWeeklyReports: true,
      tasksCreated,
      reviewsSubmitted,
      lastLoginAt: null,
      createdAt: clientUser.createdAt,
      updatedAt: clientUser.updatedAt
    }

    return NextResponse.json({
      client_users: {
        id: clientUser.id,
        name: clientUser.name,
        email: clientUser.email,
        role: clientUser.role,
        avatar: clientUser.avatar,
        coverPhoto: clientUser.coverPhoto,
        company: clientUser.company
      },
      profile: profileData
    })
  } catch (error: any) {
    console.error("❌ Error fetching client profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch client profile", details: error?.message },
      { status: 500 }
    )
  }
}

// PUT /api/client/profile - Update client profile
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Get ClientUser
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      include: { client_profiles: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Update or create profile
    const {
      position,
      department,
      directPhone,
      mobilePhone,
      timezone,
      bio,
      notifyTaskCreate,
      notifyTaskComplete,
      notifyReviews,
      notifyWeeklyReports
    } = body

    let profile

    if (clientUser.client_profiles) {
      // Update existing profile
      profile = await prisma.client_profiles.update({
        where: { clientUserId: clientUser.id },
        data: {
          ...(position !== undefined && { position }),
          ...(department !== undefined && { department }),
          ...(directPhone !== undefined && { directPhone }),
          ...(mobilePhone !== undefined && { mobilePhone }),
          ...(timezone !== undefined && { timezone }),
          ...(bio !== undefined && { bio }),
          ...(notifyTaskCreate !== undefined && { notifyTaskCreate }),
          ...(notifyTaskComplete !== undefined && { notifyTaskComplete }),
          ...(notifyReviews !== undefined && { notifyReviews }),
          ...(notifyWeeklyReports !== undefined && { notifyWeeklyReports }),
          updatedAt: new Date()
        }
      })
    } else {
      // Create new profile
      profile = await prisma.client_profiles.create({
        data: {
          id: crypto.randomUUID(),
          clientUserId: clientUser.id,
          position: position || null,
          department: department || null,
          directPhone: directPhone || null,
          mobilePhone: mobilePhone || null,
          timezone: timezone || null,
          bio: bio || null,
          notifyTaskCreate: notifyTaskCreate ?? true,
          notifyTaskComplete: notifyTaskComplete ?? true,
          notifyReviews: notifyReviews ?? true,
          notifyWeeklyReports: notifyWeeklyReports ?? true,
          updatedAt: new Date()
        }
      })
    }

    // Update clientUser fields if provided
    const { name, role, avatar, coverPhoto } = body

    if (name !== undefined || role !== undefined || avatar !== undefined || coverPhoto !== undefined) {
      await prisma.client_users.update({
        where: { id: clientUser.id },
        data: {
          ...(name !== undefined && { name }),
          ...(role !== undefined && { role }),
          ...(avatar !== undefined && { avatar }),
          ...(coverPhoto !== undefined && { coverPhoto }),
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error("❌ Error updating client profile:", error)
    return NextResponse.json(
      { error: "Failed to update client profile", details: error?.message },
      { status: 500 }
    )
  }
}


