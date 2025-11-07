import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/client/analytics - Get performance metrics for all assigned staff
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client user and their organization
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Unauthorized - Not a client user" }, { status: 401 })
    }

    // Get all staff assigned to this company
    const staffUsers = await prisma.staff_users.findMany({
      where: { companyId: clientUser.company.id },
      select: { id: true }
    })
    
    const staffIds = staffUsers.map(s => s.id)

    if (staffIds.length === 0) {
      return NextResponse.json({ 
        staff: [],
        summary: {
          totalStaff: 0,
          activeStaff: 0,
          averageProductivity: 0
        }
      })
    }

    // Get date range (last 7 days by default, or today if specified)
    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '7')
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Fetch all staff with their user info and performance metrics
    const staffMembers = await prisma.staff_users.findMany({
      where: {
        id: { in: staffIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        staff_profiles: {
          select: {
            currentRole: true,
            location: true,
            employmentStatus: true,
            startDate: true,
            salary: true
          }
        },
        company: {
          select: {
            companyName: true
          }
        }
      }
    })

    // Fetch performance metrics for all staff in the date range
    const performanceMetrics = await prisma.performance_metrics.findMany({
      where: {
        staffUserId: { in: staffIds },
        shiftDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: [
        { staffUserId: 'asc' },
        { shiftDate: 'desc' }
      ]
    })

    // Group metrics by staff member
    const metricsByStaff = new Map()
    performanceMetrics.forEach(metric => {
      if (!metricsByStaff.has(metric.staffUserId)) {
        metricsByStaff.set(metric.staffUserId, [])
      }
      metricsByStaff.get(metric.staffUserId).push(metric)
    })

    // Calculate productivity score
    const calculateProductivityScore = (metrics: any[]) => {
      if (!metrics || metrics.length === 0) return 0
      
      // Calculate totals across all metrics
      const totals = metrics.reduce((acc, metric) => {
        acc.mouseMovements += metric.mouseMovements
        acc.mouseClicks += metric.mouseClicks
        acc.keystrokes += metric.keystrokes
        acc.activeTime += metric.activeTime
        acc.idleTime += metric.idleTime
        acc.screenTime += metric.screenTime
        acc.downloads += metric.downloads
        acc.uploads += metric.uploads
        acc.bandwidth += metric.bandwidth
        acc.clipboardActions += metric.clipboardActions
        acc.filesAccessed += metric.filesAccessed
        acc.urlsVisited += metric.urlsVisited
        acc.tabsSwitched += metric.tabsSwitched
        return acc
      }, {
        mouseMovements: 0,
        mouseClicks: 0,
        keystrokes: 0,
        activeTime: 0,
        idleTime: 0,
        screenTime: 0,
        downloads: 0,
        uploads: 0,
        bandwidth: 0,
        clipboardActions: 0,
        filesAccessed: 0,
        urlsVisited: 0,
        tabsSwitched: 0
      })

      // Calculate individual component scores
      const keystrokesScore = Math.min((totals.keystrokes / 1000) * 100, 100) // Reduced threshold
      const clicksScore = Math.min((totals.mouseClicks / 100) * 100, 100) // Reduced threshold
      const movementsScore = Math.min((totals.mouseMovements / 500) * 100, 100) // Added mouse movements
      const urlsScore = Math.min((totals.urlsVisited / 10) * 100, 100) // Added URL visits
      const clipboardScore = Math.min((totals.clipboardActions / 5) * 100, 100) // Added clipboard actions
      
      // Time-based score (only if there's actual time data)
      let timeScore = 0
      const totalTime = totals.activeTime + totals.idleTime
      if (totalTime > 0) {
        const activePercent = (totals.activeTime / totalTime) * 100
        timeScore = activePercent
      } else {
        // If no time data, give a small score based on activity indicators
        timeScore = Math.min((totals.mouseClicks + totals.keystrokes + totals.mouseMovements) / 10, 20)
      }
      
      // Calculate weighted average (time is most important, then activity)
      const productivityScore = Math.round(
        (timeScore * 0.3) + 
        (keystrokesScore * 0.2) + 
        (clicksScore * 0.2) + 
        (movementsScore * 0.15) + 
        (urlsScore * 0.1) + 
        (clipboardScore * 0.05)
      )
      
      return Math.min(productivityScore, 100)
    }

    // Combine staff data with their metrics
    const staffWithMetrics = staffMembers.map(staff => {
      const staffMetrics = metricsByStaff.get(staff.id) || []
      const latestMetric = staffMetrics[0] // Most recent metric
      // Use the productivity score from the database instead of recalculating
      const productivityScore = latestMetric?.productivityScore || 0
      
      // Calculate totals across all metrics
      const totals = staffMetrics.reduce((acc: { mouseMovements: any; mouseClicks: any; keystrokes: any; activeTime: any; idleTime: any; screenTime: any; downloads: any; uploads: any; bandwidth: any; clipboardActions: any; filesAccessed: any; urlsVisited: any; tabsSwitched: any }, metric: { mouseMovements: any; mouseClicks: any; keystrokes: any; activeTime: any; idleTime: any; screenTime: any; downloads: any; uploads: any; bandwidth: any; clipboardActions: any; filesAccessed: any; urlsVisited: any; tabsSwitched: any }) => {
        acc.mouseMovements += metric.mouseMovements
        acc.mouseClicks += metric.mouseClicks
        acc.keystrokes += metric.keystrokes
        acc.activeTime += metric.activeTime
        acc.idleTime += metric.idleTime
        acc.screenTime += metric.screenTime
        acc.downloads += metric.downloads
        acc.uploads += metric.uploads
        acc.bandwidth += metric.bandwidth
        acc.clipboardActions += metric.clipboardActions
        acc.filesAccessed += metric.filesAccessed
        acc.urlsVisited += metric.urlsVisited
        acc.tabsSwitched += metric.tabsSwitched
        return acc
      }, {
        mouseMovements: 0,
        mouseClicks: 0,
        keystrokes: 0,
        activeTime: 0,
        idleTime: 0,
        screenTime: 0,
        downloads: 0,
        uploads: 0,
        bandwidth: 0,
        clipboardActions: 0,
        filesAccessed: 0,
        urlsVisited: 0,
        tabsSwitched: 0
      })
      
      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        avatar: staff.avatar,
        position: staff.staff_profiles?.currentRole || 'Staff Member',
        department: staff.company?.companyName || staff.staff_profiles?.location || 'General',
        employmentStatus: staff.staff_profiles?.employmentStatus || 'Unknown',
        startDate: staff.staff_profiles?.startDate,
        salary: staff.staff_profiles?.salary,
        location: staff.staff_profiles?.location,
        metrics: staffMetrics.length > 0 ? {
          // Latest day metrics
          latest: latestMetric ? {
            date: latestMetric.date,
            mouseMovements: latestMetric.mouseMovements,
            mouseClicks: latestMetric.mouseClicks,
            keystrokes: latestMetric.keystrokes,
            activeTime: latestMetric.activeTime,
            idleTime: latestMetric.idleTime,
            screenTime: latestMetric.screenTime,
            downloads: latestMetric.downloads,
            uploads: latestMetric.uploads,
            bandwidth: latestMetric.bandwidth,
            clipboardActions: latestMetric.clipboardActions,
            filesAccessed: latestMetric.filesAccessed,
            urlsVisited: latestMetric.urlsVisited,
            tabsSwitched: latestMetric.tabsSwitched,
            productivityScore: latestMetric.productivityScore,
            applicationsUsed: (latestMetric as any).applicationsused || [],
            visitedUrls: (latestMetric as any).visitedurls || [],
            screenshotUrls: (latestMetric as any).screenshotUrls || []
          } : null,
          // Totals across all days
          totals: {
            mouseMovements: totals.mouseMovements,
            mouseClicks: totals.mouseClicks,
            keystrokes: totals.keystrokes,
            activeTime: totals.activeTime,
            idleTime: totals.idleTime,
            screenTime: totals.screenTime,
            downloads: totals.downloads,
            uploads: totals.uploads,
            bandwidth: totals.bandwidth,
            clipboardActions: totals.clipboardActions,
            filesAccessed: totals.filesAccessed,
            urlsVisited: totals.urlsVisited,
            tabsSwitched: totals.tabsSwitched,
            productivityScore: productivityScore,
            applicationsUsed: (latestMetric as any)?.applicationsused || [],
            visitedUrls: (latestMetric as any)?.visitedurls || [],
            screenshotUrls: (latestMetric as any)?.screenshotUrls || []
          },
          // All historical data
          history: staffMetrics,
          recordCount: staffMetrics.length
        } : null,
        productivityScore,
        isActive: latestMetric && latestMetric.activeTime > 0,
        lastActivity: latestMetric ? latestMetric.date : null
      }
    })

    // Calculate summary stats
    const activeStaff = staffWithMetrics.filter(s => s.isActive).length
    const totalProductivity = staffWithMetrics.reduce((sum, s) => sum + s.productivityScore, 0)
    const averageProductivity = staffWithMetrics.length > 0 
      ? Math.round(totalProductivity / staffWithMetrics.length) 
      : 0

    // Calculate overall totals across all staff
    const overallTotals = staffWithMetrics.reduce((acc, staff) => {
      if (staff.metrics?.totals) {
        acc.mouseMovements += staff.metrics.totals.mouseMovements
        acc.mouseClicks += staff.metrics.totals.mouseClicks
        acc.keystrokes += staff.metrics.totals.keystrokes
        acc.activeTime += staff.metrics.totals.activeTime
        acc.idleTime += staff.metrics.totals.idleTime
        acc.screenTime += staff.metrics.totals.screenTime
        acc.downloads += staff.metrics.totals.downloads
        acc.uploads += staff.metrics.totals.uploads
        acc.bandwidth += staff.metrics.totals.bandwidth
        acc.clipboardActions += staff.metrics.totals.clipboardActions
        acc.filesAccessed += staff.metrics.totals.filesAccessed
        acc.urlsVisited += staff.metrics.totals.urlsVisited
        acc.tabsSwitched += staff.metrics.totals.tabsSwitched
      }
      return acc
    }, {
      mouseMovements: 0,
      mouseClicks: 0,
      keystrokes: 0,
      activeTime: 0,
      idleTime: 0,
      screenTime: 0,
      downloads: 0,
      uploads: 0,
      bandwidth: 0,
      clipboardActions: 0,
      filesAccessed: 0,
      urlsVisited: 0,
      tabsSwitched: 0
    })

    return NextResponse.json({
      staff: staffWithMetrics,
      summary: {
        totalStaff: staffMembers.length,
        activeStaff,
        averageProductivity,
        dateRange: {
          start: startDate,
          end: endDate,
          days
        },
        overallTotals
      }
    })
  } catch (error) {
    console.error("Error fetching client analytics data:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    )
  }
}

