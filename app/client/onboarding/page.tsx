"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  Calendar,
  Timer,
  User,
  FileText,
  Shield,
  PenTool,
  Phone,
  Briefcase,
  GraduationCap,
  Stethoscope,
  CreditCard,
  ChevronDown,
  ChevronUp,
  List,
  Grid3x3
} from "lucide-react"

type OnboardingStatus = "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED"

type StaffOnboarding = {
  id: string
  name: string
  email: string
  avatar: string | null
  onboarding: {
    completionPercent: number
    isComplete: boolean
    sectionsApproved: number
    totalSections: number
    sections: {
      personalInfo: OnboardingStatus
      resume: OnboardingStatus
      govId: OnboardingStatus
      education: OnboardingStatus
      medical: OnboardingStatus
      dataPrivacy: OnboardingStatus
      signature: OnboardingStatus
      emergencyContact: OnboardingStatus
    }
    updatedAt: Date
  } | null
  profile: {
    startDate: string | null
    daysUntilStart: number | null
    employmentStatus: string
    currentRole: string
  } | null
  createdAt: Date
}

const StatusIcon = ({ status }: { status: OnboardingStatus }) => {
  switch (status) {
    case "APPROVED":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    case "SUBMITTED":
      return <Clock className="h-5 w-5 text-blue-600" />
    case "REJECTED":
      return <XCircle className="h-5 w-5 text-red-600" />
    default:
      return <AlertCircle className="h-5 w-5 text-gray-400" />
  }
}

const StatusBadge = ({ status }: { status: OnboardingStatus }) => {
  const colors = {
    APPROVED: "bg-green-100 text-green-700 border-green-200",
    SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
    PENDING: "bg-gray-100 text-gray-600 border-gray-200"
  }

  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${colors[status]}`}>
      {status}
    </span>
  )
}

export default function ClientOnboardingPage() {
  const [staff, setStaff] = useState<StaffOnboarding[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOnboardingData()
  }, [])

  async function fetchOnboardingData() {
    try {
      setLoading(true)
      const res = await fetch("/api/client/onboarding")
      if (res.ok) {
        const data = await res.json()
        setStaff(data.staff)
      }
    } catch (error) {
      console.error("Failed to fetch onboarding data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  // Separate staff into active vs completed
  const activeStaff = staff.filter(member => {
    if (!member.profile?.startDate) return true // No start date = still onboarding
    const daysUntilStart = member.profile.daysUntilStart
    return daysUntilStart !== null && daysUntilStart >= -30 // Show if starting soon or within 30 days of starting
  })

  const completedStaff = staff.filter(member => {
    if (!member.profile?.startDate) return false
    const daysUntilStart = member.profile.daysUntilStart
    return daysUntilStart !== null && daysUntilStart < -30 // Already started more than 30 days ago
  })

  const sections = [
    { key: "personalInfo" as const, label: "Personal Info", icon: User },
    { key: "resume" as const, label: "Resume", icon: Briefcase },
    { key: "govId" as const, label: "Government IDs", icon: CreditCard },
    { key: "education" as const, label: "Education", icon: GraduationCap },
    { key: "medical" as const, label: "Medical Certificate", icon: Stethoscope },
    { key: "dataPrivacy" as const, label: "Data Privacy & Bank", icon: Shield },
    { key: "signature" as const, label: "Signature", icon: PenTool },
    { key: "emergencyContact" as const, label: "Emergency Contact", icon: Phone },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 bg-white border shadow-sm animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-7xl animate-in fade-in duration-700">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardCheck className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Staff Onboarding</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Track your team's onboarding progress and start dates
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "active"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Active Onboarding
              <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100">
                {activeStaff.length}
              </Badge>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "completed"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed
              <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">
                {completedStaff.length}
              </Badge>
            </div>
          </button>
        </div>

        {/* Active Onboarding Tab */}
        {activeTab === "active" && (
          <div>
            {activeStaff.length === 0 ? (
              <Card className="p-12 bg-white border shadow-sm text-center">
                <Timer className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Onboarding</h3>
                <p className="text-gray-600">
                  Staff members currently onboarding will appear here.
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {activeStaff.map((member) => {
                  const initials = member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)

                  return (
                    <Card key={member.id} className="p-6 bg-white border shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                      {/* Staff Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 ring-4 ring-blue-100">
                            <AvatarImage src={member.avatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-lg font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                            <p className="text-sm text-gray-600">{member.email}</p>
                            {member.profile?.currentRole && (
                              <p className="text-sm text-blue-600 font-medium mt-1">
                                {member.profile.currentRole}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Progress Badge */}
                        {member.onboarding && (
                          <div className="text-right">
                            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                              <ClipboardCheck className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-700">
                                {member.onboarding.sectionsApproved}/8 Approved
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Start Date & Countdown */}
                      {member.profile?.startDate && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Start Date</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {new Date(member.profile.startDate).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
                                  })}
                                </p>
                              </div>
                            </div>

                            {member.profile.daysUntilStart !== null && (
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <Timer className="h-5 w-5 text-green-600" />
                                  {member.profile.daysUntilStart > 0 ? (
                                    <div>
                                      <p className="text-2xl font-bold text-green-700">
                                        {member.profile.daysUntilStart}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {member.profile.daysUntilStart === 1 ? "day" : "days"} until start
                                      </p>
                                    </div>
                                  ) : member.profile.daysUntilStart === 0 ? (
                                    <p className="text-xl font-bold text-green-700">Starts Today! 🎉</p>
                                  ) : (
                                    <div>
                                      <p className="text-xl font-bold text-blue-700">Active</p>
                                      <p className="text-xs text-gray-600">
                                        {Math.abs(member.profile.daysUntilStart)} days in
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Onboarding Sections */}
                      {member.onboarding ? (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Onboarding Sections</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {sections.map((section) => {
                              const status = member.onboarding!.sections[section.key]
                              const Icon = section.icon

                              return (
                                <div
                                  key={section.key}
                                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                                >
                                  <div className="flex items-start gap-2 mb-2">
                                    <Icon className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs font-medium text-gray-700 leading-tight">
                                      {section.label}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <StatusIcon status={status} />
                                    <StatusBadge status={status} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Completion Status */}
                          {member.onboarding.isComplete ? (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                              <p className="text-sm font-semibold text-green-700">
                                ✅ Onboarding Complete - All 8 sections approved!
                              </p>
                            </div>
                          ) : (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                              <p className="text-sm font-semibold text-blue-700">
                                ⏳ Onboarding In Progress ({member.onboarding.sectionsApproved}/8 sections approved)
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                          <p className="text-sm text-gray-600">Onboarding not started</p>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Completed Tab - Compact List View */}
        {activeTab === "completed" && (
          <div>
            {completedStaff.length === 0 ? (
              <Card className="p-12 bg-white border shadow-sm text-center">
                <CheckCircle2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Completed Onboarding</h3>
                <p className="text-gray-600">
                  Staff who have completed onboarding and started work will appear here.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {completedStaff.map((member) => {
                  const initials = member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                  const isExpanded = expandedIds.has(member.id)

                  return (
                    <Card key={member.id} className="bg-white border shadow-sm hover:shadow-md transition-shadow">
                      {/* Compact Row */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-green-600 to-emerald-600 text-white font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900">{member.name}</h3>
                            <p className="text-sm text-gray-600 truncate">{member.profile?.currentRole || member.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Start Date */}
                          {member.profile?.startDate && (
                            <div className="text-right hidden md:block">
                              <p className="text-xs text-gray-600">Started</p>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(member.profile.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}

                          {/* Status Badge */}
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 whitespace-nowrap">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>

                          {/* Expand Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(member.id)}
                            className="text-gray-600"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && member.onboarding && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {sections.map((section) => {
                              const status = member.onboarding!.sections[section.key]
                              const Icon = section.icon

                              return (
                                <div
                                  key={section.key}
                                  className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm"
                                >
                                  <StatusIcon status={status} />
                                  <span className="text-xs text-gray-700">{section.label}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

