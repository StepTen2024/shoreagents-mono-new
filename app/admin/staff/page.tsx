"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  Search, 
  Building2, 
  User, 
  Shield, 
  Mail,
  Calendar,
  Briefcase,
  Filter
} from "lucide-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type UserType = 'all' | 'staff' | 'management'

interface StaffUser {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  createdAt: string
  company?: {
    id: string
    companyName: string
    tradingName: string | null
    industry: string | null
    logo: string | null
  } | null
  profile?: {
    phone: string | null
    location: string | null
    currentRole: string | null
  } | null
}

interface ManagementUser {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  department: string
  createdAt: string
  phone: string | null
}

interface Company {
  id: string
  companyName: string
}

export default function AdminStaffPage() {
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([])
  const [managementUsers, setManagementUsers] = useState<ManagementUser[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userType, setUserType] = useState<UserType>('all')
  const [selectedCompany, setSelectedCompany] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [staffRes, managementRes, companiesRes] = await Promise.all([
        fetch('/api/admin/staff'),
        fetch('/api/admin/management'),
        fetch('/api/admin/companies'),
      ])

      const [staffData, managementData, companiesData] = await Promise.all([
        staffRes.json(),
        managementRes.json(),
        companiesRes.json(),
      ])

      setStaffUsers(staffData.staff || [])
      setManagementUsers(managementData.management || [])
      setCompanies(companiesData.companies || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Combine and filter users
  const allUsers = [
    ...staffUsers.map(u => ({ ...u, userType: 'staff' as const })),
    ...managementUsers.map(u => ({ ...u, userType: 'management' as const })),
  ]

  const filteredUsers = allUsers.filter(user => {
    // Filter by user type
    if (userType !== 'all' && user.userType !== userType) return false

    // Filter by company (only for staff)
    if (selectedCompany !== 'all' && user.userType === 'staff') {
      const staffUser = user as StaffUser & { userType: 'staff' }
      if (!staffUser.company || staffUser.company.id !== selectedCompany) return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (user.userType === 'staff') {
        const staffUser = user as StaffUser & { userType: 'staff' }
        return (
          staffUser.name.toLowerCase().includes(query) ||
          staffUser.email.toLowerCase().includes(query) ||
          staffUser.profile?.currentRole?.toLowerCase().includes(query) ||
          staffUser.profile?.location?.toLowerCase().includes(query) ||
          staffUser.company?.companyName.toLowerCase().includes(query)
        )
      } else {
        const mgmtUser = user as ManagementUser & { userType: 'management' }
        return (
          mgmtUser.name.toLowerCase().includes(query) ||
          mgmtUser.email.toLowerCase().includes(query) ||
          mgmtUser.department?.toLowerCase().includes(query)
        )
      }
    }

    return true
  })

  const stats = {
    totalStaff: staffUsers.length,
    totalManagement: managementUsers.length,
    totalUsers: staffUsers.length + managementUsers.length,
    assignedStaff: staffUsers.filter(s => s.company).length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Staff Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage staff members and management team
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Total Team</div>
          <div className="text-2xl font-semibold text-foreground mt-1">{stats.totalUsers}</div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Client Staff</div>
          <div className="text-2xl font-semibold text-blue-500 mt-1">{stats.totalStaff}</div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Management Team</div>
          <div className="text-2xl font-semibold text-purple-500 mt-1">{stats.totalManagement}</div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="text-sm text-muted-foreground">Assigned to Clients</div>
          <div className="text-2xl font-semibold text-emerald-500 mt-1">{stats.assignedStaff}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border bg-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, department, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={userType} onValueChange={(v) => setUserType(v as UserType)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="User Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="staff">Client Staff</SelectItem>
              <SelectItem value="management">Management</SelectItem>
            </SelectContent>
          </Select>
          {userType !== 'management' && (
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {/* User List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <Link 
            key={`${user.userType}-${user.id}`}
            href={user.userType === 'staff' ? `/admin/staff/${user.id}` : `/admin/management/${user.id}`}
            className="block"
          >
            <Card className="p-6 border-border bg-card hover:bg-card/80 transition-colors cursor-pointer">
              <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-white/10">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-lg">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge 
                    variant={user.userType === 'management' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {user.userType === 'management' ? (
                      <><Shield className="h-3 w-3 mr-1" /> Management</>
                    ) : (
                      <><User className="h-3 w-3 mr-1" /> Staff</>
                    )}
                  </Badge>
                  {user.role && (
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  {user.userType === 'management' && (user as ManagementUser).department && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3 w-3" />
                      <span>{(user as ManagementUser).department}</span>
                    </div>
                  )}
                  {user.userType === 'staff' && (user as StaffUser).profile?.currentRole && (
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{(user as StaffUser).profile!.currentRole}</span>
                    </div>
                  )}
                  {user.userType === 'staff' && (user as StaffUser).company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{(user as StaffUser).company!.companyName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
            </Card>
          </Link>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="p-12 border-border bg-card text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Users Found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </Card>
      )}
    </div>
  )
}
