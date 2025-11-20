import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/client/time-tracking - Fetch time entries for client's assigned staff
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const staffId = searchParams.get('staffId')

    // Get client user with profile (for timezone)
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      include: { 
        company: true,
        client_profiles: {
          select: {
            timezone: true
          }
        }
      }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }
    
    // Get client's timezone from profile (default to America/New_York if not set)
    const clientTimezone = clientUser.client_profiles?.timezone || 'America/New_York'

    // Get all staff assigned to this company
    const staffUsers = await prisma.staff_users.findMany({
      where: { 
        companyId: clientUser.company.id
      },
      include: {
        staff_profiles: {
          select: {
            currentRole: true,
            work_schedules: true,
            startDate: true,
            employmentStatus: true
          }
        },
        staff_onboarding: {
          select: {
            isComplete: true
          }
        }
      }
    })
    const staffIds = staffUsers.map(s => s.id)

    if (staffIds.length === 0) {
      return NextResponse.json({ 
        staffTimeEntries: [],
        summary: { totalHours: 0, activeStaff: 0, totalEntries: 0 }
      })
    }

    // Build where clause for time entries
    const whereClause: any = {
      staffUserId: { in: staffIds }
    }

    // Filter by staff member if specified
    if (staffId) {
      whereClause.staffUserId = staffId
    }

    // Filter by date range if specified - using CLIENT'S timezone
    if (startDate) {
      // Parse the date in client's timezone
      const dateStr = new Date(startDate).toLocaleDateString('en-US', { timeZone: clientTimezone })
      const [month, day, year] = dateStr.split('/')
      
      // Create midnight in client's timezone, then get UTC equivalent
      const startInClientTZ = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`)
      const nowUTC = new Date()
      const nowInClientTZ = new Date(nowUTC.toLocaleString('en-US', { timeZone: clientTimezone }))
      const tzOffset = nowInClientTZ.getTime() - nowUTC.getTime()
      
      const startDateTime = new Date(startInClientTZ.getTime() - tzOffset)
      
      whereClause.clockIn = {
        gte: startDateTime
      }
      
      console.log(`[Client Time Tracking] Start date filter (${clientTimezone}):`, {
        inputDate: startDate,
        startInClientTZ: startInClientTZ.toISOString(),
        startInUTC: startDateTime.toISOString()
      })
    }

    if (endDate) {
      // Parse the date in client's timezone
      const dateStr = new Date(endDate).toLocaleDateString('en-US', { timeZone: clientTimezone })
      const [month, day, year] = dateStr.split('/')
      
      // Create end of day in client's timezone, then get UTC equivalent
      const endInClientTZ = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T23:59:59.999Z`)
      const nowUTC = new Date()
      const nowInClientTZ = new Date(nowUTC.toLocaleString('en-US', { timeZone: clientTimezone }))
      const tzOffset = nowInClientTZ.getTime() - nowUTC.getTime()
      
      const endDateTime = new Date(endInClientTZ.getTime() - tzOffset)
      
      if (whereClause.clockIn) {
        whereClause.clockIn.lte = endDateTime
      } else {
        whereClause.clockIn = { lte: endDateTime }
      }
      
      console.log(`[Client Time Tracking] End date filter (${clientTimezone}):`, {
        inputDate: endDate,
        endInClientTZ: endInClientTZ.toISOString(),
        endInUTC: endDateTime.toISOString()
      })
    }

    // Fetch time entries with breaks
    const timeEntries = await prisma.time_entries.findMany({
      where: whereClause,
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            staff_profiles: {
              select: {
                currentRole: true,
                employmentStatus: true
              }
            }
          }
        },
        breaks: {
          orderBy: {
            actualStart: 'asc'
          }
        }
      },
      orderBy: {
        clockIn: 'desc'
      }
    })

    // Create a map of ALL staff, not just those with time entries
    const staffTimeMap = new Map()
    
    // First, initialize ALL staff from the company
    staffUsers.forEach(staffUser => {
      staffTimeMap.set(staffUser.id, {
        staff: staffUser,
        timeEntries: []
      })
    })
    
    // Then, add time entries to staff who have them
    timeEntries.forEach(entry => {
      const staffId = entry.staffUserId
      if (staffTimeMap.has(staffId)) {
        const existingData = staffTimeMap.get(staffId)
        existingData.timeEntries.push(entry)
        // Keep original staff data from staffUsers - it has all the fields we need
      }
    })

    // Format response with ALL staff and their time entries (or empty if none)
    const staffTimeEntries = Array.from(staffTimeMap.values()).map(({ staff, timeEntries }) => {
      const totalHours = timeEntries.reduce((sum: number, entry: any) => {
        return sum + (entry.totalHours ? Number(entry.totalHours) : 0)
      }, 0)

      // Check if currently clocked in
      const activeEntry = timeEntries.find((e: any) => !e.clockOut)
      const isClockedIn = !!activeEntry

      // Check if on break
      const activeBreak = activeEntry?.breaks.find((b: any) => b.actualStart && !b.actualEnd)
      const isOnBreak = !!activeBreak

      // Calculate current hours for active entry (including break time deduction)
      let currentHours = 0
      if (activeEntry && !activeEntry.clockOut) {
        const clockInTime = new Date(activeEntry.clockIn).getTime()
        const now = new Date().getTime()
        const totalMs = now - clockInTime
        
        // Subtract completed break time
        const breakTimeMs = activeEntry.breaks
          .filter((b: any) => b.actualStart && b.actualEnd)
          .reduce((sum: number, b: any) => {
            const breakDuration = new Date(b.actualEnd).getTime() - new Date(b.actualStart).getTime()
            return sum + breakDuration
          }, 0)
        
        currentHours = Math.round(((totalMs - breakTimeMs) / (1000 * 60 * 60)) * 100) / 100
      }

      return {
        staff: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          avatar: staff.avatar,
          role: staff.staff_profiles?.currentRole || 'Staff Member',
          employmentStatus: staff.staff_profiles?.employmentStatus || 'PROBATION'
        },
        isClockedIn,
        isOnBreak,
        currentBreakType: activeBreak?.type || null,
        currentEntry: activeEntry ? {
          id: activeEntry.id,
          clockIn: activeEntry.clockIn,
          currentHours, // Add calculated current hours
          breaks: activeEntry.breaks.map((b: any) => ({
            id: b.id,
            type: b.type,
            scheduledStart: b.scheduledStart,
            scheduledEnd: b.scheduledEnd,
            actualStart: b.actualStart,
            actualEnd: b.actualEnd,
            duration: b.duration,
            isLate: b.isLate,
            lateBy: b.lateBy
          }))
        } : null,
        timeEntries: timeEntries.map((e: any) => ({
          id: e.id,
          clockIn: e.clockIn,
          clockOut: e.clockOut,
          totalHours: e.totalHours ? Number(e.totalHours) : 0,
          wasLate: e.wasLate,
          lateBy: e.lateBy,
          clockOutReason: e.clockOutReason,
          breaks: e.breaks.map((b: any) => ({
            id: b.id,
            type: b.type,
            scheduledStart: b.scheduledStart,
            scheduledEnd: b.scheduledEnd,
            actualStart: b.actualStart,
            actualEnd: b.actualEnd,
            duration: b.duration,
            isLate: b.isLate,
            lateBy: b.lateBy
          }))
        })),
        totalHours: Math.round(totalHours * 100) / 100,
        totalEntries: timeEntries.length
      }
    })

    // Sort staff entries: active staff first, then by total hours (descending)
    const sortedStaffTimeEntries = staffTimeEntries.sort((a, b) => {
      // First priority: active staff (clocked in) go to the top
      if (a.isClockedIn && !b.isClockedIn) return -1
      if (!a.isClockedIn && b.isClockedIn) return 1
      
      // Second priority: sort by total hours (descending)
      return b.totalHours - a.totalHours
    })

    // Calculate summary statistics
    const activeStaff = staffTimeEntries.filter(s => s.isClockedIn).length
    const totalHours = staffTimeEntries.reduce((sum, s) => sum + s.totalHours, 0)
    const totalEntries = timeEntries.length
    
    // Only count staff who have started work (not in NOT_STARTED status)
    const activeEmployees = staffTimeEntries.filter(s => 
      s.staff.employmentStatus !== 'NOT_STARTED'
    ).length

    return NextResponse.json({
      staffTimeEntries: sortedStaffTimeEntries,
      summary: {
        totalHours: Math.round(totalHours * 100) / 100,
        activeStaff,
        totalEntries,
        totalStaff: activeEmployees // Only count active employees
      }
    })
  } catch (error: any) {
    console.error("Error in client time tracking:", error)
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 }
    )
  }
}
