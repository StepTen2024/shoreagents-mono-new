"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  CreditCard
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

        {/* Staff List */}
        {staff.length === 0 ? (
          <Card className="p-12 bg-white border shadow-sm text-center">
            <ClipboardCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Staff Onboarding</h3>
            <p className="text-gray-600">
              Your assigned staff members will appear here once they begin onboarding.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {staff.map((member) => {
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
                                  <p className="text-xs text-gray-600">Already started</p>
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
    </div>
  )
}

