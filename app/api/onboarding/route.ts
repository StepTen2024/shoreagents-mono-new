import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get staff user with onboarding, profiles, and job acceptances
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        staff_onboarding: true,
        staff_profiles: true,
        job_acceptances: {
          include: {
            interview_requests: true
          }
        }
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // If no onboarding exists, create one with pre-filled data from BPOC + signup
    if (!staffUser.staff_onboarding) {
      console.log('🎯 [ONBOARDING] Creating new onboarding record with pre-filled data')
      console.log('🔍 [ONBOARDING] Staff user data:', {
        staffUserId: staffUser.id,
        userName: staffUser.name,
        userEmail: staffUser.email,
        hasJobAcceptance: !!staffUser.job_acceptances,
        hasInterviewRequest: !!staffUser.job_acceptances?.interview_requests,
        bpocCandidateId: staffUser.job_acceptances?.interview_requests?.bpocCandidateId
      })
      
      // Get BPOC candidate data if available
      let bpocData: any = null
      if (staffUser.job_acceptances?.interview_requests?.bpocCandidateId) {
        try {
          const { getCandidateById } = await import('@/lib/bpoc-db')
          bpocData = await getCandidateById(staffUser.job_acceptances.interview_requests.bpocCandidateId)
          console.log('✅ [ONBOARDING] BPOC data fetched:', {
            name: `${bpocData?.first_name} ${bpocData?.last_name}`,
            email: bpocData?.email,
            phone: bpocData?.phone,
            location: bpocData?.location_city
          })
        } catch (error) {
          console.error('❌ [ONBOARDING] Error fetching BPOC data:', error)
        }
      } else {
        console.log('ℹ️ [ONBOARDING] No BPOC data available - using staff_users data as fallback')
      }
      
      // Parse resume data for additional info
      const resumeData = bpocData?.resume_data ? 
        (typeof bpocData.resume_data === 'string' ? JSON.parse(bpocData.resume_data) : bpocData.resume_data) 
        : null
      
      // Extract name parts from staffUser.name
      const nameParts = staffUser.name.trim().split(' ')
      const defaultFirstName = nameParts[0] || staffUser.name
      const defaultLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''
      
      const onboarding = await prisma.staff_onboarding.create({
        data: {
          id: crypto.randomUUID(),
          staffUserId: staffUser.id,
          // Pre-fill from BPOC or fallback to staff_users
          email: staffUser.email || '',
          firstName: bpocData?.first_name || defaultFirstName,
          middleName: resumeData?.personal_info?.middle_name || '',
          lastName: bpocData?.last_name || defaultLastName,
          gender: resumeData?.personal_info?.gender || '',
          civilStatus: resumeData?.personal_info?.civil_status || '',
          dateOfBirth: resumeData?.personal_info?.date_of_birth ? new Date(resumeData.personal_info.date_of_birth) : null,
          contactNo: bpocData?.phone || staffUser.staff_profiles?.phone || '',
          updatedAt: new Date()
        }
      })
      
      console.log('✅ [ONBOARDING] Created with pre-filled data:', {
        firstName: onboarding.firstName,
        lastName: onboarding.lastName,
        email: onboarding.email,
        contactNo: onboarding.contactNo,
        gender: onboarding.gender,
        civilStatus: onboarding.civilStatus,
        dateOfBirth: onboarding.dateOfBirth
      })
      
      return NextResponse.json({ onboarding })
    }

    // If onboarding exists but is missing key data, try to populate it
    const existingOnboarding = staffUser.staff_onboarding
    const needsUpdate = !existingOnboarding.firstName || !existingOnboarding.lastName || !existingOnboarding.email
    
    if (needsUpdate) {
      console.log('🔄 [ONBOARDING] Existing record needs update - populating missing fields')
      
      // Get BPOC candidate data if available
      let bpocData: any = null
      if (staffUser.job_acceptances?.interview_requests?.bpocCandidateId) {
        try {
          const { getCandidateById } = await import('@/lib/bpoc-db')
          bpocData = await getCandidateById(staffUser.job_acceptances.interview_requests.bpocCandidateId)
          console.log('✅ [ONBOARDING] BPOC data fetched for update:', {
            name: `${bpocData?.first_name} ${bpocData?.last_name}`,
            email: bpocData?.email,
            phone: bpocData?.phone
          })
        } catch (error) {
          console.error('❌ [ONBOARDING] Error fetching BPOC data:', error)
        }
      }
      
      // Parse resume data for additional info
      const resumeData = bpocData?.resume_data ? 
        (typeof bpocData.resume_data === 'string' ? JSON.parse(bpocData.resume_data) : bpocData.resume_data) 
        : null
      
      // Extract name parts from staffUser.name
      const nameParts = staffUser.name.trim().split(' ')
      const defaultFirstName = nameParts[0] || staffUser.name
      const defaultLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''
      
      // Update with available data
      const updatedOnboarding = await prisma.staff_onboarding.update({
        where: { id: existingOnboarding.id },
        data: {
          email: existingOnboarding.email || staffUser.email || '',
          firstName: existingOnboarding.firstName || bpocData?.first_name || defaultFirstName,
          lastName: existingOnboarding.lastName || bpocData?.last_name || defaultLastName,
          middleName: existingOnboarding.middleName || resumeData?.personal_info?.middle_name || '',
          gender: existingOnboarding.gender || resumeData?.personal_info?.gender || '',
          civilStatus: existingOnboarding.civilStatus || resumeData?.personal_info?.civil_status || '',
          dateOfBirth: existingOnboarding.dateOfBirth || (resumeData?.personal_info?.date_of_birth ? new Date(resumeData.personal_info.date_of_birth) : null),
          contactNo: existingOnboarding.contactNo || bpocData?.phone || staffUser.staff_profiles?.phone || '',
          updatedAt: new Date()
        }
      })
      
      console.log('✅ [ONBOARDING] Updated with missing data:', {
        firstName: updatedOnboarding.firstName,
        lastName: updatedOnboarding.lastName,
        email: updatedOnboarding.email,
        contactNo: updatedOnboarding.contactNo
      })
      
      return NextResponse.json({ onboarding: updatedOnboarding })
    }

    return NextResponse.json({ onboarding: staffUser.staff_onboarding })

  } catch (error) {
    console.error("Onboarding fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch onboarding data" },
      { status: 500 }
    )
  }
}

