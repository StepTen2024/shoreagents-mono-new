import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCandidateById } from "@/lib/bpoc-db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    console.log('🔍 [VERIFY EMAIL] Checking email:', email)

    // Check if email matches any job acceptance
    const jobAcceptance = await prisma.job_acceptances.findFirst({
      where: {
        candidateEmail: email,
        staffUserId: null // Not yet linked to a staff account
      },
      include: {
        company: true,
        interview_requests: true
      },
      orderBy: {
        createdAt: 'desc' // Get most recent
      }
    })

    if (!jobAcceptance) {
      console.log('❌ [VERIFY EMAIL] No job acceptance found for:', email)
      return NextResponse.json({
        success: true,
        matched: false,
        message: "Email not found in job offers"
      })
    }

    console.log('✅ [VERIFY EMAIL] Job acceptance found:', {
      id: jobAcceptance.id,
      company: jobAcceptance.company.companyName,
      position: jobAcceptance.position
    })

    // Get candidate data from BPOC
    let candidateName = jobAcceptance.interview_requests?.candidateFirstName
    let candidateLastName = jobAcceptance.interview_requests?.candidateLastName
    let phone = null

    if (jobAcceptance.interview_requests?.bpocCandidateId) {
      try {
        const candidate = await getCandidateById(jobAcceptance.interview_requests.bpocCandidateId)
        if (candidate) {
          candidateName = candidate.first_name
          candidateLastName = candidate.last_name
          phone = candidate.phone
          console.log('✅ [VERIFY EMAIL] BPOC candidate data fetched:', {
            name: `${candidateName} ${candidateLastName}`,
            phone
          })
        }
      } catch (error) {
        console.error('❌ [VERIFY EMAIL] Error fetching BPOC candidate:', error)
      }
    }

    const fullName = candidateLastName 
      ? `${candidateName} ${candidateLastName}` 
      : candidateName

    return NextResponse.json({
      success: true,
      matched: true,
      company: jobAcceptance.company.companyName,
      position: jobAcceptance.position,
      candidateName: fullName,
      phone: phone,
      jobAcceptanceId: jobAcceptance.id,
      startDate: jobAcceptance.preferredStartDate
    })

  } catch (error) {
    console.error("[VERIFY EMAIL] Error:", error)
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    )
  }
}

