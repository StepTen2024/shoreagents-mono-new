import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// DELETE /api/shares/[id] - Delete a share (unshare)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Find the share
    const share = await prisma.shares.findUnique({
      where: { id },
    })

    if (!share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 })
    }

    // Verify ownership - get current user's type and ID
    let authorType: string
    let authorId: string

    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (managementUser) {
      authorType = "MANAGEMENT"
      authorId = managementUser.id
    } else {
      const staffUser = await prisma.staff_users.findUnique({
        where: { authUserId: session.user.id },
      })

      if (staffUser) {
        authorType = "STAFF"
        authorId = staffUser.id
      } else {
        const clientUser = await prisma.client_users.findUnique({
          where: { authUserId: session.user.id },
        })

        if (clientUser) {
          authorType = "CLIENT"
          authorId = clientUser.id
        } else {
          return NextResponse.json(
            { error: "User type not found" },
            { status: 404 }
          )
        }
      }
    }

    // Check if user owns this share OR is management (can delete any)
    if (
      share.authorType !== authorType ||
      (share.authorId !== authorId && authorType !== "MANAGEMENT")
    ) {
      return NextResponse.json(
        { error: "You can only delete your own shares" },
        { status: 403 }
      )
    }

    console.log(`[Shares API] Deleting share: ${id}`)

    await prisma.shares.delete({
      where: { id },
    })

    console.log(`[Shares API] ✅ Share deleted: ${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Shares API] Error deleting share:", error)
    return NextResponse.json(
      { error: "Failed to delete share" },
      { status: 500 }
    )
  }
}

