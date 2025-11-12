import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Building2, Users, Mail, Phone, MapPin, ExternalLink, 
  Calendar, DollarSign, ArrowLeft, Settings, Edit 
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

async function getCompanyDetails(id: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        client_users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            createdAt: true,
          }
        },
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        management_users: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            phone: true,
            avatar: true,
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          take: 10,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })
    return company
  } catch (error) {
    console.error('Error fetching company:', error)
    return null
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params
  const company = await getCompanyDetails(id)

  if (!company) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/clients">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Clients
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Company
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Company Header Card */}
      <Card className="p-6 border-border bg-card">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/10 shrink-0">
            {company.logo ? (
              <img src={company.logo} alt={company.companyName} className="h-full w-full rounded-xl object-cover" />
            ) : (
              <Building2 className="h-10 w-10 text-blue-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{company.companyName}</h1>
                {company.tradingName && company.tradingName !== company.companyName && (
                  <p className="text-sm text-muted-foreground mt-1">Trading as: {company.tradingName}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant={company.isActive ? "default" : "secondary"}>
                    {company.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {company.industry && (
                    <Badge variant="outline">{company.industry}</Badge>
                  )}
                </div>
              </div>
            </div>
            {company.bio && (
              <p className="text-sm text-muted-foreground mt-4 max-w-3xl">{company.bio}</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Contact & Details */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contact Information */}
          <Card className="p-6 border-border bg-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Contact Information</h2>
            <div className="space-y-3">
              {company.billingEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Billing Email</div>
                    <a href={`mailto:${company.billingEmail}`} className="text-sm text-foreground hover:text-blue-400">
                      {company.billingEmail}
                    </a>
                  </div>
                </div>
              )}
              {company.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <a href={`tel:${company.phone}`} className="text-sm text-foreground hover:text-blue-400">
                      {company.phone}
                    </a>
                  </div>
                </div>
              )}
              {company.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Location</div>
                    <div className="text-sm text-foreground">{company.location}</div>
                  </div>
                </div>
              )}
              {company.website && (
                <div className="flex items-start gap-3">
                  <ExternalLink className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Website</div>
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">
                      {company.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Account Manager */}
          {company.management_users && (
            <Card className="p-6 border-border bg-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">Account Manager</h2>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={company.management_users.avatar || undefined} />
                  <AvatarFallback>
                    {company.management_users.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{company.management_users.name}</div>
                  <div className="text-xs text-muted-foreground">{company.management_users.department}</div>
                  {company.management_users.email && (
                    <a href={`mailto:${company.management_users.email}`} className="text-xs text-blue-400 hover:underline">
                      {company.management_users.email}
                    </a>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Statistics */}
          <Card className="p-6 border-border bg-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Staff Assigned</span>
                <span className="text-lg font-semibold text-foreground">{company.staff_users.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Client Users</span>
                <span className="text-lg font-semibold text-foreground">{company.client_users.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Tasks</span>
                <span className="text-lg font-semibold text-foreground">
                  {company.tasks.filter(t => t.status !== 'DONE' && t.status !== 'COMPLETED').length}
                </span>
              </div>
              {company.contractStart && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Contract Start</span>
                  <span className="text-sm text-foreground">
                    {new Date(company.contractStart).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Staff & Users */}
        <div className="space-y-6 lg:col-span-2">
          {/* Staff Members */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Assigned Staff ({company.staff_users.length})</h2>
              <Button size="sm" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Staff
              </Button>
            </div>
            {company.staff_users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No staff members assigned yet
              </div>
            ) : (
              <div className="space-y-3">
                {company.staff_users.map((staff) => (
                  <div key={staff.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={staff.avatar || undefined} />
                      <AvatarFallback>
                        {staff.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{staff.name}</div>
                      <div className="text-xs text-muted-foreground">{staff.email}</div>
                    </div>
                    <Badge variant="outline">{staff.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Client Users */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Client Users ({company.client_users.length})</h2>
              <Button size="sm" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
            {company.client_users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No client users yet
              </div>
            ) : (
              <div className="space-y-3">
                {company.client_users.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>
                        {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Tasks */}
          {company.tasks.length > 0 && (
            <Card className="p-6 border-border bg-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Tasks</h2>
              <div className="space-y-2">
                {company.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

