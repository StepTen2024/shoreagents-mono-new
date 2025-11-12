import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

// POST /api/posts/images - Upload images for activity posts
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user type and determine bucket
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, name: true }
    })

    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, name: true }
    })

    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, name: true }
    })

    // Determine bucket and folder based on user type
    let bucketName: string
    let folderName: string
    let userId: string

    if (staffUser) {
      bucketName = 'staff'
      folderName = 'staff_social'
      userId = staffUser.id
    } else if (managementUser) {
      bucketName = 'management'
      folderName = 'management_social'
      userId = managementUser.id
    } else if (clientUser) {
      bucketName = 'client'
      folderName = 'client_social'
      userId = clientUser.id
    } else {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File exceeds 10MB limit` },
        { status: 400 }
      )
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File is not a valid image type` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
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
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json(
        { error: `Failed to upload: ${error.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    console.log(
      `✅ User ${userId} uploaded image to ${bucketName}/${folderName}`
    )

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: any) {
    console.error('Error uploading post images:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}

