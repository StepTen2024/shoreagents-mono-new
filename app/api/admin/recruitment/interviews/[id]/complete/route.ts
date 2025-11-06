import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    console.log(`✅ [ADMIN] Marking interview ${id} as completed`)

    // Fetch existing interview to get current notes
    const existing = await prisma.interview_requests.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Add completion note to admin notes
    const timestamp = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    })
    const existingAdminNotes = existing.adminNotes?.trim() || ''
    const completionNote = `(Completed) ${timestamp} - Interview marked as completed by admin`
    const updatedAdminNotes = existingAdminNotes 
      ? `${existingAdminNotes}\n\n${completionNote}` 
      : completionNote

    // Update interview status to COMPLETED and add note
    const interview = await prisma.interview_requests.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        adminNotes: updatedAdminNotes,
        updatedAt: new Date()
      }
    })

    console.log(`✅ [ADMIN] Interview marked as completed: ${id}`)

    return NextResponse.json({ 
      success: true, 
      interview 
    })
  } catch (error) {
    console.error('❌ Error marking interview as completed:', error)
    return NextResponse.json(
      { error: 'Failed to mark interview as completed' },
      { status: 500 }
    )
  }
}



