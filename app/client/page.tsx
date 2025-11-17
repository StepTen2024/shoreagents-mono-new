import { Users, TrendingUp, Clock, CheckCircle, Activity, Calendar, BarChart3, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function ClientDashboard() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login/client")
  }

  const clientUser = await prisma.client_users.findUnique({
    where: { email: session.user.email || undefined },
    include: { 
      company: true,
      client_profiles: true
    }
  })

  if (!clientUser) {
    redirect("/login/client")
  }

  // Simplified queries - only fetch essential data
  const staffCount = clientUser.companyId ? await prisma.staff_users.count({
    where: { companyId: clientUser.companyId }
  }) : 0

  // Get staff users (limit to 5 for now to reduce load)
  const staffUsers = clientUser.companyId ? await prisma.staff_users.findMany({
    where: { companyId: clientUser.companyId },
    take: 5,
    select: { 
      id: true, 
      authUserId: true, 
      name: true, 
      avatar: true,
      staff_profiles: {
        select: { currentRole: true }
      }
    }
  }) : []

  // Calculate start of this week (Sunday)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  // Get staff IDs for queries
  const staffIds = clientUser.companyId ? (await prisma.staff_users.findMany({
    where: { companyId: clientUser.companyId },
    select: { id: true }
  })).map(s => s.id) : []

  // 1. Tasks completed this week
  const tasksCompletedThisWeek = staffIds.length > 0 ? await prisma.tasks.count({
    where: {
      assignedToId: { in: staffIds },
      status: 'COMPLETED',
      completedAt: { gte: startOfWeek }
    }
  }) : 0

  // 2. Hours this week - sum all time entries
  const timeEntriesThisWeek = staffIds.length > 0 ? await prisma.time_entries.findMany({
    where: {
      staffUserId: { in: staffIds },
      clockIn: { gte: startOfWeek }
    },
    select: {
      clockIn: true,
      clockOut: true
    }
  }) : []

  const hoursThisWeek = timeEntriesThisWeek.reduce((total, entry) => {
    if (entry.clockOut) {
      const duration = (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60)
      return total + duration
    }
    // For active sessions, calculate up to now
    const duration = (now.getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60)
    return total + duration
  }, 0)

  // 3. Average performance from latest reviews
  const completedReviews = staffIds.length > 0 ? await prisma.reviews.findMany({
    where: {
      staffUserId: { in: staffIds },
      status: 'COMPLETED',
      overallScore: { not: null }
    },
    select: { overallScore: true },
    orderBy: { submittedDate: 'desc' },
    take: 20 // Last 20 reviews for average
  }) : []

  const avgPerformance = completedReviews.length > 0
    ? completedReviews.reduce((sum, r) => sum + Number(r.overallScore || 0), 0) / completedReviews.length
    : 0

  // 4. Recent activity from activity_log
  const recentActivities = staffIds.length > 0 ? await prisma.activity_log.findMany({
    where: {
      actorId: { in: staffIds },
      type: {
        in: ['ACHIEVEMENT', 'MILESTONE', 'KUDOS', 'WIN', 'CELEBRATION', 'UPDATE', 'ANNOUNCEMENT']
      }
    },
    include: {
      staff_users: {
        select: {
          name: true,
          avatar: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  }) : []

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to {clientUser.company?.companyName || 'Your Company'} Portal</p>
      </div>

      {/* Quick Stats - Styled like Profile page */}
      <Card className="p-6 bg-white shadow-sm border-l-4 border-l-blue-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Overview Statistics</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Assigned Staff */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">{staffCount}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-blue-800">Assigned Staff</p>
            <p className="text-xs text-blue-600 mt-1">Active team members</p>
          </div>

          {/* Tasks Completed */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">{tasksCompletedThisWeek}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-green-800">Tasks Completed</p>
            <p className="text-xs text-green-600 mt-1">This week</p>
          </div>

          {/* Hours This Week */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-600">{Math.round(hoursThisWeek)}h</p>
              </div>
            </div>
            <p className="text-sm font-medium text-purple-800">Hours This Week</p>
            <p className="text-xs text-purple-600 mt-1">Total tracked time</p>
          </div>

          {/* Performance */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-orange-600">{Math.round(avgPerformance)}%</p>
              </div>
            </div>
            <p className="text-sm font-medium text-orange-800">Performance</p>
            <p className="text-xs text-orange-600 mt-1">Average score</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6 bg-white shadow-sm border-l-4 border-l-purple-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/client/staff">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all">
              <Users className="h-4 w-4 mr-2" />
              View Staff
            </Button>
          </Link>
          <Link href="/client/knowledge-base">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all">
              <Activity className="h-4 w-4 mr-2" />
              Knowledge Base
            </Button>
          </Link>
          <Link href="/client/tasks">
            <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all">
              <CheckCircle className="h-4 w-4 mr-2" />
              Manage Tasks
            </Button>
          </Link>
        </div>
      </Card>

      {/* Staff Overview */}
      <Card className="p-6 bg-white shadow-sm border-l-4 border-l-indigo-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Your Team</h3>
        </div>
        
        {staffUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffUsers.map((staff) => {
              const initials = staff.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <Link
                  key={staff.id}
                  href={`/client/staff`}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    {staff.avatar ? (
                      <img 
                        src={staff.avatar} 
                        alt={staff.name} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold border-2 border-indigo-200">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{staff.name}</p>
                      <p className="text-sm text-gray-600 truncate">{staff.staff_profiles?.currentRole || 'Staff Member'}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No staff assigned yet</p>
            <p className="text-xs text-gray-400 mt-1">Staff members will appear here once assigned</p>
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <Card className="p-6 bg-white shadow-sm border-l-4 border-l-green-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
        </div>
        
        {recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity) => {
              const actorInitials = activity.staff_users?.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || '??'

              return (
                <div
                  key={activity.id}
                  className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    {activity.staff_users?.avatar ? (
                      <img 
                        src={activity.staff_users.avatar} 
                        alt={activity.staff_users.name} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-green-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-sm font-semibold border-2 border-green-200">
                        {actorInitials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.staff_users?.name || 'Unknown'}</span>
                        {' '}
                        <span className="text-gray-600">{activity.content}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-500">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          activity.type === 'ACHIEVEMENT' ? 'bg-blue-100 text-blue-700' :
                          activity.type === 'MILESTONE' ? 'bg-purple-100 text-purple-700' :
                          activity.type === 'KUDOS' ? 'bg-green-100 text-green-700' :
                          activity.type === 'WIN' ? 'bg-yellow-100 text-yellow-700' :
                          activity.type === 'CELEBRATION' ? 'bg-pink-100 text-pink-700' :
                          activity.type === 'UPDATE' ? 'bg-indigo-100 text-indigo-700' :
                          activity.type === 'ANNOUNCEMENT' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {activity.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs text-gray-400 mt-1">Activity from your staff will appear here</p>
          </div>
        )}
      </Card>
    </div>
  )
}
