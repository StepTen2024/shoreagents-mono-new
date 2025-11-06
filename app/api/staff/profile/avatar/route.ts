import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Get file from form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be less than 5MB" }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage - staff bucket with staff_avatar subfolder
    const filePath = `staff_avatar/${staffUser.authUserId}/avatar.jpg`
    
    // Delete old file if it exists (ensures clean replacement)
    if (staffUser.avatar) {
      await supabaseAdmin.storage
        .from('staff')
        .remove([filePath])
    }

    // Upload new file
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('staff')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL with cache-busting timestamp
    const timestamp = Date.now()
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('staff')
      .getPublicUrl(filePath)
    
    const urlWithTimestamp = `${publicUrl}?t=${timestamp}`

    // Update database with avatar URL
    await prisma.staff_users.update({
      where: { id: staffUser.id },
      data: { avatar: urlWithTimestamp }
    })

    return NextResponse.json({ 
      success: true, 
      url: urlWithTimestamp 
    })

  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    )
  }
}

