import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

// DELETE /api/client/company/delete - Delete company file with proper authentication
export async function DELETE(req: NextRequest) {
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

    const { fileUrl } = await req.json()

    if (!fileUrl) {
      return NextResponse.json({ error: "File URL is required" }, { status: 400 })
    }

    try {
      // Extract file path from URL - more robust parsing
      const url = new URL(fileUrl)
      const pathParts = url.pathname.split('/')
      
      // Find the company bucket and extract the file path
      const companyIndex = pathParts.findIndex(part => part === 'company')
      if (companyIndex !== -1 && companyIndex < pathParts.length - 1) {
        const filePath = pathParts.slice(companyIndex + 1).join('/')
        
        console.log('Deleting file from path:', filePath)
        const { error: deleteError } = await supabaseAdmin.storage
          .from('company')
          .remove([filePath])
        
        if (deleteError) {
          console.error('Failed to delete file:', deleteError)
          return NextResponse.json({ 
            error: `Failed to delete file: ${deleteError.message}` 
          }, { status: 500 })
        } else {
          console.log('File deleted successfully:', filePath)
          return NextResponse.json({ 
            success: true, 
            message: "File deleted successfully" 
          })
        }
      } else {
        console.warn('Could not parse file path from URL:', fileUrl)
        return NextResponse.json({ 
          error: "Invalid file URL format" 
        }, { status: 400 })
      }
    } catch (urlError) {
      console.error('Error parsing file URL:', urlError)
      return NextResponse.json({ 
        error: "Invalid file URL" 
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error("❌ Error deleting company file:", error)
    return NextResponse.json(
      { error: "Failed to delete file", details: error?.message },
      { status: 500 }
    )
  }
}
