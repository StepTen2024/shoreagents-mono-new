import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, phone, jobAcceptanceId } = body

    console.log('📝 [SIGNUP] Staff signup attempt:', { email, hasJobAcceptance: !!jobAcceptanceId })

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Check if email already exists in staff_users
    const existingUser = await prisma.staff_users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    // Check for job acceptance data (from hire flow)
    // FIRST: Try to auto-match by email (this is the key for recruitment flow!)
    let companyId = null
    let position = null
    let jobAcceptance = null

    // Auto-match by email first (most common scenario from hire flow)
    jobAcceptance = await prisma.job_acceptances.findFirst({
      where: {
        candidateEmail: email,
        staffUserId: null // Not yet linked to a staff account
      },
      include: {
        company: true,
        interview_requests: true
      },
      orderBy: {
        createdAt: 'desc' // Get most recent if multiple
      }
    })

    if (jobAcceptance) {
      companyId = jobAcceptance.companyId
      position = jobAcceptance.position
      console.log('✅ [SIGNUP] Job acceptance AUTO-MATCHED by email:', {
        jobAcceptanceId: jobAcceptance.id,
        company: jobAcceptance.company.companyName,
        position: jobAcceptance.position,
        candidateName: jobAcceptance.interview_requests?.candidateFirstName
      })
    } else if (jobAcceptanceId) {
      // Fallback: Try by jobAcceptanceId if provided
      jobAcceptance = await prisma.job_acceptances.findUnique({
        where: { id: jobAcceptanceId },
        include: {
          company: true,
          interview_requests: true
        }
      })

      if (jobAcceptance) {
        companyId = jobAcceptance.companyId
        position = jobAcceptance.position
        console.log('✅ [SIGNUP] Job acceptance found by ID:', {
          company: jobAcceptance.company.companyName,
          position: jobAcceptance.position
        })
      } else {
        console.warn('⚠️ [SIGNUP] Job acceptance not found:', jobAcceptanceId)
      }
    } else {
      console.log('ℹ️ [SIGNUP] No job acceptance found for email:', email)
    }

    // 1. Create user in Supabase Auth (auth.users table)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError || !authData.user) {
      console.error("Supabase auth error:", authError)
      return NextResponse.json(
        { error: authError?.message || "Failed to create auth user" },
        { status: 500 }
      )
    }

    // 2. Create in staff_users table (linked to Supabase auth user)
    const staffUserId = crypto.randomUUID()
    const staffUser = await prisma.staff_users.create({
      data: {
        id: staffUserId, // ✅ REQUIRED: Generate UUID
        authUserId: authData.user.id, // Links to Supabase auth.users.id
        email,
        name,
        role: "STAFF", // Default role
        companyId: companyId, // ✅ Auto-assigned from job acceptance if available
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('✅ [SIGNUP] Staff user created:', {
      id: staffUser.id,
      email: staffUser.email,
      companyId: staffUser.companyId,
      hasCompany: !!companyId
    })

    // 2.5. Link job acceptance to staff user if found
    if (jobAcceptance) {
      await prisma.job_acceptances.update({
        where: { id: jobAcceptance.id },
        data: {
          staffUserId: staffUser.id,
          updatedAt: new Date()
        }
      })
      console.log('✅ [SIGNUP] Job acceptance linked to staff user:', jobAcceptance.id)
      
      // 2.6. Update interview request status to HIRED
      if (jobAcceptance.interviewRequestId) {
        const interview = await prisma.interview_requests.update({
          where: { id: jobAcceptance.interviewRequestId },
          data: {
            status: 'HIRED',
            updatedAt: new Date(),
            adminNotes: `Staff member ${name} created account on ${new Date().toLocaleDateString()}. Successfully matched to job acceptance ${jobAcceptance.id}.`
          }
        })
        console.log('✅ [SIGNUP] Interview request status updated to HIRED:', jobAcceptance.interviewRequestId)
        
        // 2.7. Create staff_profiles with position and start date
        const startDate = interview.finalStartDate || new Date()
        
        // Fetch address and phone from BPOC
        let location = null
        let phone = null
        if (jobAcceptance.interviewRequestId) {
          try {
            const { getCandidateById } = await import('@/lib/bpoc-db')
            const candidate = await getCandidateById(interview.bpocCandidateId)
            if (candidate) {
              // Build location string
              const locationParts = [
                candidate.location_city,
                candidate.location_province,
                candidate.location_country
              ].filter(Boolean)
              location = locationParts.join(', ') || null
              phone = candidate.phone
              console.log('✅ [SIGNUP] BPOC location fetched:', location)
            }
          } catch (error) {
            console.error('❌ [SIGNUP] Error fetching BPOC location:', error)
          }
        }
        
        // Get salary from job acceptance
        const salary = jobAcceptance.salary ? parseFloat(jobAcceptance.salary) : 50000.00
        
        // Create staff profile with data from job_acceptances
        const staffProfile = await prisma.staff_profiles.create({
          data: {
            id: crypto.randomUUID(),
            staffUserId: staffUser.id,
            currentRole: position || 'Staff Member',
            startDate: startDate,
            salary: salary,
            hmo: jobAcceptance.hmoIncluded || false, // ✅ Transfer from job_acceptances
            totalLeave: jobAcceptance.leaveCredits || 12, // ✅ Transfer from job_acceptances
            phone: phone,
            location: location,
            employmentStatus: 'PROBATION',
            daysEmployed: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
        console.log('✅ [SIGNUP] Staff profile created:', {
          position,
          salary,
          hmo: jobAcceptance.hmoIncluded,
          totalLeave: jobAcceptance.leaveCredits,
          location,
          phone
        })
        
        // 2.8. Create work_schedules from job_acceptances data
        if (jobAcceptance.workDays && jobAcceptance.workStartTime && jobAcceptance.workEndTime) {
          try {
            const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            
            // Parse customHours if available
            const customHours = jobAcceptance.customHours ? 
              (typeof jobAcceptance.customHours === 'string' ? 
                JSON.parse(jobAcceptance.customHours) : 
                jobAcceptance.customHours) : 
              null
            
            const workSchedules = allDays.map((day) => {
              let startTime = ""
              let endTime = ""
              
              if (jobAcceptance.workDays.includes(day)) {
                // Check if custom hours exist for this day
                if (customHours && customHours[day]) {
                  startTime = customHours[day]
                  // Calculate end time (start + 9 hours)
                  const [hours, minutes] = startTime.split(':').map(Number)
                  const endHour = (hours + 9) % 24
                  endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
                } else {
                  // Use default schedule times
                  startTime = jobAcceptance.workStartTime
                  endTime = jobAcceptance.workEndTime
                }
              }
              
              return {
                id: crypto.randomUUID(),
                profileId: staffProfile.id,
                dayOfWeek: day,
                startTime,
                endTime,
                timezone: "Asia/Manila", // Staff default timezone
                clientTimezone: jobAcceptance.clientTimezone || "UTC",
                isWorkday: jobAcceptance.workDays.includes(day),
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })
            
            await prisma.work_schedules.createMany({ data: workSchedules })
            console.log('✅ [SIGNUP] Work schedules created from job_acceptances:', {
              workDays: jobAcceptance.workDays,
              workTime: customHours ? 'Custom hours per day' : `${jobAcceptance.workStartTime} - ${jobAcceptance.workEndTime}`,
              hasCustomHours: !!customHours,
              customHours: customHours,
              clientTimezone: jobAcceptance.clientTimezone,
              schedulesCreated: workSchedules.length
            })
          } catch (error) {
            console.error('❌ [SIGNUP] Error creating work schedules:', error)
            // Don't fail signup if work schedule creation fails
          }
        } else {
          console.warn('⚠️ [SIGNUP] Work schedule data missing from job_acceptances, skipping work_schedules creation')
        }
      }
    }

    // NOTE: Onboarding and contracts are separate features - will be created later in the flow

    return NextResponse.json(
      {
        message: "Staff account created successfully",
        user: {
          id: staffUser.id,
          name: staffUser.name,
          email: staffUser.email,
          role: staffUser.role,
          companyId: staffUser.companyId,
        },
        fromJobAcceptance: !!jobAcceptance,
        company: jobAcceptance ? jobAcceptance.company.companyName : null,
        position: position,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Staff signup error:", error)
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}

