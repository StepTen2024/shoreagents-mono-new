/**
 * Candidate Offer Details API
 * GET /api/offer/details?jobId=xxx
 * 
 * Fetch job offer details for candidate to review
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    console.log(`🔍 [OFFER] Fetching offer details: ${jobId}`)

    // Find the job acceptance with all related data
    const jobAcceptance = await prisma.job_acceptances.findUnique({
      where: { id: jobId },
      include: {
        interview_requests: {
          include: {
            client_users: {
              include: {
                company: true
              }
            }
          }
        },
        company: true
      }
    })

    if (!jobAcceptance) {
      return NextResponse.json({ error: 'Job offer not found' }, { status: 404 })
    }

    const interviewRequest = jobAcceptance.interview_requests

    // Check status
    const canRespond = interviewRequest?.status === 'OFFER_SENT'
    const alreadyResponded = interviewRequest?.status === 'OFFER_ACCEPTED' || interviewRequest?.status === 'OFFER_DECLINED'

    return NextResponse.json({
      success: true,
      offer: {
        id: jobAcceptance.id,
        position: jobAcceptance.position,
        company: {
          id: jobAcceptance.company.id,
          name: jobAcceptance.company.companyName,
          industry: jobAcceptance.company.industry,
        },
        candidateEmail: jobAcceptance.candidateEmail,
        candidatePhone: jobAcceptance.candidatePhone,
        clientPreferredStart: interviewRequest?.clientPreferredStart,
        finalStartDate: interviewRequest?.finalStartDate,
        offerSentAt: interviewRequest?.offerSentAt,
        status: interviewRequest?.status,
        canRespond,
        alreadyResponded,
        responseDate: interviewRequest?.offerResponseAt,
      }
    })
  } catch (error) {
    console.error('❌ [OFFER] Error fetching offer details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offer details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

