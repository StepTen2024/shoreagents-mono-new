import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

// POST /api/tasks/attachments - Upload task attachments
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    if (files.length > 5) {
      return NextResponse.json({ error: "Maximum 5 files allowed" }, { status: 400 })
    }

    // Determine user type and get user ID
    let userType: "client" | "staff" | "management" = "staff"
    let userId: string = ""
    let bucketName: string = "staff"
    let folderName: string = "staff_task"

    // Check if client
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (clientUser) {
      userType = "client"
      userId = clientUser.id
      bucketName = "client"
      folderName = "client_task"
    } else {
      // Check if staff
      const staffUser = await prisma.staff_users.findUnique({
        where: { authUserId: session.user.id },
      })

      if (staffUser) {
        userType = "staff"
        userId = staffUser.id
        bucketName = "staff"
        folderName = "staff_task"
      } else {
        // Check if management
        const managementUser = await prisma.management_users.findUnique({
          where: { authUserId: session.user.id },
        })

        if (managementUser) {
          userType = "management"
          userId = managementUser.id
          bucketName = "staff" // Use staff bucket for management
          folderName = "staff_task"
        } else {
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }
      }
    }

    const uploadedUrls: string[] = []

    // Upload each file
    for (const file of files) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 5MB limit` },
          { status: 400 }
        )
      }

      // Validate file type (images only)
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `File ${file.name} is not an image` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const extension = file.name.split(".").pop()
      const filename = `${timestamp}-${randomString}.${extension}`
      const filePath = `${folderName}/${userId}/${filename}`

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to Supabase
      const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (error) {
        console.error("Supabase upload error:", error)
        return NextResponse.json(
          { error: `Failed to upload ${file.name}: ${error.message}` },
          { status: 500 }
        )
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath)

      uploadedUrls.push(publicUrl)
    }

    console.log(
      `✅ ${userType} ${userId} uploaded ${files.length} task attachment(s) to ${bucketName}/${folderName}`
    )

    return NextResponse.json({ success: true, urls: uploadedUrls })
  } catch (error) {
    console.error("Error uploading task attachments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

