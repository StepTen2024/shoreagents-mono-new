/**
 * Education Documents Upload API
 * POST /api/onboarding/education
 * 
 * Upload education documents (Diploma/TOR) for staff onboarding
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify staff is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find staff user
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: { staff_onboarding: true }
    })

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 404 })
    }

    if (!staffUser.staff_onboarding) {
      return NextResponse.json({ error: 'Onboarding record not found' }, { status: 404 })
    }

    // Get file from form data
    const formData = await request.formData()
    const educationFile = formData.get('education') as File

    if (!educationFile) {
      return NextResponse.json({ error: 'Education document is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(educationFile.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, JPG, and PNG are allowed' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const fileName = `${staffUser.id}/diploma-tor.${educationFile.name.split('.').pop()}`
    const fileBuffer = await educationFile.arrayBuffer()

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('staff')
      .upload(`staff_onboarding/${fileName}`, fileBuffer, {
        contentType: educationFile.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload education document' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from('staff')
      .getPublicUrl(`staff_onboarding/${fileName}`)

    const educationUrl = urlData.publicUrl

    // Update onboarding record
    await prisma.staff_onboarding.update({
      where: { staffUserId: staffUser.id },
      data: {
        diplomaTorUrl: educationUrl,
        educationStatus: 'SUBMITTED'
      }
    })

    // Calculate completion percentage
    const onboardingId = staffUser.staff_onboarding.id
    const updatedOnboarding = await prisma.staff_onboarding.findUnique({
      where: { id: onboardingId }
    })

    let completionPercent = 0
    if (updatedOnboarding) {
      const totalSteps = 8
      let completedSteps = 0

      if (updatedOnboarding.personalInfoStatus === 'SUBMITTED' || updatedOnboarding.personalInfoStatus === 'APPROVED') completedSteps++
      if (updatedOnboarding.resumeStatus === 'SUBMITTED' || updatedOnboarding.resumeStatus === 'APPROVED') completedSteps++
      if (updatedOnboarding.govIdStatus === 'SUBMITTED' || updatedOnboarding.govIdStatus === 'APPROVED') completedSteps++
      if (updatedOnboarding.educationStatus === 'SUBMITTED' || updatedOnboarding.educationStatus === 'APPROVED') completedSteps++
      if (updatedOnboarding.medicalStatus === 'SUBMITTED' || updatedOnboarding.medicalStatus === 'APPROVED') completedSteps++
      if (updatedOnboarding.dataPrivacyStatus === 'SUBMITTED' || updatedOnboarding.dataPrivacyStatus === 'APPROVED') completedSteps++
      if (updatedOnboarding.signatureStatus === 'SUBMITTED' || updatedOnboarding.signatureStatus === 'APPROVED') completedSteps++
      if (updatedOnboarding.emergencyContactStatus === 'SUBMITTED' || updatedOnboarding.emergencyContactStatus === 'APPROVED') completedSteps++

      const totalProgress = Math.floor((completedSteps / totalSteps) * 100)
      completionPercent = Math.min(totalProgress, 100)

      await prisma.staff_onboarding.update({
        where: { id: onboardingId },
        data: { completionPercent }
      })
    }

    console.log(`✅ [ONBOARDING] Education document uploaded for staff: ${staffUser.name}`)

    return NextResponse.json({
      success: true,
      message: 'Education document uploaded successfully',
      educationUrl,
      completionPercent
    })
  } catch (error) {
    console.error('❌ Error uploading education document:', error)
    return NextResponse.json(
      { error: 'Failed to upload education document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

