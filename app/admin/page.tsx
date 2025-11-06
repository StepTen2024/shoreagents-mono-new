import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

async function retryQuery<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      console.error(`[AdminDashboard] Query attempt ${i + 1}/${retries} failed:`, error)
      if (i === retries - 1) throw error
      // Exponential backoff: 100ms, 200ms, 400ms
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)))
    }
  }
  throw new Error('All retries failed')
}

export default async function AdminDashboard() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login/admin")
  }

  // Verify admin user
  let adminUser
  try {
    adminUser = await retryQuery(() => 
      prisma.management_users.findUnique({
        where: { authUserId: session.user.id },
      })
    )
  } catch (error) {
    console.error('[AdminDashboard] Failed to fetch admin user:', error)
    redirect("/login/admin?error=connection")
  }

  if (!adminUser) {
    redirect("/login/admin")
  }

  // Simplified dashboard - fewer queries to avoid connection pool exhaustion
  // Run queries sequentially instead of in parallel
  let totalCompanies = 0
  let totalStaff = 0
  let activeStaff = 0
  let pendingOnboarding = 0
  let openTickets = 0
  let pendingReviews = 0
  let recentStaff: any[] = []
  let recentCompanies: any[] = []

  try {
    // Query 1: Basic counts
    totalCompanies = await retryQuery(() => prisma.company.count())
    totalStaff = await retryQuery(() => prisma.staff_users.count())
    
    // Query 2: Recent companies (most important)
    recentCompanies = await retryQuery(() => prisma.company.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        createdAt: true,
        _count: {
          select: {
            staff_users: true,
          },
        },
      },
    }))
    
    // Set others to 0 for now to reduce load
    activeStaff = 0
    pendingOnboarding = 0
    openTickets = 0
    pendingReviews = 0
    recentStaff = []
  } catch (error) {
    console.error('[AdminDashboard] Failed to fetch dashboard data:', error)
    // Already have default values set above
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">BPO Management Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of client relationships and staff operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Clients */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <h3 className="text-3xl font-bold text-foreground mt-2">{totalCompanies}</h3>
            </div>
            <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <svg className="size-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
              </svg>
            </div>
          </div>
          <Link href="/admin/clients" className="text-xs text-blue-500 hover:underline mt-3 inline-block">
            View all clients →
          </Link>
        </Card>

        {/* Total Staff */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Staff</p>
              <h3 className="text-3xl font-bold text-foreground mt-2">{totalStaff}</h3>
            </div>
            <div className="size-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="size-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <Link href="/admin/staff" className="text-xs text-green-500 hover:underline mt-3 inline-block">
            View all staff →
          </Link>
        </Card>

        {/* Active Staff */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Currently Clocked In</p>
              <h3 className="text-3xl font-bold text-foreground mt-2">{activeStaff}</h3>
            </div>
            <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <svg className="size-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <Link href="/admin/time-tracking" className="text-xs text-emerald-500 hover:underline mt-3 inline-block">
            View time tracking →
          </Link>
        </Card>

        {/* Pending Onboarding */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Onboarding</p>
              <h3 className="text-3xl font-bold text-foreground mt-2">{pendingOnboarding}</h3>
            </div>
            <div className="size-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <svg className="size-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="m9 14 2 2 4-4" />
              </svg>
            </div>
          </div>
          <Link href="/admin/onboarding" className="text-xs text-yellow-500 hover:underline mt-3 inline-block">
            View onboarding →
          </Link>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Open Tickets */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Open Tickets</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{openTickets}</h3>
            </div>
            <Badge variant={openTickets > 10 ? "destructive" : "secondary"}>
              {openTickets > 10 ? "High" : "Normal"}
            </Badge>
          </div>
          <Link href="/admin/tickets" className="text-xs text-blue-500 hover:underline">
            Manage tickets →
          </Link>
        </Card>

        {/* Pending Reviews */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{pendingReviews}</h3>
            </div>
            <Badge variant={pendingReviews > 5 ? "destructive" : "secondary"}>
              {pendingReviews > 5 ? "Action Needed" : "On Track"}
            </Badge>
          </div>
          <Link href="/admin/performance-reviews" className="text-xs text-blue-500 hover:underline">
            View reviews →
          </Link>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Staff */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Staff Additions</h3>
          {recentStaff.length > 0 ? (
            <div className="space-y-3">
              {recentStaff.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{staff.name}</p>
                      <p className="text-xs text-muted-foreground">{staff.company?.companyName || 'Unassigned'}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {staff.role}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent staff additions</p>
          )}
          <Link href="/admin/staff" className="text-xs text-blue-500 hover:underline mt-4 inline-block">
            View all staff →
          </Link>
        </Card>

        {/* Recent Companies */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Client Companies</h3>
          {recentCompanies.length > 0 ? (
            <div className="space-y-3">
              {recentCompanies.map((company) => (
                <div key={company.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{company.companyName}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(company.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {company._count.staff_users} staff
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent companies</p>
          )}
          <Link href="/admin/clients" className="text-xs text-blue-500 hover:underline mt-4 inline-block">
            View all clients →
          </Link>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <Link 
            href="/admin/onboarding"
            className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="size-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <div>
                <p className="text-sm font-medium text-foreground">Process Onboarding</p>
                <p className="text-xs text-muted-foreground">Review new staff</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin/tickets"
            className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="size-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-foreground">Manage Tickets</p>
                <p className="text-xs text-muted-foreground">Handle support requests</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin/analytics"
            className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="size-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
              <div>
                <p className="text-sm font-medium text-foreground">View Analytics</p>
                <p className="text-xs text-muted-foreground">Performance insights</p>
              </div>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  )
}
