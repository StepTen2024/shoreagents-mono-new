import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import CloudConvert from "cloudconvert"
import { randomUUID } from "crypto"
import { processDocumentForRAG } from "@/lib/document-processor"

// GET: Fetch all admin documents
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get admin user
    const adminUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, name: true, role: true }
    })

    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    }

    // Fetch all documents where source = 'ADMIN'
    const documents = await prisma.documents.findMany({
      where: {
        source: 'ADMIN'
      },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📋 [ADMIN] Fetched ${documents.length} admin documents`)

    return NextResponse.json(documents, { status: 200 })
  } catch (error: any) {
    console.error('❌ [ADMIN] Error fetching documents:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Upload a new admin document with CloudConvert
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get admin/management user
    const adminUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, name: true }
    })

    // If not management user, try staff user (for staff who have admin access)
    let staffUserId: string
    let uploaderName: string
    
    if (adminUser) {
      // For management users, we'll use a placeholder staff user or create association differently
      // For now, find any staff user to satisfy the foreign key requirement
      const anyStaffUser = await prisma.staff_users.findFirst({
        select: { id: true }
      })
      
      if (!anyStaffUser) {
        return NextResponse.json({ 
          error: "No staff users found in system. At least one staff user is required to upload documents." 
        }, { status: 400 })
      }
      
      staffUserId = anyStaffUser.id
      uploaderName = adminUser.name
    } else {
      // Try to get as staff user
      const staffUser = await prisma.staff_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true }
      })
      
      if (!staffUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      
      staffUserId = staffUser.id
      uploaderName = staffUser.name
    }

    // Parse FormData
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const categoryString = formData.get('category') as string
    const sharedWithAllString = formData.get('sharedWithAll') as string
    const sharedWithString = formData.get('sharedWith') as string // JSON array of user IDs

    if (!title || !categoryString) {
      return NextResponse.json(
        { error: "Title and category are required" },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['CLIENT', 'TRAINING', 'PROCEDURE', 'CULTURE', 'SEO', 'OTHER']
    if (!validCategories.includes(categoryString)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      )
    }
    const category = categoryString as "CLIENT" | "TRAINING" | "PROCEDURE" | "CULTURE" | "SEO" | "OTHER"

    // Parse sharing options
    const sharedWithAll = sharedWithAllString === 'true'
    const sharedWith = sharedWithString ? JSON.parse(sharedWithString) : []

    // Extract text content from file using CloudConvert
    let content = ""
    let fileSize = "0 KB"
    
    if (file) {
      fileSize = `${(file.size / 1024).toFixed(2)} KB`
      const fileName = file.name
      const fileExt = '.' + fileName.split('.').pop()?.toLowerCase()
      
      try {
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = new Uint8Array(arrayBuffer)

        // For TXT and MD files, read directly (no conversion needed)
        if (fileExt === '.txt' || fileExt === '.md') {
          const buffer = Buffer.from(fileBuffer)
          content = buffer.toString('utf-8')
          console.log('✅ [ADMIN] Text file read directly, length:', content.length)
        } 
        // For PDF, DOC, DOCX - use CloudConvert
        else if (fileExt === '.pdf' || fileExt === '.doc' || fileExt === '.docx') {
          console.log('☁️ [ADMIN] Starting CloudConvert extraction for', fileName)
          
          // Initialize CloudConvert
          const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY!)
          
          // Create conversion job
          const job = await cloudConvert.jobs.create({
            tasks: {
              'upload-file': {
                operation: 'import/upload',
              },
              'convert-to-txt': {
                operation: 'convert',
                input: 'upload-file',
                output_format: 'txt',
                engine: fileExt === '.pdf' ? 'pdftotext' : undefined,
              },
              'export-txt': {
                operation: 'export/url',
                input: 'convert-to-txt',
              },
            },
          })

          // Upload file to CloudConvert
          const uploadTask = job.tasks?.find((task: any) => task.operation === 'import/upload')
          if (!uploadTask || !uploadTask.result?.form) {
            throw new Error('CloudConvert upload task not found')
          }

          // Create FormData for CloudConvert upload
          const uploadFormData = new FormData()
          Object.entries(uploadTask.result.form.parameters as Record<string, string>).forEach(([key, value]) => {
            uploadFormData.append(key, value)
          })
          uploadFormData.append('file', new Blob([fileBuffer]), fileName)

          // Upload to CloudConvert
          const uploadResponse = await fetch(uploadTask.result.form.url, {
            method: 'POST',
            body: uploadFormData,
          })

          if (!uploadResponse.ok) {
            throw new Error(`CloudConvert upload failed: ${uploadResponse.statusText}`)
          }

          console.log('⏳ [ADMIN] Waiting for CloudConvert to complete conversion...')

          // Wait for job completion
          let completedJob = await cloudConvert.jobs.wait(job.id)
          
          // Get the export task
          const exportTask = completedJob.tasks?.find((task: any) => task.operation === 'export/url')
          if (!exportTask?.result?.files?.[0]?.url) {
            throw new Error('CloudConvert export URL not found')
          }

          // Download the converted text
          const textResponse = await fetch(exportTask.result.files[0].url)
          if (!textResponse.ok) {
            throw new Error(`Failed to download converted text: ${textResponse.statusText}`)
          }

          content = await textResponse.text()
          console.log('✅ [ADMIN] CloudConvert extraction complete, text length:', content.length)
        } else {
          return NextResponse.json(
            { error: "Unsupported file type. Please upload PDF, DOC, DOCX, TXT, or MD files." },
            { status: 400 }
          )
        }
      } catch (conversionError: any) {
        console.error('❌ [ADMIN] File conversion error:', conversionError)
        return NextResponse.json(
          { error: `File conversion failed: ${conversionError.message}` },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      )
    }

    // Upload original file to Supabase Storage
    let fileUrl: string | null = null
    try {
      const fileName = file.name
      const fileExt = fileName.split('.').pop()?.toLowerCase()
      const timestamp = Date.now()
      const uniqueFileName = `management_docs/${adminUser?.id || staffUserId}/${timestamp}-${fileName}`
      
      // Detect proper MIME type
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'md': 'text/markdown'
      }
      const contentType = mimeTypes[fileExt || ''] || file.type || 'application/pdf'
      
      console.log('📤 [ADMIN] Uploading to Supabase:', {
        fileName,
        contentType,
        path: uniqueFileName
      })
      
      // Convert file to buffer for Supabase
      const arrayBuffer = await file.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)
      
      // Upload to management bucket -> management_docs folder
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('management')
        .upload(uniqueFileName, fileBuffer, {
          contentType,
          upsert: false
        })
      
      if (uploadError) {
        console.error('❌ [ADMIN] Supabase upload FAILED:', {
          error: uploadError.message,
          fileName
        })
      } else {
        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('management')
          .getPublicUrl(uniqueFileName)
        
        fileUrl = urlData.publicUrl
        console.log('✅ [ADMIN] File uploaded SUCCESS:', {
          bucket: 'management',
          path: uniqueFileName,
          url: fileUrl
        })
      }
    } catch (storageError: any) {
      console.error('❌ [ADMIN] Storage upload exception:', storageError)
    }

    // Create document in database
    const now = new Date()
    const document = await prisma.documents.create({
      data: {
        id: randomUUID(),
        title,
        category,
        uploadedBy: uploaderName,
        size: fileSize,
        content,
        fileUrl,
        staffUserId,
        source: 'ADMIN',
        sharedWithAll,
        sharedWith,
        createdAt: now,
        updatedAt: now
      }
    })

    console.log(`✅ [ADMIN] Document created:`, {
      id: document.id,
      title: document.title,
      source: document.source,
      sharedWithAll: document.sharedWithAll,
      sharedWith: document.sharedWith.length
    })

    // 🚀 Auto-process document for RAG if it has content
    if (document.content && document.content.trim().length > 0) {
      console.log(`🤖 [RAG] Queueing admin document "${title}" for embedding generation`)
      // Process asynchronously (don't block the response)
      processDocumentForRAG(document.id).catch((ragError) => {
        console.error(`❌ [RAG] Failed to process document for RAG:`, ragError)
      })
    } else {
      console.log(`ℹ️ [RAG] Document "${title}" has no content, skipping RAG processing`)
    }

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    console.error('❌ [ADMIN] Document upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
