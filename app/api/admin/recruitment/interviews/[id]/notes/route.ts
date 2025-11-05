/**
 * Admin Notes API
 * PATCH /api/admin/recruitment/interviews/[id]/notes
 * 
 * Admin adds notes to an interview
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params
    
    // Verify admin is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is an admin
    if (session.user.role?.toUpperCase() !== 'ADMIN' && session.user.role?.toUpperCase() !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    const body = await request.json()
    const { notes } = body

    if (!notes || !notes.trim()) {
      return NextResponse.json({ error: 'Notes content is required' }, { status: 400 })
    }

    console.log(`📝 [ADMIN] Adding notes to interview ${id}`)

    // Fetch existing interview
    const existing = await prisma.interview_requests.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    // Append to existing admin notes with timestamp
    const timestamp = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    })
    const trimmedNotes = notes.trim()
    const existingAdminNotes = existing.adminNotes?.trim() || ''
    const newNote = existingAdminNotes ? `\n\n${timestamp} - ${trimmedNotes}` : `${timestamp} - ${trimmedNotes}`
    const updatedAdminNotes = existingAdminNotes + newNote

    // Update admin notes
    const interview = await prisma.interview_requests.update({
      where: { id },
      data: {
        adminNotes: updatedAdminNotes,
        updatedAt: new Date()
      }
    })

    console.log(`✅ [ADMIN] Notes added to interview: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Notes added successfully',
      interview
    })
  } catch (error) {
    console.error('❌ [ADMIN] Error adding notes:', error)
    return NextResponse.json(
      { error: 'Failed to add notes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

