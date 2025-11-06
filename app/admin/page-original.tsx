import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Link, CheckSquare, Ticket, FolderOpen, Trophy, Send, Eye } from "@/components/icons"

const stats = {
  totalStaff: 24,
  regularStaff: 18,
  probationStaff: 6,
  activeClients: 8,
  pendingReviews: 5,
  reviewBreakdown: { month1: 2, month3: 1, month5: 2 },
  openTickets: 12,
  ticketPriority: { low: 3, medium: 5, high: 3, urgent: 1 },
  staffClockedIn: 18,
  avgProductivity: 87,
}

const reviewsDue = [
  {
    id: 1,
    staffName: "Maria Santos",
    staffAvatar: "/diverse-woman-portrait.png",
    clientCompany: "TechCorp Solutions",
    manager: "John Smith",
    assignmentRole: "Customer Support Specialist",
    startDate: "2024-12-15",
    daysEmployed: 29,
    reviewType: "MONTH_1",
    dueDate: "2025-01-15",
    status: "DUE_SOON",
  },
  {
    id: 2,
    staffName: "Carlos Mendez",
    staffAvatar: "/man.jpg",
    clientCompany: "Global Retail Inc",
    manager: "Sarah Johnson",
    assignmentRole: "Data Entry Specialist",
    startDate: "2024-10-20",
    daysEmployed: 85,
    reviewType: "MONTH_3",
    dueDate: "2025-01-20",
    status: "PENDING",
  },
  {
    id: 3,
    staffName: "Ana Reyes",
    staffAvatar: "/professional-woman.png",
    clientCompany: "FinanceHub LLC",
    manager: "Michael Chen",
    assignmentRole: "Virtual Assistant",
    startDate: "2024-08-10",
    daysEmployed: 156,
    reviewType: "MONTH_5",
    dueDate: "2025-01-10",
    status: "OVERDUE",
  },
  {
    id: 4,
    staffName: "John Cruz",
    staffAvatar: "/man-business.jpg",
    clientCompany: "HealthCare Partners",
    manager: "Emily Davis",
    assignmentRole: "Technical Support Agent",
    startDate: "2024-12-01",
    daysEmployed: 43,
    reviewType: "MONTH_1",
    dueDate: "2025-01-01",
    status: "COMPLETED",
  },
  {
    id: 5,
    staffName: "Lisa Garcia",
    staffAvatar: "/smiling-woman.png",
    clientCompany: "EduTech Systems",
    manager: "Robert Wilson",
    assignmentRole: "Content Moderator",
    startDate: "2024-07-15",
    daysEmployed: 182,
    reviewType: "RECURRING_6M",
    dueDate: "2025-01-15",
    status: "NOT_SENT",
  },
]

const recentActivity = [
  {
    id: 1,
    type: "ASSIGNMENT",
    message: "New staff assignment: Maria Santos → TechCorp Solutions",
    time: "2 hours ago",
    icon: Link,
  },
  {
    id: 2,
    type: "REVIEW",
    message: "Review completed: John Cruz (4.5/5.0) by Emily Davis",
    time: "4 hours ago",
    icon: CheckSquare,
  },
  {
    id: 3,
    type: "TICKET",
    message: "High priority ticket opened: Equipment Request #TKT-2025-042",
    time: "5 hours ago",
    icon: Ticket,
  },
  {
    id: 4,
    type: "DOCUMENT",
    message: "Training document uploaded: Customer Service Best Practices.pdf",
    time: "6 hours ago",
    icon: FolderOpen,
  },
  {
    id: 5,
    type: "ACHIEVEMENT",
    message: "Badge earned: Carlos Mendez unlocked 'Task Master' 🏆",
    time: "8 hours ago",
    icon: Trophy,
  },
]

const getReviewTypeBadge = (type: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    MONTH_1: { label: "Month 1", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    MONTH_3: { label: "Month 3", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    MONTH_5: { label: "Month 5", className: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
    RECURRING_6M: { label: "6-Month", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  }
  return variants[type] || variants.MONTH_1
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    NOT_SENT: { label: "Not Sent", className: "bg-gray-500/20 text-gray-400" },
    PENDING: { label: "Pending", className: "bg-amber-500/20 text-amber-400" },
    DUE_SOON: { label: "Due Soon", className: "bg-yellow-500/20 text-yellow-400" },
    OVERDUE: { label: "Overdue", className: "bg-red-500/20 text-red-400" },
    COMPLETED: { label: "Completed", className: "bg-emerald-500/20 text-emerald-400" },
  }
  return variants[status] || variants.PENDING
}

export default function Page() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">Monitor staff, clients, and system operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Staff</div>
            <div className="mb-2 text-3xl font-bold text-foreground">{stats.totalStaff}</div>
            <div className="text-xs text-muted-foreground">
              {stats.regularStaff} Regular, {stats.probationStaff} Probation
            </div>
          </Card>

          <Card className="border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Active Clients
            </div>
            <div className="mb-2 text-3xl font-bold text-foreground">{stats.activeClients}</div>
            <div className="text-xs text-emerald-400 font-medium">All companies active</div>
          </Card>

          <Card className="border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pending Reviews
            </div>
            <div className="mb-2 text-3xl font-bold text-foreground">{stats.pendingReviews}</div>
            <div className="text-xs text-muted-foreground">
              M1: {stats.reviewBreakdown.month1}, M3: {stats.reviewBreakdown.month3}, M5: {stats.reviewBreakdown.month5}
            </div>
          </Card>

          <Card className="border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Open Tickets</div>
            <div className="mb-2 text-3xl font-bold text-foreground">{stats.openTickets}</div>
            <div className="text-xs text-amber-400 font-medium">{stats.ticketPriority.urgent} urgent</div>
          </Card>

          <Card className="border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Staff Clocked In
            </div>
            <div className="mb-2 text-3xl font-bold text-foreground">
              {stats.staffClockedIn}/{stats.totalStaff}
            </div>
            <div className="text-xs text-emerald-400 font-medium">
              {Math.round((stats.staffClockedIn / stats.totalStaff) * 100)}% online
            </div>
          </Card>

          <Card className="border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avg Productivity
            </div>
            <div className="mb-2 text-3xl font-bold text-foreground">{stats.avgProductivity}/100</div>
            <div className="text-xs text-emerald-400 font-medium">Above target</div>
          </Card>
        </div>

        {/* Reviews Due This Week Table */}
        <Card className="border-border bg-card overflow-hidden">
          <div className="border-b border-border p-5 bg-muted/20">
            <h2 className="text-base font-semibold text-foreground">Reviews Due This Week</h2>
            <p className="text-sm text-muted-foreground">Staff performance reviews requiring action</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Staff Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Client Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Manager
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Days Employed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Review Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviewsDue.map((review) => {
                  const reviewBadge = getReviewTypeBadge(review.reviewType)
                  const statusBadge = getStatusBadge(review.status)
                  return (
                    <tr key={review.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarImage src={review.staffAvatar || "/placeholder.svg"} />
                            <AvatarFallback>{review.staffName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">{review.staffName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{review.clientCompany}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{review.manager}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{review.assignmentRole}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-foreground">{review.daysEmployed} days</div>
                        <div className="text-xs text-muted-foreground">Since {review.startDate}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={reviewBadge.className}>
                          {reviewBadge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{review.dueDate}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {review.status === "COMPLETED" ? (
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                              <Eye className="size-3.5" />
                              View
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary">
                              <Send className="size-3.5" />
                              Send
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="border-border bg-card overflow-hidden">
          <div className="border-b border-border p-5 bg-muted/20">
            <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
            <p className="text-sm text-muted-foreground">Latest system events and updates</p>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-muted/20">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
