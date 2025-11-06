"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Loader2, 
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
  Briefcase,
  GraduationCap,
  Heart,
  Shield,
  Building
} from "lucide-react"

interface OnboardingData {
  // Personal Info
  firstName: string
  middleName: string
  lastName: string
  gender: string
  civilStatus: string
  dateOfBirth: string
  contactNo: string
  email: string
  
  // Gov IDs
  sss: string
  tin: string
  philhealthNo: string
  pagibigNo: string
  
  // Documents
  validIdUrl: string
  birthCertUrl: string
  nbiClearanceUrl: string
  birForm2316Url: string
  idPhotoUrl: string
  signatureUrl: string
  policeClearanceUrl: string
  certificateEmpUrl: string
  sssDocUrl: string
  tinDocUrl: string
  philhealthDocUrl: string
  pagibigDocUrl: string
  
  // New GUNTING 8-step fields
  resumeUrl: string
  diplomaTorUrl: string
  medicalCertUrl: string
  dataPrivacyConsentUrl: string
  bankAccountDetails: string
  
  // Emergency Contact
  emergencyContactName: string
  emergencyContactNo: string
  emergencyRelationship: string
  
  // Status
  personalInfoStatus: string
  govIdStatus: string
  documentsStatus: string
  signatureStatus: string
  emergencyContactStatus: string
  
  // New GUNTING 8-step status
  resumeStatus: string
  educationStatus: string
  medicalStatus: string
  dataPrivacyStatus: string
  
  // Feedback
  personalInfoFeedback: string
  govIdFeedback: string
  documentsFeedback: string
  signatureFeedback: string
  emergencyContactFeedback: string
  
  // New GUNTING 8-step feedback
  resumeFeedback: string
  educationFeedback: string
  medicalFeedback: string
  dataPrivacyFeedback: string
  
  completionPercent: number
  isComplete: boolean
  contractSigned: boolean
}

export default function AdminOnboardingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const staffUserId = params.staffUserId as string

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [viewFileModal, setViewFileModal] = useState<{ url: string; title: string } | null>(null)
  const [imageLoading, setImageLoading] = useState(true)
  const [confirmCompleteModal, setConfirmCompleteModal] = useState(false)
  const [successModal, setSuccessModal] = useState<{ 
    show: boolean; 
    title: string; 
    message: string; 
    details: string[] 
  }>({ show: false, title: "", message: "", details: [] })
  
  // Individual loading states for each section and action
  const [processingStates, setProcessingStates] = useState<{
    [key: string]: { approve: boolean; reject: boolean }
  }>({
    personalInfo: { approve: false, reject: false },
    govId: { approve: false, reject: false },
    documents: { approve: false, reject: false },
    signature: { approve: false, reject: false },
    emergencyContact: { approve: false, reject: false },
    resume: { approve: false, reject: false },
    education: { approve: false, reject: false },
    medical: { approve: false, reject: false },
    dataPolicy: { approve: false, reject: false },
    bank: { approve: false, reject: false }
  })
  
  const [staff, setStaff] = useState<any>(null)
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [editingFeedback, setEditingFeedback] = useState<Record<string, boolean>>({})
  const [savingFeedback, setSavingFeedback] = useState<Record<string, boolean>>({})
  const [companies, setCompanies] = useState<any[]>([])
  
  // Employment Details (filled by management)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [employmentStatus, setEmploymentStatus] = useState<string>("PROBATION")
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [shiftTime, setShiftTime] = useState<string>("9:00 AM - 6:00 PM")
  const [currentRole, setCurrentRole] = useState<string>("")
  const [salary, setSalary] = useState<string>("")
  const [hmo, setHmo] = useState<boolean>(true)

  useEffect(() => {
    fetchOnboardingDetails()
    fetchCompanies()
  }, [staffUserId])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/admin/companies")
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies || [])
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err)
    }
  }

  const fetchOnboardingDetails = async () => {
    try {
      const response = await fetch(`/api/admin/staff/onboarding/${staffUserId}`)
      if (!response.ok) throw new Error("Failed to fetch onboarding details")
      
      const data = await response.json()
      console.log("📋 ONBOARDING DATA RECEIVED:", {
        completionPercent: data.onboarding.completionPercent,
        isComplete: data.onboarding.isComplete,
        allApproved: 
          data.onboarding.personalInfoStatus === "APPROVED" &&
          data.onboarding.govIdStatus === "APPROVED" &&
          data.onboarding.documentsStatus === "APPROVED" &&
          data.onboarding.signatureStatus === "APPROVED" &&
          data.onboarding.emergencyContactStatus === "APPROVED" &&
          data.onboarding.resumeStatus === "APPROVED" &&
          data.onboarding.educationStatus === "APPROVED" &&
          data.onboarding.medicalStatus === "APPROVED" &&
          data.onboarding.dataPrivacyStatus === "APPROVED",
        shouldShowForm: 
          data.onboarding.personalInfoStatus === "APPROVED" &&
          data.onboarding.govIdStatus === "APPROVED" &&
          data.onboarding.documentsStatus === "APPROVED" &&
          data.onboarding.signatureStatus === "APPROVED" &&
          data.onboarding.emergencyContactStatus === "APPROVED" &&
          data.onboarding.resumeStatus === "APPROVED" &&
          data.onboarding.educationStatus === "APPROVED" &&
          data.onboarding.medicalStatus === "APPROVED" &&
          data.onboarding.dataPrivacyStatus === "APPROVED" &&
          !data.onboarding.isComplete
      })
      setStaff(data.staff)
      setOnboarding(data.onboarding)
      setProfile(data.profile)
      
      // Auto-fill employment details from contract/job acceptance if available
      if (data.autoFillData) {
        console.log("🎯 AUTO-FILL DATA:", data.autoFillData)
        
        if (data.autoFillData.companyId) {
          setSelectedCompanyId(data.autoFillData.companyId)
        }
        if (data.autoFillData.position) {
          setCurrentRole(data.autoFillData.position)
        }
        if (data.autoFillData.startDate) {
          setStartDate(data.autoFillData.startDate)
        }
        if (data.autoFillData.workSchedule) {
          setShiftTime(data.autoFillData.workSchedule)
        }
        if (data.autoFillData.salary && data.autoFillData.salary > 0) {
          setSalary(data.autoFillData.salary.toString())
        }
        if (data.autoFillData.hmo !== undefined) {
          setHmo(data.autoFillData.hmo)
        }
        if (data.autoFillData.employmentStatus) {
          setEmploymentStatus(data.autoFillData.employmentStatus)
        }
      }
    } catch (err) {
      setError("Failed to load onboarding details")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get button labels based on current status
  const getButtonLabels = (section: string) => {
    const statusField = `${section}Status` as keyof OnboardingData
    const currentStatus = onboarding?.[statusField]
    
    if (currentStatus === "REJECTED") {
      return { approve: "Reapprove", reject: "Rereject" }
    }
    return { approve: "Approve", reject: "Reject" }
  }

  const handleVerify = async (section: string, action: "APPROVED" | "REJECTED") => {
    // For rejections, check if feedback is provided
    if (action === "REJECTED") {
      const currentFeedback = feedback[section] || ""
      if (!currentFeedback.trim()) {
        setError("Please provide feedback when rejecting a submission. This helps the staff understand what needs to be improved.")
        return
      }
    }

    // Set loading state for specific section and action
    const actionKey = action === "APPROVED" ? "approve" : "reject"
    setProcessingStates(prev => ({ 
      ...prev, 
      [section]: { 
        ...prev[section], 
        [actionKey]: true 
      } 
    }))
    setError("")
    setSuccess("")
    
    console.log("🔍 ADMIN VERIFY:", { 
      section, 
      action, 
      feedback: feedback[section] || "",
      staffUserId 
    })
    
    try {
      const response = await fetch(`/api/admin/staff/onboarding/${staffUserId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          action,
          feedback: feedback[section] || ""
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        console.error("❌ VERIFY FAILED:", data.error)
        throw new Error(data.error || "Failed to verify")
      }
      
      const data = await response.json()
      console.log("✅ VERIFY SUCCESS:", data)
      
      setFeedback({ ...feedback, [section]: "" })
      await fetchOnboardingDetails()
    } catch (err: any) {
      setError(err.message)
    } finally {
      // Clear loading state for specific section and action
      setProcessingStates(prev => ({ 
        ...prev, 
        [section]: { 
          ...prev[section], 
          [actionKey]: false 
        } 
      }))
    }
  }

  const saveFeedback = async (section: string) => {
    setSavingFeedback({ ...savingFeedback, [section]: true })
    try {
      const response = await fetch(`/api/admin/staff/onboarding/${staffUserId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: section,
          action: 'feedback',
          feedback: feedback[section]
        })
      })
      if (response.ok) {
        await fetchOnboardingDetails()
        setEditingFeedback({ ...editingFeedback, [section]: false })
        setFeedback({ ...feedback, [section]: "" })
      }
    } catch (error) {
      console.error('Error saving feedback:', error)
    } finally {
      setSavingFeedback({ ...savingFeedback, [section]: false })
    }
  }

  const handleCompleteOnboarding = async () => {
    // Validation
    if (!selectedCompanyId) {
      setError("Please select a company to assign this staff member to.")
      return
    }
    
    if (!currentRole) {
      setError("Please enter the staff member's role title.")
      return
    }
    
    if (!salary || parseFloat(salary) <= 0) {
      setError("Please enter a valid salary amount.")
      return
    }
    
    setConfirmCompleteModal(true)
  }

  const confirmCompleteOnboarding = async () => {
    setConfirmCompleteModal(false)
    
    // Double-check that onboarding is not already complete
    if (onboarding?.isComplete) {
      setError("This staff member's onboarding has already been completed.")
      return
    }
    
    setCompleting(true)
    setError("")
    setSuccess("")
    
    const employmentData = {
      companyId: selectedCompanyId,
      employmentStatus,
      startDate,
      shiftTime,
      currentRole,
      salary: parseFloat(salary),
      hmo
    }
    
    console.log("🚀 COMPLETING ONBOARDING:", { 
      staffUserId, 
      ...employmentData 
    })
    
    // Log validation data for debugging
    console.log("📋 VALIDATION DATA:", {
      selectedCompanyId,
      currentRole,
      salary: parseFloat(salary),
      employmentStatus,
      startDate,
      shiftTime,
      hmo,
      onboardingStatus: {
        personalInfoStatus: onboarding?.personalInfoStatus,
        govIdStatus: onboarding?.govIdStatus,
        documentsStatus: onboarding?.documentsStatus,
        signatureStatus: onboarding?.signatureStatus,
        emergencyContactStatus: onboarding?.emergencyContactStatus,
        isComplete: onboarding?.isComplete
      }
    })
    
     try {
       const response = await fetch(`/api/admin/staff/onboarding/${staffUserId}/complete`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(employmentData)
       })
       
       console.log("🔍 RESPONSE DETAILS:", {
         status: response.status,
         statusText: response.statusText,
         ok: response.ok,
         headers: Object.fromEntries(response.headers.entries())
       })
       
       if (!response.ok) {
         const data = await response.json()
         console.error("❌ COMPLETE FAILED:", {
           status: response.status,
           statusText: response.statusText,
           error: data.error,
           details: data.details,
           data: data,
           employmentData: employmentData
         })
        
        // Provide more specific error messages based on status codes
        let errorMessage = data.error || "Failed to complete onboarding"
        
        // Add details if available
        if (data.details) {
          errorMessage += `: ${data.details}`
        }
        
        if (response.status === 400) {
          errorMessage = `Bad Request: ${data.error || "Invalid data provided. Please check all fields."}`
          if (data.details) {
            errorMessage += ` - ${data.details}`
          }
        } else if (response.status === 404) {
          errorMessage = `Not Found: ${data.error || "Staff member or company not found."}`
        } else if (response.status === 409) {
          errorMessage = `Conflict: ${data.error || "Staff profile already exists or duplicate entry."}`
        } else if (response.status === 500) {
          errorMessage = `Server Error: ${data.error || "Internal server error. Please try again later."}`
          if (data.details) {
            errorMessage += ` - Details: ${data.details}`
          }
        }
        
        throw new Error(errorMessage)
      }
      
       const data = await response.json()
       console.log("✅ COMPLETE SUCCESS:", data)
       
      if (data.alreadyExists) {
        setSuccessModal({
          show: true,
          title: "Onboarding Complete!",
          message: `${data.staffName || 'Staff'} onboarding has been successfully updated`,
          details: [
            `Assigned to ${data.companyName || 'company'}`,
            "All onboarding data synced to personal records",
            "Profile updated with latest information"
          ]
        })
      } else {
         setSuccessModal({
           show: true,
           title: "Onboarding Complete!",
           message: `${data.staffName || 'Staff'} assigned to ${data.companyName || 'company'}`,
           details: [
             `Role: ${currentRole}`,
             `Salary: ₱${salary}/month`,
             "Profile & Personal Records Created",
             "Work Schedule Set Up",
             "Welcome Form Created - Staff will be redirected to complete it"
           ]
         })
       }
      
      await fetchOnboardingDetails()
    } catch (err: any) {
      console.error("❌ COMPLETE FAILED:", err.message)
      
       // Handle specific error cases
       if (err.message.includes("Staff profile already exists")) {
         setError("✅ This staff member's profile has already been created. The onboarding was completed successfully!")
         // Refresh the data to get the updated status
         await fetchOnboardingDetails()
       } else if (err.message.includes("already exists")) {
         setError("✅ This staff member's onboarding has already been completed successfully!")
         await fetchOnboardingDetails()
       } else if (err.message.includes("Bad Request")) {
         if (err.message.includes("Staff profile already exists")) {
           setError("✅ This staff member's profile has already been created. The onboarding was completed successfully!")
           await fetchOnboardingDetails()
         } else {
           setError(`Invalid data provided: ${err.message}. Please check all fields and try again.`)
         }
       } else if (err.message.includes("Not Found")) {
         setError(`Resource not found: ${err.message}. Please refresh the page and try again.`)
       } else if (err.message.includes("Conflict")) {
         setError(`Conflict detected: ${err.message}. This may indicate a duplicate entry.`)
         await fetchOnboardingDetails()
       } else if (err.message.includes("Server Error")) {
         setError(`Server error: ${err.message}. This might be due to duplicate records. Please refresh the page and try again.`)
       } else if (err.message.includes("Failed to complete onboarding")) {
         setError(`Failed to complete onboarding: ${err.message}. Please check the console for more details and try again.`)
       } else if (err.message.includes("Unique constraint failed")) {
         setError(`Duplicate record detected: ${err.message}. The onboarding may have been partially completed. Please refresh the page to see the current status.`)
         await fetchOnboardingDetails()
       } else {
         setError(err.message || "An unexpected error occurred. Please try again.")
       }
    } finally {
      setCompleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === "APPROVED") {
      return <Badge className="bg-green-600">Approved</Badge>
    } else if (status === "REJECTED") {
      return <Badge className="bg-red-600">Rejected</Badge>
    } else if (status === "SUBMITTED") {
      return <Badge className="bg-yellow-600">Pending Review</Badge>
    } else {
      return <Badge variant="outline" className="border-slate-500 text-slate-500">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!onboarding) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No onboarding data found for this staff member.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push("/admin/staff/onboarding")}
            variant="ghost"
            className="text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {staff?.name}
              </h1>
              <p className="text-slate-400">{staff?.email}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white mb-1">
                {onboarding.completionPercent}%
              </div>
              <p className="text-slate-400 text-sm">Complete</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
         {error && (
           <Alert variant="destructive" className="mb-4">
             <AlertCircle className="h-4 w-4" />
             <AlertDescription className="flex items-center justify-between">
               <span>{error}</span>
               {error.includes("Failed to complete onboarding") && !completing && (
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => {
                     setError("")
                     setConfirmCompleteModal(true)
                   }}
                   className="ml-4 border-red-600 text-red-400 hover:bg-red-900/30"
                 >
                   Retry
                 </Button>
               )}
             </AlertDescription>
           </Alert>
         )}

         {/* Onboarding Already Complete */}
         {onboarding.isComplete && profile && (
           <Card className="mb-6 bg-linear-to-br from-green-900/40 to-green-800/20 border-green-600">
             <CardHeader>
               <div className="flex items-start gap-3">
                 <div className="p-2 bg-green-500/20 rounded-lg">
                   <CheckCircle2 className="h-6 w-6 text-green-400" />
                 </div>
                 <div>
                   <CardTitle className="text-2xl font-bold text-white mb-2">
                     Onboarding Complete
                   </CardTitle>
                   <CardDescription className="text-slate-300 text-base">
                     This staff member's onboarding has been successfully completed and their profile has been created.
                   </CardDescription>
                 </div>
               </div>
             </CardHeader>
             <CardContent>
               {profile && (
                 <div className="space-y-4">
                   <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg">
                     <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                       <Briefcase className="h-5 w-5 text-purple-400" />
                       Employment Details
                     </h3>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <p className="text-xs text-slate-400 uppercase tracking-wide">Role</p>
                         <p className="text-white font-medium">{profile.currentRole}</p>
                       </div>
                       <div className="space-y-1">
                         <p className="text-xs text-slate-400 uppercase tracking-wide">Employment Status</p>
                         <p className="text-white font-medium">
                           <Badge className={profile.employmentStatus === "REGULAR" ? "bg-blue-600" : "bg-yellow-600"}>
                             {profile.employmentStatus}
                           </Badge>
                         </p>
                       </div>
                       <div className="space-y-1">
                         <p className="text-xs text-slate-400 uppercase tracking-wide">Monthly Salary</p>
                         <p className="text-white font-medium text-lg">₱{profile.salary?.toLocaleString()}</p>
                       </div>
                       <div className="space-y-1">
                         <p className="text-xs text-slate-400 uppercase tracking-wide">Start Date</p>
                         <p className="text-white font-medium">
                           {profile.startDate ? new Date(profile.startDate).toLocaleDateString('en-US', { 
                             year: 'numeric', 
                             month: 'long', 
                             day: 'numeric' 
                           }) : 'N/A'}
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </CardContent>
           </Card>
         )}

        {/* Mark as Complete Button - When profile exists but onboarding not marked complete */}
        {onboarding.personalInfoStatus === "APPROVED" &&
         onboarding.govIdStatus === "APPROVED" &&
         onboarding.documentsStatus === "APPROVED" &&
         onboarding.signatureStatus === "APPROVED" &&
         onboarding.emergencyContactStatus === "APPROVED" &&
         onboarding.resumeStatus === "APPROVED" &&
         onboarding.educationStatus === "APPROVED" &&
         onboarding.medicalStatus === "APPROVED" &&
         onboarding.dataPrivacyStatus === "APPROVED" &&
         !onboarding.isComplete &&
         profile && (
          <Card className="mb-6 bg-green-900/30 border-green-700">
            <CardHeader>
              <CardTitle className="text-white">Ready to Complete Onboarding</CardTitle>
              <CardDescription className="text-slate-300">
                All documents have been verified and employment profile already exists. Click below to mark onboarding as complete.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setConfirmCompleteModal(true)}
                disabled={completing}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {completing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Marking Complete...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Mark Onboarding as Complete
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Complete Onboarding Button - Only show when ALL documents APPROVED and no profile exists */}
        {onboarding.personalInfoStatus === "APPROVED" &&
         onboarding.govIdStatus === "APPROVED" &&
         onboarding.documentsStatus === "APPROVED" &&
         onboarding.signatureStatus === "APPROVED" &&
         onboarding.emergencyContactStatus === "APPROVED" &&
         onboarding.resumeStatus === "APPROVED" &&
         onboarding.educationStatus === "APPROVED" &&
         onboarding.medicalStatus === "APPROVED" &&
         onboarding.dataPrivacyStatus === "APPROVED" &&
         !onboarding.isComplete &&
         !profile && (
          <Card className="mb-6 bg-green-900/30 border-green-700">
            <CardHeader>
              <CardTitle className="text-white">Complete Onboarding & Setup Employment</CardTitle>
              <CardDescription className="text-slate-300">
                All documents verified. Fill in employment details to complete onboarding.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Auto-fill indicator */}
              {(selectedCompanyId || currentRole || (salary && parseFloat(salary) > 0)) && (
                <Alert className="mb-4 bg-blue-900/30 border-blue-700">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-200">
                    <strong>Auto-filled from Employment Contract:</strong> Employment details have been pre-populated from the signed contract. You can review and modify them as needed before completing.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                
                {/* Employment Contract Section */}
                <div className="space-y-2">
                  <Label className="text-white text-lg font-semibold">
                    Employment Contract
                  </Label>
                  <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-300 text-sm">
                          Contract must be signed before completing onboarding
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          Staff member needs to sign their employment contract
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          // TODO: Implement contract viewing/management
                          alert("Contract management feature coming soon!")
                        }}
                        variant="outline"
                        className="border-blue-600 text-blue-300 hover:bg-blue-900/20"
                      >
                        View Contract
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Company Assignment */}
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-white">
                      Assign to Company/Client *
                    </Label>
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger id="company" className="w-full bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select a company..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {companies.map((company) => (
                          <SelectItem 
                            key={company.id} 
                            value={company.id}
                            className="text-white hover:bg-slate-700"
                          >
                            {company.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Employment Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-white">
                      Employment Status *
                    </Label>
                    <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                      <SelectTrigger id="status" className="w-full bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="PROBATION" className="text-white hover:bg-slate-700">Probation</SelectItem>
                        <SelectItem value="REGULAR" className="text-white hover:bg-slate-700">Regular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-white">
                      Start Date *
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white scheme-dark"
                    />
                  </div>

                  {/* Shift Time */}
                  <div className="space-y-2">
                    <Label htmlFor="shiftTime" className="text-white">
                      Shift Time *
                    </Label>
                    <Input
                      id="shiftTime"
                      type="text"
                      value={shiftTime}
                      onChange={(e) => setShiftTime(e.target.value)}
                      placeholder="e.g., 9:00 AM - 6:00 PM"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Current Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-white">
                      Role Title *
                    </Label>
                    <Input
                      id="role"
                      type="text"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      placeholder="e.g., Virtual Assistant"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  {/* Salary */}
                  <div className="space-y-2">
                    <Label htmlFor="salary" className="text-white">
                      Monthly Salary (PHP) *
                    </Label>
                    <Input
                      id="salary"
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="e.g., 25000"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>

                {/* HMO Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div>
                    <Label htmlFor="hmo" className="text-white">
                      HMO Coverage
                    </Label>
                    <p className="text-xs text-slate-400">
                      Does this staff member have HMO coverage?
                    </p>
                  </div>
                  <Switch
                    id="hmo"
                    checked={hmo}
                    onCheckedChange={setHmo}
                  />
                </div>

                <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <p className="text-xs text-blue-200">
                    <strong>Auto-calculated:</strong> Days Employed (from start date), Vacation Leave (0 until after probation)
                  </p>
                </div>

                <Button
                  onClick={handleCompleteOnboarding}
                  disabled={completing || !selectedCompanyId || !currentRole || !salary}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {completing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Complete Onboarding & Create Profile"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contract Section */}
        {onboarding.contractSigned && (
          <Card className="mb-6 border-green-200 bg-green-900/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-green-300">
                  <FileText className="h-5 w-5" />
                  Employment Contract
                </CardTitle>
                <Badge variant="default" className="bg-green-600 text-white">Signed</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-green-200 mb-4">Employment contract has been signed and is ready for review.</p>
              <Button 
                onClick={() => router.push(`/admin/contracts/${staffUserId}`)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                View Contract
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Document 1: Personal Information */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Personal Information</CardTitle>
              </div>
              {getStatusBadge(onboarding.personalInfoStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-400">Full Name</p>
                <p className="text-white">
                  {onboarding.firstName} {onboarding.middleName} {onboarding.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Gender</p>
                <p className="text-white">{onboarding.gender || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Civil Status</p>
                <p className="text-white">{onboarding.civilStatus || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Date of Birth</p>
                <p className="text-white">
                  {onboarding.dateOfBirth 
                    ? new Date(onboarding.dateOfBirth).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Contact Number</p>
                <p className="text-white">{onboarding.contactNo || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-white">{onboarding.email || "N/A"}</p>
              </div>
            </div>

            {onboarding.personalInfoFeedback && (
              <Alert className="mt-6 mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <div className="flex items-center justify-between mb-3 w-full">
                    <div className="flex-1">
                      <strong>Feedback:</strong> {onboarding.personalInfoFeedback}
                    </div>
                    {!editingFeedback.personalInfo && (
                      <Button
                        onClick={() => {
                          setFeedback({ ...feedback, personalInfo: onboarding.personalInfoFeedback || "" })
                          setEditingFeedback({ ...editingFeedback, personalInfo: true })
                        }}
                        variant="outline"
                        size="sm"
                        className="border-yellow-600 text-yellow-300 hover:bg-yellow-900 whitespace-nowrap ml-auto"
                      >
                        Edit Feedback
                      </Button>
                    )}
                  </div>
                  
                  {editingFeedback.personalInfo && (
                    <div className="space-y-3 w-full">
                      <Textarea
                        placeholder="Edit feedback..."
                        value={feedback.personalInfo || ""}
                        onChange={(e) => setFeedback({ ...feedback, personalInfo: e.target.value })}
                        className="w-full placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveFeedback('personalInfo')}
                          disabled={savingFeedback.personalInfo}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          {savingFeedback.personalInfo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Feedback'
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingFeedback({ ...editingFeedback, personalInfo: false })
                            setFeedback({ ...feedback, personalInfo: "" })
                          }}
                          variant="outline"
                          size="sm"
                          className="border-yellow-600 text-yellow-300 hover:bg-yellow-900"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {onboarding.personalInfoStatus !== "APPROVED" && (
              <div className="space-y-3 mt-6">
                {!onboarding.personalInfoFeedback && (
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Feedback</label>
                    <Textarea
                      placeholder="Add feedback (optional)"
                      value={feedback.personalInfo || ""}
                      onChange={(e) => setFeedback({ ...feedback, personalInfo: e.target.value })}
                      className="placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => handleVerify("personalInfo", "APPROVED")}
                    disabled={processingStates.personalInfo.approve || processingStates.personalInfo.reject}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingStates.personalInfo.approve ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {getButtonLabels("personalInfo").approve}
                  </Button>
                  <Button
                    onClick={() => handleVerify("personalInfo", "REJECTED")}
                    disabled={processingStates.personalInfo.approve || processingStates.personalInfo.reject}
                    variant="destructive"
                  >
                    {processingStates.personalInfo.reject ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {getButtonLabels("personalInfo").reject}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document 2: Government IDs */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Government IDs</CardTitle>
              </div>
              {getStatusBadge(onboarding.govIdStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-400">SSS Number</p>
                <p className="text-white font-mono">{onboarding.sss || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">TIN</p>
                <p className="text-white font-mono">{onboarding.tin || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">PhilHealth No</p>
                <p className="text-white font-mono">{onboarding.philhealthNo || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Pag-IBIG Number</p>
                <p className="text-white font-mono">{onboarding.pagibigNo || "Not provided"}</p>
              </div>
            </div>

            {/* Government ID Documents */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Supporting Documents</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">SSS Document</p>
                  {onboarding.sssDocUrl ? (
                    <button 
                      onClick={() => {
                        setImageLoading(true)
                        setViewFileModal({ url: onboarding.sssDocUrl, title: "SSS Document" })
                      }}
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      View Document
                    </button>
                  ) : (
                    <p className="text-slate-500 text-sm">Not uploaded</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-1">BIR Form 1902 (TIN)</p>
                  {onboarding.tinDocUrl ? (
                    <button 
                      onClick={() => {
                        setImageLoading(true)
                        setViewFileModal({ url: onboarding.tinDocUrl, title: "BIR Form 1902 (TIN)" })
                      }}
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      View Document
                    </button>
                  ) : (
                    <p className="text-slate-500 text-sm">Not uploaded</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-1">PhilHealth Document</p>
                  {onboarding.philhealthDocUrl ? (
                    <button 
                      onClick={() => {
                        setImageLoading(true)
                        setViewFileModal({ url: onboarding.philhealthDocUrl, title: "PhilHealth Document" })
                      }}
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      View Document
                    </button>
                  ) : (
                    <p className="text-slate-500 text-sm">Not uploaded</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-1">Pag-IBIG Document</p>
                  {onboarding.pagibigDocUrl ? (
                    <button 
                      onClick={() => {
                        setImageLoading(true)
                        setViewFileModal({ url: onboarding.pagibigDocUrl, title: "Pag-IBIG Document" })
                      }}
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      View Document
                    </button>
                  ) : (
                    <p className="text-slate-500 text-sm">Not uploaded</p>
                  )}
                </div>
              </div>
            </div>

            {onboarding.govIdFeedback && (
              <Alert className="mt-6 mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <div className="flex items-center justify-between mb-3 w-full">
                    <div className="flex-1">
                      <strong>Feedback:</strong> {onboarding.govIdFeedback}
                    </div>
                    {!editingFeedback.govId && (
                      <Button
                        onClick={() => {
                          setFeedback({ ...feedback, govId: onboarding.govIdFeedback || "" })
                          setEditingFeedback({ ...editingFeedback, govId: true })
                        }}
                        variant="outline"
                        size="sm"
                        className="border-yellow-600 text-yellow-300 hover:bg-yellow-900 whitespace-nowrap ml-auto"
                      >
                        Edit Feedback
                      </Button>
                    )}
                  </div>
                  
                  {editingFeedback.govId && (
                    <div className="space-y-3 w-full">
                      <Textarea
                        placeholder="Edit feedback..."
                        value={feedback.govId || ""}
                        onChange={(e) => setFeedback({ ...feedback, govId: e.target.value })}
                        className="w-full placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveFeedback('govId')}
                          disabled={savingFeedback.govId}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          {savingFeedback.govId ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Feedback'
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingFeedback({ ...editingFeedback, govId: false })
                            setFeedback({ ...feedback, govId: "" })
                          }}
                          variant="outline"
                          size="sm"
                          className="border-yellow-600 text-yellow-300 hover:bg-yellow-900"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {onboarding.govIdStatus !== "APPROVED" && (
              <div className="space-y-3 mt-6">
                {!onboarding.govIdFeedback && (
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Feedback</label>
                    <Textarea
                      placeholder="Add feedback (optional)"
                      value={feedback.govId || ""}
                      onChange={(e) => setFeedback({ ...feedback, govId: e.target.value })}
                      className="placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => handleVerify("govId", "APPROVED")}
                    disabled={processingStates.govId.approve || processingStates.govId.reject}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingStates.govId.approve ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {getButtonLabels("govId").approve}
                  </Button>
                  <Button
                    onClick={() => handleVerify("govId", "REJECTED")}
                    disabled={processingStates.govId.approve || processingStates.govId.reject}
                    variant="destructive"
                  >
                    {processingStates.govId.reject ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {getButtonLabels("govId").reject}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document 3: Documents */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Required Documents</CardTitle>
              </div>
              {getStatusBadge(onboarding.documentsStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Valid ID</p>
                {onboarding.validIdUrl ? (
                  <button 
                    onClick={() => {
                      setImageLoading(true)
                      setViewFileModal({ url: onboarding.validIdUrl, title: "Valid ID" })
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    View Document
                  </button>
                ) : (
                  <p className="text-slate-500 text-sm">Not uploaded</p>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">Birth Certificate</p>
                {onboarding.birthCertUrl ? (
                  <button 
                    onClick={() => {
                      setImageLoading(true)
                      setViewFileModal({ url: onboarding.birthCertUrl, title: "Birth Certificate" })
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    View Document
                  </button>
                ) : (
                  <p className="text-slate-500 text-sm">Not uploaded</p>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">NBI Clearance</p>
                {onboarding.nbiClearanceUrl ? (
                  <button 
                    onClick={() => {
                      setImageLoading(true)
                      setViewFileModal({ url: onboarding.nbiClearanceUrl, title: "NBI Clearance" })
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    View Document
                  </button>
                ) : (
                  <p className="text-slate-500 text-sm">Not uploaded</p>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">Police Clearance</p>
                {onboarding.policeClearanceUrl ? (
                  <button 
                    onClick={() => {
                      setImageLoading(true)
                      setViewFileModal({ url: onboarding.policeClearanceUrl, title: "Police Clearance" })
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    View Document
                  </button>
                ) : (
                  <p className="text-slate-500 text-sm">Not uploaded</p>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">ID Photo (2x2)</p>
                {onboarding.idPhotoUrl ? (
                  <button 
                    onClick={() => {
                      setImageLoading(true)
                      setViewFileModal({ url: onboarding.idPhotoUrl, title: "ID Photo" })
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    View Photo
                  </button>
                ) : (
                  <p className="text-slate-500 text-sm">Not uploaded</p>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">BIR 2316</p>
                {onboarding.birForm2316Url ? (
                  <button 
                    onClick={() => {
                      setImageLoading(true)
                      setViewFileModal({ url: onboarding.birForm2316Url, title: "BIR 2316" })
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    View Document
                  </button>
                ) : (
                  <p className="text-slate-500 text-sm">Not uploaded</p>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-1">COE</p>
                {onboarding.certificateEmpUrl ? (
                  <button 
                    onClick={() => {
                      setImageLoading(true)
                      setViewFileModal({ url: onboarding.certificateEmpUrl, title: "COE" })
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    View Document
                  </button>
                ) : (
                  <p className="text-slate-500 text-sm">Not uploaded</p>
                )}
              </div>
            </div>

            {onboarding.documentsFeedback && (
              <Alert className="mt-6 mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <div className="flex items-center justify-between mb-3 w-full">
                    <div className="flex-1">
                      <strong>Feedback:</strong> {onboarding.documentsFeedback}
                    </div>
                    {!editingFeedback.documents && (
                      <Button
                        onClick={() => {
                          setFeedback({ ...feedback, documents: onboarding.documentsFeedback || "" })
                          setEditingFeedback({ ...editingFeedback, documents: true })
                        }}
                        variant="outline"
                        size="sm"
                        className="border-yellow-600 text-yellow-300 hover:bg-yellow-900 whitespace-nowrap ml-auto"
                      >
                        Edit Feedback
                      </Button>
                    )}
                  </div>
                  
                  {editingFeedback.documents && (
                    <div className="space-y-3 w-full">
                      <Textarea
                        placeholder="Edit feedback..."
                        value={feedback.documents || ""}
                        onChange={(e) => setFeedback({ ...feedback, documents: e.target.value })}
                        className="w-full placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveFeedback('documents')}
                          disabled={savingFeedback.documents}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          {savingFeedback.documents ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Feedback'
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingFeedback({ ...editingFeedback, documents: false })
                            setFeedback({ ...feedback, documents: "" })
                          }}
                          variant="outline"
                          size="sm"
                          className="border-yellow-600 text-yellow-300 hover:bg-yellow-900"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {onboarding.documentsStatus !== "APPROVED" && (
              <div className="space-y-3 mt-6">
                {!onboarding.documentsFeedback && (
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Feedback</label>
                    <Textarea
                      placeholder="Add feedback (optional)"
                      value={feedback.documents || ""}
                      onChange={(e) => setFeedback({ ...feedback, documents: e.target.value })}
                      className="placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => handleVerify("documents", "APPROVED")}
                    disabled={processingStates.documents.approve || processingStates.documents.reject}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingStates.documents.approve ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {getButtonLabels("documents").approve}
                  </Button>
                  <Button
                    onClick={() => handleVerify("documents", "REJECTED")}
                    disabled={processingStates.documents.approve || processingStates.documents.reject}
                    variant="destructive"
                  >
                    {processingStates.documents.reject ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {getButtonLabels("documents").reject}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document 4: Signature */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PenTool className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Signature</CardTitle>
              </div>
              {getStatusBadge(onboarding.signatureStatus)}
            </div>
          </CardHeader>
          <CardContent>
            {onboarding.signatureUrl ? (
              <div className="mb-4">
                <p className="text-sm text-slate-400 mb-2">Signature Preview:</p>
                <div 
                  className="border-2 border-slate-600 rounded-lg p-4 bg-white inline-block"
                >
                  <img 
                    src={onboarding.signatureUrl} 
                    alt="Staff Signature" 
                    className="max-h-32"
                  />
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm mb-4">Signature not uploaded yet</p>
            )}

            {onboarding.signatureFeedback && (
              <Alert className="mt-6 mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <div className="flex items-center justify-between mb-3 w-full">
                    <div className="flex-1">
                      <strong>Feedback:</strong> {onboarding.signatureFeedback}
                    </div>
                    {!editingFeedback.signature && (
                      <Button
                        onClick={() => {
                          setFeedback({ ...feedback, signature: onboarding.signatureFeedback || "" })
                          setEditingFeedback({ ...editingFeedback, signature: true })
                        }}
                        variant="outline"
                        size="sm"
                        className="border-yellow-600 text-yellow-300 hover:bg-yellow-900 whitespace-nowrap ml-auto"
                      >
                        Edit Feedback
                      </Button>
                    )}
                  </div>
                  
                  {editingFeedback.signature && (
                    <div className="space-y-3 w-full">
                      <Textarea
                        placeholder="Edit feedback..."
                        value={feedback.signature || ""}
                        onChange={(e) => setFeedback({ ...feedback, signature: e.target.value })}
                        className="w-full placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveFeedback('signature')}
                          disabled={savingFeedback.signature}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          {savingFeedback.signature ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Feedback'
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingFeedback({ ...editingFeedback, signature: false })
                            setFeedback({ ...feedback, signature: "" })
                          }}
                          variant="outline"
                          size="sm"
                          className="border-yellow-600 text-yellow-300 hover:bg-yellow-900"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {onboarding.signatureStatus !== "APPROVED" && (
              <div className="space-y-3 mt-6">
                {!onboarding.signatureFeedback && (
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Feedback</label>
                    <Textarea
                      placeholder="Add feedback (optional)"
                      value={feedback.signature || ""}
                      onChange={(e) => setFeedback({ ...feedback, signature: e.target.value })}
                      className="placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => handleVerify("signature", "APPROVED")}
                    disabled={processingStates.signature.approve || processingStates.signature.reject}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingStates.signature.approve ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {getButtonLabels("signature").approve}
                  </Button>
                  <Button
                    onClick={() => handleVerify("signature", "REJECTED")}
                    disabled={processingStates.signature.approve || processingStates.signature.reject}
                    variant="destructive"
                  >
                    {processingStates.signature.reject ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {getButtonLabels("signature").reject}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document 5: Emergency Contact */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white">Emergency Contact</CardTitle>
              </div>
              {getStatusBadge(onboarding.emergencyContactStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-400">Contact Name</p>
                <p className="text-white">{onboarding.emergencyContactName || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Relationship</p>
                <p className="text-white">{onboarding.emergencyRelationship || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Contact Number</p>
                <p className="text-white">{onboarding.emergencyContactNo || "Not provided"}</p>
              </div>
            </div>

            {onboarding.emergencyContactFeedback && (
              <Alert className="mt-6 mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <div className="flex items-center justify-between mb-3 w-full">
                    <div className="flex-1">
                      <strong>Feedback:</strong> {onboarding.emergencyContactFeedback}
                    </div>
                    {!editingFeedback.emergencyContact && (
                      <Button
                        onClick={() => {
                          setFeedback({ ...feedback, emergencyContact: onboarding.emergencyContactFeedback || "" })
                          setEditingFeedback({ ...editingFeedback, emergencyContact: true })
                        }}
                        variant="outline"
                        size="sm"
                        className="border-yellow-600 text-yellow-300 hover:bg-yellow-900 whitespace-nowrap ml-auto"
                      >
                        Edit Feedback
                      </Button>
                    )}
                  </div>
                  
                  {editingFeedback.emergencyContact && (
                    <div className="space-y-3 w-full">
                      <Textarea
                        placeholder="Edit feedback..."
                        value={feedback.emergencyContact || ""}
                        onChange={(e) => setFeedback({ ...feedback, emergencyContact: e.target.value })}
                        className="w-full placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveFeedback('emergencyContact')}
                          disabled={savingFeedback.emergencyContact}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          {savingFeedback.emergencyContact ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Feedback'
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingFeedback({ ...editingFeedback, emergencyContact: false })
                            setFeedback({ ...feedback, emergencyContact: "" })
                          }}
                          variant="outline"
                          size="sm"
                          className="border-yellow-600 text-yellow-300 hover:bg-yellow-900"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {onboarding.emergencyContactStatus !== "APPROVED" && (
              <div className="space-y-3 mt-6">
                {!onboarding.emergencyContactFeedback && (
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Feedback</label>
                    <Textarea
                      placeholder="Add feedback (optional)"
                      value={feedback.emergencyContact || ""}
                      onChange={(e) => setFeedback({ ...feedback, emergencyContact: e.target.value })}
                      className="placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => handleVerify("emergencyContact", "APPROVED")}
                    disabled={processingStates.emergencyContact.approve || processingStates.emergencyContact.reject}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingStates.emergencyContact.approve ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {getButtonLabels("emergencyContact").approve}
                  </Button>
                  <Button
                    onClick={() => handleVerify("emergencyContact", "REJECTED")}
                    disabled={processingStates.emergencyContact.approve || processingStates.emergencyContact.reject}
                    variant="destructive"
                  >
                    {processingStates.emergencyContact.reject ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {getButtonLabels("emergencyContact").reject}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 6: Resume Upload */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-white">Resume Upload</CardTitle>
              </div>
              {getStatusBadge(onboarding.resumeStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-2">Resume File</p>
              {onboarding.resumeUrl ? (
                <Button
                  onClick={() => setViewFileModal({ url: onboarding.resumeUrl, title: "Resume" })}
                  variant="outline"
                  className="border-blue-600 text-blue-300 hover:bg-blue-900"
                >
                  View Resume
                </Button>
              ) : (
                <p className="text-slate-500">No resume uploaded</p>
              )}
            </div>

            {onboarding.resumeFeedback && (
              <Alert className="mt-6 mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <div className="flex items-center justify-between mb-3 w-full">
                    <div className="flex-1">
                      <strong>Feedback:</strong> {onboarding.resumeFeedback}
                    </div>
                    {!editingFeedback.resume && (
                      <Button
                        onClick={() => {
                          setFeedback({ ...feedback, resume: onboarding.resumeFeedback || "" })
                          setEditingFeedback({ ...editingFeedback, resume: true })
                        }}
                        variant="outline"
                        size="sm"
                        className="border-yellow-600 text-yellow-300 hover:bg-yellow-900 whitespace-nowrap ml-auto"
                      >
                        Edit Feedback
                      </Button>
                    )}
                  </div>
                  
                  {editingFeedback.resume && (
                    <div className="space-y-3 w-full">
                      <Textarea
                        placeholder="Edit feedback..."
                        value={feedback.resume || ""}
                        onChange={(e) => setFeedback({ ...feedback, resume: e.target.value })}
                        className="w-full placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveFeedback('resume')}
                          disabled={savingFeedback.resume}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          {savingFeedback.resume ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Feedback'
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingFeedback({ ...editingFeedback, resume: false })
                            setFeedback({ ...feedback, resume: "" })
                          }}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!onboarding.resumeFeedback && onboarding.resumeStatus !== "APPROVED" && (
              <div className="mt-6">
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Feedback <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Feedback is required when rejecting submissions to help staff understand what needs to be improved.
                </p>
                <Textarea
                  placeholder="Add feedback for this section..."
                  value={feedback.resume || ""}
                  onChange={(e) => setFeedback({ ...feedback, resume: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  rows={3}
                />
              </div>
            )}

            {onboarding.resumeStatus !== "APPROVED" && (
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => handleVerify("resume", "APPROVED")}
                  disabled={processingStates.resume.approve || processingStates.resume.reject}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingStates.resume.approve ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {getButtonLabels("resume").approve}
                </Button>
                <Button
                  onClick={() => handleVerify("resume", "REJECTED")}
                  disabled={processingStates.resume.approve || processingStates.resume.reject}
                  variant="destructive"
                >
                  {processingStates.resume.reject ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {getButtonLabels("resume").reject}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 7: Education Documents */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-green-400" />
                <CardTitle className="text-white">Education Documents</CardTitle>
              </div>
              {getStatusBadge(onboarding.educationStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-2">Education Documents</p>
              {onboarding.diplomaTorUrl ? (
                <Button
                  onClick={() => setViewFileModal({ url: onboarding.diplomaTorUrl, title: "Education Documents" })}
                  variant="outline"
                  className="border-green-600 text-green-300 hover:bg-green-900"
                >
                  View Documents
                </Button>
              ) : (
                <p className="text-slate-500">No education documents uploaded</p>
              )}
            </div>

            {onboarding.educationFeedback && (
              <Alert className="mt-6 mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <div className="flex items-center justify-between mb-3 w-full">
                    <div className="flex-1">
                      <strong>Feedback:</strong> {onboarding.educationFeedback}
                    </div>
                    {!editingFeedback.education && (
                      <Button
                        onClick={() => {
                          setFeedback({ ...feedback, education: onboarding.educationFeedback || "" })
                          setEditingFeedback({ ...editingFeedback, education: true })
                        }}
                        variant="outline"
                        size="sm"
                        className="border-yellow-600 text-yellow-300 hover:bg-yellow-900 whitespace-nowrap ml-auto"
                      >
                        Edit Feedback
                      </Button>
                    )}
                  </div>
                  
                  {editingFeedback.education && (
                    <div className="space-y-3 w-full">
                      <Textarea
                        placeholder="Edit feedback..."
                        value={feedback.education || ""}
                        onChange={(e) => setFeedback({ ...feedback, education: e.target.value })}
                        className="w-full placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveFeedback('education')}
                          disabled={savingFeedback.education}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          {savingFeedback.education ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Feedback'
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingFeedback({ ...editingFeedback, education: false })
                            setFeedback({ ...feedback, education: "" })
                          }}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!onboarding.educationFeedback && onboarding.educationStatus !== "APPROVED" && (
              <div className="mt-6">
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Feedback <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Feedback is required when rejecting submissions to help staff understand what needs to be improved.
                </p>
                <Textarea
                  placeholder="Add feedback for this section..."
                  value={feedback.education || ""}
                  onChange={(e) => setFeedback({ ...feedback, education: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  rows={3}
                />
              </div>
            )}

            {onboarding.educationStatus !== "APPROVED" && (
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => handleVerify("education", "APPROVED")}
                  disabled={processingStates.education.approve || processingStates.education.reject}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingStates.education.approve ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {getButtonLabels("education").approve}
                </Button>
                <Button
                  onClick={() => handleVerify("education", "REJECTED")}
                  disabled={processingStates.education.approve || processingStates.education.reject}
                  variant="destructive"
                >
                  {processingStates.education.reject ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {getButtonLabels("education").reject}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 8: Medical Certificate */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-red-400" />
                <CardTitle className="text-white">Medical Certificate</CardTitle>
              </div>
              {getStatusBadge(onboarding.medicalStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-2">Medical Certificate</p>
              {onboarding.medicalCertUrl ? (
                <Button
                  onClick={() => setViewFileModal({ url: onboarding.medicalCertUrl, title: "Medical Certificate" })}
                  variant="outline"
                  className="border-red-600 text-red-300 hover:bg-red-900"
                >
                  View Certificate
                </Button>
              ) : (
                <p className="text-slate-500">No medical certificate uploaded</p>
              )}
            </div>

            {onboarding.medicalFeedback && (
              <Alert className="mt-6 mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <div className="flex items-center justify-between mb-3 w-full">
                    <div className="flex-1">
                      <strong>Feedback:</strong> {onboarding.medicalFeedback}
                    </div>
                    {!editingFeedback.medical && (
                      <Button
                        onClick={() => {
                          setFeedback({ ...feedback, medical: onboarding.medicalFeedback || "" })
                          setEditingFeedback({ ...editingFeedback, medical: true })
                        }}
                        variant="outline"
                        size="sm"
                        className="border-yellow-600 text-yellow-300 hover:bg-yellow-900 whitespace-nowrap ml-auto"
                      >
                        Edit Feedback
                      </Button>
                    )}
                  </div>
                  
                  {editingFeedback.medical && (
                    <div className="space-y-3 w-full">
                      <Textarea
                        placeholder="Edit feedback..."
                        value={feedback.medical || ""}
                        onChange={(e) => setFeedback({ ...feedback, medical: e.target.value })}
                        className="w-full placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveFeedback('medical')}
                          disabled={savingFeedback.medical}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          {savingFeedback.medical ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Feedback'
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingFeedback({ ...editingFeedback, medical: false })
                            setFeedback({ ...feedback, medical: "" })
                          }}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!onboarding.medicalFeedback && onboarding.medicalStatus !== "APPROVED" && (
              <div className="mt-6">
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Feedback <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Feedback is required when rejecting submissions to help staff understand what needs to be improved.
                </p>
                <Textarea
                  placeholder="Add feedback for this section..."
                  value={feedback.medical || ""}
                  onChange={(e) => setFeedback({ ...feedback, medical: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  rows={3}
                />
              </div>
            )}

            {onboarding.medicalStatus !== "APPROVED" && (
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => handleVerify("medical", "APPROVED")}
                  disabled={processingStates.medical.approve || processingStates.medical.reject}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingStates.medical.approve ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {getButtonLabels("medical").approve}
                </Button>
                <Button
                  onClick={() => handleVerify("medical", "REJECTED")}
                  disabled={processingStates.medical.approve || processingStates.medical.reject}
                  variant="destructive"
                >
                  {processingStates.medical.reject ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {getButtonLabels("medical").reject}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 9: Data Privacy & Consent */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-indigo-400" />
                <CardTitle className="text-white">Data Privacy & Bank Details</CardTitle>
              </div>
              {getStatusBadge(onboarding.dataPrivacyStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-2">Data Privacy Consent</p>
              {onboarding.dataPrivacyConsentUrl ? (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-green-300 font-medium">Consent Given</p>
                      <p className="text-slate-400 text-sm">
                        Staff has agreed to data privacy terms and conditions
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <XCircle className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-red-300 font-medium">No Consent Given</p>
                      <p className="text-slate-400 text-sm">
                        Staff has not agreed to data privacy terms
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bank Account Details Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Bank Account Information
              </h4>
              {onboarding.bankAccountDetails ? (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  {(() => {
                    try {
                      const bankDetails = JSON.parse(onboarding.bankAccountDetails)
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-slate-400 text-sm">Bank Name:</span>
                            <p className="text-white font-medium">{bankDetails.bankName}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-sm">Account Holder:</span>
                            <p className="text-white font-medium">{bankDetails.accountName}</p>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-slate-400 text-sm">Account Number:</span>
                            <p className="text-white font-medium">{bankDetails.accountNumber}</p>
                          </div>
                          {bankDetails.consentedAt && (
                            <div className="md:col-span-2">
                              <span className="text-slate-400 text-sm">Consent Date:</span>
                              <p className="text-white font-medium">
                                {new Date(bankDetails.consentedAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    } catch (error) {
                      return <p className="text-slate-500">Invalid bank account data</p>
                    }
                  })()}
                </div>
              ) : (
                <p className="text-slate-500">No bank account details provided</p>
              )}
            </div>

            {onboarding.dataPrivacyFeedback && (
              <Alert className="mt-6 mb-4 bg-yellow-900/50 border-yellow-700">
                <AlertDescription className="text-yellow-200">
                  <div className="flex items-center justify-between mb-3 w-full">
                    <div className="flex-1">
                      <strong>Feedback:</strong> {onboarding.dataPrivacyFeedback}
                    </div>
                    {!editingFeedback.dataPrivacy && (
                      <Button
                        onClick={() => {
                          setFeedback({ ...feedback, dataPrivacy: onboarding.dataPrivacyFeedback || "" })
                          setEditingFeedback({ ...editingFeedback, dataPrivacy: true })
                        }}
                        variant="outline"
                        size="sm"
                        className="border-yellow-600 text-yellow-300 hover:bg-yellow-900 whitespace-nowrap ml-auto"
                      >
                        Edit Feedback
                      </Button>
                    )}
                  </div>
                  
                  {editingFeedback.dataPrivacy && (
                    <div className="space-y-3 w-full">
                      <Textarea
                        placeholder="Edit feedback..."
                        value={feedback.dataPrivacy || ""}
                        onChange={(e) => setFeedback({ ...feedback, dataPrivacy: e.target.value })}
                        className="w-full placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-slate-700 border-slate-600 text-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveFeedback('dataPrivacy')}
                          disabled={savingFeedback.dataPrivacy}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          {savingFeedback.dataPrivacy ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Feedback'
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingFeedback({ ...editingFeedback, dataPrivacy: false })
                            setFeedback({ ...feedback, dataPrivacy: "" })
                          }}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!onboarding.dataPrivacyFeedback && onboarding.dataPrivacyStatus !== "APPROVED" && (
              <div className="mt-6">
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Feedback <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Feedback is required when rejecting submissions to help staff understand what needs to be improved.
                </p>
                <Textarea
                  placeholder="Add feedback for this section..."
                  value={feedback.dataPrivacy || ""}
                  onChange={(e) => setFeedback({ ...feedback, dataPrivacy: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  rows={3}
                />
              </div>
            )}

            {onboarding.dataPrivacyStatus !== "APPROVED" && (
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => handleVerify("dataPolicy", "APPROVED")}
                  disabled={processingStates.dataPolicy.approve || processingStates.dataPolicy.reject}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingStates.dataPolicy.approve ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {getButtonLabels("dataPolicy").approve}
                </Button>
                <Button
                  onClick={() => handleVerify("dataPolicy", "REJECTED")}
                  disabled={processingStates.dataPolicy.approve || processingStates.dataPolicy.reject}
                  variant="destructive"
                >
                  {processingStates.dataPolicy.reject ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {getButtonLabels("dataPolicy").reject}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* File View Modal */}
      <Dialog open={!!viewFileModal} onOpenChange={() => {
        setViewFileModal(null)
        setImageLoading(true)
      }}>
        <DialogContent className={`${viewFileModal?.url?.endsWith('.pdf') ? 'w-screen h-screen max-w-none max-h-none rounded-none' : 'max-w-5xl'} bg-slate-800 border-slate-700 p-0`} style={viewFileModal?.url?.endsWith('.pdf') ? { width: '100vw', height: '100vh', maxWidth: 'none', maxHeight: 'none', borderRadius: '0' } : {}}>
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-white">{viewFileModal?.title}</DialogTitle>
            </DialogHeader>
          </div>
          <div className={`${viewFileModal?.url?.endsWith('.pdf') ? 'h-[calc(100vh-120px)]' : 'h-[60vh]'} relative px-6 pb-6 flex items-center justify-center`}>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                  <span className="text-slate-300 text-sm">Loading file...</span>
                </div>
              </div>
            )}
            {viewFileModal?.url && (
              viewFileModal.url.endsWith('.pdf') ? (
                <iframe
                  src={`${viewFileModal.url}?t=${Date.now()}#toolbar=0&scrollbar=0`}
                  className="w-full h-full"
                  title={viewFileModal.title}
                  onLoad={() => setImageLoading(false)}
                />
              ) : (
                <img
                  src={`${viewFileModal.url}?t=${Date.now()}`}
                  alt={viewFileModal.title}
                  className="max-w-full max-h-full object-contain"
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={confirmCompleteModal} onOpenChange={setConfirmCompleteModal}>
        <DialogContent className="max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Complete Onboarding</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-300 mb-4">
              Are you sure you want to complete this staff member's onboarding and assign them to the selected company?
            </p>
            <div className="bg-slate-700 p-3 rounded-lg mb-4">
              <p className="text-sm text-slate-400 mb-1">This will:</p>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Create their profile and personal records</li>
                <li>• Set up their work schedule</li>
                <li>• Assign them to {companies.find(c => c.id === selectedCompanyId)?.companyName || 'selected company'}</li>
                <li>• Set their role as {currentRole}</li>
                <li>• Set their salary to ₱{salary}/month</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmCompleteModal(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmCompleteOnboarding}
                disabled={completing}
                className="bg-green-600 hover:bg-green-700"
              >
                {completing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Complete Onboarding"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={successModal.show} onOpenChange={(open) => setSuccessModal(prev => ({ ...prev, show: open }))}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-green-900/95 to-green-800/95 border-green-600 backdrop-blur-sm">
          <DialogHeader className="pb-2">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white mb-2">
                  {successModal.title}
                </DialogTitle>
                <p className="text-slate-300 text-base">
                  {successModal.message}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Details</h3>
              <ul className="space-y-2">
                {successModal.details.map((detail, index) => (
                  <li key={index} className="flex items-center gap-2 text-slate-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={() => router.push("/admin/staff/onboarding")}
                className="bg-green-600 hover:bg-green-700 px-8"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

