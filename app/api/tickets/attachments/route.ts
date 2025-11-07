import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin as supabase } from "@/lib/supabase"

// POST /api/tickets/attachments - Upload ticket attachments
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Determine if user is staff, management, or client
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
    })

    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
    })

    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!staffUser && !managementUser && !clientUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // Limit to 3 files
    const filesToUpload = files.slice(0, 3)
    const uploadedUrls: string[] = []

    for (const file of filesToUpload) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        continue
      }

      // Validate file type (images only)
      if (!file.type.startsWith("image/")) {
        continue
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Determine bucket and folder based on user type
      const bucket = staffUser ? "staff" : managementUser ? "management" : "client"
      const folder = staffUser ? "staff_ticket" : managementUser ? "management_ticket" : "client_ticket"
      // Use auth user ID (session.user.id) to match Supabase storage policies
      const authUserId = session.user.id

      // Generate unique filename
      const timestamp = Date.now()
      const fileExt = file.name.split(".").pop()
      const fileName = `${folder}/${authUserId}/${timestamp}_${file.name}`

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        })

      if (error) {
        console.error("Supabase upload error:", error)
        console.error("Bucket:", bucket, "Folder:", folder, "FileName:", fileName)
        console.error("File size:", file.size, "File type:", file.type)
        continue
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      console.log("Generated public URL:", publicUrlData.publicUrl)
      uploadedUrls.push(publicUrlData.publicUrl)
    }

    return NextResponse.json({ success: true, urls: uploadedUrls })
  } catch (error) {
    console.error("Error uploading attachments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

