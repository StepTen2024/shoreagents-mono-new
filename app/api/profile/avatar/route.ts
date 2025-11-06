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
    const file = formData.get('avatar') as File
    
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

    // Delete existing avatar if it exists
    if (staffUser.avatar) {
      try {
        // Extract the file path from the existing URL
        const urlParts = staffUser.avatar.split('/staff/')
        if (urlParts.length > 1) {
          const oldFilePath = urlParts[1].split('?')[0] // Remove query params
          await supabaseAdmin.storage
            .from('staff')
            .remove([oldFilePath])
        }
      } catch (error) {
        console.log("Note: Could not delete old avatar:", error)
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename with timestamp to avoid caching issues
    const timestamp = Date.now()
    const filePath = `staff_avatar/${staffUser.authUserId}/avatar_${timestamp}.jpg`
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('staff')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false, // No need to upsert since filename is unique
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('staff')
      .getPublicUrl(filePath)

    // Update database with avatar URL
    await prisma.staff_users.update({
      where: { id: staffUser.id },
      data: { avatar: publicUrl }
    })

    return NextResponse.json({ 
      success: true, 
      url: publicUrl 
    })

  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    )
  }
}

