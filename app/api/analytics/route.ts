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

    // Get today's metrics (SUM all records for today in case of multiple entries)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const allTodayMetrics = await prisma.performance_metrics.findMany({
      where: {
        staffUserId: staffUser.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    // SUM all metrics from multiple records (in case Electron creates multiple entries per day)
    const todayMetric = allTodayMetrics.length > 0 ? {
      id: allTodayMetrics[0].id,
      staffUserId: allTodayMetrics[0].staffUserId,
      date: allTodayMetrics[0].date,
      mouseMovements: allTodayMetrics.reduce((sum, m) => sum + m.mouseMovements, 0),
      mouseClicks: allTodayMetrics.reduce((sum, m) => sum + m.mouseClicks, 0),
      keystrokes: allTodayMetrics.reduce((sum, m) => sum + m.keystrokes, 0),
      activeTime: allTodayMetrics.reduce((sum, m) => sum + m.activeTime, 0),
      idleTime: allTodayMetrics.reduce((sum, m) => sum + m.idleTime, 0),
      screenTime: allTodayMetrics.reduce((sum, m) => sum + m.screenTime, 0),
      downloads: allTodayMetrics.reduce((sum, m) => sum + m.downloads, 0),
      uploads: allTodayMetrics.reduce((sum, m) => sum + m.uploads, 0),
      bandwidth: allTodayMetrics.reduce((sum, m) => sum + m.bandwidth, 0),
      clipboardActions: allTodayMetrics.reduce((sum, m) => sum + m.clipboardActions, 0),
      filesAccessed: allTodayMetrics.reduce((sum, m) => sum + m.filesAccessed, 0),
      urlsVisited: allTodayMetrics.reduce((sum, m) => sum + m.urlsVisited, 0),
      tabsSwitched: allTodayMetrics.reduce((sum, m) => sum + m.tabsSwitched, 0),
      productivityScore: Math.round(allTodayMetrics.reduce((sum, m) => sum + m.productivityScore, 0) / allTodayMetrics.length),
      createdAt: allTodayMetrics[0].createdAt,
      updatedAt: allTodayMetrics[allTodayMetrics.length - 1].updatedAt, // Most recent update
    } : null

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

    // Format metrics for frontend (values already in seconds - no conversion needed)
    const formattedMetrics = metrics.map((m) => ({
      id: m.id,
      date: m.date.toISOString(),
      mouseMovements: m.mouseMovements,
      mouseClicks: m.mouseClicks,
      keystrokes: m.keystrokes,
      activeTime: m.activeTime, // Already in seconds
      idleTime: m.idleTime, // Already in seconds
      screenTime: m.screenTime, // Already in seconds
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
          activeTime: todayMetric.activeTime, // Already in seconds
          idleTime: todayMetric.idleTime, // Already in seconds
          screenTime: todayMetric.screenTime, // Already in seconds
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

    // Check if there's already a metric for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingMetric = await prisma.performance_metrics.findFirst({
      where: {
        staffUserId: staffUser.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    let metric

    if (existingMetric) {
      // Update existing metric: Use MAX value (Electron sends cumulative totals)
      // If Electron restarts, new values will be lower, so keep the higher existing values
      metric = await prisma.performance_metrics.update({
        where: { id: existingMetric.id },
        data: {
          // Use MAXIMUM value (handles both: new activity increasing count, and Electron restarts)
          mouseMovements: Math.max(existingMetric.mouseMovements || 0, mouseMovements || 0),
          mouseClicks: Math.max(existingMetric.mouseClicks || 0, mouseClicks || 0),
          keystrokes: Math.max(existingMetric.keystrokes || 0, keystrokes || 0),
          activeTime: Math.max(existingMetric.activeTime || 0, activeTime || 0),
          idleTime: Math.max(existingMetric.idleTime || 0, idleTime || 0),
          screenTime: Math.max(existingMetric.screenTime || 0, screenTime || 0),
          downloads: Math.max(existingMetric.downloads || 0, downloads || 0),
          uploads: Math.max(existingMetric.uploads || 0, uploads || 0),
          bandwidth: Math.max(existingMetric.bandwidth || 0, bandwidth || 0),
          // NEVER overwrite clipboardActions from sync - it's managed by screenshot service
          clipboardActions: existingMetric.clipboardActions,
          filesAccessed: Math.max(existingMetric.filesAccessed || 0, filesAccessed || 0),
          urlsVisited: Math.max(existingMetric.urlsVisited || 0, urlsVisited || 0),
          tabsSwitched: Math.max(existingMetric.tabsSwitched || 0, tabsSwitched || 0),
          // Use latest productivity score
          productivityScore: productivityScore ?? existingMetric.productivityScore,
          // Merge arrays for applications and URLs (deduplicate)
          ...(applicationsUsed !== undefined && { 
            applicationsused: [...new Set([...(existingMetric.applicationsused || []), ...applicationsUsed])]
          }),
          ...(visitedUrls !== undefined && { 
            visitedurls: [...new Set([...(existingMetric.visitedurls || []), ...visitedUrls])]
          }),
        } as any,
      })
    } else {
      // Create new metric
      metric = await prisma.performance_metrics.create({
        data: {
          id: randomUUID(),
          staffUserId: staffUser.id,
          mouseMovements: mouseMovements || 0,
          mouseClicks: mouseClicks || 0,
          keystrokes: keystrokes || 0,
          activeTime: activeTime || 0,
          idleTime: idleTime || 0,
          screenTime: screenTime || 0,
          downloads: downloads || 0,
          uploads: uploads || 0,
          bandwidth: bandwidth || 0,
          clipboardActions: clipboardActions || 0,
          filesAccessed: filesAccessed || 0,
          urlsVisited: urlsVisited || 0,
          tabsSwitched: tabsSwitched || 0,
          productivityScore: productivityScore || 0,
          applicationsused: applicationsUsed || [],
          visitedurls: visitedUrls || [],
        } as any,
      })
    }

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