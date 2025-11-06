import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Mail, 
  Calendar, 
  ArrowLeft, 
  Shield,
  Briefcase,
  Phone,
  Hash,
  User as UserIcon
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

async function getManagementUser(id: string) {
  try {
    const managementUser = await prisma.management_users.findUnique({
      where: { id },
    })

    return managementUser
  } catch (error) {
    console.error('Error fetching management user:', error)
    return null
  }
}

export default async function ManagementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const managementUser = await getManagementUser(id)

  if (!managementUser) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/staff">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Management Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage team member details
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Profile Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Profile Card */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 ring-2 ring-purple-500/50">
                <AvatarImage src={managementUser.avatar || undefined} alt={managementUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-2xl">
                  {managementUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-foreground">{managementUser.name}</h2>
                <p className="text-muted-foreground">{managementUser.email}</p>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className="text-xs bg-purple-600">
                    <Shield className="h-3 w-3 mr-1" /> Management Team
                  </Badge>
                  {managementUser.role && (
                    <Badge variant="outline" className="text-xs">
                      {managementUser.role}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Department</div>
                  <div className="font-medium text-foreground">{managementUser.department}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Role</div>
                  <div className="font-medium text-foreground">{managementUser.role}</div>
                </div>
              </div>
              {managementUser.phone && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-medium text-foreground">{managementUser.phone}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Joined</div>
                  <div className="font-medium text-foreground">
                    {new Date(managementUser.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Organization */}
          <Card className="p-6 border-border bg-card border-emerald-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Briefcase className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Organization</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Employer</div>
                <div className="text-base font-semibold text-foreground">Shore Agents / StepTen</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Employee Type</div>
                <Badge className="bg-emerald-600">Management Team</Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <div className="text-sm text-foreground">Internal team member responsible for company operations</div>
              </div>
            </div>
          </Card>

          {/* Management Role Card */}
          <Card className="p-6 border-border bg-card border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Management Role</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Access Level</div>
                <Badge className="bg-purple-600">{managementUser.role}</Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Department</div>
                <div className="text-sm font-medium text-foreground">{managementUser.department}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Responsibilities</div>
                <div className="text-sm text-foreground">
                  Full system access, staff management, client oversight, and administrative functions
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Account Status</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">User ID</div>
                <div className="flex items-center gap-2 text-sm font-mono text-foreground">
                  <Hash className="h-3 w-3" />
                  <span className="truncate">{managementUser.id.slice(0, 8)}...</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Account Type</div>
                <div className="text-sm font-medium text-foreground">
                  Management Admin
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Account Created</div>
                <div className="text-sm text-foreground">
                  {new Date(managementUser.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Last Updated</div>
                <div className="text-sm text-foreground">
                  {new Date(managementUser.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Manage Permissions
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

