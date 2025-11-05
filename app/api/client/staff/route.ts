import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [CLIENT/STAFF] API called")
    const session = await auth()

    if (!session?.user?.email) {
      console.log("❌ [CLIENT/STAFF] No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ [CLIENT/STAFF] Session found:", session.user.email)

    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      include: { 
        company: {
          include: {
            management_users: {
              select: {
                name: true
              }
            }
          }
        }
      },
    })

    if (!clientUser || !clientUser.company) {
      console.log("❌ [CLIENT/STAFF] Client user or company not found")
      return NextResponse.json({ error: "Client user or company not found" }, { status: 404 })
    }

    console.log("✅ [CLIENT/STAFF] Client found:", clientUser.email, "Company:", clientUser.company.companyName)

    // Get all staff for this company (regardless of onboarding status or start date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    console.log("🔍 [CLIENT/STAFF] Looking for staff in company:", clientUser.company.id)
    
    const staffList = await prisma.staff_users.findMany({
      where: {
        companyId: clientUser.company.id
        // Show all staff regardless of profile, onboarding status, or start date
      },
      include: {
        staff_onboarding: {
          select: {
            isComplete: true,
            completionPercent: true
          }
        },
        staff_profiles: {
          select: {
            phone: true,
            location: true,
            employmentStatus: true,
            startDate: true,
            currentRole: true,
            salary: true,
            totalLeave: true,
            usedLeave: true,
            hmo: true,
            work_schedules: true,
          }
        },
        gamification_profiles: {
          select: {
            level: true,
            points: true,
          }
        },
        performance_metrics: {
          orderBy: { date: 'desc' },
          take: 7, // Last 7 days
          select: {
            productivityScore: true,
          }
        },
        task_assignments: {
          where: {
            tasks: {
              status: {
                in: ['TODO', 'IN_PROGRESS']
              }
            }
          },
          select: { id: true }
        },
        reviews: {
          where: {
            acknowledgedDate: { not: null }
          },
          select: {
            overallScore: true
          }
        },
        time_entries: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Start of current month
            }
          },
          select: {
            clockIn: true,
            clockOut: true
          }
        },
        breaks: {
          where: {
            actualStart: { not: null },
            actualEnd: null
          },
          select: { id: true }
        }
      },
      orderBy: { name: "asc" },
    })

    console.log("✅ [CLIENT/STAFF] Found staff:", staffList.length)
    staffList.forEach((staff, index) => {
      console.log(`  ${index + 1}. ${staff.name} (${staff.email}) - Start: ${staff.staff_profiles?.startDate}`)
    })

    // Format the response with calculated fields
    const formattedStaff = staffList.map(staff => {
      // Calculate days employed or days until start
      const startDate = staff.staff_profiles?.startDate
      let daysEmployed = 0
      let hasStarted = true
      
      if (startDate) {
        const daysDiff = Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff >= 0) {
          daysEmployed = daysDiff
          hasStarted = true
        } else {
          daysEmployed = Math.abs(daysDiff) // Store as positive for "starts in X days"
          hasStarted = false
        }
      } else {
        hasStarted = false
      }

      // Calculate average productivity
      const avgProductivity = staff.performance_metrics.length > 0
        ? Math.round(staff.performance_metrics.reduce((sum, m) => sum + m.productivityScore, 0) / staff.performance_metrics.length)
        : 0

      // Calculate average review score
      const reviewScore = staff.reviews.length > 0
        ? Math.round((staff.reviews.reduce((sum, r) => sum + (r.overallScore ? Number(r.overallScore) : 0), 0) / staff.reviews.length) * 10) / 10
        : 0

      // Calculate total hours this month
      const totalHoursThisMonth = staff.time_entries.reduce((total, entry) => {
        if (entry.clockIn && entry.clockOut) {
          const hours = (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60)
          return total + hours
        }
        return total
      }, 0)

      // Get shift time from work schedule
      const workSchedule = staff.staff_profiles?.work_schedules?.find(s => s.isWorkday) || null
      const shift = workSchedule 
        ? `${workSchedule.startTime} - ${workSchedule.endTime}` 
        : "Not assigned"

      // Check if clocked in (no active breaks means they're working)
      const isClockedIn = staff.breaks.length === 0 && totalHoursThisMonth > 0

      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        avatar: staff.avatar,
        assignmentRole: staff.staff_profiles?.currentRole || "Onboarding",
        rate: staff.staff_profiles?.salary ? Number(staff.staff_profiles.salary) : null,
        startDate: staff.staff_profiles?.startDate?.toISOString() || new Date().toISOString(),
        managedBy: clientUser.company.management_users?.[0]?.name || "Not assigned",
        client: clientUser.company.companyName,
        phone: staff.staff_profiles?.phone || null,
        location: staff.staff_profiles?.location || null,
        employmentStatus: staff.staff_profiles?.employmentStatus || "PROBATION",
        daysEmployed,
        hasStarted, // New field to indicate if staff has started
        currentRole: staff.staff_profiles?.currentRole || "Staff Member",
        salary: staff.staff_profiles?.salary ? Number(staff.staff_profiles.salary) : 0,
        totalLeave: staff.staff_profiles?.totalLeave || 12,
        usedLeave: staff.staff_profiles?.usedLeave || 0,
        hmo: staff.staff_profiles?.hmo || false,
        shift,
        activeTasks: staff.task_assignments.length,
        avgProductivity,
        reviewScore,
        totalHoursThisMonth: Math.round(totalHoursThisMonth),
        isClockedIn,
        level: staff.gamification_profiles?.level || 1,
        points: staff.gamification_profiles?.points || 0,
        onboardingComplete: staff.staff_onboarding?.isComplete || false,
        onboardingProgress: staff.staff_onboarding?.completionPercent || 0,
      }
    })

    console.log("📤 [CLIENT/STAFF] Returning staff data:", formattedStaff.length, "staff members")
    return NextResponse.json({ staff: formattedStaff })
  } catch (error) {
    console.error("Error fetching client staff:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
