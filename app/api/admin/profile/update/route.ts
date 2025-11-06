import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get management user
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        management_profiles: true
      }
    })

    if (!managementUser) {
      return NextResponse.json({ error: "Management user not found" }, { status: 404 })
    }

    // Check permissions: Only CEO_EXECUTIVE can edit anyone's profile
    // Others can only edit their own
    const isCEO = managementUser.department === 'CEO_EXECUTIVE'
    
    if (!isCEO) {
      console.log("✅ User editing own profile:", managementUser.name)
    } else {
      console.log("✅ CEO editing profile:", managementUser.name)
    }

    const profileExists = !!managementUser.management_profiles

    const body = await req.json()
    const { currentRole, roleDescription, bio, responsibilities, startDate } = body

    // Validate required fields
    if (!currentRole?.trim()) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 })
    }

    if (!startDate) {
      return NextResponse.json({ error: "Start date is required" }, { status: 400 })
    }

    // Calculate days employed
    const start = new Date(startDate)
    const today = new Date()
    const daysEmployed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    const profileData = {
      currentRole: currentRole.trim(),
      roleDescription: roleDescription?.trim() || null,
      bio: bio?.trim() || null,
      responsibilities: responsibilities?.trim() || null,
      startDate: new Date(startDate),
      daysEmployed,
      updatedAt: new Date()
    }

    if (profileExists) {
      // Update existing profile
      await prisma.management_profiles.update({
        where: { managementUserId: managementUser.id },
        data: profileData
      })
      console.log("✅ PROFILE UPDATED:", managementUser.name)
    } else {
      // Create new profile
      await prisma.management_profiles.create({
        data: {
          id: crypto.randomUUID(),
          managementUserId: managementUser.id,
          ...profileData,
          phone: null,
          timezone: "Asia/Manila",
          salary: null,
          lastPayIncrease: null,
          lastIncreaseAmount: null,
          totalLeave: 12,
          usedLeave: 0,
          vacationUsed: 0,
          sickUsed: 0,
          hmo: true,
          civilStatus: null,
          dateOfBirth: null,
          gender: null,
          createdAt: new Date()
        }
      })
      console.log("✅ PROFILE CREATED:", managementUser.name)
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!"
    })

  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}

