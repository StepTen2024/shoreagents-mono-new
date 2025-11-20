import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/analytics - Get comprehensive performance analytics for admin
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if Prisma client is available
    if (!prisma) {
      console.error('[Admin Analytics] Prisma client not available')
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }

    // Check if user is admin
    const user = await prisma.management_users.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Get date range (default to Today)
    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '1')
    
    // ✅ FIX: Calculate date range based on Philippines timezone (UTC+8)
    // Get current date/time in Philippines
    const nowUTC = new Date()
    const nowInPH = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
    
    // For "Today", we need to capture all records from midnight PH time to now
    // Midnight today in PH = midnight - 8 hours in UTC (since PH is UTC+8)
    const startOfTodayPH = new Date(nowInPH)
    startOfTodayPH.setHours(0, 0, 0, 0)
    
    // Convert PH midnight to UTC by subtracting 8 hours
    const startDate = new Date(startOfTodayPH.getTime() - (8 * 60 * 60 * 1000))
    startDate.setDate(startDate.getDate() - (days - 1))
    
    // End date should be current time + some buffer
    const endDate = new Date(nowUTC.getTime() + (60 * 60 * 1000)) // Add 1 hour buffer
    
    console.log(`[Admin Analytics] 🔍 Date Range Debug for ${days} days:`, {
      serverTime: nowUTC.toISOString(),
      phTime: nowInPH.toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDatePH: new Date(startDate).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
      endDatePH: new Date(endDate).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
    })

    // Get all staff users
    const staffUsers = await prisma.staff_users.findMany({
      include: {
        company: true,
        performance_metrics: {
          where: {
            shiftDate: {              // ✅ FIX: Use shiftDate (timezone-aware) instead of date
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: { shiftDate: 'desc' }
        }
      }
    })

    // Get all client companies
    const companies = await prisma.company.findMany({
      include: {
        staff_users: {
          include: {
            performance_metrics: {
              where: {
                shiftDate: {          // ✅ FIX: Use shiftDate (timezone-aware) instead of date
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          }
        }
      }
    })

    // Calculate overall statistics
    const allMetrics = staffUsers.flatMap(staff => staff.performance_metrics)
    
    console.log(`[Admin Analytics] 📊 Found ${allMetrics.length} performance metrics:`, {
      sampleDates: allMetrics.slice(0, 5).map(m => ({
        clockInDate: m.date.toISOString(),
        shiftDate: m.shiftDate?.toISOString() || 'null',
        datePH: new Date(m.date).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        staffUserId: m.staffUserId,
        mouseClicks: m.mouseClicks
      }))
    })
    
    const totalStaff = staffUsers.length
    // ✅ FIX: Use shiftDate field for active staff calculation (timezone-aware)
    const today = new Date(nowInPH)
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const activeStaff = staffUsers.filter(staff => 
      staff.performance_metrics.some(metric => 
        metric.shiftDate && metric.shiftDate >= today && metric.shiftDate < tomorrow
      )
    ).length

    // Calculate average productivity score
    const latestMetrics = staffUsers.map(staff => {
      const latest = staff.performance_metrics[0]
      return latest ? latest.productivityScore : 0
    })
    const averageProductivity = latestMetrics.length > 0 
      ? Math.round(latestMetrics.reduce((sum, score) => sum + score, 0) / latestMetrics.length)
      : 0

    // Calculate totals across all staff
    const overallTotals = allMetrics.reduce((totals, metric) => ({
      mouseMovements: totals.mouseMovements + metric.mouseMovements,
      mouseClicks: totals.mouseClicks + metric.mouseClicks,
      keystrokes: totals.keystrokes + metric.keystrokes,
      activeTime: totals.activeTime + metric.activeTime,
      idleTime: totals.idleTime + metric.idleTime,
      screenTime: totals.screenTime + metric.screenTime,
      downloads: totals.downloads + metric.downloads,
      uploads: totals.uploads + metric.uploads,
      bandwidth: totals.bandwidth + metric.bandwidth,
      clipboardActions: totals.clipboardActions + metric.clipboardActions,
      filesAccessed: totals.filesAccessed + metric.filesAccessed,
      urlsVisited: totals.urlsVisited + metric.urlsVisited,
      tabsSwitched: totals.tabsSwitched + metric.tabsSwitched
    }), {
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

    // Calculate performance trends (daily averages) with company breakdown
    const dailyTrends = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      // ✅ FIX: Use shiftDate field for filtering (timezone-aware)
      const dayMetrics = allMetrics.filter(metric => 
        metric.shiftDate && metric.shiftDate >= date && metric.shiftDate <= dayEnd
      )
      
      const dayProductivity = dayMetrics.length > 0
        ? Math.round(dayMetrics.reduce((sum, metric) => sum + metric.productivityScore, 0) / dayMetrics.length)
        : 0
      
      // Group metrics by company for the day
      const companyBreakdown: Record<string, {
        staffCount: number;
        totalProductivity: number;
        metrics: any[];
      }> = {}
      
      dayMetrics.forEach(metric => {
        const staff = staffUsers.find(s => s.id === metric.staffUserId)
        if (staff && staff.company) {
          const companyName = staff.company.companyName || 'Unknown'
          if (!companyBreakdown[companyName]) {
            companyBreakdown[companyName] = {
              staffCount: 0,
              totalProductivity: 0,
              metrics: []
            }
          }
          companyBreakdown[companyName].staffCount++
          companyBreakdown[companyName].totalProductivity += metric.productivityScore
          companyBreakdown[companyName].metrics.push(metric)
        }
      })
      
      // Calculate average productivity per company
      const companyStats = Object.entries(companyBreakdown).map(([companyName, data]) => ({
        companyName,
        staffCount: data.staffCount,
        averageProductivity: Math.round(data.totalProductivity / data.staffCount),
        totalActivity: data.metrics.reduce((sum: number, metric: any) => 
          sum + metric.mouseClicks + metric.keystrokes + metric.urlsVisited, 0
        )
      }))
      
      dailyTrends.push({
        date: date.toISOString().split('T')[0],
        productivity: dayProductivity,
        activeStaff: dayMetrics.length,
        totalActivity: dayMetrics.reduce((sum, metric) => 
          sum + metric.mouseClicks + metric.keystrokes + metric.urlsVisited, 0
        ),
        companies: companyStats
      })
    }

    // Calculate department performance with detailed metrics
    const departmentStats = companies.map(company => {
      const companyStaff = company.staff_users
      const companyMetrics = companyStaff.flatMap(staff => staff.performance_metrics)
      
      const avgProductivity = companyMetrics.length > 0
        ? Math.round(companyMetrics.reduce((sum, metric) => sum + metric.productivityScore, 0) / companyMetrics.length)
        : 0
      
      // Calculate company-specific totals
      const companyTotals = companyMetrics.reduce((totals, metric) => ({
        mouseMovements: totals.mouseMovements + metric.mouseMovements,
        mouseClicks: totals.mouseClicks + metric.mouseClicks,
        keystrokes: totals.keystrokes + metric.keystrokes,
        activeTime: totals.activeTime + metric.activeTime,
        idleTime: totals.idleTime + metric.idleTime,
        screenTime: totals.screenTime + metric.screenTime,
        downloads: totals.downloads + metric.downloads,
        uploads: totals.uploads + metric.uploads,
        bandwidth: totals.bandwidth + metric.bandwidth,
        clipboardActions: totals.clipboardActions + metric.clipboardActions,
        filesAccessed: totals.filesAccessed + metric.filesAccessed,
        urlsVisited: totals.urlsVisited + metric.urlsVisited,
        tabsSwitched: totals.tabsSwitched + metric.tabsSwitched
      }), {
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
      
      console.log('[Admin Analytics] Company data:', {
        id: company.id,
        companyName: company.companyName,
        staffCount: companyStaff.length,
        mouseClicks: companyTotals.mouseClicks
      })
      
      return {
        companyName: company.companyName || 'Unknown Company',
        staffCount: companyStaff.length,
        // ✅ FIX: Use shiftDate field for filtering (timezone-aware)
        activeStaff: companyStaff.filter(staff => 
          staff.performance_metrics.some(metric => 
            metric.shiftDate && metric.shiftDate >= today && metric.shiftDate < tomorrow
          )
        ).length,
        averageProductivity: avgProductivity,
        totalActivity: companyMetrics.reduce((sum, metric) => 
          sum + metric.mouseClicks + metric.keystrokes + metric.urlsVisited, 0
        ),
        totals: companyTotals
      }
    })

    // Calculate top performers
    const topPerformers = staffUsers
      .map(staff => {
        const latest = staff.performance_metrics[0]
        return {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          company: staff.company?.companyName || 'Unknown',
          productivityScore: latest ? latest.productivityScore : 0,
          lastActivity: latest ? latest.date : null
        }
      })
      .sort((a, b) => b.productivityScore - a.productivityScore)
      .slice(0, 10)

    // Calculate recent activity (last 7 days)
    const recentActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      // ✅ FIX: Use shiftDate field for filtering (timezone-aware)
      const dayMetrics = allMetrics.filter(metric => 
        metric.shiftDate && metric.shiftDate >= date && metric.shiftDate <= dayEnd
      )
      
      recentActivity.push({
        date: date.toISOString().split('T')[0],
        activeStaff: dayMetrics.length,
        totalScreenshots: dayMetrics.reduce((sum, metric) => 
          sum + (metric.clipboardActions || 0), 0
        ),
        totalUrls: dayMetrics.reduce((sum, metric) => sum + metric.urlsVisited, 0),
        totalApplications: dayMetrics.reduce((sum, metric) => 
          sum + ((metric as any).applicationsUsed?.length || 0), 0
        )
      })
    }

    return NextResponse.json({
      summary: {
        totalStaff,
        activeStaff,
        averageProductivity,
        totalCompanies: companies.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days
        },
        overallTotals
      },
      trends: {
        daily: dailyTrends.reverse(), // Most recent first
        recentActivity
      },
      departments: departmentStats,
      topPerformers,
      companies: companies.map(company => ({
        id: company.id,
        name: company.companyName,
        staffCount: company.staff_users.length,
        // ✅ FIX: Use shiftDate (timezone-aware) instead of date
        activeStaff: company.staff_users.filter(staff => 
          staff.performance_metrics.some(metric => 
            metric.shiftDate && metric.shiftDate >= today && metric.shiftDate < tomorrow
          )
        ).length
      }))
    })

  } catch (error) {
    console.error('[Admin Analytics] Error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
