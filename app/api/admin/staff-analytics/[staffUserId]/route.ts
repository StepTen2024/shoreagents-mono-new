import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ staffUserId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!managementUser || managementUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const params = await context.params
    const { staffUserId } = params

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "1") // Default to Today

    // Calculate date range based on Philippines timezone
    // ✅ FIX: Calculate date range based on Philippines timezone (UTC+8)
    const nowUTC = new Date()
    const nowInPH = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
    
    // Get midnight today in PH time, then convert to UTC
    const startOfTodayPH = new Date(nowInPH)
    startOfTodayPH.setHours(0, 0, 0, 0)
    
    const startDate = new Date(startOfTodayPH.getTime() - (8 * 60 * 60 * 1000))
    startDate.setDate(startDate.getDate() - (days - 1))
    
    const endDate = new Date(nowUTC.getTime() + (60 * 60 * 1000)) // Current time + 1hr buffer

    // Fetch staff with ALL tracking data
    const staffMember = await prisma.staff_users.findUnique({
      where: { id: staffUserId },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            industry: true,
          },
        },
        staff_profiles: {
          select: {
            currentRole: true,
            phone: true,
            location: true,
          },
        },
        performance_metrics: {
          where: {
            shiftDate: {              // ✅ FIX: Use shiftDate (timezone-aware) instead of date
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            shiftDate: "desc",        // ✅ FIX: Order by shiftDate
          },
        },
        time_entries: {
          where: {
            clockIn: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            breaks: {
              orderBy: {
                actualStart: "asc",
              },
            },
          },
          orderBy: {
            clockIn: "desc",
          },
        },
      },
    })

    if (!staffMember) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    const metrics = staffMember.performance_metrics
    const timeEntries = staffMember.time_entries

    // Calculate overall stats
    const totalMouseClicks = metrics.reduce((sum, m) => sum + m.mouseClicks, 0)
    const totalKeystrokes = metrics.reduce((sum, m) => sum + m.keystrokes, 0)
    const totalActiveTime = metrics.reduce((sum, m) => sum + m.activeTime, 0)
    const totalIdleTime = metrics.reduce((sum, m) => sum + m.idleTime, 0)
    const totalScreenTime = metrics.reduce((sum, m) => sum + m.screenTime, 0)
    const totalUrlsVisited = metrics.reduce((sum, m) => sum + m.urlsVisited, 0)

    // Calculate productivity
    const totalTime = totalActiveTime + totalIdleTime
    const productivityPercentage = totalTime > 0 ? Math.round((totalActiveTime / totalTime) * 100) : 0

    // Get current clock-in status
    const currentEntry = timeEntries.find((entry) => !entry.clockOut)
    const isClockedIn = !!currentEntry

    // Collect all visited URLs with timestamps
    const allVisitedUrls: any[] = []
    metrics.forEach((metric) => {
      if (metric.visitedurls && Array.isArray(metric.visitedurls)) {
        allVisitedUrls.push(
          ...metric.visitedurls.map((urlData: any) => ({
            ...urlData,
            date: metric.date,
          }))
        )
      }
    })

    // Flag suspicious URLs
    const suspiciousKeywords = [
      "youtube",
      "facebook",
      "instagram",
      "twitter",
      "tiktok",
      "twitch",
      "dota",
      "gaming",
      "reddit",
      "netflix",
      "spotify",
      "9gag",
      "pinterest",
    ]
    const suspiciousUrls = allVisitedUrls
      .filter((urlData: any) => {
        const url = urlData.url?.toLowerCase() || ""
        return suspiciousKeywords.some((keyword) => url.includes(keyword))
      })
      .map((urlData: any) => ({
        ...urlData,
        isSuspicious: true,
        reason: suspiciousKeywords.find((k) => urlData.url?.toLowerCase().includes(k)),
      }))

    // Collect all applications used
    const allApplications: any[] = []
    metrics.forEach((metric) => {
      if (metric.applicationsused && Array.isArray(metric.applicationsused)) {
        allApplications.push(
          ...metric.applicationsused.map((appData: any) => ({
            ...appData,
            date: metric.date,
          }))
        )
      }
    })

    // Group applications by name and sum time
    const applicationStats: Record<string, any> = {}
    allApplications.forEach((appData: any) => {
      const appName = appData.name || "Unknown"
      if (!applicationStats[appName]) {
        applicationStats[appName] = {
          name: appName,
          totalTime: 0,
          count: 0,
        }
      }
      applicationStats[appName].totalTime += appData.duration || 0
      applicationStats[appName].count++
    })

    const topApplications = Object.values(applicationStats)
      .sort((a: any, b: any) => b.totalTime - a.totalTime)
      .slice(0, 10)

    // Analyze breaks
    const allBreaks = timeEntries.flatMap((entry) => entry.breaks)
    const lateBreaks = allBreaks.filter((b) => b.isLate)
    const totalBreakTime = allBreaks.reduce((sum, b) => sum + (b.duration || 0), 0)

    // Calculate daily activity timeline
    const dailyActivity = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const dayMetrics = metrics.filter((m) => m.shiftDate && m.shiftDate >= date && m.shiftDate <= dayEnd)  // ✅ FIX: Use shiftDate for filtering
      const dayEntries = timeEntries.filter((e) => e.clockIn >= date && e.clockIn <= dayEnd)

      const dayStats = {
        date: date.toISOString().split("T")[0],
        mouseClicks: dayMetrics.reduce((sum, m) => sum + m.mouseClicks, 0),
        keystrokes: dayMetrics.reduce((sum, m) => sum + m.keystrokes, 0),
        activeTime: dayMetrics.reduce((sum, m) => sum + m.activeTime, 0),
        idleTime: dayMetrics.reduce((sum, m) => sum + m.idleTime, 0),
        urlsVisited: dayMetrics.reduce((sum, m) => sum + m.urlsVisited, 0),
        productivityScore: dayMetrics[0]?.productivityScore || 0,
        clockedIn: dayEntries.length > 0,
        breaks: dayEntries.flatMap((e) => e.breaks).length,
        lateBreaks: dayEntries.flatMap((e) => e.breaks).filter((b) => b.isLate).length,
      }

      dailyActivity.push(dayStats)
    }

    // Get screenshots
    const allScreenshots: any[] = []
    metrics.forEach((metric) => {
      // Database column is lowercase: screenshoturls
      const screenshots = (metric as any).screenshoturls
      if (screenshots && Array.isArray(screenshots)) {
        allScreenshots.push(
          ...screenshots.map((url: string) => ({
            url: url,
            date: metric.date,
          }))
        )
      }
    })

    return NextResponse.json({
      success: true,
      staff: {
        id: staffMember.id,
        name: staffMember.name,
        email: staffMember.email,
        avatar: staffMember.avatar,
        role: staffMember.role,
        company: staffMember.company,
        profile: staffMember.staff_profiles,
        isClockedIn,
        currentEntry,
      },
      summary: {
        totalMouseClicks,
        totalKeystrokes,
        totalActiveTime,
        totalIdleTime,
        totalScreenTime,
        totalUrlsVisited,
        productivityPercentage,
        totalBreakTime,
        lateBreakCount: lateBreaks.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days,
        },
      },
      visitedUrls: allVisitedUrls,
      suspiciousUrls,
      applications: topApplications,
      breaks: allBreaks,
      lateBreaks,
      screenshots: allScreenshots,
      dailyActivity: dailyActivity.reverse(),
      timeEntries,
    })
  } catch (error) {
    console.error("Error fetching staff analytics detail:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

