import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET: Fetch all companies
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all companies
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        companyName: true,
        logo: true,
        industry: true,
        isActive: true
      },
      where: {
        isActive: true
      },
      orderBy: {
        companyName: 'asc'
      }
    })

    console.log(`📋 [COMPANIES] Fetched ${companies.length} companies`)

    return NextResponse.json({ companies }, { status: 200 })
  } catch (error: any) {
    console.error('❌ [COMPANIES] Error fetching companies:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

