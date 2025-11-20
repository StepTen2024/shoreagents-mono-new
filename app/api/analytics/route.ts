import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"
import { getStaffDayStart } from "@/lib/timezone-helpers"

// Function to emit performance updates (will be set by server.js)
declare global {
  var emitPerformanceUpdate: ((data: any) => void) | undefined
}

// GET /api/performance - Get performance metrics for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the StaffUser record using authUserId with staff profile
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        staff_profiles: {
          select: {
            timezone: true
          }
        }
      }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // ✅ FIX: Use staff timezone (default to Asia/Manila for Filipino staff)
    const staffTimezone = staffUser.staff_profiles?.timezone || 'Asia/Manila'
    
    console.log(`📊 [Analytics API] Fetching metrics in timezone: ${staffTimezone}`)
    
    // ✅ FIX: Get midnight "today" in STAFF timezone (works same locally & deployed!)
    const todayInStaffTz = getStaffDayStart(staffTimezone, 0)  // Today at midnight
    const sevenDaysAgo = getStaffDayStart(staffTimezone, -7)   // 7 days ago at midnight
    const tomorrow = getStaffDayStart(staffTimezone, 1)        // Tomorrow at midnight
    
    console.log(`📅 [Analytics API] Today midnight in ${staffTimezone}: ${todayInStaffTz.toISOString()}`)
    console.log(`📅 [Analytics API] 7 days ago midnight: ${sevenDaysAgo.toISOString()}`)
    console.log(`📅 [Analytics API] Tomorrow midnight: ${tomorrow.toISOString()}`)

    // ✅ FIX: Query using shiftDate (timezone-aware) instead of date field
    const metrics = await prisma.performance_metrics.findMany({
      where: {
        staffUserId: staffUser.id,
        shiftDate: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { shiftDate: "desc" },
    })

    // ✅ FIX: Get today's metrics using shiftDate (timezone-aware)

    const todayMetric = await prisma.performance_metrics.findFirst({
      where: {
        staffUserId: staffUser.id,
        shiftDate: {
          gte: todayInStaffTz,
          lt: tomorrow,
        },
      },
      orderBy: { date: 'desc' }, // Get the MOST RECENT shift (in case of multiple clock-ins today)
    })
    
    console.log(`📊 [Analytics API] Found ${metrics.length} metrics (last 7 days), today's metric: ${todayMetric ? 'YES' : 'NO'}`)

    // Calculate total screenshot count (sum of all clipboardActions)
    const allMetrics = await prisma.performance_metrics.findMany({
      where: {
        staffUserId: staffUser.id
      },
      select: {
        clipboardActions: true
      }
    })
    const totalScreenshotCount = allMetrics.reduce((sum, m) => sum + m.clipboardActions, 0)

    // Format metrics for frontend (convert minutes to seconds for consistent display)
    // ✅ FIX: Use shiftDate (timezone-aware) instead of date field
    const formattedMetrics = metrics.map((m) => ({
      id: m.id,
      date: m.shiftDate ? m.shiftDate.toISOString() : m.date.toISOString(), // Use shiftDate (staff timezone)
      shiftDate: m.shiftDate ? m.shiftDate.toISOString() : null,
      shiftDayOfWeek: m.shiftDayOfWeek,
      mouseMovements: m.mouseMovements,
      mouseClicks: m.mouseClicks,
      keystrokes: m.keystrokes,
      activeTime: m.activeTime, // ⏱️ Already in seconds
      idleTime: m.idleTime, // ⏱️ Already in seconds
      screenTime: m.screenTime, // ⏱️ Already in seconds
      downloads: m.downloads,
      uploads: m.uploads,
      bandwidth: m.bandwidth,
      clipboardActions: m.clipboardActions,
      filesAccessed: m.filesAccessed,
      urlsVisited: m.urlsVisited,
      tabsSwitched: m.tabsSwitched,
      productivityScore: m.productivityScore,
      screenshotCount: m.clipboardActions, // Use clipboardActions as screenshot count
      applicationsUsed: (m as any).applicationsused || [], // Get from database
      visitedUrls: (m as any).visitedurls || [], // Get from database
    }))

    const formattedToday = todayMetric
      ? {
          id: todayMetric.id,
          date: todayMetric.shiftDate ? todayMetric.shiftDate.toISOString() : todayMetric.date.toISOString(), // Use shiftDate (staff timezone)
          shiftDate: todayMetric.shiftDate ? todayMetric.shiftDate.toISOString() : null,
          shiftDayOfWeek: todayMetric.shiftDayOfWeek,
          mouseMovements: todayMetric.mouseMovements,
          mouseClicks: todayMetric.mouseClicks,
          keystrokes: todayMetric.keystrokes,
          activeTime: todayMetric.activeTime, // ⏱️ Already in seconds
          idleTime: todayMetric.idleTime, // ⏱️ Already in seconds
          screenTime: todayMetric.screenTime, // ⏱️ Already in seconds
          downloads: todayMetric.downloads,
          uploads: todayMetric.uploads,
          bandwidth: todayMetric.bandwidth,
          clipboardActions: todayMetric.clipboardActions,
          filesAccessed: todayMetric.filesAccessed,
          urlsVisited: todayMetric.urlsVisited,
          tabsSwitched: todayMetric.tabsSwitched,
          productivityScore: todayMetric.productivityScore,
          screenshotCount: todayMetric.clipboardActions, // Use clipboardActions as screenshot count
          applicationsUsed: (todayMetric as any).applicationsused || [], // Get from database
          visitedUrls: (todayMetric as any).visitedurls || [], // Get from database
        }
      : null

    return NextResponse.json({
      metrics: formattedMetrics,
      today: formattedToday,
      totalScreenshots: totalScreenshotCount,
    })
  } catch (error) {
    console.error("Error fetching performance metrics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/performance - Log new performance metric
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the StaffUser record using authUserId
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      mouseMovements,
      mouseClicks,
      keystrokes,
      activeTime,
      idleTime,
      screenTime,
      downloads,
      uploads,
      bandwidth,
      clipboardActions,
      filesAccessed,
      urlsVisited,
      tabsSwitched,
      productivityScore,
      applicationsUsed,
      visitedUrls,
    } = body

    // ✅ Get active time entry to find shift date
    const activeTimeEntry = await prisma.time_entries.findFirst({
      where: {
        staffUserId: staffUser.id,
        clockOut: null
      },
      select: {
        shiftDate: true,
        shiftDayOfWeek: true
      }
    })

    // If no active time entry, staff is not clocked in - don't track performance
    if (!activeTimeEntry) {
      console.log('[Performance API] ⚠️ No active time entry - staff not clocked in')
      return NextResponse.json({ 
        success: false, 
        message: "Not clocked in - performance not tracked" 
      }, { status: 400 })
    }

    const shiftDate = activeTimeEntry.shiftDate
    const shiftDayOfWeek = activeTimeEntry.shiftDayOfWeek

    console.log(`📊 [Performance API] Tracking for shift:`, {
      shiftDate,
      shiftDayOfWeek
    })

    // ✅ Check if there's already a metric for THIS SHIFT (not calendar day)
    const startOfShiftDate = shiftDate ? new Date(shiftDate) : new Date()
    startOfShiftDate.setHours(0, 0, 0, 0)
    const endOfShiftDate = new Date(startOfShiftDate)
    endOfShiftDate.setDate(endOfShiftDate.getDate() + 1)

    // ✅ SIMPLIFIED: Row is guaranteed to exist (created at clock-in)
    // Just find it and UPDATE (no creation logic needed)
    // Use orderBy to get the MOST RECENT shift (in case of multiple clock-ins same day)
    const existingMetric = await prisma.performance_metrics.findFirst({
      where: {
        staffUserId: staffUser.id,
        shiftDate: {
          gte: startOfShiftDate,
          lt: endOfShiftDate,
        },
      },
      orderBy: { date: 'desc' }, // Get the MOST RECENT shift
    })

    if (!existingMetric) {
      console.error(`❌ [Performance API] No metric row found for shift! This should never happen.`)
      return NextResponse.json({ 
        success: false, 
        message: "Performance metric row not found. Please clock in again." 
      }, { status: 400 })
    }

    // Parse existing JSON arrays
    const existingApps = Array.isArray(existingMetric.applicationsused) 
      ? existingMetric.applicationsused 
      : []
    const existingUrls = Array.isArray(existingMetric.visitedurls) 
      ? existingMetric.visitedurls 
      : []
    
    // Merge new apps/URLs with existing (remove duplicates)
    const newApps = applicationsUsed ? (Array.isArray(applicationsUsed) ? applicationsUsed : []) : []
    const newUrls = visitedUrls ? (Array.isArray(visitedUrls) ? visitedUrls : []) : []
    
    const mergedApps = Array.from(new Set([...existingApps, ...newApps]))
    const mergedUrls = Array.from(new Set([...existingUrls, ...newUrls]))

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📈 [Performance API] INCREMENTING METRICS (Adding Deltas)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`🖱️  Mouse Movements: ${existingMetric.mouseMovements} + ${mouseMovements || 0} = ${existingMetric.mouseMovements + (mouseMovements || 0)}`)
    console.log(`🖱️  Mouse Clicks: ${existingMetric.mouseClicks} + ${mouseClicks || 0} = ${existingMetric.mouseClicks + (mouseClicks || 0)}`)
    console.log(`⌨️  Keystrokes: ${existingMetric.keystrokes} + ${keystrokes || 0} = ${existingMetric.keystrokes + (keystrokes || 0)}`)
    
    // 🔧 DATABASE NOW STORES SECONDS (not minutes!)
    // Simply add the new seconds to existing seconds
    const totalActiveSeconds = existingMetric.activeTime + (activeTime || 0)
    const totalIdleSeconds = existingMetric.idleTime + (idleTime || 0)
    const totalScreenSeconds = existingMetric.screenTime + (screenTime || 0)
    
    console.log(`✅ Active Time: ${existingMetric.activeTime}s + ${activeTime || 0}s = ${totalActiveSeconds}s (${Math.floor(totalActiveSeconds / 60)} min ${totalActiveSeconds % 60}s)`)
    console.log(`😴 Idle Time: ${existingMetric.idleTime}s + ${idleTime || 0}s = ${totalIdleSeconds}s (${Math.floor(totalIdleSeconds / 60)} min ${totalIdleSeconds % 60}s)`)
    console.log(`🖥️  Screen Time: ${existingMetric.screenTime}s + ${screenTime || 0}s = ${totalScreenSeconds}s (${Math.floor(totalScreenSeconds / 60)} min ${totalScreenSeconds % 60}s)`)
    console.log(`🌐 URLs Visited: ${existingMetric.urlsVisited} + ${urlsVisited || 0} = ${existingMetric.urlsVisited + (urlsVisited || 0)}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // ✅ UPDATE the existing row (created at clock-in)
    const metric = await prisma.performance_metrics.update({
      where: { id: existingMetric.id },
      data: {
        // ✅ INCREMENT all numeric values (these are DELTAS from Electron)
        mouseMovements: existingMetric.mouseMovements + (mouseMovements || 0),
        mouseClicks: existingMetric.mouseClicks + (mouseClicks || 0),
        keystrokes: existingMetric.keystrokes + (keystrokes || 0),
        // ✅ Time values in SECONDS (stored as Int, just like mouse movements!)
        activeTime: totalActiveSeconds,
        idleTime: totalIdleSeconds,
        screenTime: totalScreenSeconds,
        downloads: existingMetric.downloads + (downloads || 0),
        uploads: existingMetric.uploads + (uploads || 0),
        bandwidth: existingMetric.bandwidth + (bandwidth || 0),
        clipboardActions: existingMetric.clipboardActions + (clipboardActions || 0),
        filesAccessed: existingMetric.filesAccessed + (filesAccessed || 0),
        urlsVisited: existingMetric.urlsVisited + (urlsVisited || 0),
        tabsSwitched: existingMetric.tabsSwitched + (tabsSwitched || 0),
        // Productivity score = average or latest (not cumulative)
        productivityScore: productivityScore ?? existingMetric.productivityScore,
        // ✅ MERGE JSON arrays
        applicationsused: mergedApps,
        visitedurls: mergedUrls,
      } as any,
    })

    // Emit real-time update to monitoring clients
    if (global.emitPerformanceUpdate) {
      try {
        global.emitPerformanceUpdate({
          staffUserId: staffUser.id,
          type: 'latest',
          metrics: metric,
          isActive: true,
          lastActivity: new Date().toISOString()
        })
        console.log('[Performance API] Emitted real-time update for staff user:', staffUser.id)
      } catch (wsError) {
        console.error('[Performance API] Error emitting real-time update:', wsError)
      }
    }

    return NextResponse.json({ success: true, metric }, { status: 201 })
  } catch (error) {
    console.error("Error logging performance metric:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}