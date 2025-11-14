import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft,
  Clock,
  Calendar,
  Coffee,
  PlayCircle,
  StopCircle,
  Timer,
  Building2,
  AlertCircle,
  CheckCircle2,
  User as UserIcon
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

// Helper function to format minutes into readable hours/minutes
function formatLateTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`
  }
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }
  
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${mins} minutes`
}

async function getTimeEntry(id: string) {
  try {
    const entry = await prisma.time_entries.findUnique({
      where: { id },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            company: {
              select: {
                id: true,
                companyName: true,
                tradingName: true,
                logo: true,
                isActive: true,
              },
            },
            staff_profiles: {
              select: {
                currentRole: true,
                phone: true,
                location: true,
              },
            },
          },
        },
        breaks: {
          orderBy: {
            actualStart: 'asc',
          },
        },
      },
    })

    return entry
  } catch (error) {
    console.error('Error fetching time entry:', error)
    return null
  }
}

function calculateDuration(start: Date, end: Date | null) {
  const startTime = start.getTime()
  const endTime = end ? end.getTime() : Date.now()
  const diff = endTime - startTime
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { hours, minutes, total: `${hours}h ${minutes}m` }
}

export default async function TimeEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const entry = await getTimeEntry(id)

  if (!entry) {
    notFound()
  }

  const isActive = !entry.clockOut
  const duration = calculateDuration(entry.clockIn, entry.clockOut)
  
  // Calculate break time
  const totalBreakMinutes = entry.breaks.reduce((sum, brk) => {
    if (brk.duration) return sum + brk.duration
    if (brk.actualStart && brk.actualEnd) {
      const diff = new Date(brk.actualEnd).getTime() - new Date(brk.actualStart).getTime()
      return sum + Math.floor(diff / (1000 * 60))
    }
    return sum
  }, 0)
  const breakHours = Math.floor(totalBreakMinutes / 60)
  const breakMins = totalBreakMinutes % 60

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/time-tracking">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Time Entry Details</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete time tracking information
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Entry Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Staff Info Card */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Staff Member</h3>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-white/10">
                <AvatarImage src={entry.staff_users.avatar || undefined} alt={entry.staff_users.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-xl">
                  {entry.staff_users.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{entry.staff_users.name}</h4>
                <p className="text-sm text-muted-foreground">{entry.staff_users.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {entry.staff_users.role}
                  </Badge>
                  {entry.staff_users.staff_profiles?.currentRole && (
                    <Badge variant="secondary" className="text-xs">
                      {entry.staff_users.staff_profiles.currentRole}
                    </Badge>
                  )}
                </div>
                <div className="mt-3">
                  <Link href={`/admin/staff/${entry.staff_users.id}`}>
                    <Button variant="outline" size="sm">
                      View Staff Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Company Card */}
          {entry.staff_users.company && (
            <Card className="p-6 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Company Assignment</h3>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/10">
                  {entry.staff_users.company.logo ? (
                    <img 
                      src={entry.staff_users.company.logo} 
                      alt={entry.staff_users.company.companyName} 
                      className="h-full w-full rounded-lg object-cover" 
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{entry.staff_users.company.companyName}</h4>
                    <Badge variant={entry.staff_users.company.isActive ? "default" : "secondary"} className="text-xs">
                      {entry.staff_users.company.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {entry.staff_users.company.tradingName && (
                    <p className="text-xs text-muted-foreground">
                      Trading as: {entry.staff_users.company.tradingName}
                    </p>
                  )}
                  <div className="mt-3">
                    <Link href={`/admin/clients/${entry.staff_users.company.id}`}>
                      <Button variant="outline" size="sm">
                        View Company
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Time Details Card */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Time Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  Clock In
                </span>
                <div className="text-right">
                  <div className="font-semibold text-foreground">
                    {new Date(entry.clockIn).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(entry.clockIn).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {entry.clockOut ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <StopCircle className="h-4 w-4" />
                    Clock Out
                  </span>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">
                      {new Date(entry.clockOut).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.clockOut).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-sm text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Currently Clocked In
                  </span>
                  <Badge className="bg-emerald-600">Active</Badge>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="text-sm text-blue-400 flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Total Duration
                </span>
                <div className="text-xl font-bold text-blue-400">{duration.total}</div>
              </div>

              {totalBreakMinutes > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Coffee className="h-4 w-4" />
                    Total Break Time
                  </span>
                  <div className="font-medium text-foreground">{breakHours}h {breakMins}m</div>
                </div>
              )}
            </div>
          </Card>

          {/* Breaks Card */}
          {entry.breaks.length > 0 && (
            <Card className="p-6 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Breaks ({entry.breaks.length})
              </h3>
              <div className="space-y-3">
                {entry.breaks.map((brk, index) => {
                  const breakDuration = brk.duration || (brk.actualStart && brk.actualEnd
                    ? Math.floor((new Date(brk.actualEnd).getTime() - new Date(brk.actualStart).getTime()) / (1000 * 60))
                    : 0)

                  return (
                    <div key={brk.id} className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {brk.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Break #{index + 1}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {brk.actualStart && (
                          <div>
                            <div className="text-xs text-muted-foreground">Start</div>
                            <div className="font-medium text-foreground">
                              {new Date(brk.actualStart).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        )}
                        {brk.actualEnd && (
                          <div>
                            <div className="text-xs text-muted-foreground">End</div>
                            <div className="font-medium text-foreground">
                              {new Date(brk.actualEnd).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      {breakDuration > 0 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Duration</span>
                            <span className="font-medium text-foreground">{breakDuration} minutes</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Notes */}
          {entry.notes && (
            <Card className="p-6 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Notes</h3>
              <p className="text-sm text-muted-foreground">{entry.notes}</p>
            </Card>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Entry Status</div>
                {isActive ? (
                  <Badge className="bg-emerald-600">Currently Active</Badge>
                ) : (
                  <Badge variant="secondary">Completed</Badge>
                )}
              </div>
              {entry.wasLate && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-amber-500 mb-1">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Late Clock-In</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatLateTime(entry.lateBy)} late
                  </p>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Entry ID</div>
                <div className="text-xs font-mono text-foreground">{entry.id.slice(0, 8)}...</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Created</div>
                <div className="text-xs text-foreground">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Last Updated</div>
                <div className="text-xs text-foreground">
                  {new Date(entry.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/admin/staff/${entry.staff_users.id}`} className="block">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <UserIcon className="h-4 w-4 mr-2" />
                  View Staff Profile
                </Button>
              </Link>
              {entry.staff_users.company && (
                <Link href={`/admin/clients/${entry.staff_users.company.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Building2 className="h-4 w-4 mr-2" />
                    View Company
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

