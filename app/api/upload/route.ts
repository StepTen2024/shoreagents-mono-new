import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/upload - Upload a file to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type (images only)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images are allowed" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    // Determine user type and bucket
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true }
    })
    
    const managementUser = !staffUser ? await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true }
    }) : null

    const clientUser = !staffUser && !managementUser ? await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true }
    }) : null

    // Determine bucket based on user type
    let bucket: string
    let folder: string
    
    if (staffUser) {
      bucket = "staff"
      folder = "staff_uploads"
    } else if (managementUser) {
      bucket = "management"
      folder = "management_uploads"
    } else if (clientUser) {
      bucket = "client"
      folder = "client_uploads"
    } else {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${folder}/${session.user.id}/${fileName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error("Supabase upload error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath)

    console.log(`✅ [UPLOAD] File uploaded: ${bucket}/${filePath}`)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

