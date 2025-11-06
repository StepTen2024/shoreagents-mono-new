import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/client/profile/avatar - Update client user avatar
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { avatar } = body

    // Get ClientUser
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Update avatar
    await prisma.client_users.update({
      where: { id: clientUser.id },
      data: { avatar }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Error updating avatar:", error)
    return NextResponse.json(
      { error: "Failed to update avatar", details: error?.message },
      { status: 500 }
    )
  }
}
