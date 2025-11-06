import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// GET /api/client/reviews/auto-create/test - Test endpoint to verify basic functionality
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      message: "Auto-create test endpoint working",
      user: session.user.email,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Error in test endpoint:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
