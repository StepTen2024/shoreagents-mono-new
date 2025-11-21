import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { processDocumentForRAG } from "@/lib/document-processor"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, rejectionNote } = await request.json()

    // Get document
    const document = await prisma.documents.findUnique({
      where: { id: documentId },
      include: {
        staff_users: {
          select: {
            name: true,
            email: true,
            companyId: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check authorization: CLIENT can approve their staff's docs, ADMIN can approve all docs
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, name: true, email: true, companyId: true },
    })

    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, name: true, email: true },
    })

    const isAdmin = !!managementUser
    const isClientForThisStaff = clientUser && clientUser.companyId === document.staff_users.companyId

    if (!isAdmin && !isClientForThisStaff) {
      return NextResponse.json(
        { error: "You don't have permission to review this document" },
        { status: 403 }
      )
    }

    // Validate action
    if (!["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update document status
    const approverEmail = clientUser?.email || managementUser?.email || session.user.email
    const approverName = clientUser?.name || managementUser?.name || "Admin"

    const updatedDocument = await prisma.documents.update({
      where: { id: documentId },
      data: {
        status: action,
        approvedBy: approverEmail,
        approvedAt: new Date(),
        rejectionNote: action === "REJECTED" ? rejectionNote : null,
        updatedAt: new Date(),
      },
    })

    console.log(`✅ [DOCUMENT APPROVAL] ${action} by ${approverEmail}`)
    console.log(`   Document: ${document.title}`)
    console.log(`   Staff: ${document.staff_users.name}`)

    // 🚀 Auto-process newly approved document for RAG
    if (action === 'APPROVED' && updatedDocument.content && updatedDocument.content.trim().length > 0) {
      console.log(`🤖 [RAG] Queueing approved document "${document.title}" for embedding generation`)
      // Process asynchronously (don't block the response)
      processDocumentForRAG(updatedDocument.id).catch((ragError) => {
        console.error(`❌ [RAG] Failed to process document for RAG:`, ragError)
      })
    }

    // TODO: Send notification to staff user about approval/rejection
    // Can be implemented with the notifications system

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      message:
        action === "APPROVED"
          ? `Document approved! ${document.staff_users.name} can now use it.`
          : `Document rejected. ${document.staff_users.name} will need to revise it.`,
    })
  } catch (error) {
    console.error("Error approving/rejecting document:", error)
    return NextResponse.json(
      {
        error: "Failed to process document approval",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

