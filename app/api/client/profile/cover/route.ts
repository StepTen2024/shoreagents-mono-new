import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/client/profile/cover - Update client user cover photo
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { coverPhoto } = body

    // Get ClientUser
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Update cover photo
    await prisma.client_users.update({
      where: { id: clientUser.id },
      data: { coverPhoto }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Error updating cover photo:", error)
    return NextResponse.json(
      { error: "Failed to update cover photo", details: error?.message },
      { status: 500 }
    )
  }
}
