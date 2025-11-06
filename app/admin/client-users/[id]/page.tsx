import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Mail, Calendar, ArrowLeft, User as UserIcon } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

async function getClientUser(id: string) {
  try {
    const clientUser = await prisma.client_users.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            tradingName: true,
            industry: true,
            location: true,
            logo: true,
          },
        },
      },
    })

    return clientUser
  } catch (error) {
    console.error('Error fetching client user:', error)
    return null
  }
}

export default async function ClientUserDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const clientUser = await getClientUser(params.id)

  if (!clientUser) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clients?tab=users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Client User Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage client user information
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - User Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <Avatar className="h-24 w-24 ring-2 ring-border">
                <AvatarImage src={clientUser.avatar || undefined} alt={clientUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-2xl">
                  <UserIcon className="h-10 w-10 text-blue-400" />
                </AvatarFallback>
              </Avatar>

              {/* User Details */}
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-foreground">{clientUser.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{clientUser.email}</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline">{clientUser.role}</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Company Card */}
          {clientUser.company && (
            <Card className="p-6 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Company Information</h3>
              <Link href={`/admin/clients/${clientUser.company.id}`}>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/10">
                    {clientUser.company.logo ? (
                      <img 
                        src={clientUser.company.logo} 
                        alt={clientUser.company.companyName} 
                        className="h-full w-full rounded-lg object-cover" 
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{clientUser.company.companyName}</h4>
                    {clientUser.company.tradingName && clientUser.company.tradingName !== clientUser.company.companyName && (
                      <p className="text-xs text-muted-foreground mt-0.5">{clientUser.company.tradingName}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {clientUser.company.industry && (
                        <Badge variant="outline" className="text-xs">
                          {clientUser.company.industry}
                        </Badge>
                      )}
                      {clientUser.company.location && (
                        <span>{clientUser.company.location}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
          )}

          {/* Activity Card - Placeholder for future */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">No recent activity to display</p>
          </Card>
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Account Info */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Account Information</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">User ID</div>
                <div className="text-sm font-mono text-foreground break-all">{clientUser.id}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Created</div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(clientUser.createdAt).toLocaleDateString()}
                </div>
              </div>
              {clientUser.updatedAt && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Last Updated</div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(clientUser.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full" disabled>
                Send Message
              </Button>
              <Button variant="outline" className="w-full" disabled>
                View Tasks
              </Button>
              <Button variant="outline" className="w-full" disabled>
                View Tickets
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

