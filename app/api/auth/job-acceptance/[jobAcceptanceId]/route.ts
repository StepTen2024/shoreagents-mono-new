/**
 * Job Acceptance Public API
 * GET /api/auth/job-acceptance/[jobAcceptanceId]
 * 
 * Fetch job acceptance details for staff signup (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobAcceptanceId: string } }
) {
  try {
    const { jobAcceptanceId } = params

    if (!jobAcceptanceId) {
      return NextResponse.json({ error: 'Job acceptance ID is required' }, { status: 400 })
    }

    // Fetch job acceptance with company info
    const jobAcceptance = await prisma.job_acceptances.findUnique({
      where: { id: jobAcceptanceId },
      include: {
        company: {
          select: {
            id: true,
            companyName: true
          }
        }
      }
    })

    if (!jobAcceptance) {
      return NextResponse.json({ error: 'Job acceptance not found' }, { status: 404 })
    }

    // Check if already used
    if (jobAcceptance.staffUserId) {
      return NextResponse.json({ 
        error: 'This job acceptance link has already been used' 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      job_acceptances: {
        id: jobAcceptance.id,
        position: jobAcceptance.position,
        candidateEmail: jobAcceptance.candidateEmail,
        candidatePhone: jobAcceptance.candidatePhone,
        company: jobAcceptance.company
      }
    })
  } catch (error) {
    console.error('❌ Error fetching job acceptance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job acceptance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

