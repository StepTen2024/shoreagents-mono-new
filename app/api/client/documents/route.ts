import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import CloudConvert from 'cloudconvert'
import { randomUUID } from "crypto"

// GET - Fetch documents for client: own uploads + staff documents shared with them
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ClientUser
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Get all staff assigned to this company
    const staffUsers = await prisma.staff_users.findMany({
      where: { companyId: clientUser.company.id },
      select: { id: true }
    })

    const staffUserIds = staffUsers.map((s) => s.id)

    // Fetch documents:
    // 1. Client's own uploads (source=CLIENT)
    // 2. Staff documents that are shared (sharedWithAll=true or client in sharedWith)
    // 3. Admin documents that are shared (sharedWithAll=true or client in sharedWith)
    const documents = await prisma.documents.findMany({
      where: {
        OR: [
          // Client's own documents
          { source: 'CLIENT' },
          // Staff documents shared with all
          { 
            staffUserId: { in: staffUserIds },
            source: 'STAFF',
            sharedWithAll: true
          },
          // Staff documents shared with this specific client
          {
            staffUserId: { in: staffUserIds },
            source: 'STAFF',
            sharedWith: { has: clientUser.company.id }
          },
          // Admin documents shared with all
          {
            source: 'ADMIN',
            sharedWithAll: true
          },
          // Admin documents shared with this specific client
          {
            source: 'ADMIN',
            sharedWith: { has: clientUser.company.id }
          }
        ],
      },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform for client display
    const transformedDocs = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      category: doc.category.toLowerCase().replace("_", "-"),
      description: doc.content?.substring(0, 150) || "No description available",
      uploadedBy: doc.uploadedBy,
      uploadedByUser: doc.staff_users,
      size: doc.size,
      fileUrl: doc.fileUrl,
      lastUpdated: doc.updatedAt.toISOString().split("T")[0],
      createdAt: doc.createdAt.toISOString(),
      views: 0, // TODO: Add view tracking
      isStaffUpload: staffUserIds.includes(doc.staffUserId),
      source: doc.source, // Include source for badge display
      status: doc.status, // Include approval status
      approvedBy: doc.approvedBy,
      approvedAt: doc.approvedAt,
      rejectionNote: doc.rejectionNote,
    }))

    // Get category counts
    const categoryCounts = transformedDocs.reduce(
      (acc, doc) => {
        const cat = doc.category
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      documents: transformedDocs,
      categoryCounts,
      totalCount: transformedDocs.length,
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

// POST - Upload new document from client with CloudConvert
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const sharedWithAllStr = formData.get('sharedWithAll') as string
    const sharedWithStr = formData.get('sharedWith') as string

    if (!title || !category || !file) {
      return NextResponse.json(
        { error: "Title, category, and file are required" },
        { status: 400 }
      )
    }

    // Parse sharing settings
    const sharedWithAll = sharedWithAllStr === 'true'
    let sharedWith: string[] = []
    
    if (!sharedWithAll && sharedWithStr) {
      try {
        sharedWith = JSON.parse(sharedWithStr)
      } catch (e) {
        console.error('Failed to parse sharedWith:', e)
      }
    }

    console.log(`📤 [CLIENT] Document upload request:`, {
      title,
      category,
      sharedWithAll,
      specificStaffCount: sharedWith.length,
      fileSize: file.size
    })

    // Get ClientUser
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      console.error(`❌ [CLIENT] Client user not found for email: ${session.user.email}`)
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    console.log(`✅ [CLIENT] Client user found: ${clientUser.name} (Company: ${clientUser.company.companyName})`)

    // Get first staff assigned to this client (for storing in staffUserId relation)
    const firstStaff = await prisma.staff_users.findFirst({
      where: {
        companyId: clientUser.company.id
      }
    })

    if (!firstStaff) {
      console.error(`❌ [CLIENT] No staff assigned to company: ${clientUser.company.id}`)
      return NextResponse.json({ 
        error: "No staff members are assigned to your company yet. Please contact your administrator to assign staff before uploading documents." 
      }, { status: 400 })
    }

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

        // For TXT and MD files, read directly
        if (fileExt === '.txt' || fileExt === '.md') {
          const buffer = Buffer.from(fileBuffer)
          content = buffer.toString('utf-8')
          console.log('✅ [CLIENT] Text file read directly, length:', content.length)
        } 
        // For PDF, DOC, DOCX - use CloudConvert
        else if (fileExt === '.pdf' || fileExt === '.doc' || fileExt === '.docx') {
          console.log('☁️ [CLIENT] Starting CloudConvert extraction for', fileName)
          
          const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY!)
          
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

          console.log('📤 [CLIENT] CloudConvert job created:', job.id)

          const uploadTask = job.tasks.filter((task) => task.name === 'upload-file')[0]
          const buffer = Buffer.from(fileBuffer)
          await cloudConvert.tasks.upload(uploadTask, buffer, fileName)
          console.log('✅ [CLIENT] File uploaded to CloudConvert')

          console.log('⏳ [CLIENT] Waiting for conversion...')
          const completedJob = await cloudConvert.jobs.wait(job.id)
          
          const exportTask = completedJob.tasks.filter(
            (task) => task.name === 'export-txt'
          )[0]

          if (exportTask?.result?.files?.[0]?.url) {
            const txtUrl = exportTask.result.files[0].url
            console.log('⬇️ [CLIENT] Downloading extracted text')
            
            const response = await fetch(txtUrl)
            content = await response.text()
            console.log('✅ [CLIENT] Text extracted, length:', content.length)
          } else {
            console.error('❌ [CLIENT] No export URL found')
            content = `[File: ${fileName}]`
          }
        } else {
          content = `[Unsupported file type: ${fileExt}]`
        }
      } catch (err) {
        console.error("[CLIENT] Error extracting text:", err)
        content = `[File: ${fileName} - Extraction failed]`
      }
    }

    // Upload original file to Supabase Storage
    let fileUrl: string | null = null
    let uploadStatus = {
      success: false,
      message: '',
      path: ''
    }
    
    if (file) {
      try {
        const fileName = file.name
        const fileExt = fileName.split('.').pop()?.toLowerCase()
        const timestamp = Date.now()
        const uniqueFileName = `client_docs/${clientUser.company.id}/${timestamp}-${fileName}`
        
        // Detect proper MIME type
        const mimeTypes: Record<string, string> = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'txt': 'text/plain',
          'md': 'text/markdown'
        }
        const contentType = mimeTypes[fileExt || ''] || file.type || 'application/octet-stream'
        
        console.log('📤 [CLIENT] Uploading to Supabase:', {
          fileName,
          fileExt,
          contentType,
          size: file.size,
          path: uniqueFileName
        })
        
        // Convert file to buffer for Supabase
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)
        
        // Upload to client bucket -> client_docs folder
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('client')
          .upload(uniqueFileName, fileBuffer, {
            contentType,
            upsert: false
          })
        
        if (uploadError) {
          console.error('❌ [CLIENT] Supabase upload FAILED:', {
            error: uploadError.message,
            status: uploadError.status,
            fileName
          })
          uploadStatus.success = false
          uploadStatus.message = `Storage upload failed: ${uploadError.message}`
        } else {
          // Get public URL
          const { data: urlData } = supabaseAdmin.storage
            .from('client')
            .getPublicUrl(uniqueFileName)
          
          fileUrl = urlData.publicUrl
          uploadStatus.success = true
          uploadStatus.message = 'File uploaded successfully to client bucket (client_docs folder)'
          uploadStatus.path = uniqueFileName
          
          console.log('✅ [CLIENT] File uploaded to Supabase SUCCESS:', {
            bucket: 'client',
            path: uniqueFileName,
            url: fileUrl
          })
        }
      } catch (storageError: any) {
        console.error('❌ [CLIENT] Storage upload exception:', storageError)
        uploadStatus.success = false
        uploadStatus.message = `Upload exception: ${storageError.message}`
      }
    }

    // For CLIENT documents:
    // - If sharedWithAll is true, we'll use that flag + uploadedBy (company name) for dynamic matching
    // - If specific staff are selected, use the sharedWith array
    
    // Create document with CLIENT source
    const now = new Date()
    const document = await prisma.documents.create({
      data: {
        id: randomUUID(),
        staffUserId: firstStaff.id, // Use first staff as placeholder for relation
        title,
        category,
        source: 'CLIENT',  // Mark as client upload
        content,
        size: fileSize,
        fileUrl,
        uploadedBy: clientUser.company.companyName,  // Store company name for dynamic filtering
        sharedWithAll: sharedWithAll,  // TRUE = all staff in this company, FALSE = specific staff only
        sharedWith: sharedWith,  // Array of specific staff user IDs (used when sharedWithAll is false)
        createdAt: now,
        updatedAt: now
      },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    console.log('✅ [CLIENT] Document created:', {
      id: document.id,
      title: document.title,
      fileUrl: document.fileUrl ? 'YES' : 'NO',
      storageStatus: uploadStatus.message,
      company: clientUser.company.companyName,
      shareMode: sharedWithAll ? 'ALL_COMPANY_STAFF' : `SPECIFIC (${sharedWith.length} users)`
    })

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        category: document.category.toLowerCase(),
        uploadedBy: document.uploadedBy,
        uploadedByUser: document.staff_users,
        lastUpdated: document.updatedAt.toISOString().split("T")[0],
        createdAt: document.createdAt.toISOString(),
        fileUrl: document.fileUrl,
      },
      storage: uploadStatus
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CLIENT] Error creating document:", error)
    const errorMessage = error.message || "Failed to create document"
    const errorDetails = error.stack || error.toString()
    console.error("[CLIENT] Error details:", errorDetails)
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 })
  }
}


