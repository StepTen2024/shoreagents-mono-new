import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"
import CloudConvert from 'cloudconvert'
import { randomUUID } from "crypto"

// GET /api/documents - Fetch all documents for current staff user (own + client uploads)
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get StaffUser record using authUserId (include company info)
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Fetch documents with proper filtering based on source and approval status:
    // 1. Staff's own uploads (any status - they can see their pending/rejected docs)
    // 2. CLIENT documents - APPROVED only, for their company
    // 3. ADMIN documents - APPROVED only, for all staff (company policies/SOPs)
    const documents = await prisma.documents.findMany({
      where: {
        OR: [
          // Staff's own uploads - show ALL statuses (pending, approved, rejected)
          { staffUserId: staffUser.id },
          
          // CLIENT documents (APPROVED only) - shared with ALL staff in the same company
          {
            uploadedByRole: 'CLIENT',
            status: 'APPROVED',
            sharedWithAll: true,
            uploadedBy: staffUser.company?.companyName  // Match by company name
          },
          
          // CLIENT documents (APPROVED only) - specifically shared with this user
          {
            uploadedByRole: 'CLIENT',
            status: 'APPROVED',
            sharedWith: { has: staffUser.id }
          },
          
          // ADMIN documents (APPROVED only) - shared with all staff (policies, SOPs)
          {
            uploadedByRole: 'ADMIN',
            status: 'APPROVED',
            sharedWithAll: true
          },
          
          // ADMIN documents (APPROVED only) - specifically shared with this user
          {
            uploadedByRole: 'ADMIN',
            status: 'APPROVED',
            sharedWith: { has: staffUser.id }
          }
        ]
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

    console.log(`📚 [STAFF] Fetched ${documents.length} documents for staff user ${staffUser.id} (${staffUser.name}, Company: ${staffUser.company?.companyName})`)

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}

// POST /api/documents - Upload new document (staff-side)
// Documents are automatically shared with assigned clients
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get StaffUser record using authUserId
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, name: true, companyId: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Parse FormData
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const categoryString = formData.get('category') as string

    if (!title || !categoryString) {
      return NextResponse.json(
        { error: "Title and category are required" },
        { status: 400 }
      )
    }

    // Validate category is a valid DocumentCategory
    const validCategories = ['CLIENT', 'TRAINING', 'PROCEDURE', 'CULTURE', 'SEO', 'OTHER']
    if (!validCategories.includes(categoryString)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      )
    }
    const category = categoryString as "CLIENT" | "TRAINING" | "PROCEDURE" | "CULTURE" | "SEO" | "OTHER"

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
          console.log('✅ Text file read directly, length:', content.length)
        } 
        // For PDF, DOC, DOCX - use CloudConvert
        else if (fileExt === '.pdf' || fileExt === '.doc' || fileExt === '.docx') {
          console.log('☁️ Starting CloudConvert extraction for', fileName)
          
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

          console.log('📤 CloudConvert job created:', job.id)

          // Get upload task
          const uploadTask = job.tasks.filter((task) => task.name === 'upload-file')[0]
          
          // Upload file
          const buffer = Buffer.from(fileBuffer)
          await cloudConvert.tasks.upload(uploadTask, buffer, fileName)
          console.log('✅ File uploaded to CloudConvert')

          // Wait for job to complete
          console.log('⏳ Waiting for conversion to complete...')
          const completedJob = await cloudConvert.jobs.wait(job.id)
          
          // Get export task
          const exportTask = completedJob.tasks.filter(
            (task) => task.name === 'export-txt'
          )[0]

          if (exportTask?.result?.files?.[0]?.url) {
            const txtUrl = exportTask.result.files[0].url
            console.log('⬇️ Downloading extracted text from:', txtUrl)
            
            // Download extracted text
            const response = await fetch(txtUrl)
            content = await response.text()
            console.log('✅ Text extracted successfully, length:', content.length)
          } else {
            console.error('❌ No export URL found')
            content = `[File: ${fileName}]`
          }
        } else {
          // Unsupported file type
          content = `[Unsupported file type: ${fileExt}]`
        }
      } catch (err) {
        console.error("Error extracting text:", err)
        content = `[File: ${fileName} - Extraction failed]`
      }
    }

    // Upload original file to Supabase Storage
    let fileUrl: string | null = null
    if (file) {
      try {
        const fileName = file.name
        const fileExt = fileName.split('.').pop()?.toLowerCase()
        const timestamp = Date.now()
        const uniqueFileName = `staff_docs/${staffUser.id}/${timestamp}-${fileName}`
        
        // Detect proper MIME type
        const mimeTypes: Record<string, string> = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'txt': 'text/plain',
          'md': 'text/markdown'
        }
        const contentType = mimeTypes[fileExt || ''] || file.type || 'application/pdf'
        
        console.log('📤 [STAFF] Uploading to Supabase:', {
          fileName,
          contentType,
          path: uniqueFileName
        })
        
        // Convert file to buffer for Supabase
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)
        
        // Upload to staff bucket -> staff_docs folder
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('staff')
          .upload(uniqueFileName, fileBuffer, {
            contentType,
            upsert: false
          })
        
        if (uploadError) {
          console.error('❌ [STAFF] Supabase upload FAILED:', {
            error: uploadError.message,
            fileName
          })
        } else {
          // Get public URL
          const { data: urlData } = supabaseAdmin.storage
            .from('staff')
            .getPublicUrl(uniqueFileName)
          
          fileUrl = urlData.publicUrl
          console.log('✅ [STAFF] File uploaded SUCCESS:', {
            bucket: 'staff',
            path: uniqueFileName,
            url: fileUrl
          })
        }
      } catch (storageError: any) {
        console.error('❌ [STAFF] Storage upload exception:', storageError)
      }
    }

    // Auto-share with assigned company (always)
    let sharedWith: string[] = []
    if (staffUser.companyId) {
      sharedWith = [staffUser.companyId]
      console.log('📤 [STAFF] Auto-sharing with assigned client company:', staffUser.companyId)
    }

    // Create the document
    const document = await prisma.documents.create({
      data: {
        id: randomUUID(),
        staffUserId: staffUser.id,
        title,
        category,
        source: 'STAFF',  // Legacy field
        uploadedByRole: 'STAFF',  // Who uploaded it
        status: 'PENDING',  // Needs client approval before staff can use it
        content,
        uploadedBy: staffUser.name,
        size: fileSize,
        fileUrl,
        sharedWithAll: false,  // For STAFF docs, use sharedWith array
        sharedWith,
        updatedAt: new Date()
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
      }
    })

    // TODO: Check if this staff member is assigned to any clients
    // Documents can be shared with clients later via sharedWith field
    
    return NextResponse.json({
      document,
      message: "Document created successfully"
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    )
  }
}

