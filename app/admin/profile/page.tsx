import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProfileHeader } from "@/components/admin/profile-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
              <p className="text-foreground font-medium">{user.department}</p>
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
        <div className="grid gap-6 md:grid-cols-2">
          {/* Employment Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Employment Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Current Role</label>
                <p className="text-foreground font-medium">{profile.currentRole}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Start Date</label>
                <p className="text-foreground font-medium">
                  {new Date(profile.startDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Days Employed</label>
                <p className="text-foreground font-medium">{profile.daysEmployed} days</p>
              </div>
              {profile.salary && (
                <div>
                  <label className="text-sm text-muted-foreground">Salary</label>
                  <p className="text-foreground font-medium">₱{Number(profile.salary).toLocaleString()}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Work Info & Timezone */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Work Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Timezone</label>
                <p className="text-foreground font-medium">{profile.timezone || "Not set"} 🌍</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">HMO</label>
                <Badge variant={profile.hmo ? "default" : "secondary"}>
                  {profile.hmo ? "✅ Enrolled" : "Not Enrolled"}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Bio & Responsibilities */}
          <Card className="p-6 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">About & Responsibilities</h3>
            <div className="space-y-4">
              {profile.bio && (
                <div>
                  <label className="text-sm text-muted-foreground">Bio</label>
                  <p className="text-foreground mt-1">{profile.bio}</p>
                </div>
              )}
              {profile.responsibilities && (
                <div>
                  <label className="text-sm text-muted-foreground">Responsibilities</label>
                  <p className="text-foreground mt-1">{profile.responsibilities}</p>
                </div>
              )}
              {!profile.bio && !profile.responsibilities && (
                <p className="text-sm text-muted-foreground italic">No bio or responsibilities added yet</p>
              )}
            </div>
          </Card>

          {/* Leave Tracking */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Leave Balance</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Total Leave Days</label>
                <p className="text-foreground font-medium">{profile.totalLeave} days/year</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Used Leave</label>
                <p className="text-foreground font-medium">{profile.usedLeave} days</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Available</label>
                <p className="text-foreground font-medium text-green-600">
                  {profile.totalLeave - profile.usedLeave} days remaining
                </p>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vacation Used:</span>
                  <span className="font-medium">{profile.vacationUsed} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sick Leave Used:</span>
                  <span className="font-medium">{profile.sickUsed} days</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Personal Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="space-y-3">
              {profile.civilStatus && (
                <div>
                  <label className="text-sm text-muted-foreground">Civil Status</label>
                  <p className="text-foreground font-medium">{profile.civilStatus}</p>
                </div>
              )}
              {profile.dateOfBirth && (
                <div>
                  <label className="text-sm text-muted-foreground">Date of Birth</label>
                  <p className="text-foreground font-medium">
                    {new Date(profile.dateOfBirth).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              {profile.gender && (
                <div>
                  <label className="text-sm text-muted-foreground">Gender</label>
                  <p className="text-foreground font-medium">{profile.gender}</p>
                </div>
              )}
              {!profile.civilStatus && !profile.dateOfBirth && !profile.gender && (
                <p className="text-sm text-muted-foreground italic">No personal information added yet</p>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Profile not set up yet. Please contact HR to complete your profile.
          </p>
        </Card>
      )}
    </div>
  )
}

