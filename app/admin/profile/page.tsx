import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProfileHeader } from "@/components/admin/profile-header"
import { EditProfileModal } from "@/components/admin/edit-profile-modal"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDepartment } from "@/lib/format-department"

export default async function AdminProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login/admin")
  }

  // Fetch full management user profile
  const user = await prisma.management_users.findUnique({
    where: { authUserId: session.user.id },
    include: {
      management_profiles: true
    }
  })

  if (!user) {
    redirect("/login/admin")
  }

  const profile = user.management_profiles

  return (
    <div className="space-y-6">
      {/* Profile Header with Cover & Avatar */}
      <ProfileHeader user={user} />

      {/* Profile Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Full Name</label>
              <p className="text-foreground font-medium">{user.name}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="text-foreground font-medium">{user.email}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Phone</label>
              <p className="text-foreground font-medium">{user.phone || "Not provided"}</p>
            </div>
          </div>
        </Card>

        {/* Role & Department */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Role & Department</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Role</label>
              <div className="mt-1">
                <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  {user.role}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Department</label>
              <p className="text-foreground font-medium">{formatDepartment(user.department)}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Member Since</label>
              <p className="text-foreground font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Profile Data - Show if profile exists */}
      {profile ? (
        <div className="space-y-6">
          {/* Position Information */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Position Information</h3>
              <EditProfileModal profile={profile} />
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                <p className="text-foreground text-lg font-semibold mt-1">{profile.currentRole}</p>
              </div>
              
              {profile.roleDescription && (
                <div className="pt-3 border-t">
                  <label className="text-sm font-medium text-muted-foreground">What I Do</label>
                  <p className="text-foreground mt-2 leading-relaxed">{profile.roleDescription}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="text-foreground font-medium mt-1">
                    {new Date(profile.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Days with Company</label>
                  <p className="text-foreground font-medium mt-1">
                    {profile.daysEmployed} days
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Bio & Responsibilities */}
          {(profile.bio || profile.responsibilities) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">About Me</h3>
              <div className="space-y-4">
                {profile.bio && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bio</label>
                    <p className="text-foreground mt-2 leading-relaxed">{profile.bio}</p>
                  </div>
                )}
                {profile.responsibilities && (
                  <div className={profile.bio ? "pt-4 border-t" : ""}>
                    <label className="text-sm font-medium text-muted-foreground">Key Responsibilities</label>
                    <p className="text-foreground mt-2 leading-relaxed whitespace-pre-wrap">{profile.responsibilities}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              No profile found. Let's set one up!
            </p>
            <EditProfileModal 
              profile={{
                currentRole: user.department === 'CEO_EXECUTIVE' ? 'CEO' : 'Manager',
                roleDescription: null,
                bio: null,
                responsibilities: null,
                startDate: new Date()
              }} 
            />
          </div>
        </Card>
      )}
    </div>
  )
}

