import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()

    console.log("🎨 [UPDATE INTERESTS] Staff user:", userId)
    console.log("🎨 [UPDATE INTERESTS] Data:", body)

    // Update the staff_welcome_forms (mapped to staff_interests table)
    const updated = await prisma.staff_welcome_forms.updateMany({
      where: {
        staffUserId: userId
      },
      data: {
        favoriteFastFood: body.favoriteFastFood || null,
        favoriteColor: body.favoriteColor || null,
        favoriteMusic: body.favoriteMusic || null,
        favoriteMovie: body.favoriteMovie || null,
        favoriteBook: body.favoriteBook || null,
        hobby: body.hobby || null,
        dreamDestination: body.dreamDestination || null,
        favoriteSeason: body.favoriteSeason || null,
        petName: body.petName || null,
        favoriteSport: body.favoriteSport || null,
        favoriteGame: body.favoriteGame || null,
        favoriteQuote: body.favoriteQuote || null,
        funFact: body.funFact || null,
        additionalInfo: body.additionalInfo || null,
        updatedAt: new Date()
      }
    })

    console.log("✅ [UPDATE INTERESTS] Updated count:", updated.count)

    return NextResponse.json({ 
      success: true,
      message: "Interests updated successfully"
    })
  } catch (error) {
    console.error("❌ [UPDATE INTERESTS] Error:", error)
    return NextResponse.json(
      { error: "Failed to update interests" },
      { status: 500 }
    )
  }
}

