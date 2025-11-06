import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, phone, department, role } = body

    // Validation
    if (!name || !email || !password || !department) {
      return NextResponse.json(
        { error: "Name, email, password, and department are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Check if email already exists in managementUser
    const existingUser = await prisma.management_users.findUnique({
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

    // 2. Create in managementUser table (linked to Supabase auth user)
    const managementUser = await prisma.management_users.create({
      data: {
        id: randomUUID(), // Generate unique ID
        authUserId: authData.user.id, // Links to Supabase auth.users.id
        email,
        name,
        role: role || "MANAGER",
        phone: phone || null,
        department,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(
      {
        message: "Management account created successfully",
        user: {
          id: managementUser.id,
          name: managementUser.name,
          email: managementUser.email,
          role: managementUser.role,
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Management signup error:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
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

