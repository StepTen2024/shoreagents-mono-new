import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET: Fetch all comments for a document
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const documentId = id

    // Verify document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { 
        id: true, 
        source: true,
        staffUserId: true,
        sharedWithAll: true,
        sharedWith: true
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Fetch comments
    const comments = await prisma.document_comments.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' }
    })

    console.log(`📝 [COMMENTS] Fetched ${comments.length} comments for document ${documentId}`)

    return NextResponse.json(comments, { status: 200 })
  } catch (error: any) {
    console.error('❌ [COMMENTS] Error fetching comments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Create a new comment on a document
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const documentId = id
    const { content } = await req.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    // Verify document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { 
        id: true, 
        source: true,
        staffUserId: true,
        sharedWithAll: true,
        sharedWith: true
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Determine user type and get user info
    let userType: 'STAFF' | 'CLIENT' | 'ADMIN' = 'STAFF'
    let userName = session.user.name || 'Unknown User'
    let userAvatar = session.user.image || null
    let userId = session.user.id

    // Check if user is management (admin)
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, name: true, avatar: true, role: true }
    })

    if (managementUser) {
      // Admin users should NOT be able to comment (view-only)
      return NextResponse.json(
        { error: "Admin users can only view documents, not comment" },
        { status: 403 }
      )
    }

    // Check if user is staff
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, name: true, avatar: true }
    })

    if (staffUser) {
      userType = 'STAFF'
      userName = staffUser.name
      userAvatar = staffUser.avatar
      userId = staffUser.id

      // Verify staff has access to this document
      const hasAccess = 
        document.staffUserId === staffUser.id ||
        document.sharedWithAll ||
        document.sharedWith.includes(staffUser.id)

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    } else {
      // Check if user is client
      const clientUser = await prisma.client_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true, avatar: true, companyId: true }
      })

      if (clientUser) {
        userType = 'CLIENT'
        userName = clientUser.name
        userAvatar = clientUser.avatar
        userId = clientUser.id

        // Verify client has access to this document
        const hasAccess = 
          document.source === 'CLIENT' || // Client's own docs
          document.sharedWithAll ||
          document.sharedWith.includes(clientUser.companyId)

        if (!hasAccess) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
    }

    // Create comment
    const comment = await prisma.document_comments.create({
      data: {
        documentId,
        content: content.trim(),
        userId,
        userType,
        userName,
        userAvatar
      }
    })

    console.log(`✅ [COMMENTS] Comment created:`, {
      id: comment.id,
      documentId,
      userType,
      userName
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error: any) {
    console.error('❌ [COMMENTS] Error creating comment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

