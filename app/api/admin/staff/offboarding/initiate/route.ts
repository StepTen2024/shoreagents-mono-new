import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminUser = await prisma.managementUser.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!adminUser) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await req.json()
    const { staffUserId, reason, reasonDetails, lastWorkingDate, offboardingNotes } = body

    if (!staffUserId || !reason || !lastWorkingDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const staffUser = await prisma.staffUser.findUnique({
      where: { id: staffUserId }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    const existing = await prisma.staffOffboarding.findUnique({
      where: { staffUserId }
    })

    if (existing && existing.status !== "CANCELLED") {
      return NextResponse.json({ error: "Already offboarding" }, { status: 400 })
    }

    const offboarding = await prisma.staffOffboarding.create({
      data: {
        staffUserId,
        initiatedBy: adminUser.id,
        reason,
        reasonDetails,
        lastWorkingDate: new Date(lastWorkingDate),
        offboardingNotes,
        status: "INITIATED"
      }
    })

    return NextResponse.json({ success: true, offboarding })
  } catch (error) {
    console.error("Offboarding initiate error:", error)
    return NextResponse.json({ error: "Failed to initiate" }, { status: 500 })
  }
}
