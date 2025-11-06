import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST /api/client/company/upload - Upload company file with proper authentication
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser and their company
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser || !clientUser.company) {
      return NextResponse.json({ error: "Unauthorized - Not a client user or no company found" }, { status: 401 })
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as 'logo' | 'cover'

    if (!file || !type) {
      return NextResponse.json({ error: "File and type are required" }, { status: 400 })
    }

    // Validate file type
    if (!['logo', 'cover'].includes(type)) {
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
    const currentFileUrl = type === 'logo' ? clientUser.company.logo : clientUser.company.coverPhoto
    if (currentFileUrl) {
      try {
        // Extract file path from URL - more robust parsing
        const url = new URL(currentFileUrl)
        const pathParts = url.pathname.split('/')
        
        // Find the company bucket and extract the file path
        const companyIndex = pathParts.findIndex(part => part === 'company')
        if (companyIndex !== -1 && companyIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(companyIndex + 1).join('/')
          
          console.log('Deleting old file from path:', filePath)
          const { error: deleteError } = await supabase.storage
            .from('company')
            .remove([filePath])
          
          if (deleteError) {
            console.warn('Failed to delete old file:', deleteError)
          } else {
            console.log('Old file deleted successfully:', filePath)
          }
        } else {
          console.warn('Could not parse file path from URL:', currentFileUrl)
        }
      } catch (deleteError) {
        console.warn('Error deleting old file:', deleteError)
        // Continue with upload even if delete fails
      }
    }

    // Generate file path with proper folder structure
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `company_${timestamp}.${fileExt}`
    
    let folder: string
    if (type === 'logo') {
      folder = `company_logo/${clientUser.company.id}`
    } else {
      folder = `company_cover/${clientUser.company.id}`
    }
    
    const filePath = `${folder}/${fileName}`

    // Upload to Supabase storage using service role key
    const { data, error } = await supabase.storage
      .from('company')
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
    const { data: { publicUrl } } = supabase.storage
      .from('company')
      .getPublicUrl(filePath)

    // Update company in database
    const updateData = type === 'logo' 
      ? { logo: publicUrl }
      : { coverPhoto: publicUrl }

    await prisma.company.update({
      where: { id: clientUser.company.id },
      data: updateData
    })

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      type: type
    })

  } catch (error: any) {
    console.error("❌ Error uploading company file:", error)
    return NextResponse.json(
      { error: "Failed to upload file", details: error?.message },
      { status: 500 }
    )
  }
}
