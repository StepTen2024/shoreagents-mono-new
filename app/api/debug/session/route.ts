import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  
  return NextResponse.json({
    session,
    user: session?.user,
    role: session?.user?.role,
    email: session?.user?.email,
  }, { status: 200 })
}

