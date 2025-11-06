"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, Users as UsersIcon, Mail, Phone, MapPin, ExternalLink, Search, User } from "lucide-react"
import Link from "next/link"

type TabType = 'companies' | 'users'

interface Company {
  id: string
  companyName: string
  tradingName: string | null
  industry: string | null
  location: string | null
  billingEmail: string | null
  phone: string | null
  website: string | null
  logo: string | null
  isActive: boolean
  staff_users: { id: string; name: string; email: string }[]
  client_users: { id: string; name: string; email: string; role: string }[]
  management_users: { id: string; name: string; email: string; department: string } | null
}

interface ClientUser {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  createdAt: string
  company: {
    id: string
    companyName: string
  } | null
}

export default function AdminClientsPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as TabType | null
  const [activeTab, setActiveTab] = useState<TabType>(tabParam === 'users' ? 'users' : 'companies')
  const [companies, setCompanies] = useState<Company[]>([])
  const [client_users, setClient_users] = useState<ClientUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Update tab from URL
  useEffect(() => {
    if (tabParam === 'users' || tabParam === 'companies') {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Fetch companies
  useEffect(() => {
    if (activeTab === 'companies') {
      fetchCompanies()
    } else {
      fetchClientUsers()
    }
  }, [activeTab])

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/clients')
      const data = await response.json()
      setCompanies(data.companies || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  const fetchClientUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/client-users')
      const data = await response.json()
      setClient_users(data.client_users || [])
    } catch (error) {
      console.error('Error fetching client users:', error)
      setClient_users([])
    } finally {
      setLoading(false)
    }
  }

  // Filter companies based on search
  const filteredCompanies = companies.filter(company =>
    company.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.tradingName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter client users based on search
  const filteredClient_users = client_users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company?.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Client Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage client companies and users
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => {
            setActiveTab('companies')
            setSearchQuery('')
          }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'companies'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
          }`}
        >
          <Building2 className="size-4" />
          Companies
          {!loading && companies.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {companies.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('users')
            setSearchQuery('')
          }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
          }`}
        >
          <UsersIcon className="size-4" />
          Users
          {!loading && client_users.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {client_users.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'companies' ? 'Search companies...' : 'Search users...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )}

      {/* Companies Tab */}
      {!loading && activeTab === 'companies' && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4 border-border bg-card">
              <div className="text-sm text-muted-foreground">Total Companies</div>
              <div className="text-2xl font-semibold text-foreground mt-1">{companies.length}</div>
            </Card>
            <Card className="p-4 border-border bg-card">
              <div className="text-sm text-muted-foreground">Active Clients</div>
              <div className="text-2xl font-semibold text-emerald-500 mt-1">
                {companies.filter(c => c.isActive).length}
              </div>
            </Card>
            <Card className="p-4 border-border bg-card">
              <div className="text-sm text-muted-foreground">Total Staff Assigned</div>
              <div className="text-2xl font-semibold text-blue-500 mt-1">
                {companies.reduce((acc, c) => acc + c.staff_users.length, 0)}
              </div>
            </Card>
            <Card className="p-4 border-border bg-card">
              <div className="text-sm text-muted-foreground">Client Users</div>
              <div className="text-2xl font-semibold text-purple-500 mt-1">
                {companies.reduce((acc, c) => acc + c.client_users.length, 0)}
              </div>
            </Card>
          </div>

          {/* Companies Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="p-6 border-border bg-card hover:bg-card/80 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Company Logo/Icon */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/10">
                        {company.logo ? (
                          <img src={company.logo} alt={company.companyName} className="h-full w-full rounded-lg object-cover" />
                        ) : (
                          <Building2 className="h-6 w-6 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{company.companyName}</h3>
                        {company.tradingName && company.tradingName !== company.companyName && (
                          <p className="text-xs text-muted-foreground">{company.tradingName}</p>
                        )}
                      </div>
                    </div>

                    {/* Company Status */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={company.isActive ? "default" : "secondary"} className="text-xs">
                        {company.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {company.industry && (
                        <Badge variant="outline" className="text-xs">
                          {company.industry}
                        </Badge>
                      )}
                    </div>

                    {/* Company Details */}
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      {company.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">{company.location}</span>
                        </div>
                      )}
                      {company.billingEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs truncate">{company.billingEmail}</span>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{company.phone}</span>
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-3 w-3" />
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                            Website
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="rounded-lg bg-muted/30 p-2 text-center">
                        <div className="text-xs text-muted-foreground">Staff</div>
                        <div className="text-lg font-semibold text-foreground">{company.staff_users.length}</div>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2 text-center">
                        <div className="text-xs text-muted-foreground">Users</div>
                        <div className="text-lg font-semibold text-foreground">{company.client_users.length}</div>
                      </div>
                    </div>

                    {/* Account Manager */}
                    {company.management_users && (
                      <div className="rounded-lg bg-muted/30 p-3 mb-4">
                        <div className="text-xs text-muted-foreground mb-1">Account Manager</div>
                        <div className="font-medium text-sm text-foreground">{company.management_users.name}</div>
                        <div className="text-xs text-muted-foreground">{company.management_users.department}</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/admin/clients/${company.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredCompanies.length === 0 && (
            <Card className="p-12 border-border bg-card text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Companies Found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'No client companies in the system yet'}
              </p>
            </Card>
          )}
        </>
      )}

      {/* Users Tab */}
      {!loading && activeTab === 'users' && (
        <>
          {/* Users Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClient_users.map((user) => (
              <Card key={user.id} className="p-6 border-border bg-card hover:bg-card/80 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/10">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-blue-400" />
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{user.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>

                    {user.company && (
                      <div className="mt-3 rounded-lg bg-muted/30 p-2">
                        <div className="text-xs text-muted-foreground mb-0.5">Company</div>
                        <div className="font-medium text-sm text-foreground">{user.company.companyName}</div>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-muted-foreground">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>

                    {/* View Profile Button */}
                    <div className="mt-4">
                      <Link href={`/admin/client-users/${user.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredClient_users.length === 0 && (
            <Card className="p-12 border-border bg-card text-center">
              <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Users Found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'No client users in the system yet'}
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
