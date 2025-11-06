import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { staffEmail } = await req.json()

    console.log(`🔍 Finding staff: ${staffEmail}`)
    
    // Find the staff user
    const staff = await prisma.staff_users.findFirst({
      where: { email: staffEmail },
      include: {
        staff_profiles: true,
        company: true
      }
    })

    if (!staff) {
      return NextResponse.json({ 
        error: "Staff not found" 
      }, { status: 404 })
    }

    console.log(`✅ Found staff: ${staff.name}`)

    // Check if profile already exists
    if (staff.staff_profiles) {
      console.log('⚠️ Profile already exists')
      return NextResponse.json({
        success: true,
        message: "Profile already exists",
        profile: staff.staff_profiles
      })
    }

    // Create staff profile
    console.log('📝 Creating staff profile...')
    const profile = await prisma.staff_profiles.create({
      data: {
        id: crypto.randomUUID(),
        staff_users: {
          connect: { id: staff.id }
        },
        phone: null,
        location: "Remote",
        gender: "PREFER_NOT_TO_SAY",
        civilStatus: "SINGLE",
        dateOfBirth: null,
        employmentStatus: "PROBATION",
        startDate: new Date(),
        currentRole: "Staff Member",
        salary: 0,
        lastPayIncrease: null,
        lastIncreaseAmount: null,
        totalLeave: 15,
        usedLeave: 0,
        vacationUsed: 0,
        sickUsed: 0,
        hmo: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('✅ Profile created!')

    return NextResponse.json({
      success: true,
      message: "Profile created successfully",
      profile: profile
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to create profile" 
    }, { status: 500 })
  }
}

