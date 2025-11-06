/**
 * Contract Sign API
 * POST /api/contract/sign
 * 
 * Save contract signature and mark as signed
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Verify staff is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find staff user with contract
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        employment_contracts: true,
        job_acceptances: true
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 404 })
    }

    if (!staffUser.employment_contracts) {
      return NextResponse.json({ error: 'No contract found' }, { status: 404 })
    }

    if (staffUser.employment_contracts.signed) {
      return NextResponse.json({ error: 'Contract already signed' }, { status: 400 })
    }

    // Get signature from form data
    const formData = await request.formData()
    const signatureFile = formData.get('signature') as File

    if (!signatureFile) {
      return NextResponse.json({ error: 'Signature is required' }, { status: 400 })
    }

    // Upload signature to Supabase Storage
    const fileName = `${staffUser.id}/signature.png`
    const fileBuffer = await signatureFile.arrayBuffer()

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('staff')
      .upload(`employment_contracts/${fileName}`, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload signature' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from('staff')
      .getPublicUrl(`employment_contracts/${fileName}`)

    const signatureUrl = urlData.publicUrl

    // Update contract with signature
    await prisma.employment_contracts.update({
      where: { id: staffUser.employment_contracts.id },
      data: {
        finalSignatureUrl: signatureUrl,
        signed: true,
        signedAt: new Date(),
        fullyInitialed: true // All sections checked
      }
    })

    // Update job acceptance
    if (staffUser.job_acceptances) {
      await prisma.job_acceptances.update({
        where: { id: staffUser.job_acceptances.id },
        data: {
          contractSigned: true,
          contractSignedAt: new Date()
        }
      })
    }

    // ALSO save signature to staff_onboarding so it can be reused in onboarding Step 7
    await prisma.staff_onboarding.upsert({
      where: { staffUserId: staffUser.id },
      update: {
        signatureUrl: signatureUrl,
        signatureStatus: "SUBMITTED",
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        staffUserId: staffUser.id,
        email: staffUser.email,
        signatureUrl: signatureUrl,
        signatureStatus: "SUBMITTED",
        updatedAt: new Date()
      }
    })

    console.log(`✅ [CONTRACT] Contract signed by staff: ${staffUser.name}`)
    console.log(`✅ [CONTRACT] Signature also saved to staff_onboarding for reuse in onboarding form`)

    return NextResponse.json({
      success: true,
      message: 'Contract signed successfully',
      signatureUrl
    })
  } catch (error) {
    console.error('❌ Error signing contract:', error)
    return NextResponse.json(
      { error: 'Failed to sign contract', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

