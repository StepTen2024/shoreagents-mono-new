import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Building2, 
  Mail, 
  Calendar, 
  ArrowLeft, 
  User as UserIcon,
  Briefcase,
  Phone,
  MapPin,
  Clock,
  Hash,
  DollarSign,
  TrendingUp,
  Umbrella,
  Heart,
  Award,
  Globe,
  Users,
  Cake,
  Shield
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

async function getStaffUser(id: string) {
  try {
    const staffUser = await prisma.staff_users.findUnique({
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
            isActive: true,
          },
        },
        staff_onboarding: {
          select: {
            isComplete: true,
            completionPercent: true,
          },
        },
        staff_profiles: {
          include: {
            work_schedules: true  // Include shift schedules
          }
        },
        staff_interests: {
          select: {
            id: true,
            name: true,
            client: true,
            startDate: true,
            favoriteFastFood: true,
            favoriteColor: true,
            favoriteMovie: true,
            favoriteBook: true,
            hobby: true,
            dreamDestination: true,
            favoriteSeason: true,
            petName: true,
            favoriteSport: true,
            favoriteGame: true,
            favoriteQuote: true,
            funFact: true,
            additionalInfo: true,
            completed: true,
            submittedAt: true,
          },
        },
        staff_personal_records: true,
      },
    })

    return staffUser
  } catch (error) {
    console.error('Error fetching staff user:', error)
    return null
  }
}

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const staffUser = await getStaffUser(id)

  if (!staffUser) {
    notFound()
  }

  // Type assertion to help TypeScript understand the included relations
  const staff = staffUser as any

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
          <h1 className="text-3xl font-semibold text-foreground">Staff Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage staff member details
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Profile Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Profile Card */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 ring-2 ring-white/10">
                <AvatarImage src={staff.avatar || undefined} alt={staff.name} />
                <AvatarFallback className="bg-linear-to-br from-blue-500/20 to-purple-500/20 text-2xl">
                  {staff.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-foreground">{staff.name}</h2>
                <p className="text-muted-foreground">{staff.email}</p>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">
                    <UserIcon className="h-3 w-3 mr-1" /> Staff Member
                  </Badge>
                  {staff.role && (
                    <Badge variant="outline" className="text-xs">
                      {staff.role}
                    </Badge>
                  )}
                  {staff.staff_onboarding?.isComplete && (
                    <Badge className="text-xs bg-emerald-500">
                      Onboarding Complete
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {staff.staff_profiles?.currentRole && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Current Role</div>
                    <div className="font-medium text-foreground">{staff.staff_profiles.currentRole}</div>
                  </div>
                </div>
              )}
              {staff.staff_profiles?.phone && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="font-medium text-foreground">{staff.staff_profiles.phone}</div>
                  </div>
                </div>
              )}
              {staff.staff_profiles?.location && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Location</div>
                    <div className="font-medium text-foreground">{staff.staff_profiles.location}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Joined</div>
                  <div className="font-medium text-foreground">
                    {new Date(staff.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Company Assignment */}
          {staff.company && (
            <Card className="p-6 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Company Assignment</h3>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-linear-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/10">
                  {staff.company.logo ? (
                    <img 
                      src={staff.company.logo} 
                      alt={staff.company.companyName} 
                      className="h-full w-full rounded-lg object-cover" 
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-foreground">{staff.company.companyName}</h4>
                    <Badge variant={staff.company.isActive ? "default" : "secondary"} className="text-xs">
                      {staff.company.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {staff.company.tradingName && staff.company.tradingName !== staff.company.companyName && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Trading as: {staff.company.tradingName}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {staff.company.industry && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span>{staff.company.industry}</span>
                      </div>
                    )}
                    {staff.company.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{staff.company.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <Link href={`/admin/clients/${staff.company.id}`}>
                      <Button variant="outline" size="sm">
                        View Company Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {!staff.company && (
            <Card className="p-6 border-border bg-card text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Company Assigned</h3>
              <p className="text-sm text-muted-foreground">
                This staff member is not currently assigned to any client company
              </p>
            </Card>
          )}

          {/* Employment Details */}
          {staff.staff_profiles && (
            <Card className="p-6 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-500" />
                Employment Details
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Employment Status</div>
                    <Badge variant={staff.staff_profiles.employmentStatus === 'REGULAR' ? 'default' : 'secondary'}>
                      {staff.staff_profiles.employmentStatus}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Start Date</div>
                    <div className="font-medium text-foreground">
                      {new Date(staff.staff_profiles.startDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Days Employed</div>
                    <div className="font-medium text-foreground">{staff.staff_profiles.daysEmployed} days</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Timezone</div>
                    <div className="font-medium text-foreground">{staff.staff_profiles.timezone || 'Asia/Manila'}</div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Compensation */}
          {staff.staff_profiles && (
            <Card className="p-6 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Compensation & Pay
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Monthly Salary</div>
                    <div className="font-semibold text-foreground text-lg">
                      ₱{Number(staff.staff_profiles.salary).toLocaleString()}
                    </div>
                  </div>
                </div>
                {staff.staff_profiles.lastPayIncrease && (
                  <>
                    <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Last Pay Increase</div>
                        <div className="font-medium text-foreground">
                          {new Date(staff.staff_profiles.lastPayIncrease).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    {staff.staff_profiles.lastIncreaseAmount && (
                      <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Increase Amount</div>
                          <div className="font-medium text-green-600">
                            +₱{Number(staff.staff_profiles.lastIncreaseAmount).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Leave Management */}
          {staff.staff_profiles && (
            <Card className="p-6 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Umbrella className="h-5 w-5 text-orange-500" />
                Leave Management
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Leave Allowance</div>
                    <div className="font-medium text-foreground">{staff.staff_profiles.totalLeave} days</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Used Leave</div>
                    <div className="font-medium text-foreground">{staff.staff_profiles.usedLeave} days</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Umbrella className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Vacation Leave Used</div>
                    <div className="font-medium text-foreground">{staff.staff_profiles.vacationUsed} days</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Sick Leave Used</div>
                    <div className="font-medium text-foreground">{staff.staff_profiles.sickUsed} days</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Remaining Leave</div>
                    <div className="font-semibold text-green-600">
                      {staff.staff_profiles.totalLeave - staff.staff_profiles.usedLeave} days
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Work Schedule */}
          {staff.staff_profiles?.work_schedules && staff.staff_profiles.work_schedules.length > 0 && (
            <Card className="p-6 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                Work Schedule
              </h3>
              <div className="space-y-2">
                {staff.staff_profiles.work_schedules.map((schedule: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-24 font-medium text-foreground">{schedule.dayOfWeek}</div>
                      {schedule.isWorkday ? (
                        <>
                          <Badge variant="outline" className="text-xs">{schedule.shiftType || 'DAY_SHIFT'}</Badge>
                          <div className="text-sm text-muted-foreground">
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {schedule.timezone || 'Asia/Manila'}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Rest Day</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Personal Information */}
          {staff.staff_profiles && (
            <Card className="p-6 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Personal Information
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {staff.staff_profiles.dateOfBirth && (
                  <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                    <Cake className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Date of Birth</div>
                      <div className="font-medium text-foreground">
                        {new Date(staff.staff_profiles.dateOfBirth).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {staff.staff_profiles.gender && (
                  <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Gender</div>
                      <div className="font-medium text-foreground">{staff.staff_profiles.gender}</div>
                    </div>
                  </div>
                )}
                {staff.staff_profiles.civilStatus && (
                  <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Civil Status</div>
                      <div className="font-medium text-foreground">{staff.staff_profiles.civilStatus}</div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Benefits */}
          {staff.staff_profiles && (
            <Card className="p-6 border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-500" />
                Benefits & Coverage
              </h3>
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">HMO Coverage</div>
                  <Badge variant={staff.staff_profiles.hmo ? 'default' : 'secondary'}>
                    {staff.staff_profiles.hmo ? 'Active' : 'Not Enrolled'}
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Staff Interests */}
          {staff.staff_interests && (
            <Card className="p-6 border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Staff Interests & Personal Info
                </h3>
                <Badge variant={staff.staff_interests.completed ? "default" : "secondary"}>
                  {staff.staff_interests.completed ? "Completed" : "Incomplete"}
                </Badge>
              </div>
              
              {staff.staff_interests.completed ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    {staff.staff_interests.name && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Name</div>
                        <div className="text-sm font-medium text-foreground">{staff.staff_interests.name}</div>
                    </div>
                    )}
                    {staff.staff_interests.client && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Client</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.client}</div>
                    </div>
                    )}
                    {staff.staff_interests.startDate && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Start Date</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.startDate}</div>
                    </div>
                    )}
                    {staff.staff_interests.submittedAt && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Submitted At</div>
                      <div className="text-sm text-foreground">
                          {new Date(staff.staff_interests.submittedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {staff.staff_interests.favoriteFastFood && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Favorite Fast Food</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.favoriteFastFood}</div>
                      </div>
                    )}
                    {staff.staff_interests.favoriteColor && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Favorite Color</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.favoriteColor}</div>
                      </div>
                    )}
                    {staff.staff_interests.favoriteMovie && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Favorite Movie</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.favoriteMovie}</div>
                      </div>
                    )}
                    {staff.staff_interests.favoriteBook && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Favorite Book</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.favoriteBook}</div>
                      </div>
                    )}
                    {staff.staff_interests.hobby && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Hobby</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.hobby}</div>
                      </div>
                    )}
                    {staff.staff_interests.dreamDestination && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Dream Destination</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.dreamDestination}</div>
                      </div>
                    )}
                    {staff.staff_interests.favoriteSeason && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Favorite Season</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.favoriteSeason}</div>
                      </div>
                    )}
                    {staff.staff_interests.petName && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Pet Name</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.petName}</div>
                      </div>
                    )}
                    {staff.staff_interests.favoriteSport && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Favorite Sport</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.favoriteSport}</div>
                      </div>
                    )}
                    {staff.staff_interests.favoriteGame && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Favorite Game</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.favoriteGame}</div>
                      </div>
                    )}
                    {staff.staff_interests.favoriteQuote && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Favorite Quote</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.favoriteQuote}</div>
                      </div>
                    )}
                    {staff.staff_interests.funFact && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Fun Fact</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.funFact}</div>
                      </div>
                    )}
                    {staff.staff_interests.additionalInfo && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Additional Info</div>
                        <div className="text-sm text-foreground">{staff.staff_interests.additionalInfo}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-2">Staff interests not yet completed</div>
                  <div className="text-sm text-muted-foreground">
                    Staff member needs to fill out their interests form
                  </div>
                </div>
              )}
            </Card>
          )}
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
                  <span className="truncate">{staff.id.slice(0, 8)}...</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Onboarding Status</div>
                {staff.staff_onboarding ? (
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-foreground">
                      {staff.staff_onboarding.completionPercent}% Complete
                    </div>
                    {staff.staff_onboarding.isComplete && (
                      <Badge className="text-xs bg-emerald-500">✓</Badge>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Not started</div>
                )}
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Account Created</div>
                <div className="text-sm text-foreground">
                  {new Date(staff.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Last Updated</div>
                <div className="text-sm text-foreground">
                  {new Date(staff.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 border-border bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/admin/onboarding/${staff.id}`} className="block">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <UserIcon className="h-4 w-4 mr-2" />
                  View Onboarding
                </Button>
              </Link>
              {staff.company && (
                <Link href={`/admin/clients/${staff.company.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Building2 className="h-4 w-4 mr-2" />
                    View Company
                  </Button>
                </Link>
              )}
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

