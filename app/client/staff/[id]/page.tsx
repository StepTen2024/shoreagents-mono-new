"use client"

import React, { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { convertTo12Hour } from "@/lib/utils"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Award,
  FileText,
  TrendingUp,
  Coffee,
  Loader2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Star,
  Heart,
  Activity,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface StaffDetail {
  id: string
  name: string
  email: string
  avatar: string | null
  coverPhoto: string | null
  role: string
  assignment: {
    role: string | null
    rate: number | null
    startDate: string
    client: string
    manager: {
      name: string
      email: string
      role: string
    }
  } | null
  profile: {
    phone: string | null
    location: string | null
    employmentStatus: string
    startDate: string
    daysEmployed: number
    currentRole: string
    salary: number
    totalLeave: number
    usedLeave: number
    vacationUsed: number
    sickUsed: number
    hmo: boolean
    work_schedules: Array<{
      dayOfWeek: string
      startTime: string
      endTime: string
      isWorkday: boolean
    }>
  } | null
  currentStatus: {
    isClockedIn: boolean
    shift: string
  }
  stats: {
    avgProductivity: number
    reviewScore: number
    totalHoursThisMonth: number
    level: number
    points: number
  }
  tasks: {
    stats: {
      total: number
      todo: number
      inProgress: number
      completed: number
      stuck: number
    }
  }
  attendance: {
    daysPresent: number
    totalHours: number
    averageHoursPerDay: number
  }
  reviews: Array<{
    type: string
    overallScore: number
    submittedDate: string
    reviewer: string
  }>
  performanceTrend: Array<{
    date: string
    score: number
    activeTime: number
  }>
}

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [staff, setStaff] = useState<StaffDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [staffId, setStaffId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setStaffId(p.id))
  }, [params])

  useEffect(() => {
    if (staffId) {
      fetchStaffDetail()
    }
  }, [staffId])

  const fetchStaffDetail = async () => {
    if (!staffId) return
    try {
      const response = await fetch(`/api/client/staff/${staffId}`)
      if (!response.ok) throw new Error("Failed to fetch staff details")
      const data = await response.json()
      setStaff(data.staff)
    } catch (error) {
      console.error("Error fetching staff details:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REGULAR":
        return "bg-green-100 text-green-800 border-green-200"
      case "PROBATION":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading staff details...</p>
        </div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Staff member not found</h3>
          <Link href="/client/staff">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4">Back to Staff</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo Header */}
      {staff.coverPhoto && (
        <div className="relative h-64 w-full">
          <Image src={staff.coverPhoto} alt={`${staff.name}'s cover`} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50" />
        </div>
      )}

      <header className={`bg-white border-b border-gray-200 ${staff.coverPhoto ? '-mt-20 relative z-10' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/client/staff">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {staff.avatar ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-xl">
                  <Image src={staff.avatar} alt={staff.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-4xl font-semibold ring-4 ring-white shadow-xl">
                  {staff.name.split(" ").map((n) => n[0]).join("")}
                </div>
              )}
              <div className="pt-2">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{staff.name}</h1>
                  {staff.currentStatus.isClockedIn && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                      Online Now
                    </Badge>
                  )}
                </div>
                <p className="text-lg text-gray-600 mb-3">{staff.assignment?.role || staff.profile?.currentRole}</p>
                <div className="flex items-center gap-4 flex-wrap">
                  {staff.profile && (
                    <Badge className={getStatusColor(staff.profile.employmentStatus)}>
                      {staff.profile.employmentStatus}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-sm">
                    <Star className="h-3 w-3 mr-1" />
                    Level {staff.stats.level}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {staff.profile?.daysEmployed} days employed
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Star className="h-7 w-7 text-yellow-500 fill-yellow-500" />
                <p className="text-5xl font-bold text-gray-900">{staff.stats.avgProductivity}</p>
              </div>
              <p className="text-sm text-gray-500 font-medium">Performance Score</p>
              {staff.stats.reviewScore > 0 && (
                <p className="text-xs text-gray-400 mt-1">Latest Review: {staff.stats.reviewScore}/5.0</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Contact & Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700 font-medium">{staff.email}</span>
              </div>
              {staff.profile?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 font-medium">{staff.profile.phone}</span>
                </div>
              )}
              {staff.profile?.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 font-medium">{staff.profile.location}</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Employment Details
            </h3>
            <div className="space-y-3">
              {staff.assignment && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="font-semibold text-gray-900">{staff.assignment.client}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Manager</p>
                    <p className="font-semibold text-gray-900">{staff.assignment.manager.name}</p>
                  </div>
                  {staff.assignment.rate && (
                    <div>
                      <p className="text-sm text-gray-500">Monthly Rate</p>
                      <p className="font-semibold text-gray-900 text-2xl">${staff.assignment.rate}/month</p>
                    </div>
                  )}
                </>
              )}
              {staff.profile && (
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(staff.profile.startDate)}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Work Schedule */}
        {staff.profile?.work_schedules && (
          <Card className="p-6 bg-white mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Work Schedule
            </h3>
            <div className="grid grid-cols-7 gap-3">
              {staff.profile.work_schedules.map((schedule) => (
                <div
                  key={schedule.dayOfWeek}
                  className={`p-3 rounded-lg text-center ${
                    schedule.isWorkday
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-900 mb-1">{schedule.dayOfWeek.slice(0, 3)}</p>
                  {schedule.isWorkday ? (
                    <>
                      <p className="text-xs text-gray-600">{convertTo12Hour(schedule.startTime)}</p>
                      <p className="text-xs text-gray-600">{convertTo12Hour(schedule.endTime)}</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">Off</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <Clock className="h-8 w-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{staff.stats.totalHoursThisMonth}h</p>
            <p className="text-sm opacity-90">Hours This Month</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <Activity className="h-8 w-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{staff.tasks.stats.inProgress}</p>
            <p className="text-sm opacity-90">Active Tasks</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CheckCircle2 className="h-8 w-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">{staff.tasks.stats.completed}</p>
            <p className="text-sm opacity-90">Tasks Completed</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <Coffee className="h-8 w-8 mb-3 opacity-80" />
            <p className="text-3xl font-bold mb-1">
              {staff.profile ? staff.profile.totalLeave - staff.profile.usedLeave : 0}
            </p>
            <p className="text-sm opacity-90">Leave Days Left</p>
          </Card>
        </div>

        {/* Leave Credits & Attendance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {staff.profile && (
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Coffee className="h-5 w-5 text-blue-600" />
                Leave Credits
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Vacation Leave Used</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {staff.profile.vacationUsed} / {Math.floor(staff.profile.totalLeave / 2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(staff.profile.vacationUsed / (staff.profile.totalLeave / 2)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Sick Leave Used</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {staff.profile.sickUsed} / {Math.floor(staff.profile.totalLeave / 2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: `${(staff.profile.sickUsed / (staff.profile.totalLeave / 2)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total Remaining</span>
                    <span className="font-bold text-2xl text-green-600">
                      {staff.profile.totalLeave - staff.profile.usedLeave}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Attendance This Month
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Days Present</span>
                <span className="text-2xl font-bold text-green-600">{staff.attendance.daysPresent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Hours</span>
                <span className="text-2xl font-bold text-blue-600">{staff.attendance.totalHours}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Hours/Day</span>
                <span className="text-2xl font-bold text-purple-600">{staff.attendance.averageHoursPerDay}h</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Benefits */}
        {staff.profile && (
          <Card className="p-6 bg-white mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-blue-600" />
              Benefits
            </h3>
            <div className="flex items-center gap-4">
              {staff.profile.hmo ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">HMO Benefits Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <Circle className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-600">HMO Benefits Not Active</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Recent Reviews */}
        {staff.reviews.length > 0 && (
          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Performance Reviews
            </h3>
            <div className="space-y-4">
              {staff.reviews.slice(0, 3).map((review, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{review.type.replace(/_/g, " ")}</p>
                    <p className="text-sm text-gray-600">
                      By {review.reviewer} • {formatDate(review.submittedDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900">{review.overallScore}</span>
                      <span className="text-gray-500">/5.0</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}









