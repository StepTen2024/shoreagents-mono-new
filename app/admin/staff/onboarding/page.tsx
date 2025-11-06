"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Eye, CheckCircle2, Clock, AlertCircle, FileText, Circle, CircleDot, PlayCircle, PauseCircle, Play } from "lucide-react"

interface StaffOnboarding {
  id: string
  name: string
  email: string
  onboarding: {
    completionPercent: number
    isComplete: boolean
    personalInfoStatus: string
    resumeStatus: string
    govIdStatus: string
    educationStatus: string
    medicalStatus: string
    dataPrivacyStatus: string
    documentsStatus: string
    signatureStatus: string
    emergencyContactStatus: string
    updatedAt: string
  } | null
}

export default function AdminOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [staffList, setStaffList] = useState<StaffOnboarding[]>([])
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchStaffList()
  }, [filter])

  const fetchStaffList = async () => {
    try {
      const response = await fetch(`/api/admin/staff/onboarding?filter=${filter}`)
      if (!response.ok) throw new Error("Failed to fetch staff list")
      
      const data = await response.json()
      setStaffList(data.staff)
    } catch (err) {
      console.error("Failed to load staff list:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (percent: number, isComplete: boolean) => {
    if (isComplete) {
      return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Verified & Complete</Badge>
    } else if (percent === 100) {
      return <Badge className="bg-blue-600"><FileText className="h-3 w-3 mr-1" />Ready for Verification</Badge>
    } else if (percent >= 80) {
      return <Badge className="bg-blue-500"><CircleDot className="h-3 w-3 mr-1" />Almost Complete</Badge>
    } else if (percent >= 60) {
      return <Badge className="bg-green-500"><PlayCircle className="h-3 w-3 mr-1" />In Progress</Badge>
    } else if (percent >= 40) {
      return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Halfway</Badge>
    } else if (percent >= 20) {
      return <Badge className="bg-orange-500"><PauseCircle className="h-3 w-3 mr-1" />Started</Badge>
    } else {
      return <Badge className="bg-red-500"><Play className="h-3 w-3 mr-1" />Just Started</Badge>
    }
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
          <h1 className="text-3xl font-semibold text-foreground">Staff Onboarding Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and verify staff onboarding submissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All Staff</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
          <TabsTrigger value="complete">Complete</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            {staffList.length} staff member{staffList.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staffList.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No staff members found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">
                        {staff.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {staff.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${staff.onboarding?.completionPercent || 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {staff.onboarding?.completionPercent || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(
                          staff.onboarding?.completionPercent || 0,
                          staff.onboarding?.isComplete || false
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {staff.onboarding?.updatedAt
                          ? new Date(staff.onboarding.updatedAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => router.push(`/admin/staff/onboarding/${staff.id}`)}
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

