import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateEnhancedProductivityScore } from "@/lib/productivity-score"

// GET /api/client/analytics - Get performance metrics for all assigned staff
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client user and their organization with profile (for timezone)
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
    
    // Get client's timezone from profile (default to browser timezone behavior if not set)
    const clientTimezone = clientUser.client_profiles?.timezone || 'America/New_York'

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

    // Get date range (default to Today) using CLIENT'S timezone
    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '1')
    
    // ✅ Calculate date range based on CLIENT'S timezone from their profile
    const nowUTC = new Date()
    const nowInClientTZ = new Date(nowUTC.toLocaleString('en-US', { timeZone: clientTimezone }))
    
    // Get midnight today in client's timezone, then convert to UTC
    const startOfTodayClient = new Date(nowInClientTZ)
    startOfTodayClient.setHours(0, 0, 0, 0)
    
    // Calculate timezone offset in milliseconds
    const tzOffset = nowInClientTZ.getTime() - nowUTC.getTime()
    
    const startDate = new Date(startOfTodayClient.getTime() - tzOffset)
    startDate.setDate(startDate.getDate() - (days - 1))
    
    const endDate = new Date(nowUTC.getTime() + (60 * 60 * 1000)) // Current time + 1hr buffer
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 [Client Analytics] DATE RANGE CALCULATION')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`👤 Client: ${clientUser.email}`)
    console.log(`🌍 Client Timezone: ${clientTimezone}`)
    console.log(`🔍 Filtering for: ${days} day(s)`)
    console.log(`⏰ Current UTC Time: ${nowUTC.toISOString()}`)
    console.log(`🕐 Current Client Time: ${nowInClientTZ.toISOString()}`)
    console.log(`📅 Query Date Range (UTC):`)
    console.log(`   Start: ${startDate.toISOString()}`)
    console.log(`   End:   ${endDate.toISOString()}`)
    console.log(`📅 Query Date Range (Client TZ):`)
    console.log(`   Start: ${new Date(startDate).toLocaleString('en-US', { timeZone: clientTimezone })}`)
    console.log(`   End:   ${new Date(endDate).toLocaleString('en-US', { timeZone: clientTimezone })}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

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

    // Calculate productivity score using Electron's weighted formula (same as admin)
    // Formula: 40% active time ratio + 30% keystrokes + 30% mouse clicks
    const calculateProductivityScore = (metrics: any[]) => {
      if (!metrics || metrics.length === 0) return 0
      
      // Calculate totals across all metrics
      const totals = metrics.reduce((acc, metric) => {
        acc.activeTime += metric.activeTime
        acc.idleTime += metric.idleTime
        acc.keystrokes += metric.keystrokes
        acc.mouseClicks += metric.mouseClicks
        return acc
      }, {
        activeTime: 0,
        idleTime: 0,
        keystrokes: 0,
        mouseClicks: 0
      })

      // Use Electron's weighted formula (40% time + 30% keystrokes + 30% mouse)
      const totalTime = totals.activeTime + totals.idleTime
      if (totalTime === 0) return 0

      // Active time percentage (40% weight)
      const activePercent = (totals.activeTime / totalTime) * 40

      // Keystroke activity (30% weight) - normalized to 5000 keystrokes = 100%
      const keystrokeScore = Math.min((totals.keystrokes / 5000) * 30, 30)

      // Mouse activity (30% weight) - normalized to 1000 clicks = 100%
      const mouseScore = Math.min((totals.mouseClicks / 1000) * 30, 30)

      return Math.round(activePercent + keystrokeScore + mouseScore)
    }

    // Combine staff data with their metrics
    const staffWithMetrics = staffMembers.map(staff => {
      const staffMetrics = metricsByStaff.get(staff.id) || []
      const latestMetric = staffMetrics[0] // Most recent metric
      
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
      
      // Calculate productivity using Electron's weighted formula (40% time + 30% keystrokes + 30% mouse)
      const totalTime = totals.activeTime + totals.idleTime
      let productivityScore = 0
      
      if (totalTime > 0) {
        const activePercent = (totals.activeTime / totalTime) * 40
        const keystrokeScore = Math.min((totals.keystrokes / 5000) * 30, 30)
        const mouseScore = Math.min((totals.mouseClicks / 1000) * 30, 30)
        productivityScore = Math.round(activePercent + keystrokeScore + mouseScore)
      }
      
      // ✨ Calculate enhanced productivity score with breakdown
      const allApps: string[] = []
      const allUrls: string[] = []
      
      staffMetrics.forEach(metric => {
        if ((metric as any).applicationsused && Array.isArray((metric as any).applicationsused)) {
          (metric as any).applicationsused.forEach((app: any) => {
            const appName = typeof app === 'string' ? app : app?.name
            if (appName && !allApps.includes(appName)) {
              allApps.push(appName)
            }
          })
        }
        if ((metric as any).visitedurls && Array.isArray((metric as any).visitedurls)) {
          (metric as any).visitedurls.forEach((urlData: any) => {
            const url = typeof urlData === 'string' ? urlData : urlData?.url
            if (url && !allUrls.includes(url)) {
              allUrls.push(url)
            }
          })
        }
      })
      
      const enhancedScore = calculateEnhancedProductivityScore({
        activeTime: totals.activeTime,
        idleTime: totals.idleTime,
        screenTime: totals.screenTime,
        mouseMovements: totals.mouseMovements,
        mouseClicks: totals.mouseClicks,
        keystrokes: totals.keystrokes,
        clipboardActions: totals.clipboardActions,
        downloads: totals.downloads,
        uploads: totals.uploads,
        urlsVisited: totals.urlsVisited,
        tabsSwitched: totals.tabsSwitched,
        applicationsUsed: allApps,
        visitedUrls: allUrls
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
        enhancedScore, // ✨ Add enhanced score with breakdown
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

