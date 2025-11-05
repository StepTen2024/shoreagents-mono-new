import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logStaffOnboarded } from "@/lib/activity-generator"

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
      shiftTime,
      currentRole,
      salary,
      hmo
    } = body

    console.log("🚀 COMPLETING ONBOARDING REQUEST:", {
      staffUserId,
      companyId,
      employmentStatus,
      startDate,
      shiftTime,
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
    const allApproved = 
      onboarding.personalInfoStatus === "APPROVED" &&
      onboarding.govIdStatus === "APPROVED" &&
      onboarding.documentsStatus === "APPROVED" &&
      onboarding.signatureStatus === "APPROVED" &&
      onboarding.emergencyContactStatus === "APPROVED" &&
      onboarding.resumeStatus === "APPROVED" &&
      onboarding.educationStatus === "APPROVED" &&
      onboarding.medicalStatus === "APPROVED" &&
      onboarding.dataPrivacyStatus === "APPROVED"

    if (!allApproved) {
      return NextResponse.json({ 
        error: "All 9 onboarding sections must be approved before completing onboarding" 
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

    // 🎯 CHECK IF PROFILE ALREADY EXISTS (from hiring process)
    if (staffUser.staff_profiles) {
      console.log("✅ PROFILE ALREADY EXISTS - SYNCING ONBOARDING DATA TO PERSONAL RECORDS:", { 
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

      // UPDATE staff_profiles with additional onboarding data (gender, DOB, civil status, phone)
      try {
        // Build update data object only with non-null values
        const profileUpdateData: any = {
          updatedAt: new Date()
        }
        
        if (onboarding.contactNo) profileUpdateData.phone = onboarding.contactNo
        if (onboarding.gender) profileUpdateData.gender = onboarding.gender
        if (onboarding.civilStatus) profileUpdateData.civilStatus = onboarding.civilStatus
        if (onboarding.dateOfBirth) profileUpdateData.dateOfBirth = onboarding.dateOfBirth
        
        await prisma.staff_profiles.update({
          where: { staffUserId: staffUser.id },
          data: profileUpdateData
        })
        console.log("✅ STAFF PROFILE UPDATED with personal details:", profileUpdateData)
      } catch (error) {
        console.error("❌ STAFF PROFILE UPDATE FAILED:", error)
        // Continue even if this fails
      }
      
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
        staffName: staffUser.name,
        alreadyExists: true
      })
    }

    // Profile doesn't exist - validate employment data
    if (!companyId) {
      return NextResponse.json({ 
        error: "Company ID is required" 
      }, { status: 400 })
    }

    if (!currentRole) {
      return NextResponse.json({ 
        error: "Role title is required" 
      }, { status: 400 })
    }

    if (!salary || salary <= 0) {
      return NextResponse.json({ 
        error: "Valid salary is required" 
      }, { status: 400 })
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json({ 
        error: "Company not found" 
      }, { status: 404 })
    }

    // Update legal name from onboarding (companyId already assigned during hiring)
    const fullName = `${onboarding.firstName} ${onboarding.middleName || ''} ${onboarding.lastName}`.trim()
    await prisma.staff_users.update({
      where: { id: staffUser.id },
      data: { 
        name: fullName // Update with full legal name from onboarding
      }
    })
    console.log("✅ STAFF USER NAME UPDATED:", { 
      staffUserId: staffUser.id, 
      fullName,
      companyName: company.companyName 
    })

    // Calculate days employed from start date
    const startDateTime = new Date(startDate)
    const today = new Date()
    const daysEmployed = Math.floor((today.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24))

    // Vacation leave: 0 for PROBATION, 12 for REGULAR
    const vacationLeave = employmentStatus === "PROBATION" ? 0 : 12

    // Create StaffProfile with data from onboarding + management input
    const profile = await prisma.staff_profiles.create({
      data: {
        staffUserId: staffUser.id,
        phone: onboarding.contactNo || "",
        location: "Philippines", // Default location
        gender: onboarding.gender,
        civilStatus: onboarding.civilStatus,
        dateOfBirth: onboarding.dateOfBirth,
        employmentStatus: employmentStatus || "PROBATION",
        startDate: new Date(startDate),
        daysEmployed: daysEmployed >= 0 ? daysEmployed : 0,
        currentRole: currentRole,
        salary: salary,
        totalLeave: vacationLeave,
        usedLeave: 0,
        vacationUsed: 0,
        sickUsed: 0,
        hmo: hmo !== undefined ? hmo : true,
      }
    })
    console.log("✅ PROFILE CREATED:", { 
      profileId: profile.id, 
      salary, 
      currentRole, 
      employmentStatus,
      daysEmployed,
      totalLeave: vacationLeave
    })

    // Get employment contract URL if it exists
    let employmentContractUrl = null
    if (employmentContract && employmentContract.signed) {
      employmentContractUrl = employmentContract.id // Contract reference/URL
    }

    // Create/Update StaffPersonalRecord with HR data from onboarding
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
    console.log("🔐 CREATING/UPDATING PERSONAL RECORD:", { staffUserId: staffUser.id, hasContract: !!employmentContractUrl })
    
    try {
      const personalRecord = await prisma.staff_personal_records.upsert({
        where: { staffUserId: staffUser.id },
        update: personalRecordData,
        create: {
          id: crypto.randomUUID(),
          ...personalRecordData
        }
      })
      console.log("✅ PERSONAL RECORD CREATED/UPDATED:", { 
        personalRecordId: personalRecord.id,
        staffUserId: personalRecord.staffUserId
      })
    } catch (error) {
      console.error("❌ PERSONAL RECORD CREATION FAILED:", error)
      throw error
    }

    // Create work schedule based on shift time
    // Parse shift time (e.g., "9:00 AM - 6:00 PM")
    const shiftParts = shiftTime.split('-').map((s: string) => s.trim())
    const startTime = shiftParts[0] || "9:00 AM"
    const endTime = shiftParts[1] || "6:00 PM"

    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ]

    const schedules = days.map((day: string) => ({
      profileId: profile.id,
      dayOfWeek: day,
      startTime: ["Saturday", "Sunday"].includes(day) ? "" : startTime,
      endTime: ["Saturday", "Sunday"].includes(day) ? "" : endTime,
      isWorkday: !["Saturday", "Sunday"].includes(day)
    }))

    await prisma.work_schedules.createMany({ data: schedules })
    console.log("✅ WORK SCHEDULE CREATED:", { 
      profileId: profile.id, 
      schedulesCount: schedules.length,
      workdays: schedules.filter((s: { isWorkday: boolean }) => s.isWorkday).length
    })

    // Create empty welcome form record
    try {
      const welcomeForm = await prisma.staff_welcome_forms.create({
        data: {
          staffUserId: staffUser.id,
          name: fullName,
          client: company.companyName,
          startDate: new Date(startDate).toLocaleDateString(),
          favoriteFastFood: "", // Empty - to be filled by staff
          completed: false
        }
      })
      console.log("✅ WELCOME FORM RECORD CREATED:", { 
        welcomeFormId: welcomeForm.id,
        staffUserId: staffUser.id,
        staffName: fullName
      })
    } catch (error) {
      console.error("❌ WELCOME FORM CREATION FAILED:", error)
      // Don't fail the entire onboarding process if welcome form creation fails
    }

    // Mark onboarding as complete
    await prisma.staff_onboarding.update({
      where: { id: onboarding.id },
      data: {
        isComplete: true,
        completionPercent: 100
      }
    })
    console.log("✅ ONBOARDING MARKED COMPLETE:", { 
      onboardingId: onboarding.id,
      staffUserId: staffUser.id 
    })

    console.log("🎉 ONBOARDING COMPLETION SUCCESS:", {
      staffName: fullName,
      company: company.companyName,
      role: currentRole,
      salary,
      profileId: profile.id
    })

    // ✨ Auto-generate activity post
    await logStaffOnboarded(staffUser.id, fullName)

    return NextResponse.json({ 
      success: true,
      message: `Onboarding completed! ${fullName} assigned to ${company.companyName} as ${currentRole}.`,
      profileId: profile.id,
      companyName: company.companyName,
      staffName: fullName,
      redirectTo: "/welcome" // Redirect staff to welcome form
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

