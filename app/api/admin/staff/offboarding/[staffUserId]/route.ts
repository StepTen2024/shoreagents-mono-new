import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ staffUserId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { staffUserId } = await params

    const offboarding = await prisma.staffOffboarding.findUnique({
      where: { staffUserId },
      include: {
        staffUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!offboarding) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ offboarding })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}
