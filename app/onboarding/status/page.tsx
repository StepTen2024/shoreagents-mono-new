"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  CreditCard,
  FileText,
  PenTool,
  Users,
  ArrowLeft,
  Info,
  Briefcase,
  GraduationCap,
  Stethoscope,
  Shield
} from "lucide-react"

interface OnboardingStatus {
  // Personal Info
  personalInfoStatus: string
  personalInfoFeedback: string | null
  personalInfoVerifiedAt: string | null
  
  // Resume
  resumeStatus: string
  resumeFeedback: string | null
  resumeVerifiedAt: string | null
  
  // Gov IDs
  govIdStatus: string
  govIdFeedback: string | null
  govIdVerifiedAt: string | null
  
  // Education
  educationStatus: string
  educationFeedback: string | null
  educationVerifiedAt: string | null
  
  // Medical
  medicalStatus: string
  medicalFeedback: string | null
  medicalVerifiedAt: string | null
  
  // Data Privacy
  dataPrivacyStatus: string
  dataPrivacyFeedback: string | null
  dataPrivacyVerifiedAt: string | null
  
  // Documents
  documentsStatus: string
  documentsFeedback: string | null
  documentsVerifiedAt: string | null
  
  // Signature
  signatureStatus: string
  signatureFeedback: string | null
  signatureVerifiedAt: string | null
  
  // Emergency Contact
  emergencyContactStatus: string
  emergencyContactFeedback: string | null
  emergencyContactVerifiedAt: string | null
  
  completionPercent: number
  isComplete: boolean
}

export default function OnboardingStatusPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchStatus()
  }, [])

  // Check if onboarding is complete and redirect to welcome form
  useEffect(() => {
    if (status?.isComplete && status.completionPercent === 100) {
      // Check if welcome form is already completed
      const checkWelcomeForm = async () => {
        try {
          const response = await fetch('/api/welcome')
          if (response.ok) {
            const data = await response.json()
            if (data.alreadySubmitted) {
              // Welcome form already submitted, stay on status page
              return
            } else {
              // Redirect to welcome form
              router.push('/welcome')
            }
          }
        } catch (error) {
          console.error('Failed to check welcome form status:', error)
        }
      }
      
      checkWelcomeForm()
    }
  }, [status, router])

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/onboarding")
      if (!response.ok) throw new Error("Failed to fetch status")
      
      const data = await response.json()
      setStatus(data.onboarding)
    } catch (err) {
      setError("Failed to load onboarding status")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (sectionStatus: string) => {
    if (sectionStatus === "APPROVED") {
      return (
        <Badge className="bg-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    } else if (sectionStatus === "REJECTED") {
      return (
        <Badge className="bg-red-600">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected - Action Required
        </Badge>
      )
    } else if (sectionStatus === "SUBMITTED") {
      return (
        <Badge className="bg-yellow-600">
          <Clock className="h-3 w-3 mr-1" />
          Pending Review
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="border-slate-500 text-slate-500">
          <AlertCircle className="h-3 w-3 mr-1" />
          Not Submitted
        </Badge>
      )
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="loader"></div>
      </div>
    )
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "No onboarding data found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const sections = [
    { 
      key: "personalInfo", 
      title: "Personal Information", 
      icon: User, 
      status: status.personalInfoStatus,
      feedback: status.personalInfoFeedback,
      verifiedAt: status.personalInfoVerifiedAt
    },
    { 
      key: "resume", 
      title: "Resume", 
      icon: Briefcase, 
      status: status.resumeStatus,
      feedback: status.resumeFeedback,
      verifiedAt: status.resumeVerifiedAt
    },
    { 
      key: "govId", 
      title: "Government IDs & Documents", 
      icon: CreditCard, 
      status: status.govIdStatus,
      feedback: status.govIdFeedback,
      verifiedAt: status.govIdVerifiedAt
    },
    { 
      key: "education", 
      title: "Education Documents", 
      icon: GraduationCap, 
      status: status.educationStatus,
      feedback: status.educationFeedback,
      verifiedAt: status.educationVerifiedAt
    },
    { 
      key: "medical", 
      title: "Medical Certificate", 
      icon: Stethoscope, 
      status: status.medicalStatus,
      feedback: status.medicalFeedback,
      verifiedAt: status.medicalVerifiedAt
    },
    { 
      key: "dataPrivacy", 
      title: "Data Privacy & Bank", 
      icon: Shield, 
      status: status.dataPrivacyStatus,
      feedback: status.dataPrivacyFeedback,
      verifiedAt: status.dataPrivacyVerifiedAt
    },
    { 
      key: "documents", 
      title: "Additional Documents", 
      icon: FileText, 
      status: status.documentsStatus,
      feedback: status.documentsFeedback,
      verifiedAt: status.documentsVerifiedAt
    },
    { 
      key: "signature", 
      title: "Signature", 
      icon: PenTool, 
      status: status.signatureStatus,
      feedback: status.signatureFeedback,
      verifiedAt: status.signatureVerifiedAt
    },
    { 
      key: "emergencyContact", 
      title: "Emergency Contact", 
      icon: Users, 
      status: status.emergencyContactStatus,
      feedback: status.emergencyContactFeedback,
      verifiedAt: status.emergencyContactVerifiedAt
    }
  ]

  const approvedCount = sections.filter(s => s.status === "APPROVED").length
  const rejectedCount = sections.filter(s => s.status === "REJECTED").length
  const pendingCount = sections.filter(s => s.status === "SUBMITTED").length
  const notSubmittedCount = sections.filter(s => s.status === "PENDING" || !s.status).length

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Onboarding Status
          </h1>
          <p className="text-slate-400">Track your onboarding progress and review feedback</p>
        </div>

        {/* Status Messages */}
        {status.isComplete && (
          <Alert className="mb-6 bg-green-900/50 border-green-700">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-200 flex items-center justify-between">
              <span>
                <strong>All Set!</strong> Your onboarding has been completed and verified by management. Welcome to the team!
              </span>
              <Button
                onClick={() => router.push("/onboarding")}
                variant="outline"
                size="sm"
                className="ml-3 border-green-600 text-green-300 hover:bg-green-900 whitespace-nowrap"
              >
                View Onboarding Form
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {rejectedCount > 0 && (
          <Alert className="mb-6 bg-red-900/50 border-red-700">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-200 flex items-center justify-between">
              <span>
                <strong>Action Required:</strong> {rejectedCount} document{rejectedCount > 1 ? 's' : ''} {rejectedCount > 1 ? 'need' : 'needs'} your attention. Please review the feedback below and resubmit.
              </span>
              <Button
                onClick={() => router.push("/onboarding")}
                variant="outline"
                size="sm"
                className="ml-3 border-red-600 text-red-300 hover:bg-red-900 whitespace-nowrap"
              >
                Fix Rejected Documents
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!status.isComplete && rejectedCount === 0 && status.completionPercent === 100 && (
          <Alert className="mb-6 bg-blue-900/50 border-blue-700">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-200 flex items-center justify-between">
              <span>
                <strong>Awaiting Verification:</strong> You've submitted all required information! Our management team is reviewing your onboarding. You'll be notified once verification is complete.
              </span>
              <Button
                onClick={() => router.push("/onboarding")}
                variant="outline"
                size="sm"
                className="ml-3 border-blue-600 text-blue-300 hover:bg-blue-900 whitespace-nowrap"
              >
                View Onboarding Form
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Overview */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Overall Progress</CardTitle>
            <CardDescription>
              {approvedCount} of {sections.length} sections approved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-400">Completion</span>
                  <span className="text-sm font-bold text-white">
                    {status.completionPercent}%
                  </span>
                </div>
                <Progress 
                  value={status.completionPercent} 
                  className="h-3 bg-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{approvedCount}</div>
                  <div className="text-xs text-green-300">Approved</div>
                </div>
                <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">{pendingCount}</div>
                  <div className="text-xs text-yellow-300">Under Review</div>
                </div>
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <div className="text-2xl font-bold text-red-400">{rejectedCount}</div>
                  <div className="text-xs text-red-300">Needs Attention</div>
                </div>
                <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                  <div className="text-2xl font-bold text-slate-400">{notSubmittedCount}</div>
                  <div className="text-xs text-slate-300">Not Submitted</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Documents */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-400" />
              View Documents
            </CardTitle>
            <CardDescription className="text-slate-400">
              Access and review all your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => router.push("/onboarding")}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 border-slate-600 hover:border-blue-500 hover:bg-blue-900/20"
              >
                <div className="flex items-center gap-2 w-full">
                  <User className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Personal Information</span>
                </div>
                <span className="text-xs text-slate-400 text-left">View and edit your personal details</span>
              </Button>

              <Button
                onClick={() => router.push("/onboarding")}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 border-slate-600 hover:border-blue-500 hover:bg-blue-900/20"
              >
                <div className="flex items-center gap-2 w-full">
                  <Briefcase className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Resume</span>
                </div>
                <span className="text-xs text-slate-400 text-left">View your uploaded resume</span>
              </Button>

              <Button
                onClick={() => router.push("/onboarding")}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 border-slate-600 hover:border-blue-500 hover:bg-blue-900/20"
              >
                <div className="flex items-center gap-2 w-full">
                  <CreditCard className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Government IDs</span>
                </div>
                <span className="text-xs text-slate-400 text-left">View SSS, TIN, PhilHealth, Pag-IBIG documents</span>
              </Button>

              <Button
                onClick={() => router.push("/onboarding")}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 border-slate-600 hover:border-blue-500 hover:bg-blue-900/20"
              >
                <div className="flex items-center gap-2 w-full">
                  <GraduationCap className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Education Documents</span>
                </div>
                <span className="text-xs text-slate-400 text-left">View diploma, TOR, and education certificates</span>
              </Button>

              <Button
                onClick={() => router.push("/onboarding")}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 border-slate-600 hover:border-blue-500 hover:bg-blue-900/20"
              >
                <div className="flex items-center gap-2 w-full">
                  <Stethoscope className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Medical Certificate</span>
                </div>
                <span className="text-xs text-slate-400 text-left">View your medical certificate</span>
              </Button>

              <Button
                onClick={() => router.push("/onboarding")}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 border-slate-600 hover:border-blue-500 hover:bg-blue-900/20"
              >
                <div className="flex items-center gap-2 w-full">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Data Privacy & Bank</span>
                </div>
                <span className="text-xs text-slate-400 text-left">View data privacy consent and bank details</span>
              </Button>

              <Button
                onClick={() => router.push("/onboarding")}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 border-slate-600 hover:border-blue-500 hover:bg-blue-900/20"
              >
                <div className="flex items-center gap-2 w-full">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Additional Documents</span>
                </div>
                <span className="text-xs text-slate-400 text-left">View ID, certificates, clearances, and more</span>
              </Button>

              <Button
                onClick={() => router.push("/onboarding")}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 border-slate-600 hover:border-blue-500 hover:bg-blue-900/20"
              >
                <div className="flex items-center gap-2 w-full">
                  <PenTool className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Signature</span>
                </div>
                <span className="text-xs text-slate-400 text-left">View your uploaded signature</span>
              </Button>

              <Button
                onClick={() => router.push("/onboarding")}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 border-slate-600 hover:border-blue-500 hover:bg-blue-900/20"
              >
                <div className="flex items-center gap-2 w-full">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Emergency Contact</span>
                </div>
                <span className="text-xs text-slate-400 text-left">View emergency contact information</span>
              </Button>

              <Button
                onClick={() => router.push("/onboarding")}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 border-slate-600 hover:border-blue-500 hover:bg-blue-900/20"
              >
                <div className="flex items-center gap-2 w-full">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">All Documents</span>
                </div>
                <span className="text-xs text-slate-400 text-center">View complete onboarding form</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Verification Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Verification Details</h2>
          
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <Card key={section.key} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-purple-400" />
                      <CardTitle className="text-white text-lg">{section.title}</CardTitle>
                    </div>
                    {getStatusBadge(section.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {section.verifiedAt && (
                    <p className="text-sm text-slate-400 mb-2">
                      Verified on {formatDate(section.verifiedAt)}
                    </p>
                  )}
                  
                  {section.feedback && (
                    <Alert className="bg-yellow-900/30 border-yellow-700">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-yellow-200">
                        <strong>Feedback from Management:</strong><br />
                        {section.feedback}
                      </AlertDescription>
                    </Alert>
                  )}

                  {section.status === "SUBMITTED" && !section.feedback && (
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Your submission is under review by our management team.
                    </p>
                  )}

                  {section.status === "REJECTED" && !section.feedback && (
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      This document was rejected. Please review and resubmit with correct information.
                    </p>
                  )}

                  {section.status === "APPROVED" && (
                    <p className="text-sm text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      This document has been verified and approved.
                    </p>
                  )}

                  {(section.status === "PENDING" || !section.status) && (
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      You haven't submitted this document yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

