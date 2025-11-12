import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

// POST /api/client/upload - Upload client file with proper authentication
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as 'avatar' | 'cover'

    if (!file || !type) {
      return NextResponse.json({ error: "File and type are required" }, { status: 400 })
    }

    // Validate file type
    if (!['avatar', 'cover'].includes(type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only JPEG, PNG, and WebP are allowed" 
      }, { status: 400 })
    }

    // Delete old file if it exists
    const currentFileUrl = type === 'avatar' ? clientUser.avatar : clientUser.coverPhoto
    if (currentFileUrl) {
      try {
        // Extract file path from URL - more robust parsing
        const url = new URL(currentFileUrl)
        const pathParts = url.pathname.split('/')
        
        // Find the client bucket and extract the file path
        const clientIndex = pathParts.findIndex(part => part === 'client')
        if (clientIndex !== -1 && clientIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(clientIndex + 1).join('/')
          
          console.log('Deleting old client file from path:', filePath)
          const { error: deleteError } = await supabaseAdmin.storage
            .from('client')
            .remove([filePath])
          
          if (deleteError) {
            console.warn('Failed to delete old client file:', deleteError)
          } else {
            console.log('Old client file deleted successfully:', filePath)
          }
        } else {
          console.warn('Could not parse file path from URL:', currentFileUrl)
        }
      } catch (deleteError) {
        console.warn('Error deleting old client file:', deleteError)
        // Continue with upload even if delete fails
      }
    }

    // Generate file path with proper folder structure
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const folder = type === 'avatar' ? 'client_avatar' : 'client_cover'
    const fileName = type === 'avatar' ? `avatar_${timestamp}.${fileExt}` : `cover_${timestamp}.${fileExt}`
    const filePath = `${folder}/${clientUser.id}/${fileName}`

    // Upload to Supabase storage using service role key
    const { data, error } = await supabaseAdmin.storage
      .from('client')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json(
        { error: `Failed to upload file: ${error.message}` }, 
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('client')
      .getPublicUrl(filePath)

    // Update client user in database
    const updateData = type === 'avatar' 
      ? { avatar: publicUrl }
      : { coverPhoto: publicUrl }

    await prisma.client_users.update({
      where: { id: clientUser.id },
      data: updateData
    })

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      type: type
    })

  } catch (error: any) {
    console.error("❌ Error uploading client file:", error)
    return NextResponse.json(
      { error: "Failed to upload file", details: error?.message },
      { status: 500 }
    )
  }
}
