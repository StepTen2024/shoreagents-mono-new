import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// GET: Fetch single document by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const documentId = id

    // Get document with staffUser relation
    const document = await prisma.documents.findUnique({
      where: { id: documentId },
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

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    console.log(`📄 [CLIENT] Fetched document ${documentId}`)

    return NextResponse.json(document, { status: 200 })
  } catch (error: any) {
    console.error('❌ [CLIENT] Error fetching document:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Delete document by ID (Client-only documents)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const documentId = id

    // Get document to check ownership and get fileUrl
    const document = await prisma.documents.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Only allow clients to delete their own documents (source = CLIENT)
    // AND the document must be uploaded by their company
    if (document.source !== 'CLIENT' || document.uploadedBy !== clientUser.company.companyName) {
      return NextResponse.json({ 
        error: "Unauthorized - You can only delete documents uploaded by your company" 
      }, { status: 403 })
    }

    // Delete file from Supabase Storage if it exists
    if (document.fileUrl) {
      try {
        // Extract the file path from the URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/client/client_docs/[companyId]/[timestamp]-[filename]
        const urlParts = document.fileUrl.split('/storage/v1/object/public/client/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          
          console.log(`🗑️ [CLIENT] Deleting file from Supabase: ${filePath}`)
          
          const { error: deleteError } = await supabaseAdmin.storage
            .from('client')
            .remove([filePath])
          
          if (deleteError) {
            console.error('❌ [CLIENT] Supabase deletion error:', deleteError)
            // Continue with database deletion even if storage deletion fails
          } else {
            console.log('✅ [CLIENT] File deleted from Supabase storage')
          }
        }
      } catch (storageError) {
        console.error('❌ [CLIENT] Error deleting from storage:', storageError)
        // Continue with database deletion
      }
    }

    // Delete document from database
    await prisma.documents.delete({
      where: { id: documentId }
    })

    console.log(`✅ [CLIENT] Document ${documentId} deleted successfully`)

    return NextResponse.json({ 
      success: true,
      message: "Document deleted successfully" 
    }, { status: 200 })
  } catch (error: any) {
    console.error('❌ [CLIENT] Error deleting document:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
