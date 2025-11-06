import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, companyName, role, phone } = body

    // Validation
    if (!name || !email || !password || !companyName) {
      return NextResponse.json(
        { error: "Name, email, password, and company name are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Check if email already exists in client_users
    const existingUser = await prisma.client_users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    // 1. Create user in Supabase Auth (auth.users table)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError || !authData.user) {
      console.error("Supabase auth error:", authError)
      return NextResponse.json(
        { error: authError?.message || "Failed to create auth user" },
        { status: 500 }
      )
    }

    // 2. Find or create Company record
    let company = await prisma.company.findFirst({
      where: { companyName }
    })

    if (!company) {
      company = await prisma.company.create({
        data: {
          id: randomUUID(),
          companyName,
          organizationId: randomUUID(), // Unique org ID
          updatedAt: new Date(),
        }
      })
    }

    // 3. Create in client_users table (linked to Supabase auth user and Company)
    const clientUser = await prisma.client_users.create({
      data: {
        id: randomUUID(),
        authUserId: authData.user.id, // Links to Supabase auth.users.id
        companyId: company.id,
        email,
        name,
        role: role || "MANAGER",
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(
      {
        message: "Client account created successfully",
        user: {
          id: clientUser.id,
          name: clientUser.name,
          email: clientUser.email,
          role: clientUser.role,
          companyName: company.companyName,
          organizationId: company.organizationId,
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Client signup error:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
    })
    return NextResponse.json(
      { 
        error: "Failed to create account",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}

