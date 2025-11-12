import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: { staff_offboarding: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    return NextResponse.json({ offboarding: staffUser.staff_offboarding })
  } catch (error) {
    console.error("Error fetching offboarding:", error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: { staff_offboarding: true }
    })

    if (!staffUser || !staffUser.staff_offboarding) {
      return NextResponse.json({ error: "No offboarding found" }, { status: 404 })
    }

    if (staffUser.staff_offboarding.exitInterviewCompleted) {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 })
    }

    const body = await req.json()

    await prisma.staff_offboarding.update({
      where: { id: staffUser.staff_offboarding.id },
      data: {
        exitInterviewCompleted: true,
        exitInterviewData: JSON.stringify(body),
        status: "PROCESSING"
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error submitting offboarding:", error)
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 })
  }
}
