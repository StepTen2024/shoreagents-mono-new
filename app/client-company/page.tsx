"use client"

import { useState, useEffect } from "react"
import { Building2, Users, Mail, Phone, Globe, MapPin, Calendar, Tag, User, ArrowRight } from "lucide-react"
import Link from "next/link"
import ClientUserModal from "@/components/client-user-modal"

interface ClientUser {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  createdAt: string
}

interface Company {
  id: string
  companyName: string
  tradingName: string | null
  logo: string | null
  industry: string | null
  location: string | null
  billingEmail: string | null
  phone: string | null
  website: string | null
  bio: string | null
  clientUsers: ClientUser[]
  accountManager: {
    id: string
    name: string
    email: string
    avatar: string | null
    department: string | null
  } | null
}

interface ClientCompanyData {
  company: Company
  clientUsersCount: number
}

export default function ClientCompanyPage() {
  const [data, setData] = useState<ClientCompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchClientCompany()
  }, [])

  const fetchClientCompany = async () => {
    try {
      const response = await fetch("/api/client-company")
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to load client company")
      }
    } catch (err) {
      console.error("Error fetching client company:", err)
      setError("Failed to load client company")
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (user: ClientUser) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedUser(null), 300)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="h-32 rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-red-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-red-500/20 text-center">
            <Building2 className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Client Company Assigned</h2>
            <p className="text-slate-400">{error || "You are not currently assigned to a client company."}</p>
          </div>
        </div>
      </div>
    )
  }

  const { company } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-700">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">My Client</h1>
            <p className="mt-2 text-lg text-slate-400">Company information and client users</p>
          </div>
        </div>

        {/* Company Profile Card */}
        <Link href={`/company-profile/${company.id}`}>
          <div className="group cursor-pointer rounded-3xl bg-gradient-to-br from-slate-900/80 via-indigo-900/30 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-2xl hover:shadow-indigo-500/20 hover:scale-[1.01]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                {/* Company Logo */}
                {company.logo ? (
                  <div className="h-24 w-24 overflow-hidden rounded-2xl ring-2 ring-white/10">
                    <img src={company.logo} alt={company.companyName} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-3xl font-bold text-white ring-2 ring-white/10">
                    {company.companyName.charAt(0)}
                  </div>
                )}

                {/* Company Info */}
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{company.companyName}</h2>
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

              <div className="flex items-center gap-2 text-indigo-400 transition-transform group-hover:translate-x-2">
                <span className="text-sm font-semibold">View Full Profile</span>
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            {/* Company Bio */}
            {company.bio && (
              <p className="mt-6 text-slate-300 leading-relaxed border-t border-white/5 pt-6">
                {company.bio}
              </p>
            )}

            {/* Company Details Grid */}
            <div className="mt-6 grid gap-4 md:grid-cols-3 border-t border-white/5 pt-6">
              {company.billingEmail && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-2">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-400">Email</div>
                    <div className="text-sm font-semibold text-white truncate">{company.billingEmail}</div>
                  </div>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 p-2">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-400">Phone</div>
                    <div className="text-sm font-semibold text-white truncate">{company.phone}</div>
                  </div>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2">
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-400">Website</div>
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        window.open(company.website, '_blank', 'noopener,noreferrer')
                      }}
                      className="text-sm font-semibold text-indigo-400 hover:underline truncate block cursor-pointer"
                    >
                      {company.website.replace(/^https?:\/\//, "")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Account Manager */}
            {company.accountManager && (
              <div className="mt-6 flex items-center gap-4 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 border-t border-white/5 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-lg font-bold text-white">
                  {company.accountManager.avatar ? (
                    <img src={company.accountManager.avatar} alt={company.accountManager.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    company.accountManager.name.charAt(0)
                  )}
                </div>
                <div>
                  <div className="text-xs text-slate-400">Account Manager</div>
                  <div className="text-sm font-semibold text-white">{company.accountManager.name}</div>
                  <div className="text-xs text-slate-500">{company.accountManager.department} • {company.accountManager.email}</div>
                </div>
              </div>
            )}
          </div>
        </Link>

        {/* Client Users Section */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-purple-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-2.5">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Client Users</h2>
                <p className="text-sm text-slate-400">{data.clientUsersCount} {data.clientUsersCount === 1 ? "user" : "users"} from this company</p>
              </div>
            </div>
          </div>

          {/* Client Users Grid */}
          {company.clientUsers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {company.clientUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="group flex flex-col gap-4 rounded-xl bg-slate-800/50 p-5 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-purple-500/50 hover:scale-[1.02] text-left"
                >
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <div className="h-14 w-14 overflow-hidden rounded-xl ring-2 ring-white/10">
                        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-xl font-bold text-white ring-2 ring-white/10">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white truncate">{user.name}</h3>
                      <p className="text-sm text-slate-400 truncate">{user.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-xs text-slate-500">Click to view details</span>
                    <ArrowRight className="h-4 w-4 text-purple-400 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="mx-auto h-16 w-16 text-slate-600 mb-4" />
              <p className="text-slate-400">No client users found for this company.</p>
            </div>
          )}
        </div>
      </div>

      {/* Client User Modal */}
      <ClientUserModal 
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  )
}

