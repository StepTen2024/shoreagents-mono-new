import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Work-related keywords for URL classification
const WORK_KEYWORDS = [
  'gmail', 'outlook', 'slack', 'teams', 'zoom', 'meet', 'docs', 'drive',
  'notion', 'asana', 'trello', 'jira', 'github', 'gitlab', 'stackoverflow',
  'linkedin', 'salesforce', 'hubspot', 'shopify', 'wordpress', 'figma',
  'canva', 'dropbox', 'onedrive', 'monday', 'clickup', 'airtable'
]

const WORK_APPS = [
  'chrome', 'firefox', 'edge', 'safari', 'vscode', 'visual studio',
  'slack', 'teams', 'zoom', 'outlook', 'gmail', 'word', 'excel',
  'powerpoint', 'photoshop', 'illustrator', 'figma', 'sketch',
  'terminal', 'cmd', 'powershell', 'pycharm', 'webstorm', 'phpstorm'
]

function isWorkRelated(item: string, keywords: string[]): boolean {
  const lowerItem = item.toLowerCase()
  return keywords.some(keyword => lowerItem.includes(keyword))
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client user
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email }
    })

    if (!clientUser || !clientUser.companyId) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Get period from query
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
    
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1)
    }

    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    // Get all staff for this company
    const staffMembers = await prisma.staff_users.findMany({
      where: { companyId: clientUser.companyId },
      include: {
        staff_profiles: {
          include: {
            work_schedules: true
          }
        }
      }
    })

    const staffAnalytics = await Promise.all(
      staffMembers.map(async (staff) => {
        // Get today's time entry for attendance
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const timeEntry = await prisma.time_entries.findFirst({
          where: {
            staffUserId: staff.id,
            clockIn: {
              gte: todayStart,
              lte: todayEnd
            }
          },
          orderBy: { clockIn: 'desc' }
        })

        // Get breaks for period
        const breaks = await prisma.breaks.findMany({
          where: {
            staffUserId: staff.id,
            actualStart: {
              gte: startDate,
              lte: endDate
            }
          }
        })

        // Get performance metrics for period
        const metrics = await prisma.performance_metrics.findMany({
          where: {
            staffUserId: staff.id,
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        })

        // Calculate totals
        const totalActiveTime = metrics.reduce((sum, m) => sum + (m.activeTime || 0), 0)
        const totalIdleTime = metrics.reduce((sum, m) => sum + (m.idleTime || 0), 0)
        const totalKeystrokes = metrics.reduce((sum, m) => sum + (m.keystrokes || 0), 0)
        const totalClicks = metrics.reduce((sum, m) => sum + (m.mouseClicks || 0), 0)
        const totalScreenTime = metrics.reduce((sum, m) => sum + (m.screenTime || 0), 0)

        // Get URLs and Apps
        const allUrls: string[] = []
        const allApps: string[] = []
        
        metrics.forEach(m => {
          if ((m as any).visitedurls && Array.isArray((m as any).visitedurls)) {
            allUrls.push(...(m as any).visitedurls)
          }
          if ((m as any).applicationsused && Array.isArray((m as any).applicationsused)) {
            allApps.push(...(m as any).applicationsused)
          }
        })

        const uniqueUrls = [...new Set(allUrls)]
        const uniqueApps = [...new Set(allApps)]

        const workRelatedUrls = uniqueUrls.filter(url => isWorkRelated(url, WORK_KEYWORDS)).length
        const workRelatedApps = uniqueApps.filter(app => isWorkRelated(app, WORK_APPS)).length

        // Calculate productivity score (0-100)
        let productivityScore = 0
        
        if (totalActiveTime + totalIdleTime > 0) {
          // Active time percentage (40%)
          const activePercentage = (totalActiveTime / (totalActiveTime + totalIdleTime)) * 40
          productivityScore += activePercentage

          // Keystroke activity (30%)
          const keystrokeScore = Math.min((totalKeystrokes / 5000) * 30, 30)
          productivityScore += keystrokeScore

          // Mouse activity (30%)
          const mouseScore = Math.min((totalClicks / 1000) * 30, 30)
          productivityScore += mouseScore
        }

        productivityScore = Math.round(Math.min(productivityScore, 100))

        // Attendance status
        let clockInStatus: "EARLY" | "ON_TIME" | "LATE" | "NO_DATA" = "NO_DATA"
        let minutesEarly: number | null = null
        let minutesLate: number | null = null

        if (timeEntry) {
          if (timeEntry.wasEarly) {
            clockInStatus = "EARLY"
            minutesEarly = timeEntry.earlyBy || 0
          } else if (timeEntry.wasLate) {
            clockInStatus = "LATE"
            minutesLate = timeEntry.lateBy || 0
          } else {
            clockInStatus = "ON_TIME"
          }
        }

        // Break compliance
        let breakCompliance: "GOOD" | "WARNING" | "CONCERN" | "NO_DATA" = "NO_DATA"
        const todayBreaks = breaks.filter(b => {
          const breakDate = new Date(b.actualStart)
          return breakDate >= todayStart && breakDate <= todayEnd
        })

        if (todayBreaks.length > 0) {
          const lateFromBreak = todayBreaks.some(b => {
            if (!b.actualEnd || !b.scheduledEnd) return false
            const actualEnd = new Date(b.actualEnd)
            const scheduledEnd = new Date(b.scheduledEnd)
            return actualEnd > scheduledEnd
          })

          if (todayBreaks.length >= 2 && todayBreaks.length <= 3 && !lateFromBreak) {
            breakCompliance = "GOOD"
          } else if (todayBreaks.length > 3 || lateFromBreak) {
            breakCompliance = "WARNING"
          } else if (todayBreaks.length > 5 || (lateFromBreak && todayBreaks.length > 2)) {
            breakCompliance = "CONCERN"
          } else {
            breakCompliance = "GOOD"
          }
        }

        const totalTime = totalActiveTime + totalIdleTime
        const activePercentage = totalTime > 0 ? (totalActiveTime / totalTime) * 100 : 0

        return {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          avatar: staff.avatar,
          position: staff.staff_profiles?.currentRole || "Staff Member",
          
          // Attendance
          clockInStatus,
          minutesEarly,
          minutesLate,
          
          // Break Compliance
          breakCompliance,
          totalBreaks: todayBreaks.length,
          lateFromBreak: todayBreaks.some(b => {
            if (!b.actualEnd || !b.scheduledEnd) return false
            return new Date(b.actualEnd) > new Date(b.scheduledEnd)
          }),
          
          // Productivity Score
          productivityScore,
          
          // Time Metrics
          activeTime: totalActiveTime,
          idleTime: totalIdleTime,
          activePercentage: Math.round(activePercentage),
          
          // Web Activity
          urlsVisited: uniqueUrls.length,
          workRelatedUrls,
          nonWorkUrls: uniqueUrls.length - workRelatedUrls,
          workUrlPercentage: uniqueUrls.length > 0 
            ? Math.round((workRelatedUrls / uniqueUrls.length) * 100)
            : 0,
          
          // Applications
          appsUsed: uniqueApps.length,
          workRelatedApps,
          nonWorkApps: uniqueApps.length - workRelatedApps,
          workAppPercentage: uniqueApps.length > 0
            ? Math.round((workRelatedApps / uniqueApps.length) * 100)
            : 0,
          
          lastUpdate: metrics.length > 0 
            ? metrics[metrics.length - 1].updatedAt.toISOString()
            : new Date().toISOString()
        }
      })
    )

    return NextResponse.json({
      staff: staffAnalytics,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    })

  } catch (error) {
    console.error("Error fetching staff analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch staff analytics" },
      { status: 500 }
    )
  }
}

