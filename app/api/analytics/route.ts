import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"

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

    // Get the StaffUser record using authUserId
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Get metrics for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const metrics = await prisma.performance_metrics.findMany({
      where: {
        staffUserId: staffUser.id,
        date: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { date: "desc" },
    })

    // Get today's metrics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayMetric = await prisma.performance_metrics.findFirst({
      where: {
        staffUserId: staffUser.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

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
    const formattedMetrics = metrics.map((m) => ({
      id: m.id,
      date: m.date.toISOString(),
      mouseMovements: m.mouseMovements,
      mouseClicks: m.mouseClicks,
      keystrokes: m.keystrokes,
      activeTime: m.activeTime * 60, // Convert minutes to seconds
      idleTime: m.idleTime * 60, // Convert minutes to seconds
      screenTime: m.screenTime * 60, // Convert minutes to seconds
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
          date: todayMetric.date.toISOString(),
          mouseMovements: todayMetric.mouseMovements,
          mouseClicks: todayMetric.mouseClicks,
          keystrokes: todayMetric.keystrokes,
          activeTime: todayMetric.activeTime * 60, // Convert minutes to seconds
          idleTime: todayMetric.idleTime * 60, // Convert minutes to seconds
          screenTime: todayMetric.screenTime * 60, // Convert minutes to seconds
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
    const existingMetric = await prisma.performance_metrics.findFirst({
      where: {
        staffUserId: staffUser.id,
        shiftDate: {
          gte: startOfShiftDate,
          lt: endOfShiftDate,
        },
      },
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
    console.log(`✅ Active Time: ${existingMetric.activeTime} min + ${activeTime || 0} sec (${Math.round((activeTime || 0) / 60)} min) = ${existingMetric.activeTime + Math.round((activeTime || 0) / 60)} min`)
    console.log(`🌐 URLs Visited: ${existingMetric.urlsVisited} + ${urlsVisited || 0} = ${existingMetric.urlsVisited + (urlsVisited || 0)}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    // 🔧 Convert time values from SECONDS (received) to MINUTES (stored)
    // Electron sends deltas in seconds, we store in minutes
    const activeTimeMinutes = activeTime ? Math.round(activeTime / 60) : 0
    const idleTimeMinutes = idleTime ? Math.round(idleTime / 60) : 0
    const screenTimeMinutes = screenTime ? Math.round(screenTime / 60) : 0

    // ✅ UPDATE the existing row (created at clock-in)
    const metric = await prisma.performance_metrics.update({
      where: { id: existingMetric.id },
      data: {
        // ✅ INCREMENT all numeric values (these are DELTAS from Electron)
        mouseMovements: existingMetric.mouseMovements + (mouseMovements || 0),
        mouseClicks: existingMetric.mouseClicks + (mouseClicks || 0),
        keystrokes: existingMetric.keystrokes + (keystrokes || 0),
        // Time values: convert seconds to minutes before adding
        activeTime: existingMetric.activeTime + activeTimeMinutes,
        idleTime: existingMetric.idleTime + idleTimeMinutes,
        screenTime: existingMetric.screenTime + screenTimeMinutes,
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