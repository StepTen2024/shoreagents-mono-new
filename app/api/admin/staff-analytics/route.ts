import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get("search") || ""
    const companyFilter = searchParams.get("company") || "all"
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
    
    console.log(`[Staff Analytics] Date range for ${days} days:`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDatePH: new Date(startDate).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
      endDatePH: new Date(endDate).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
    })

    const where: any = {}

    if (companyFilter !== "all") {
      where.companyId = companyFilter
    }

    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { company: { companyName: { contains: searchQuery, mode: "insensitive" } } },
      ]
    }

    // Fetch staff with all tracking data
    const staff = await prisma.staff_users.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            logo: true,
          },
        },
        staff_profiles: {
          select: {
            currentRole: true,
          },
        },
        performance_metrics: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            date: "desc",
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
            breaks: true,
          },
          orderBy: {
            clockIn: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // Calculate stats for each staff member
    const staffWithStats = staff.map((staffMember) => {
      const metrics = staffMember.performance_metrics
      const timeEntries = staffMember.time_entries

      // Calculate totals
      const totalMouseClicks = metrics.reduce((sum, m) => sum + m.mouseClicks, 0)
      const totalKeystrokes = metrics.reduce((sum, m) => sum + m.keystrokes, 0)
      const totalActiveTime = metrics.reduce((sum, m) => sum + m.activeTime, 0)
      const totalIdleTime = metrics.reduce((sum, m) => sum + m.idleTime, 0)
      const totalUrlsVisited = metrics.reduce((sum, m) => sum + m.urlsVisited, 0)

      // Get latest productivity score
      const latestProductivity = metrics[0]?.productivityScore || 0

      // Calculate productivity percentage (active time / total time)
      const totalTime = totalActiveTime + totalIdleTime
      const productivityPercentage = totalTime > 0 ? Math.round((totalActiveTime / totalTime) * 100) : 0

      // Check if currently clocked in
      const currentEntry = timeEntries.find((entry) => !entry.clockOut)
      const isClockedIn = !!currentEntry

      // Count break violations (late returns)
      const lateBreaks = timeEntries.reduce((count, entry) => {
        return count + entry.breaks.filter((b) => b.isLate).length
      }, 0)

      // Get all visited URLs (from JSON field)
      const allVisitedUrls: any[] = []
      metrics.forEach((metric) => {
        if (metric.visitedurls && Array.isArray(metric.visitedurls)) {
          allVisitedUrls.push(...metric.visitedurls)
        }
      })

      // Flag suspicious URLs (YouTube, gaming, social media during work)
      const suspiciousKeywords = ["youtube", "facebook", "instagram", "twitter", "tiktok", "twitch", "dota", "gaming", "reddit", "netflix"]
      const suspiciousUrls = allVisitedUrls.filter((urlData: any) => {
        const url = urlData.url?.toLowerCase() || ""
        return suspiciousKeywords.some((keyword) => url.includes(keyword))
      })

      const hasSuspiciousActivity = suspiciousUrls.length > 0

      return {
        id: staffMember.id,
        name: staffMember.name,
        email: staffMember.email,
        avatar: staffMember.avatar,
        role: staffMember.role,
        company: staffMember.company,
        currentRole: staffMember.staff_profiles?.currentRole,
        isClockedIn,
        stats: {
          productivityScore: latestProductivity,
          productivityPercentage,
          totalMouseClicks,
          totalKeystrokes,
          totalActiveTime,
          totalIdleTime,
          totalUrlsVisited,
          lateBreaks,
          hasSuspiciousActivity,
          suspiciousUrlCount: suspiciousUrls.length,
        },
        lastActivity: metrics[0]?.date || timeEntries[0]?.clockIn || null,
      }
    })

    return NextResponse.json({ success: true, staff: staffWithStats })
  } catch (error) {
    console.error("Error fetching staff analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

