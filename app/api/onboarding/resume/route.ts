/**
 * Resume Upload API
 * POST /api/onboarding/resume
 * 
 * Upload resume document for staff onboarding
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('📄 [RESUME] Starting resume upload...')
    
    // Verify staff is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      console.error('❌ [RESUME] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ [RESUME] Session found:', session.user.email)

    // Find staff user
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: { staff_onboarding: true }
    })

    if (!staffUser) {
      console.error('❌ [RESUME] Staff user not found for authUserId:', session.user.id)
      return NextResponse.json({ error: 'Staff user not found' }, { status: 404 })
    }

    console.log('✅ [RESUME] Staff user found:', staffUser.name)

    if (!staffUser.staff_onboarding) {
      console.error('❌ [RESUME] Onboarding record not found for staff:', staffUser.id)
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 })
    }

    console.log('✅ [RESUME] Onboarding record found')

    // Get resume file from form data
    const formData = await request.formData()
    const resumeFile = formData.get('resume') as File

    if (!resumeFile) {
      console.error('❌ [RESUME] No resume file in request')
      return NextResponse.json({ error: 'Resume file is required' }, { status: 400 })
    }

    console.log('✅ [RESUME] File received:', resumeFile.name, 'Type:', resumeFile.type, 'Size:', resumeFile.size)

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(resumeFile.type)) {
      console.error('❌ [RESUME] Invalid file type:', resumeFile.type)
      return NextResponse.json({ error: 'Invalid file type. Only PDF, DOC, and DOCX are allowed' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const fileName = `${staffUser.id}/resume.${resumeFile.name.split('.').pop()}`
    console.log('📤 [RESUME] Uploading to Supabase:', fileName)
    const fileBuffer = await resumeFile.arrayBuffer()

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('staff')
      .upload(`staff_onboarding/${fileName}`, fileBuffer, {
        contentType: resumeFile.type,
        upsert: true
      })

    if (uploadError) {
      console.error('❌ [RESUME] Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload resume', details: uploadError.message }, { status: 500 })
    }

    console.log('✅ [RESUME] Uploaded to Supabase successfully')

    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from('staff')
      .getPublicUrl(`staff_onboarding/${fileName}`)

    const resumeUrl = urlData.publicUrl
    console.log('✅ [RESUME] Public URL generated:', resumeUrl)

    // Update onboarding record
    console.log('💾 [RESUME] Updating onboarding record...')
    const updatedOnboarding = await prisma.staff_onboarding.update({
      where: { staffUserId: staffUser.id },
      data: {
        resumeUrl: resumeUrl,
        resumeStatus: 'SUBMITTED'
      }
    })

    console.log('✅ [RESUME] Onboarding record updated')

    // Update completion percentage
    console.log('📊 [RESUME] Updating completion percentage...')
    await updateCompletionPercent(updatedOnboarding.id)
    console.log('✅ [RESUME] Completion percentage updated')

    console.log(`✅ [ONBOARDING] Resume uploaded for staff: ${staffUser.name}`)

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded successfully',
      resumeUrl
    })
  } catch (error) {
    console.error('❌ Error uploading resume:', error)
    return NextResponse.json(
      { error: 'Failed to upload resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate completion percentage
async function updateCompletionPercent(onboardingId: string) {
  const onboarding = await prisma.staff_onboarding.findUnique({
    where: { id: onboardingId }
  })

  if (!onboarding) return

  const sections = [
    onboarding.personalInfoStatus,
    onboarding.resumeStatus,
    onboarding.govIdStatus,
    onboarding.educationStatus,
    onboarding.medicalStatus,
    onboarding.dataPrivacyStatus,
    onboarding.signatureStatus,
    onboarding.emergencyContactStatus
  ]

  // Each section = 12.5% when SUBMITTED or APPROVED (8 sections total)
  let totalProgress = 0
  sections.forEach(status => {
    if (status === "SUBMITTED" || status === "APPROVED") {
      totalProgress += Math.round(100 / sections.length)
    }
  })

  const completionPercent = Math.min(totalProgress, 100)

  await prisma.staff_onboarding.update({
    where: { id: onboardingId },
    data: { completionPercent }
  })
}

