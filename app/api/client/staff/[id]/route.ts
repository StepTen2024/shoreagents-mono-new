import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🔍 [CLIENT/STAFF/DETAIL] API called")
    const session = await auth()
    
    if (!session?.user?.email) {
      console.log("❌ [CLIENT/STAFF/DETAIL] No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ [CLIENT/STAFF/DETAIL] Session found:", session.user.email)

    // Get ClientUser to verify they have access
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })

    if (!clientUser || !clientUser.company) {
      console.log("❌ [CLIENT/STAFF/DETAIL] Client user or company not found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ [CLIENT/STAFF/DETAIL] Client found:", clientUser.email, "Company:", clientUser.company.companyName)
    
    const { id: userId } = await params
    console.log("🔍 [CLIENT/STAFF/DETAIL] Looking for staff:", userId, "in company:", clientUser.company.id)

    // Get staff member details with all relations (ONLY from staff_users and staff_profiles)
    console.log("🔍 [CLIENT/STAFF/DETAIL] Querying database for staff:", userId)
    const user = await prisma.staff_users.findUnique({
      where: { 
        id: userId,
        companyId: clientUser.company.id // Ensure staff belongs to client's company
      },
      include: {
        staff_profiles: {
          include: {
            work_schedules: true,
          },
        },
        company: {
          select: {
            companyName: true,
            management_users: {
              select: {
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        time_entries: {
          orderBy: { clockIn: 'desc' },
          take: 10,
        },
        performance_metrics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          orderBy: { submittedDate: 'desc' },
        },
        breaks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
        },
        gamification_profiles: {
          include: {
            user_badges: true,
          },
        },
        activity_posts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!user) {
      console.log("❌ [CLIENT/STAFF/DETAIL] Staff member not found:", userId)
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    console.log("✅ [CLIENT/STAFF/DETAIL] Staff found:", user.name, user.email)

    // Calculate stats
    console.log("🔍 [CLIENT/STAFF/DETAIL] Calculating stats...")
    const avgProductivity = user.performance_metrics.length > 0
      ? Math.round(
          user.performance_metrics.reduce((sum, m) => sum + m.productivityScore, 0) /
          user.performance_metrics.length
        )
      : 0

    const latestReview = user.reviews[0]
    const reviewScore = latestReview ? Number(latestReview.overallScore) : 0

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const totalHoursThisMonth = user.performance_metrics
      .filter(m => new Date(m.date) >= startOfMonth)
      .reduce((sum, m) => sum + m.activeTime, 0) / 60

    const currentEntry = user.time_entries[0]
    const isClockedIn = currentEntry && !currentEntry.clockOut

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todaySchedule = user.staff_profiles?.work_schedules?.find(s => s.dayOfWeek === today)
    
    console.log("✅ [CLIENT/STAFF/DETAIL] Stats calculated:", {
      avgProductivity,
      reviewScore,
      totalHoursThisMonth,
      isClockedIn,
      todaySchedule: todaySchedule ? `${todaySchedule.startTime} - ${todaySchedule.endTime}` : 'N/A'
    })

    // Calculate task stats
    const taskStats = {
      total: user.tasks.length,
      todo: user.tasks.filter(t => t.status === 'TODO').length,
      inProgress: user.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: user.tasks.filter(t => t.status === 'COMPLETED').length,
      stuck: user.tasks.filter(t => t.status === 'STUCK').length,
    }

    // Calculate attendance stats from timeEntries
    const thisMonthEntries = user.time_entries.filter(
      e => new Date(e.clockIn) >= startOfMonth
    )
    const attendanceStats = {
      daysPresent: thisMonthEntries.length,
      totalHours: Math.round(
        thisMonthEntries.reduce((sum, e) => {
          if (e.totalHours) {
            return sum + Number(e.totalHours)
          }
          return sum
        }, 0)
      ),
      averageHoursPerDay: thisMonthEntries.length > 0
        ? Math.round(
            thisMonthEntries.reduce((sum, e) => {
              if (e.totalHours) {
                return sum + Number(e.totalHours)
              }
              return sum
            }, 0) / thisMonthEntries.length
          )
        : 0,
    }

    // Get performance trend (last 7 days)
    const last7Days = user.performance_metrics.slice(0, 7).reverse()
    const performanceTrend = last7Days.map(m => ({
      date: m.date,
      score: m.productivityScore,
      activeTime: Math.round(m.activeTime / 60), // hours
    }))

    const staffDetail = {
      // Basic info
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      coverPhoto: user.coverPhoto,
      role: user.role,

      // Assignment (from company relationship)
      assignment: user.company ? {
        role: user.staff_profiles?.currentRole || null,
        rate: null,
        startDate: user.staff_profiles?.startDate?.toISOString() || user.createdAt.toISOString(),
        client: user.company.companyName,
        manager: {
          name: user.company.accountManager?.name || null,
          email: user.company.accountManager?.email || null,
          role: user.company.accountManager?.role || null,
        },
      } : null,

      // Profile (NO personal records like SSS/TIN)
      profile: user.staff_profiles ? {
        phone: user.staff_profiles.phone,
        location: user.staff_profiles.location,
        employmentStatus: user.staff_profiles.employmentStatus,
        startDate: user.staff_profiles.startDate.toISOString(),
        daysEmployed: Math.floor((new Date().getTime() - new Date(user.staff_profiles.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        currentRole: user.staff_profiles.currentRole,
        salary: user.staff_profiles.salary,
        lastPayIncrease: user.staff_profiles.lastPayIncrease?.toISOString() || null,
        lastIncreaseAmount: user.staff_profiles.lastIncreaseAmount,
        totalLeave: user.staff_profiles.totalLeave,
        usedLeave: user.staff_profiles.usedLeave,
        vacationUsed: user.staff_profiles.vacationUsed,
        sickUsed: user.staff_profiles.sickUsed,
        hmo: user.staff_profiles.hmo,
        work_schedules: user.staff_profiles.work_schedules,
      } : null,

      // Current status
      currentStatus: {
        isClockedIn,
        shift: todaySchedule ? `${todaySchedule.startTime} - ${todaySchedule.endTime}` : 'N/A',
        currentEntry: currentEntry ? {
          clockIn: currentEntry.clockIn,
          clockOut: currentEntry.clockOut,
        } : null,
      },

      // Stats
      stats: {
        avgProductivity,
        reviewScore,
        totalHoursThisMonth: Math.round(totalHoursThisMonth),
        level: user.gamification_profiles?.level || 1,
        points: user.gamification_profiles?.points || 0,
        rank: user.gamification_profiles?.rank || null,
        badges: user.gamification_profiles?.user_badges || [],
      },

      // Tasks
      tasks: {
        stats: taskStats,
        recent: user.tasks.slice(0, 5).map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          deadline: t.deadline,
          completedAt: t.completedAt,
        })),
      },

      // Attendance
      attendance: attendanceStats,

      // Performance trend
      performanceTrend,

      // Reviews
      reviews: user.reviews.map(r => ({
        id: r.id,
        type: r.type,
        overallScore: Number(r.overallScore),
        previousScore: r.previousScore ? Number(r.previousScore) : null,
        submittedDate: r.submittedDate.toISOString(),
        reviewer: r.reviewer,
        status: r.status,
      })),

      // Time entries (history)
      timeEntries: user.time_entries.map(e => ({
        id: e.id,
        clockIn: e.clockIn.toISOString(),
        clockOut: e.clockOut?.toISOString() || null,
        totalHours: e.totalHours ? Number(e.totalHours) : null,
        notes: e.notes,
      })),

      // Recent activity posts
      recentActivity: user.activity_posts.map(p => ({
        id: p.id,
        type: p.type,
        content: p.content,
        createdAt: p.createdAt.toISOString(),
      })),

      // Tickets
      tickets: {
        total: user.tickets.length,
        open: user.tickets.filter(t => t.status === 'OPEN').length,
        resolved: user.tickets.filter(t => t.status === 'RESOLVED').length,
      },
    }

    console.log("📤 [CLIENT/STAFF/DETAIL] Returning staff detail data")
    return NextResponse.json({ staff: staffDetail })
  } catch (error) {
    console.error("❌ [CLIENT/STAFF/DETAIL] Error fetching staff details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}










