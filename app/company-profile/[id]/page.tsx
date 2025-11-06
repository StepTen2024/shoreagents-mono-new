import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Building2,
  Users,
  Mail,
  Phone,
  Globe,
  MapPin,
  Tag,
  Calendar,
  User,
  Shield,
} from "lucide-react"
import Link from "next/link"

interface CompanyProfilePageProps {
  params: {
    id: string
  }
}

async function getCompanyDetails(companyId: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        client_users: {
          include: {
            client_profiles: true,
          },
        },
        staff_users: {
          include: {
            staff_profiles: true,
            gamification_profiles: true,
          },
        },
        management_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
      },
    })
    return company
  } catch (error) {
    console.error("Error fetching company details:", error)
    return null
  }
}

export default async function CompanyProfilePage({ params }: CompanyProfilePageProps) {
  const company = await getCompanyDetails(params.id)

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-red-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-red-500/20 text-center max-w-md">
          <Building2 className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Company Not Found</h1>
          <p className="text-slate-400 mb-6">The requested company could not be found.</p>
          <Link href="/client-company">
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Client
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-700">
        {/* Back Button */}
        <Link href="/client-company">
          <button className="flex items-center justify-center rounded-xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 p-3 transition-all hover:bg-slate-800 hover:scale-105">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
        </Link>

        {/* Hero Banner with Cover Photo and Logo */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-indigo-900/30 to-slate-900/80 backdrop-blur-xl ring-1 ring-white/10 overflow-hidden">
          {/* Cover Photo */}
          {company.coverPhoto ? (
            <div className="h-48 w-full overflow-hidden">
              <img src={company.coverPhoto} alt={`${company.companyName} cover`} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-48 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
          )}
          
          {/* Company Info - Overlapping the cover */}
          <div className="relative px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-12">
              {/* Logo */}
              {company.logo ? (
                <div className="h-32 w-32 overflow-hidden rounded-2xl ring-4 ring-slate-900 bg-slate-900">
                  <img src={company.logo} alt={company.companyName} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-5xl font-bold text-white ring-4 ring-slate-900">
                  {company.companyName.charAt(0)}
                </div>
              )}
              
              {/* Company Name and Details */}
              <div className="flex-1 sm:mt-8">
                <h1 className="text-4xl font-bold text-white mb-2">{company.companyName}</h1>
                {company.tradingName && (
                  <p className="text-lg text-slate-400 mb-3">({company.tradingName})</p>
                )}
                <div className="flex flex-wrap gap-3">
                  {company.industry && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-4 py-1.5 ring-1 ring-indigo-500/50">
                      <Tag className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-sm font-semibold text-indigo-300">{company.industry}</span>
                    </div>
                  )}
                  {company.location && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-1.5 ring-1 ring-purple-500/50">
                      <MapPin className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-sm font-semibold text-purple-300">{company.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Bio */}
            {company.bio && (
              <p className="mt-6 text-slate-300 leading-relaxed border-t border-white/5 pt-6">
                {company.bio}
              </p>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 p-6 text-center transition-all duration-500 hover:scale-[1.02] hover:ring-white/20 hover:shadow-indigo-500/30">
            <Building2 className="h-8 w-8 text-indigo-400 mb-2" />
            <div className="text-3xl font-bold text-white">{company.isActive ? "Active" : "Inactive"}</div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Status</div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 p-6 text-center transition-all duration-500 hover:scale-[1.02] hover:ring-white/20 hover:shadow-blue-500/30">
            <Users className="h-8 w-8 text-blue-400 mb-2" />
            <div className="text-3xl font-bold text-white">{company.staff_users.length}</div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Staff Members</div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 p-6 text-center transition-all duration-500 hover:scale-[1.02] hover:ring-white/20 hover:shadow-purple-500/30">
            <User className="h-8 w-8 text-purple-400 mb-2" />
            <div className="text-3xl font-bold text-white">{company.client_users.length}</div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Client Users</div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 p-6 text-center transition-all duration-500 hover:scale-[1.02] hover:ring-white/20 hover:shadow-emerald-500/30">
            <Calendar className="h-8 w-8 text-emerald-400 mb-2" />
            <div className="text-3xl font-bold text-white">
              {company.contractStart ? new Date(company.contractStart).getFullYear() : "N/A"}
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Since</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Details */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-blue-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-blue-500/20">
              <h2 className="mb-6 text-2xl font-bold text-white">Company Information</h2>
              <div className="space-y-4">
                {company.industry && (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                    <Tag className="h-5 w-5 text-indigo-400" />
                    <div>
                      <div className="text-xs text-slate-400">Industry</div>
                      <div className="text-sm font-semibold text-white">{company.industry}</div>
                    </div>
                  </div>
                )}
                {company.location && (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                    <MapPin className="h-5 w-5 text-purple-400" />
                    <div>
                      <div className="text-xs text-slate-400">Location</div>
                      <div className="text-sm font-semibold text-white">{company.location}</div>
                    </div>
                  </div>
                )}
                {company.billingEmail && (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                    <Mail className="h-5 w-5 text-blue-400" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-400">Email</div>
                      <div className="text-sm font-semibold text-white truncate">{company.billingEmail}</div>
                    </div>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                    <Phone className="h-5 w-5 text-emerald-400" />
                    <div>
                      <div className="text-xs text-slate-400">Phone</div>
                      <div className="text-sm font-semibold text-white">{company.phone}</div>
                    </div>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5">
                    <Globe className="h-5 w-5 text-pink-400" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-400">Website</div>
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm font-semibold text-indigo-400 hover:underline truncate block"
                      >
                        {company.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  </div>
                )}
              </div>
              {company.bio && (
                <div className="mt-6 border-t border-white/5 pt-6">
                  <h3 className="text-md font-semibold text-white mb-3">About</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{company.bio}</p>
                </div>
              )}
            </div>

            {company.management_users && (
              <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-orange-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-orange-500/20">
                <h2 className="mb-6 text-2xl font-bold text-white">Account Manager</h2>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-2xl font-bold text-white">
                    {company.management_users.avatar ? (
                      <img 
                        src={company.management_users.avatar} 
                        alt={company.management_users.name} 
                        className="h-full w-full rounded-2xl object-cover" 
                      />
                    ) : (
                      company.management_users.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{company.management_users.name}</h3>
                    <p className="text-sm text-slate-400">{company.management_users.department}</p>
                    <p className="text-xs text-slate-500">{company.management_users.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Users */}
          <div className="space-y-6 lg:col-span-2">
            {/* Staff Users */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-indigo-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-indigo-500/20">
              <h2 className="mb-6 text-2xl font-bold text-white">
                Staff Members ({company.staff_users.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {company.staff_users.length > 0 ? (
                  company.staff_users.map((staff) => (
                    <div key={staff.id} className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-white/10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg font-bold text-white">
                        {staff.avatar ? (
                          <img src={staff.avatar} alt={staff.name} className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          staff.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white truncate">{staff.name}</p>
                        <p className="text-sm text-slate-400 truncate">{staff.staff_profiles?.currentRole || "Staff"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-2 text-slate-400 text-center py-8">No staff assigned</p>
                )}
              </div>
            </div>

            {/* Client Users */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-purple-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-purple-500/20">
              <h2 className="mb-6 text-2xl font-bold text-white">
                Client Users ({company.client_users.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {company.client_users.length > 0 ? (
                  company.client_users.map((client) => (
                    <div key={client.id} className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-white/10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold text-white">
                        {client.avatar ? (
                          <img src={client.avatar} alt={client.name} className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          client.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white truncate">{client.name}</p>
                        <p className="text-sm text-slate-400 truncate">{client.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-2 text-slate-400 text-center py-8">No client users</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

