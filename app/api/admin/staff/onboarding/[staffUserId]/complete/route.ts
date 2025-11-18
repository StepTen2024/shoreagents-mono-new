import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logStaffOnboarded } from "@/lib/activity-generator"
import crypto from "crypto"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ staffUserId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/management
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser || managementUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { staffUserId } = await context.params
    const body = await req.json()
    const { 
      companyId,
      employmentStatus,
      startDate,
      currentRole,
      salary,
      hmo
    } = body

    console.log("🚀 COMPLETING ONBOARDING REQUEST:", {
      staffUserId,
      companyId,
      employmentStatus,
      startDate,
      currentRole,
      salary,
      hmo,
      adminId: managementUser.id
    })

    // Get staff onboarding FIRST to check if profile exists
    const staffUser = await prisma.staff_users.findUnique({
      where: { id: staffUserId },
      include: { 
        staff_onboarding: true,
        staff_profiles: true,
        company: true
      }
    })

    if (!staffUser || !staffUser.staff_onboarding) {
      return NextResponse.json({ error: "Onboarding not found" }, { status: 404 })
    }

    // Check if all 9 sections are approved (GUNTING 9-step system)
    const onboarding = staffUser.staff_onboarding
    const sections = [
      { name: "Personal Info", status: onboarding.personalInfoStatus },
      { name: "Government ID", status: onboarding.govIdStatus },
      { name: "Documents", status: onboarding.documentsStatus },
      { name: "Signature", status: onboarding.signatureStatus },
      { name: "Emergency Contact", status: onboarding.emergencyContactStatus },
      { name: "Resume", status: onboarding.resumeStatus },
      { name: "Education", status: onboarding.educationStatus },
      { name: "Medical", status: onboarding.medicalStatus },
      { name: "Data Privacy", status: onboarding.dataPrivacyStatus }
    ]
    
    const unapprovedSections = sections.filter(s => s.status !== "APPROVED")
    
    if (unapprovedSections.length > 0) {
      const sectionNames = unapprovedSections.map(s => `${s.name} (${s.status})`).join(", ")
      return NextResponse.json({ 
        error: "All 9 onboarding sections must be approved before completing onboarding",
        details: `Unapproved sections: ${sectionNames}`
      }, { status: 400 })
    }

    // Check if contract is signed
    const employmentContract = await prisma.employment_contracts.findFirst({
      where: { staffUserId: staffUser.id }
    })

    if (!employmentContract || !employmentContract.signed) {
      return NextResponse.json({ 
        error: "Employment contract must be signed before completing onboarding" 
      }, { status: 400 })
    }

    // 🎯 PROFILE MUST EXIST (created during staff signup)
    if (!staffUser.staff_profiles) {
      return NextResponse.json({ 
        error: "Staff profile not found. Profile should be created during signup process.",
        details: "Please ensure the staff member completed the signup flow after receiving their job offer."
      }, { status: 404 })
    }

    console.log("✅ PROFILE EXISTS - SYNCING ONBOARDING DATA:", { 
      profileId: staffUser.staff_profiles.id,
      staffUserId: staffUser.id,
      staffName: staffUser.name,
      companyId: staffUser.companyId
    })
    
    // Get employment contract URL if it exists
    let employmentContractUrl = null
    if (employmentContract && employmentContract.signed) {
      // Assuming contract is stored as PDF or has a URL field
      employmentContractUrl = employmentContract.id // Or whatever field stores the URL/reference
    }

    // UPDATE staff_personal_records with ALL onboarding data
    const personalRecordData = {
      staffUserId: staffUser.id,
      sss: onboarding.sss,
      tin: onboarding.tin,
      philhealthNo: onboarding.philhealthNo,
      pagibigNo: onboarding.pagibigNo,
      emergencyContactName: onboarding.emergencyContactName,
      emergencyContactNo: onboarding.emergencyContactNo,
      emergencyRelationship: onboarding.emergencyRelationship,
      validIdUrl: onboarding.validIdUrl,
      birthCertUrl: onboarding.birthCertUrl,
      nbiClearanceUrl: onboarding.nbiClearanceUrl,
      policeClearanceUrl: onboarding.policeClearanceUrl,
      sssDocUrl: onboarding.sssDocUrl,
      tinDocUrl: onboarding.tinDocUrl,
      philhealthDocUrl: onboarding.philhealthDocUrl,
      pagibigDocUrl: onboarding.pagibigDocUrl,
      birForm2316Url: onboarding.birForm2316Url,
      idPhotoUrl: onboarding.idPhotoUrl,
      signatureUrl: onboarding.signatureUrl,
      certificateEmpUrl: onboarding.certificateEmpUrl,
      medicalCertUrl: onboarding.medicalCertUrl,
      resumeUrl: onboarding.resumeUrl,
      employmentContractUrl: employmentContractUrl,
      updatedAt: new Date()
    }

    console.log("📋 UPSERTING PERSONAL RECORDS:", { staffUserId: staffUser.id, hasContract: !!employmentContractUrl })
    
    try {
      await prisma.staff_personal_records.upsert({
        where: { staffUserId: staffUser.id },
        update: personalRecordData,
        create: {
          id: crypto.randomUUID(),
          ...personalRecordData
        }
      })
      console.log("✅ PERSONAL RECORDS UPDATED")
    } catch (error) {
      console.error("❌ PERSONAL RECORDS UPDATE FAILED:", error)
      // Continue even if this fails - don't block the whole process
    }

    // UPDATE staff_profiles with onboarding data + employment details from admin form
    try {
      // Build update data object only with non-null values
      const profileUpdateData: any = {
        updatedAt: new Date()
      }
      
      // Personal info from onboarding
      if (onboarding.contactNo) profileUpdateData.phone = onboarding.contactNo
      if (onboarding.gender) profileUpdateData.gender = onboarding.gender
      if (onboarding.civilStatus) profileUpdateData.civilStatus = onboarding.civilStatus
      if (onboarding.dateOfBirth) profileUpdateData.dateOfBirth = onboarding.dateOfBirth
      
      // Employment details from admin completion form (body data)
      if (employmentStatus) profileUpdateData.employmentStatus = employmentStatus
      if (startDate) {
        profileUpdateData.startDate = new Date(startDate)
        // Recalculate days employed
        const daysEmployed = Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
        profileUpdateData.daysEmployed = daysEmployed >= 0 ? daysEmployed : 0
      }
      if (currentRole) profileUpdateData.currentRole = currentRole
      if (salary && salary > 0) profileUpdateData.salary = salary
      if (hmo !== undefined) profileUpdateData.hmo = hmo
      
      await prisma.staff_profiles.update({
        where: { staffUserId: staffUser.id },
        data: profileUpdateData
      })
      console.log("✅ STAFF PROFILE UPDATED with personal & employment details:", profileUpdateData)
    } catch (error) {
      console.error("❌ STAFF PROFILE UPDATE FAILED:", error)
      // Continue even if this fails
    }

    // NOTE: work_schedules are already created during staff signup from job_acceptances data
    // No need to recreate them here - they contain the correct schedule from the hire flow
    
    // Mark onboarding as complete
    await prisma.staff_onboarding.update({
      where: { staffUserId: staffUser.id },
      data: {
        isComplete: true,
        completionPercent: 100,
        updatedAt: new Date()
      }
    })

    console.log("🎉 ONBOARDING COMPLETED & ALL DATA SYNCED TO PERSONAL RECORDS")

    // ✨ Auto-generate activity post
    try {
      await logStaffOnboarded(staffUser.id, staffUser.name)
    } catch (error) {
      console.error("❌ ACTIVITY LOG FAILED:", error)
      // Don't block onboarding completion if activity logging fails
    }

    return NextResponse.json({ 
      success: true,
      message: `Onboarding completed for ${staffUser.name}. All data synced to personal records.`,
      profileId: staffUser.staff_profiles.id,
      companyName: staffUser.company?.companyName || "N/A",
      staffName: staffUser.name
    })

  } catch (error) {
    console.error("Complete onboarding error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    
    // Return more specific error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json(
      { 
        error: "Failed to complete onboarding",
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}

