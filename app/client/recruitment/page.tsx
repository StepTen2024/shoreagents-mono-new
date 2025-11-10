"use client"

/**
 * COMBINED RECRUITMENT PAGE - Talent Pool + Job Requests
 * 
 * Tab 1: 🔍 Talent Pool - Browse & Search 26 candidates
 * Tab 2: 📋 Job Requests - Create & Manage job postings
 */

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  Briefcase, 
  Plus, 
  DollarSign, 
  MapPin, 
  Clock, 
  Users,
  Calendar,
  Building2,
  Target,
  CheckCircle2,
  X,
  Loader2,
  FileText,
  UserCheck,
  Star,
  Search,
  Filter,
  Zap,
  Award,
  TrendingUp,
  UserSearch,
  AlertCircle,
  Video,
  CalendarCheck,
  XCircle,
  MessageSquare,
  CalendarClock,
  User,
  Mail,
  RotateCcw
} from "lucide-react"

// Types
interface JobRequest {
  id: number
  job_title: string
  work_type: string
  work_arrangement: string
  experience_level: string
  status: string
  created_at: string
  applicants: number
  views: number
}

interface Candidate {
  id: string
  firstName: string
  avatar: string | null
  position: string
  location: string
  bio: string | null
  skills: string[]
  experienceYears: number
  culturalFitScore: number | null
  discType: string | null
  typingWpm: number | null
  leaderboardScore: number | null
}

interface PreferredTime {
  datetime: string
  timezone: string
  timezoneDisplay: string
}

interface InterviewRequest {
  id: string
  candidateFirstName: string
  bpocCandidateId: string
  preferredTimes: (string | PreferredTime)[]
  clientNotes: string | null
  clientTimezone?: string | null
  status: 'PENDING' | 'SCHEDULED' | 'RESCHEDULE_REQUESTED' | 'COMPLETED' | 'CANCELLED' | 'HIRED' | 'HIRE-REQUESTED' | 'HIRE_REQUESTED' | 'OFFER-SENT' | 'OFFER_SENT' | 'OFFER-ACCEPTED' | 'OFFER_ACCEPTED' | 'OFFER-DECLINED' | 'OFFER_DECLINED' | 'REJECTED'
  createdAt: string
  updatedAt: string
  scheduledTime: string | null
  adminNotes: string | null
  meetingLink: string | null
  clientPreferredStart?: string | null
  candidateAvatar?: string
  workSchedule?: {
    workDays: string[]
    workStartTime: string | null
    isMonToFri: boolean
    hasCustomHours?: boolean
    customHours?: Record<string, string>
  } | null
}

type TabType = 'talent-pool' | 'job-requests' | 'interviews'

// Helper function to convert 24-hour time to 12-hour format with AM/PM
const convertTo12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`
}

export default function RecruitmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  // Initialize activeTab from URL or default to 'talent-pool'
  const tabFromUrl = searchParams.get('tab') as TabType | null
  const initialTab = (tabFromUrl && ['talent-pool', 'job-requests', 'interviews'].includes(tabFromUrl)) 
    ? tabFromUrl 
    : 'talent-pool'
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  
  // Function to change tab and update URL
  const changeTab = (tab: TabType) => {
    setActiveTab(tab)
    router.push(`/client/recruitment?tab=${tab}`, { scroll: false })
  }
  
  // Job Requests State
  const [showForm, setShowForm] = useState(false)
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Talent Pool State
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidatesLoading, setCandidatesLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Interviews State
  const [interviews, setInterviews] = useState<InterviewRequest[]>([])
  const [interviewsLoading, setInterviewsLoading] = useState(true)
  const [hireRequestingId, setHireRequestingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  
  // Hire/Reject Modals
  const [hireModalOpen, setHireModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<InterviewRequest | null>(null)
  const [hireData, setHireData] = useState({ 
    preferredStartDate: '', 
    hireNotes: '',
    isMonToFri: true,
    workStartTime: '09:00',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    hasCustomHours: false,
    customHours: {} as Record<string, string>
  })
  const [rejectData, setRejectData] = useState({ rejectReason: '' })
  
  // Interview Management Modals
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [undoCancelModalOpen, setUndoCancelModalOpen] = useState(false)
  const [undoRejectModalOpen, setUndoRejectModalOpen] = useState(false)
  
  // Form states for interview management
  const [cancelReason, setCancelReason] = useState('')
  const [rescheduleNotes, setRescheduleNotes] = useState('')
  const [reschedulePreferredTimes, setReschedulePreferredTimes] = useState<string[]>(['', ''])
  const [clientTimezone, setClientTimezone] = useState<string>('Australia/Brisbane')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [undoCancelNotes, setUndoCancelNotes] = useState('')
  const [undoRejectNotes, setUndoRejectNotes] = useState('')
  const [interviewSubmitting, setInterviewSubmitting] = useState(false)
  
  // Filters
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [minExperience, setMinExperience] = useState(0)
  const [selectedDiscTypes, setSelectedDiscTypes] = useState<string[]>([])
  const [minCulturalFit, setMinCulturalFit] = useState(0)
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    job_title: "",
    job_description: "",
    work_type: "full-time",
    work_arrangement: "remote",
    experience_level: "mid-level",
    salary_min: "",
    salary_max: "",
    currency: "PHP",
    salary_type: "monthly",
    department: "",
    industry: "",
    shift: "day",
    priority: "medium",
    application_deadline: "",
    requirements: [""],
    responsibilities: [""],
    benefits: [""],
    skills: [""]
  })

  // Fetch job requests
  useEffect(() => {
    if (activeTab === 'job-requests') {
    fetchJobRequests()
    }
  }, [activeTab])

  // Fetch candidates
  useEffect(() => {
    if (activeTab === 'talent-pool') {
      fetchCandidates()
    }
  }, [activeTab, searchQuery, selectedSkills, location, minExperience, selectedDiscTypes, minCulturalFit])

  // Fetch interviews
  useEffect(() => {
    if (activeTab === 'interviews') {
      fetchInterviews()
    }
  }, [activeTab])

  // Fetch client timezone on mount
  useEffect(() => {
    async function fetchClientTimezone() {
      try {
        const response = await fetch('/api/client/profile')
        const data = await response.json()
        if (data.profile?.timezone) {
          setClientTimezone(data.profile.timezone)
        }
      } catch (error) {
        console.error('Failed to fetch client timezone:', error)
      }
    }
    fetchClientTimezone()
  }, [])

  async function fetchJobRequests() {
    try {
      setJobsLoading(true)
      const response = await fetch("/api/client/job-requests")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setJobRequests(data)
    } catch (error) {
      console.error("Error fetching job requests:", error)
    } finally {
      setJobsLoading(false)
    }
  }

  async function fetchCandidates() {
    try {
      setCandidatesLoading(true)
      
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedSkills.length > 0) params.append('skills', selectedSkills.join(','))
      if (location) params.append('location', location)
      if (minExperience > 0) params.append('minExperience', minExperience.toString())
      if (selectedDiscTypes.length > 0) params.append('discType', selectedDiscTypes[0])
      if (minCulturalFit > 0) params.append('culturalFitMin', minCulturalFit.toString())

      const response = await fetch(`/api/client/candidates?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setCandidates(data.candidates)
        
        const allSkills = new Set<string>()
        data.candidates.forEach((c: Candidate) => {
          c.skills?.forEach((skill: string) => allSkills.add(skill))
        })
        setAvailableSkills(Array.from(allSkills).sort())
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error)
    } finally {
      setCandidatesLoading(false)
    }
  }

  async function fetchInterviews() {
    try {
      setInterviewsLoading(true)
      const response = await fetch("/api/client/interviews")
      if (!response.ok) throw new Error("Failed to fetch interviews")
      const data = await response.json()
      if (data.success) {
        setInterviews(data.interviews || [])
        console.log(`✅ [CLIENT] Loaded ${data.interviews?.length || 0} interviews`)
      }
    } catch (error) {
      console.error('❌ Failed to fetch interviews:', error)
    } finally {
      setInterviewsLoading(false)
    }
  }

  async function handleHireRequest() {
    if (!selectedInterview) return
    
    try {
      setHireRequestingId(selectedInterview.id)
      
      // Format hire notes with timestamp
      const timestamp = new Date().toLocaleString('en-US')
      const noteText = hireData.hireNotes || "Client would like to hire this candidate"
      const formattedNotes = `(Hire Requested) ${timestamp} - ${noteText}`
      
      // Clean up customHours to only include selected workDays
      const cleanedCustomHours: Record<string, string> = {}
      if (hireData.hasCustomHours) {
        hireData.workDays.forEach((day: string) => {
          if (hireData.customHours[day]) {
            cleanedCustomHours[day] = hireData.customHours[day]
          }
        })
      }
      
      const response = await fetch("/api/client/interviews/hire-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewRequestId: selectedInterview.id,
          preferredStartDate: hireData.preferredStartDate,
          notes: formattedNotes,
          workSchedule: {
            workDays: hireData.workDays,
            workStartTime: hireData.hasCustomHours ? null : hireData.workStartTime,
            isMonToFri: hireData.isMonToFri,
            hasCustomHours: hireData.hasCustomHours,
            customHours: cleanedCustomHours
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Hire Request Submitted Successfully",
          description: "Our admin team has been notified and will proceed with the following steps:\n\n1. Send a formal job offer to the candidate\n2. Schedule a confirmation call to discuss role details\n3. Verify the candidate's interest and availability\n\nYou'll be notified once the candidate confirms their acceptance. Thank you for your patience!",
          duration: 8000,
        })
        setHireModalOpen(false)
        setHireData({ 
          preferredStartDate: '', 
          hireNotes: '',
          isMonToFri: true,
          workStartTime: '09:00',
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          hasCustomHours: false,
          customHours: {}
        })
        setSelectedInterview(null)
        // Refresh interviews to show updated status
        await fetchInterviews()
      } else {
        throw new Error(data.error || "Failed to send hire request")
      }
    } catch (error) {
      console.error('❌ Error sending hire request:', error)
      toast({
        title: "Error",
        description: `Failed to send hire request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    } finally {
      setHireRequestingId(null)
    }
  }

  async function handleRejectRequest() {
    if (!selectedInterview) return
    
    try {
      setRejectingId(selectedInterview.id)
      
      // Format rejection reason with timestamp
      const timestamp = new Date().toLocaleString('en-US')
      const reason = rejectData.rejectReason.trim()
      const formattedReason = reason 
        ? `(Rejected) ${timestamp} - ${reason}`
        : `(Rejected) ${timestamp} - Candidate not selected`
      
      const response = await fetch("/api/client/interviews/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewRequestId: selectedInterview.id,
          rejectReason: formattedReason
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Candidate Rejected Successfully",
          description: "The admin team has been notified of your decision. Thank you for your feedback.",
          duration: 5000,
        })
        setRejectModalOpen(false)
        setRejectData({ rejectReason: '' })
        setSelectedInterview(null)
        // Refresh interviews to show updated status
        await fetchInterviews()
      } else {
        throw new Error(data.error || "Failed to send rejection")
      }
    } catch (error) {
      console.error('❌ Error sending rejection:', error)
      toast({
        title: "Error",
        description: `Failed to send rejection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      })
    } finally {
      setRejectingId(null)
    }
  }

  function clearFilters() {
    setSearchQuery('')
    setSelectedSkills([])
    setLocation('')
    setMinExperience(0)
    setSelectedDiscTypes([])
    setMinCulturalFit(0)
  }

  function toggleSkill(skill: string) {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  function toggleDiscType(type: string) {
    setSelectedDiscTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const addArrayItem = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev] as string[], ""]
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }))
  }

  const updateArrayItem = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).map((item, i) => i === index ? value : item)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const cleanedData = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim()),
        responsibilities: formData.responsibilities.filter(r => r.trim()),
        benefits: formData.benefits.filter(b => b.trim()),
        skills: formData.skills.filter(s => s.trim()),
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        application_deadline: formData.application_deadline || null
      }

      const response = await fetch("/api/client/job-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData)
      })

      if (!response.ok) throw new Error("Failed to create job request")

      await fetchJobRequests()
      setShowForm(false)
      
      // Reset form
      setFormData({
        job_title: "",
        job_description: "",
        work_type: "full-time",
        work_arrangement: "remote",
        experience_level: "mid-level",
        salary_min: "",
        salary_max: "",
        currency: "PHP",
        salary_type: "monthly",
        department: "",
        industry: "",
        shift: "day",
        priority: "medium",
        application_deadline: "",
        requirements: [""],
        responsibilities: [""],
        benefits: [""],
        skills: [""]
      })
    } catch (error) {
      console.error("Error submitting job request:", error)
      alert("Failed to create job request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Recruitment
          </h1>
          <p className="text-slate-600">
            {activeTab === 'talent-pool' 
              ? 'Discover top Filipino professionals ready to join your team'
              : activeTab === 'job-requests'
              ? 'Create and manage job requests for your team'
              : 'Schedule and manage candidate interviews'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'talent-pool' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/50">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">
                {candidates.length} Candidates Available
              </span>
            </div>
          )}
          {activeTab === 'interviews' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200/50">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">
                {interviews.filter((i: InterviewRequest) => i.status === 'SCHEDULED').length} Scheduled Interview{interviews.filter((i: InterviewRequest) => i.status === 'SCHEDULED').length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {activeTab === 'job-requests' && !showForm && (
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Job Request
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            changeTab('talent-pool')
            setShowForm(false)
          }}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all rounded-lg ${
            activeTab === 'talent-pool'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              : 'text-slate-600 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:text-purple-700'
          }`}
        >
          <UserSearch className="w-5 h-5" />
          Talent Pool
          <Badge className={activeTab === 'talent-pool' ? 'bg-white/30 text-white border border-white/50' : 'bg-blue-100 text-blue-700 border border-blue-200'}>{candidates.length}</Badge>
        </button>
        <button
          onClick={() => {
            changeTab('job-requests')
          }}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all rounded-lg ${
            activeTab === 'job-requests'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              : 'text-slate-600 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:text-purple-700'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          Job Requests
          {jobRequests.length > 0 && (
            <Badge className={activeTab === 'job-requests' ? 'bg-white/30 text-white border border-white/50' : 'bg-blue-100 text-blue-700 border border-blue-200'}>{jobRequests.length}</Badge>
          )}
        </button>
        <button
          onClick={() => {
            changeTab('interviews')
          }}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all rounded-lg ${
            activeTab === 'interviews'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              : 'text-slate-600 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:text-purple-700'
          }`}
        >
          <Calendar className="w-5 h-5" />
          Interviews
          {interviews.length > 0 && (
            <Badge className={activeTab === 'interviews' ? 'bg-white/30 text-white border border-white/50' : 'bg-blue-100 text-blue-700 border border-blue-200'}>{interviews.length}</Badge>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <main className="w-full">
        {activeTab === 'talent-pool' && (
          <TalentPoolTab 
            candidates={candidates}
            loading={candidatesLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            selectedSkills={selectedSkills}
            toggleSkill={toggleSkill}
            location={location}
            setLocation={setLocation}
            minExperience={minExperience}
            setMinExperience={setMinExperience}
            selectedDiscTypes={selectedDiscTypes}
            toggleDiscType={toggleDiscType}
            minCulturalFit={minCulturalFit}
            setMinCulturalFit={setMinCulturalFit}
            availableSkills={availableSkills}
            clearFilters={clearFilters}
            router={router}
          />
        )}

        {activeTab === 'job-requests' && (
          <JobRequestsTab
            showForm={showForm}
            setShowForm={setShowForm}
            jobRequests={jobRequests}
            loading={jobsLoading}
            submitting={submitting}
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
            updateArrayItem={updateArrayItem}
          />
        )}

        {activeTab === 'interviews' && (
          <InterviewsTab
            interviews={interviews}
            loading={interviewsLoading}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            hireRequestingId={hireRequestingId}
            rejectingId={rejectingId}
            hireModalOpen={hireModalOpen}
            setHireModalOpen={setHireModalOpen}
            rejectModalOpen={rejectModalOpen}
            setRejectModalOpen={setRejectModalOpen}
            setSelectedInterview={setSelectedInterview}
            selectedInterview={selectedInterview}
            hireData={hireData}
            setHireData={setHireData}
            rejectData={rejectData}
            setRejectData={setRejectData}
            handleHireRequest={handleHireRequest}
            handleRejectRequest={handleRejectRequest}
            cancelModalOpen={cancelModalOpen}
            setCancelModalOpen={setCancelModalOpen}
            rescheduleModalOpen={rescheduleModalOpen}
            setRescheduleModalOpen={setRescheduleModalOpen}
            notesModalOpen={notesModalOpen}
            setNotesModalOpen={setNotesModalOpen}
            undoCancelModalOpen={undoCancelModalOpen}
            setUndoCancelModalOpen={setUndoCancelModalOpen}
            undoRejectModalOpen={undoRejectModalOpen}
            setUndoRejectModalOpen={setUndoRejectModalOpen}
            cancelReason={cancelReason}
            setCancelReason={setCancelReason}
            rescheduleNotes={rescheduleNotes}
            setRescheduleNotes={setRescheduleNotes}
            reschedulePreferredTimes={reschedulePreferredTimes}
            setReschedulePreferredTimes={setReschedulePreferredTimes}
            clientTimezone={clientTimezone}
            additionalNotes={additionalNotes}
            setAdditionalNotes={setAdditionalNotes}
            undoCancelNotes={undoCancelNotes}
            setUndoCancelNotes={setUndoCancelNotes}
            undoRejectNotes={undoRejectNotes}
            setUndoRejectNotes={setUndoRejectNotes}
            interviewSubmitting={interviewSubmitting}
            setInterviewSubmitting={setInterviewSubmitting}
            fetchInterviews={fetchInterviews}
            toast={toast}
          />
        )}
      </main>
    </div>
  )
}

// ============================================================================
// TAB 1: TALENT POOL
// ============================================================================

function TalentPoolTab({ 
  candidates, 
  loading,
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  selectedSkills,
  toggleSkill,
  location,
  setLocation,
  minExperience,
  setMinExperience,
  selectedDiscTypes,
  toggleDiscType,
  minCulturalFit,
  setMinCulturalFit,
  availableSkills,
  clearFilters,
  router
}: any) {
  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by skills, role, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
            showFilters
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filters
          {(selectedSkills.length > 0 || minExperience > 0 || minCulturalFit > 0) && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {selectedSkills.length + (minExperience > 0 ? 1 : 0) + (minCulturalFit > 0 ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="p-6 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 text-lg">Advanced Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Skills Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Skills
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50">
                {availableSkills.slice(0, 20).map((skill: string) => (
                  <label key={skill} className="flex items-center gap-2 py-2 hover:bg-white px-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-800">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Experience Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Min. Experience: {minExperience} years
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={minExperience}
                onChange={(e) => setMinExperience(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Cultural Fit Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Min. Cultural Fit: {minCulturalFit}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={minCulturalFit}
                onChange={(e) => setMinCulturalFit(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* DISC Type Filter */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Personality Type (DISC)
            </label>
            <div className="flex gap-2">
              {['D', 'I', 'S', 'C'].map(type => (
                <button
                  key={type}
                  onClick={() => toggleDiscType(type)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    selectedDiscTypes.includes(type)
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Candidates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden animate-pulse">
              {/* Gradient Header */}
              <div className="h-32 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-300" />
              
              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Avatar and Name */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-32 bg-gray-200 rounded" />
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
                
                {/* Bio */}
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded" />
                  <div className="h-3 w-5/6 bg-gray-200 rounded" />
                </div>
                
                {/* Skills */}
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                  <div className="h-6 w-24 bg-gray-200 rounded-full" />
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border border-gray-200 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-blue-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl" />
          
          <div className="relative py-16 px-8 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 mb-6">
              <UserSearch className="h-12 w-12 text-indigo-600" />
            </div>
            
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent mb-3">
              No Candidates Found
            </h3>
            
            <p className="text-slate-600 text-base max-w-md mx-auto mb-6 leading-relaxed">
              We couldn't find any candidates matching your search criteria. Try adjusting your filters or clearing them to see all available talent.
            </p>
            
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all"
            >
              <X className="h-4 w-4" />
              Clear All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate: Candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onClick={() => router.push(`/client/talent-pool/${candidate.id}?returnTo=recruitment&tab=talent-pool`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Candidate Card Component (same as before, keeping it compact)
function CandidateCard({ candidate, onClick }: { candidate: Candidate; onClick: () => void }) {
  const getGradient = () => {
    if (!candidate.culturalFitScore) return 'from-blue-500 via-indigo-500 to-purple-600'
    if (candidate.culturalFitScore >= 80) return 'from-emerald-500 via-teal-500 to-cyan-600'
    if (candidate.culturalFitScore >= 70) return 'from-blue-500 via-indigo-500 to-purple-600'
    return 'from-indigo-500 via-purple-500 to-pink-600'
  }

  return (
    <div
      onClick={onClick}
      className="relative bg-white rounded-2xl shadow-sm transition-all duration-500 cursor-pointer border border-gray-100 hover:border-transparent hover:-translate-y-2 overflow-hidden group flex flex-col"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-sm -z-10"></div>
      
      <div className={`relative bg-gradient-to-br ${getGradient()} p-6 text-white overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {candidate.avatar ? (
                <img
                  src={candidate.avatar}
                  alt={candidate.firstName}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-2xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-2xl bg-white/20 flex items-center justify-center text-3xl font-bold">
                  {candidate.firstName[0]}
                </div>
              )}
              <div>
                <h3 className="font-bold text-2xl tracking-tight mb-1 drop-shadow-sm">
                  {candidate.firstName}
                </h3>
                <p className="text-sm text-white/90 font-medium">{candidate.position}</p>
              </div>
            </div>
            
            {candidate.leaderboardScore && candidate.leaderboardScore > 50 && (
              <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-bold">{candidate.leaderboardScore}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        {candidate.bio && (
          <p className="text-sm text-gray-800 group-hover:text-white leading-relaxed line-clamp-2 mb-5 transition-colors duration-300">
            {candidate.bio}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-5">
          {candidate.culturalFitScore && candidate.culturalFitScore >= 60 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 group-hover:bg-white/20 group-hover:backdrop-blur-sm group-hover:text-white rounded-lg text-xs font-semibold border border-emerald-200 group-hover:border-white/30 transition-all duration-300">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{candidate.culturalFitScore}% Match</span>
            </div>
          )}
          {candidate.discType && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 group-hover:bg-white/20 group-hover:backdrop-blur-sm group-hover:text-white rounded-lg text-xs font-semibold border border-blue-200 group-hover:border-white/30 transition-all duration-300">
              <Zap className="w-3.5 h-3.5" />
              <span>DISC: {candidate.discType}</span>
            </div>
          )}
          {candidate.typingWpm && candidate.typingWpm >= 40 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 group-hover:bg-white/20 group-hover:backdrop-blur-sm group-hover:text-white rounded-lg text-xs font-semibold border border-purple-200 group-hover:border-white/30 transition-all duration-300">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{candidate.typingWpm} WPM</span>
            </div>
          )}
        </div>

        <div className="mb-5 flex-1">
          <p className="text-xs font-bold text-gray-600 group-hover:text-white/90 uppercase tracking-wider mb-3 transition-colors duration-300">
            Top Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gray-50 text-gray-800 group-hover:bg-white/20 group-hover:backdrop-blur-sm group-hover:text-white rounded-lg text-xs font-semibold border border-gray-200 group-hover:border-white/30 transition-all duration-300"
              >
                {skill}
              </span>
            ))}
            {candidate.skills.length > 5 && (
              <span className="px-3 py-1.5 bg-gray-50 text-gray-800 group-hover:bg-white/20 group-hover:backdrop-blur-sm group-hover:text-white rounded-lg text-xs font-semibold border border-gray-200 group-hover:border-white/30 transition-all duration-300">
                +{candidate.skills.length - 5} more
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-800 group-hover:text-white bg-gray-50 group-hover:bg-white/20 group-hover:backdrop-blur-sm rounded-lg px-3 py-2 mb-5 border border-gray-200 group-hover:border-white/30 transition-all duration-300">
          <Award className="w-4 h-4 text-blue-500 group-hover:text-white transition-colors duration-300" />
          <span className="font-semibold">{candidate.experienceYears}</span>
          <span>years of experience</span>
        </div>

        <button className="relative w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 mt-auto">
          <span className="relative flex items-center justify-center gap-2">
            View Full Profile
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </span>
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// TAB 2: JOB REQUESTS
// ============================================================================

function JobRequestsTab({
  showForm,
  setShowForm,
  jobRequests,
  loading,
  submitting,
  formData,
  setFormData,
  handleSubmit,
  addArrayItem,
  removeArrayItem,
  updateArrayItem
}: any) {
  if (showForm) {
    return (
                  <div className="bg-white shadow rounded-lg text-gray-900">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Job Request</h2>
              <p className="mt-1 text-sm text-gray-500">
                Fill out the details below to post your job request
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                            <Label htmlFor="job_title" className="text-sm font-medium text-gray-900">
                              Job Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="job_title"
                              type="text"
                              required
                              value={formData.job_title}
                              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                              placeholder="e.g. Senior Virtual Assistant"
                              className="mt-1 text-gray-900 bg-white border-gray-300"
                            />
                  </div>

                  <div>
                    <Label htmlFor="job_description" className="text-sm font-medium text-gray-900">
                      Job Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="job_description"
                      required
                      rows={4}
                      value={formData.job_description}
                      onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                      placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                      className="mt-1 text-gray-900 bg-white border-gray-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="department" className="text-sm font-medium text-gray-900">
                        Department
                      </Label>
                      <Input
                        id="department"
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="e.g. Marketing, IT, Operations"
                        className="mt-1 text-gray-900 bg-white border-gray-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry" className="text-sm font-medium text-gray-900">
                        Industry
                      </Label>
                      <Input
                        id="industry"
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g. Technology, Finance, Healthcare"
                        className="mt-1 text-gray-900 bg-white border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <Clock className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-medium text-gray-900">Work Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="work_type" className="text-sm font-medium text-gray-900">
                      Work Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.work_type}
                      onValueChange={(value) => setFormData({ ...formData, work_type: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select work type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="work_arrangement" className="text-sm font-medium text-gray-900">
                      Work Arrangement
                    </Label>
                    <Select
                      value={formData.work_arrangement}
                      onValueChange={(value) => setFormData({ ...formData, work_arrangement: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select arrangement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="onsite">Onsite</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience_level" className="text-sm font-medium text-gray-900">
                      Experience Level
                    </Label>
                    <Select
                      value={formData.experience_level}
                      onValueChange={(value) => setFormData({ ...formData, experience_level: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry-level">Entry Level</SelectItem>
                        <SelectItem value="mid-level">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="shift" className="text-sm font-medium text-gray-900">
                      Shift
                    </Label>
                    <Select
                      value={formData.shift}
                      onValueChange={(value) => setFormData({ ...formData, shift: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day Shift</SelectItem>
                        <SelectItem value="night">Night Shift</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority" className="text-sm font-medium text-gray-900">
                      Priority
                    </Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="application_deadline" className="text-sm font-medium text-gray-900">
                      Application Deadline
                    </Label>
                    <Input
                      id="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1 text-gray-900 bg-white border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Compensation */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <h3 className="text-lg font-medium text-gray-900">Compensation</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <Label htmlFor="currency" className="text-sm font-medium text-gray-900">
                      Currency <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PHP">PHP</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="salary_type" className="text-sm font-medium text-gray-900">
                      Salary Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.salary_type}
                      onValueChange={(value) => setFormData({ ...formData, salary_type: value })}
                    >
                      <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="salary_min" className="text-sm font-medium text-gray-900">
                      Min Salary
                    </Label>
                    <Input
                      id="salary_min"
                      type="number"
                      value={formData.salary_min}
                      onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                      placeholder="20000"
                      className="mt-1 text-gray-900 bg-white border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="salary_max" className="text-sm font-medium text-gray-900">
                      Max Salary
                    </Label>
                    <Input
                      id="salary_max"
                      type="number"
                      value={formData.salary_max}
                      onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                      placeholder="30000"
                      className="mt-1 text-gray-900 bg-white border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-medium text-gray-900">Requirements</h3>
                </div>
                
                <div className="space-y-4">
              {formData.requirements.map((req: string, index: number) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        type="text"
                        value={req}
                        onChange={(e) => updateArrayItem('requirements', index, e.target.value)}
                        placeholder={`Requirement ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.requirements.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('requirements', index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('requirements')}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Requirement
                  </Button>
                </div>
              </div>

              {/* Responsibilities */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <UserCheck className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-medium text-gray-900">Responsibilities</h3>
                </div>
                
                <div className="space-y-4">
              {formData.responsibilities.map((resp: string, index: number) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        type="text"
                        value={resp}
                        onChange={(e) => updateArrayItem('responsibilities', index, e.target.value)}
                        placeholder={`Responsibility ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.responsibilities.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('responsibilities', index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('responsibilities')}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Responsibility
                  </Button>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <Star className="h-5 w-5 text-teal-600" />
                  <h3 className="text-lg font-medium text-gray-900">Required Skills</h3>
                </div>
                
                <div className="space-y-4">
              {formData.skills.map((skill: string, index: number) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        type="text"
                        value={skill}
                        onChange={(e) => updateArrayItem('skills', index, e.target.value)}
                        placeholder={`Skill ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.skills.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('skills', index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('skills')}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                  </Button>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-medium text-gray-900">Benefits</h3>
                </div>
                
                <div className="space-y-4">
              {formData.benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        type="text"
                        value={benefit}
                        onChange={(e) => updateArrayItem('benefits', index, e.target.value)}
                        placeholder={`Benefit ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.benefits.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('benefits', index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('benefits')}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Benefit
                  </Button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit Job Request
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4">
                  Your job request will be posted to the BPOC platform for candidate matching
                </p>
              </div>
            </form>
          </div>
    )
  }

  // Job Requests List
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border shadow-sm p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 space-y-3">
                {/* Title */}
                <div className="h-6 w-64 bg-gray-200 rounded" />
                
                {/* Badges */}
                <div className="flex items-center gap-3">
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                  <div className="h-6 w-32 bg-gray-200 rounded-full" />
                  <div className="h-6 w-28 bg-gray-200 rounded-full" />
                </div>
              </div>
              
              {/* Date */}
              <div className="h-5 w-32 bg-gray-200 rounded" />
            </div>
            
            {/* Description */}
            <div className="space-y-2 mb-4">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-4/6 bg-gray-200 rounded" />
            </div>
            
            {/* Footer with requirements */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="flex flex-wrap gap-2">
                <div className="h-6 w-24 bg-gray-200 rounded" />
                <div className="h-6 w-20 bg-gray-200 rounded" />
                <div className="h-6 w-28 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (jobRequests.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-gray-200 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-teal-200/30 to-cyan-200/30 rounded-full blur-3xl" />
        
        <div className="relative py-16 px-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 mb-6">
            <Briefcase className="h-12 w-12 text-emerald-600" />
          </div>
          
          <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent mb-3">
            No Job Requests Yet
          </h3>
          
          <p className="text-slate-600 text-base max-w-md mx-auto mb-6 leading-relaxed">
            Start your journey by creating your first job request. Connect with top talent from the BPOC platform and build your dream team.
          </p>
          
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Job Request
          </button>
        </div>
      </div>
    )
  }

  return (
          <div className="space-y-4">
      {jobRequests.map((job: JobRequest) => (
              <Card key={job.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{job.job_title}</h3>
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <Badge className={
                        job.status === 'active' ? 'bg-green-100 text-green-800' :
                        job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {job.status.toUpperCase()}
                      </Badge>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <Briefcase className="h-4 w-4" />
                        {job.work_type}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {job.work_arrangement}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <Target className="h-4 w-4" />
                        {job.experience_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {job.applicants} applicants
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
    </div>
  )
}

// ============================================================================
// TAB 3: INTERVIEWS
// ============================================================================

function InterviewsTab({ 
  interviews, 
  loading, 
  statusFilter,
  setStatusFilter,
  hireRequestingId,
  rejectingId,
  hireModalOpen,
  setHireModalOpen,
  rejectModalOpen,
  setRejectModalOpen,
  setSelectedInterview,
  selectedInterview,
  hireData,
  setHireData,
  rejectData,
  setRejectData,
  handleHireRequest,
  handleRejectRequest,
  cancelModalOpen,
  setCancelModalOpen,
  rescheduleModalOpen,
  setRescheduleModalOpen,
  notesModalOpen,
  setNotesModalOpen,
  undoCancelModalOpen,
  setUndoCancelModalOpen,
  undoRejectModalOpen,
  setUndoRejectModalOpen,
  cancelReason,
  setCancelReason,
  rescheduleNotes,
  setRescheduleNotes,
  reschedulePreferredTimes,
  setReschedulePreferredTimes,
  clientTimezone,
  additionalNotes,
  setAdditionalNotes,
  undoCancelNotes,
  setUndoCancelNotes,
  undoRejectNotes,
  setUndoRejectNotes,
  interviewSubmitting,
  setInterviewSubmitting,
  fetchInterviews,
  toast
}: any) {
  const router = useRouter()
  
  // Helper functions
  function getStatusBadge(status: InterviewRequest['status']) {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-300',
      RESCHEDULE_REQUESTED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      COMPLETED: 'bg-green-100 text-green-800 border-green-300',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300',
      HIRED: 'bg-purple-100 text-purple-800 border-purple-300',
      'HIRE-REQUESTED': 'bg-orange-100 text-orange-800 border-orange-300',
      'HIRE_REQUESTED': 'bg-orange-100 text-orange-800 border-orange-300',
      'OFFER-SENT': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'OFFER_SENT': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'OFFER-ACCEPTED': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'OFFER_ACCEPTED': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'OFFER-DECLINED': 'bg-red-100 text-red-800 border-red-300',
      'OFFER_DECLINED': 'bg-red-100 text-red-800 border-red-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300'
    }

    const icons: Record<string, React.ReactElement> = {
      PENDING: <Clock className="h-3 w-3 mr-1" />,
      SCHEDULED: <CalendarCheck className="h-3 w-3 mr-1" />,
      RESCHEDULE_REQUESTED: <Calendar className="h-3 w-3 mr-1" />,
      COMPLETED: <CheckCircle2 className="h-3 w-3 mr-1" />,
      CANCELLED: <XCircle className="h-3 w-3 mr-1" />,
      HIRED: <UserCheck className="h-3 w-3 mr-1" />,
      'HIRE-REQUESTED': <UserCheck className="h-3 w-3 mr-1" />,
      'HIRE_REQUESTED': <UserCheck className="h-3 w-3 mr-1" />,
      'OFFER-SENT': <Mail className="h-3 w-3 mr-1" />,
      'OFFER_SENT': <Mail className="h-3 w-3 mr-1" />,
      'OFFER-ACCEPTED': <CheckCircle2 className="h-3 w-3 mr-1" />,
      'OFFER_ACCEPTED': <CheckCircle2 className="h-3 w-3 mr-1" />,
      'OFFER-DECLINED': <XCircle className="h-3 w-3 mr-1" />,
      'OFFER_DECLINED': <XCircle className="h-3 w-3 mr-1" />,
      REJECTED: <XCircle className="h-3 w-3 mr-1" />
    }

    // Format status text: replace underscores/hyphens with spaces
    const displayStatus = status.replace(/[_-]/g, ' ')
    
    return (
      <Badge variant="outline" className={`${styles[status] || 'bg-gray-100 text-gray-800 border-gray-300'} flex items-center`}>
        {icons[status] || <AlertCircle className="h-3 w-3 mr-1" />}
        {displayStatus}
      </Badge>
    )
  }

  function formatDate(dateString: string, timezone?: string) {
    const date = new Date(dateString)
    const formatted = date.toLocaleString('en-US', {
      timeZone: timezone || undefined,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    
    // Add timezone in parentheses
    if (timezone) {
      const tzName = date.toLocaleString('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
      }).split(' ').pop()
      return `${formatted} (${tzName})`
    }
    
    return formatted
  }

  function formatPreferredTime(time: string | PreferredTime) {
    try {
      // Handle new object format
      if (typeof time === 'object' && time.datetime) {
        const date = new Date(time.datetime)
        
        // Get the full date/time string with timezone abbreviation
        const fullString = date.toLocaleString('en-US', {
          timeZone: time.timezone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZoneName: 'short'
        })
        
        // Extract timezone abbreviation (e.g., "CST", "AEDT")
        const tzAbbr = fullString.split(' ').pop() || ''
        
        // Format without timezone first
        const formatted = date.toLocaleString('en-US', {
          timeZone: time.timezone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        
        return `${formatted} (${tzAbbr})`
      }
      
      // Handle old string format
      const date = new Date(time as string)
      const formatted = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      
      return formatted
    } catch (error) {
      // Fallback
      return typeof time === 'string' ? time : time.datetime
    }
  }
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Filter Skeleton */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Interview Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border shadow-sm overflow-hidden animate-pulse">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-purple-300" />
                    
                    {/* Info */}
                    <div className="flex-1 space-y-3">
                      <div className="h-6 w-48 bg-gray-200 rounded" />
                      <div className="h-5 w-64 bg-gray-200 rounded" />
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-32 bg-gray-200 rounded" />
                        <div className="h-4 w-28 bg-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`h-6 w-24 rounded-full ${
                    i === 1 ? 'bg-green-200' : 
                    i === 2 ? 'bg-blue-200' : 
                    'bg-yellow-200'
                  }`} />
                </div>
                
                {/* Details */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-5/6 bg-gray-200 rounded" />
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-10 w-32 bg-blue-200 rounded-lg" />
                  <div className="h-10 w-32 bg-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (interviews.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border border-gray-200 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
        
        <div className="relative py-16 px-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6">
            <Calendar className="h-12 w-12 text-blue-600" />
          </div>
          
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent mb-3">
            No Interview Requests Yet
          </h3>
          
          <p className="text-slate-600 text-base max-w-md mx-auto leading-relaxed">
            Start your recruitment journey by requesting interviews with candidates from the talent pool.
          </p>
        </div>
      </div>
    )
  }

  // Filter interviews by status
  const filteredInterviews = statusFilter === 'ALL' 
    ? interviews 
    : statusFilter === 'HIRE_REQUESTED'
    ? interviews.filter((interview: InterviewRequest) => interview.status === 'HIRE_REQUESTED' || interview.status === 'HIRE-REQUESTED')
    : interviews.filter((interview: InterviewRequest) => interview.status === statusFilter)

  const statusOptions = [
    { value: 'ALL', label: 'All', count: interviews.length },
    { value: 'PENDING', label: 'Pending', count: interviews.filter((i: InterviewRequest) => i.status === 'PENDING').length },
    { value: 'SCHEDULED', label: 'Scheduled', count: interviews.filter((i: InterviewRequest) => i.status === 'SCHEDULED').length },
    { value: 'RESCHEDULE_REQUESTED', label: 'Reschedule Requested', count: interviews.filter((i: InterviewRequest) => i.status === 'RESCHEDULE_REQUESTED').length },
    { value: 'COMPLETED', label: 'Completed', count: interviews.filter((i: InterviewRequest) => i.status === 'COMPLETED').length },
    { value: 'HIRE_REQUESTED', label: 'Hire Requested', count: interviews.filter((i: InterviewRequest) => i.status === 'HIRE_REQUESTED' || i.status === 'HIRE-REQUESTED').length },
    { value: 'HIRED', label: 'Hired', count: interviews.filter((i: InterviewRequest) => i.status === 'HIRED').length },
    { value: 'CANCELLED', label: 'Cancelled', count: interviews.filter((i: InterviewRequest) => i.status === 'CANCELLED').length },
    { value: 'REJECTED', label: 'Rejected', count: interviews.filter((i: InterviewRequest) => i.status === 'REJECTED').length },
  ]

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-5 h-5 text-gray-700" />
        <span className="font-semibold text-gray-900">Filters</span>
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === option.value
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            {option.label} ({option.count})
          </button>
        ))}
      </div>

      {filteredInterviews.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border border-gray-200 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
          
          <div className="relative py-16 px-8 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6">
              <Calendar className="h-12 w-12 text-blue-600" />
            </div>
            
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent mb-3">
              {statusFilter !== 'ALL' 
                ? `No ${statusFilter.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Interviews` 
                : 'No Interviews Yet'}
            </h3>
            
            <p className="text-slate-600 text-base max-w-md mx-auto mb-6 leading-relaxed">
              {statusFilter !== 'ALL' 
                ? 'There are currently no interviews with this status. Try selecting a different filter to view other interviews.'
                : 'Start your recruitment journey by requesting interviews with candidates from the talent pool.'}
            </p>
            
            {statusFilter !== 'ALL' && (
              <button
                onClick={() => setStatusFilter('ALL')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all"
              >
                <Calendar className="h-4 w-4" />
                View All Interviews
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((interview: InterviewRequest) => (
        <Card key={interview.id} className="p-6 bg-white transition-shadow border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-4">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {interview.candidateAvatar ? (
                    <img 
                      src={interview.candidateAvatar} 
                      alt={interview.candidateFirstName}
                      className="h-12 w-12 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {interview.candidateFirstName}
                      </h3>
                      {interview.bpocCandidateId && (
                        <button
                          onClick={() => router.push(`/client/talent-pool/${interview.bpocCandidateId}?returnTo=recruitment&tab=interviews`)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <UserSearch className="h-3 w-3" />
                          View Profile
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Requested on {formatDate(interview.createdAt, clientTimezone)}
                    </p>
                  </div>
                </div>
                {getStatusBadge(interview.status)}
              </div>

              {/* Status Message - Dynamic Background */}
              <div className={`rounded-lg p-6 border-l-4 shadow-sm ${
                interview.status === 'PENDING' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-yellow-500' :
                interview.status === 'SCHEDULED' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-l-blue-500' :
                interview.status === 'RESCHEDULE_REQUESTED' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-yellow-500' :
                interview.status === 'COMPLETED' ? 'bg-gradient-to-br from-green-50 to-green-100 border-l-green-500' :
                (interview.status === 'HIRE_REQUESTED' || interview.status === 'HIRE-REQUESTED') ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-l-orange-500' :
                (interview.status === 'OFFER_SENT' || interview.status === 'OFFER-SENT') ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-l-indigo-500' :
                (interview.status === 'OFFER_ACCEPTED' || interview.status === 'OFFER-ACCEPTED') ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-l-emerald-500' :
                (interview.status === 'OFFER_DECLINED' || interview.status === 'OFFER-DECLINED') ? 'bg-gradient-to-br from-red-50 to-red-100 border-l-red-500' :
                interview.status === 'HIRED' ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-l-purple-500' :
                interview.status === 'REJECTED' ? 'bg-gradient-to-br from-red-50 to-red-100 border-l-red-500' :
                interview.status === 'CANCELLED' ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-l-gray-500' :
                'bg-gradient-to-br from-gray-50 to-gray-100 border-l-gray-500'
              }`}>
                {interview.status === 'PENDING' && (
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="h-12 w-12 rounded-full bg-yellow-200 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-700" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-yellow-900 mb-2">
                        Waiting for Coordination
                      </h3>
                      <p className="text-sm text-yellow-800 leading-relaxed">
                        Our team is coordinating with <span className="font-semibold">{interview.candidateFirstName}</span> to schedule your interview. 
                        You'll be notified once a time is confirmed.
                      </p>
                    </div>
                  </div>
                )}

                {interview.status === 'SCHEDULED' && interview.scheduledTime && (
                  <div className="flex items-center gap-4 justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="shrink-0">
                        <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                          <CalendarCheck className="h-6 w-6 text-blue-700" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-blue-900">
                          Interview Scheduled
                        </h3>
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">Time:</span> {formatDate(interview.scheduledTime, clientTimezone)}
                        </p>
                      </div>
                    </div>
                    {interview.meetingLink && (
                      <div className="flex-shrink-0">
                        <a 
                          href={interview.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                        >
                          <Video className="h-4 w-4" />
                          Join Meeting
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {interview.status === 'RESCHEDULE_REQUESTED' && (
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="h-12 w-12 rounded-full bg-amber-200 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-amber-700" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-amber-900 mb-2">
                        Reschedule Requested
                      </h3>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        Your reschedule request has been submitted. Our team is coordinating a new interview time with <span className="font-semibold">{interview.candidateFirstName}</span>.
                      </p>
                    </div>
                  </div>
                )}

                {interview.status === 'COMPLETED' && (
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-700" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-green-900 mb-2">
                        Interview Complete
                      </h3>
                      <p className="text-sm text-green-800 leading-relaxed">
                        Great work! The interview with <span className="font-semibold">{interview.candidateFirstName}</span> has been completed. 
                        You can now request to hire this candidate or reject them below.
                      </p>
                    </div>
                  </div>
                )}

                {(interview.status === 'HIRE_REQUESTED' || interview.status === 'HIRE-REQUESTED') && (
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="h-12 w-12 rounded-full bg-orange-200 flex items-center justify-center">
                        <UserCheck className="h-6 w-6 text-orange-700" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-orange-900 mb-2">
                        Hire Request Submitted
                      </h3>
                      <p className="text-sm text-orange-800 leading-relaxed">
                        Your hire request for <span className="font-semibold">{interview.candidateFirstName}</span> has been submitted to our admin team. 
                        They will send a formal job offer to the candidate and notify you once they respond.
                      </p>
                    </div>
                  </div>
                )}

                {(interview.status === 'OFFER_SENT' || interview.status === 'OFFER-SENT') && (
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="h-12 w-12 rounded-full bg-indigo-200 flex items-center justify-center">
                        <Mail className="h-6 w-6 text-indigo-700" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-indigo-900 mb-2">
                        Job Offer Sent 📧
                      </h3>
                      <p className="text-sm text-indigo-800 leading-relaxed">
                        A formal job offer has been sent to <span className="font-semibold">{interview.candidateFirstName}</span>. 
                        We're waiting for their response. You'll be notified once they respond.
                      </p>
                    </div>
                  </div>
                )}

                {(interview.status === 'OFFER_ACCEPTED' || interview.status === 'OFFER-ACCEPTED') && (
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="h-12 w-12 rounded-full bg-emerald-200 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-emerald-700" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-emerald-900 mb-2">
                        Offer Accepted! 🎉
                      </h3>
                      <p className="text-sm text-emerald-800 leading-relaxed">
                        Great news! <span className="font-semibold">{interview.candidateFirstName}</span> has accepted your job offer. 
                        They are now completing their onboarding process.
                      </p>
                    </div>
                  </div>
                )}

                {(interview.status === 'OFFER_DECLINED' || interview.status === 'OFFER-DECLINED') && (
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="h-12 w-12 rounded-full bg-red-200 flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-red-700" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-900 mb-2">
                        Offer Declined
                      </h3>
                      <p className="text-sm text-red-800 leading-relaxed">
                        Unfortunately, <span className="font-semibold">{interview.candidateFirstName}</span> has declined the job offer. 
                        Our team will reach out to discuss alternative candidates.
                      </p>
                    </div>
                  </div>
                )}

                {interview.status === 'HIRED' && (
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center">
                        <UserCheck className="h-6 w-6 text-purple-700" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-purple-900 mb-2">
                        Candidate Hired! 🎉
                      </h3>
                      <p className="text-sm text-purple-800 leading-relaxed">
                        Congratulations! <span className="font-semibold">{interview.candidateFirstName}</span> has been hired and is now moving forward with onboarding.
                      </p>
                    </div>
                  </div>
                )}

                {interview.status === 'REJECTED' && (
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="h-12 w-12 rounded-full bg-red-200 flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-red-700" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-900 mb-2">
                        Candidate Rejected
                      </h3>
                      <p className="text-sm text-red-800 leading-relaxed">
                        You have declined to move forward with <span className="font-semibold">{interview.candidateFirstName}</span>. 
                        The admin team has been notified of your decision. If you'd like to reconsider, you can undo this rejection below.
                      </p>
                    </div>
                  </div>
                )}

                {interview.status === 'CANCELLED' && (
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-gray-700" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Interview Cancelled
                      </h3>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        You have cancelled the interview with <span className="font-semibold">{interview.candidateFirstName}</span>. 
                        The interview request has been closed.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Your Preferred Times - Show only for pending and reschedule-requested */}
              {(interview.status === 'PENDING' || interview.status === 'RESCHEDULE_REQUESTED') && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Your Preferred Times{interview.status === 'RESCHEDULE_REQUESTED' ? ' (Rescheduled)' : ''}:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interview.preferredTimes.map((time, idx) => (
                      <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatPreferredTime(time)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Start Date - Show for hire requested and later */}
              {interview.clientPreferredStart && (interview.status === 'HIRE_REQUESTED' || interview.status === 'HIRE-REQUESTED' || interview.status === 'OFFER_SENT' || interview.status === 'OFFER-SENT' || interview.status === 'OFFER_ACCEPTED' || interview.status === 'OFFER-ACCEPTED' || interview.status === 'HIRED') && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900">Your Preferred Start Date</span>
                  </div>
                  <p className="text-base font-medium text-blue-700">
                    {new Date(interview.clientPreferredStart).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {/* Work Schedule - Show for hire requested and later */}
              {interview.workSchedule && (interview.status === 'HIRE_REQUESTED' || interview.status === 'HIRE-REQUESTED' || interview.status === 'OFFER_SENT' || interview.status === 'OFFER-SENT' || interview.status === 'OFFER_ACCEPTED' || interview.status === 'OFFER-ACCEPTED' || interview.status === 'HIRED') && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-semibold text-gray-900">Work Schedule</span>
                    </div>
                    {interview.workSchedule.isMonToFri && (
                      <p className="text-xs text-gray-500">(Standard Mon-Fri)</p>
                    )}
                  </div>
                  {interview.workSchedule.hasCustomHours && interview.workSchedule.customHours ? (
                    <div>
                      <div className="grid grid-cols-7 gap-2">
                        {(() => {
                          const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                          
                          return dayOrder.map((fullDay, index) => {
                            const time = interview.workSchedule?.customHours?.[fullDay];
                            if (!time) return <div key={fullDay} className="flex flex-col items-center text-sm bg-gray-200/80 px-3 py-2.5 rounded border-2 border-gray-300/70">
                              <span className="text-gray-600 font-bold mb-1">{fullDay}</span>
                              <span className="text-gray-500 text-xs font-semibold">Day Off</span>
                            </div>; // Empty/disabled cell
                            
                            const [hours, minutes] = time.split(':').map(Number);
                            const endHour = (hours + 9) % 24;
                            const endTime24 = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            
                            // Get timezone abbreviation
                            const tzName = clientTimezone ? new Date().toLocaleString('en-US', {
                              timeZone: clientTimezone,
                              timeZoneName: 'short'
                            }).split(' ').pop() : '';
                            
                            return (
                              <div key={fullDay} className="flex flex-col items-center text-sm bg-white px-3 py-2.5 rounded border border-purple-200">
                                <span className="text-gray-900 font-medium mb-1.5">{fullDay}</span>
                                <span className="text-gray-600 text-xs">{convertTo12Hour(time)} - {convertTo12Hour(endTime24)} {tzName && `(${tzName})`}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">(9 hours per day, including break time)</p>
                    </div>
                  ) : interview.workSchedule.workStartTime && interview.workSchedule.workDays ? (
                    <div>
                      <div className="grid grid-cols-7 gap-2">
                        {(() => {
                          const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                          const workDays = interview.workSchedule?.workDays || [];
                          const workStartTime = interview.workSchedule?.workStartTime || '09:00';
                          
                          return dayOrder.map((fullDay) => {
                            if (!workDays.includes(fullDay)) return <div key={fullDay} className="flex flex-col items-center text-sm bg-gray-200/80 px-3 py-2.5 rounded border-2 border-gray-300/70">
                              <span className="text-gray-600 font-bold mb-1">{fullDay}</span>
                              <span className="text-gray-500 text-xs font-semibold">Day Off</span>
                            </div>; // Empty/disabled cell
                            
                            const [hours, minutes] = workStartTime.split(':').map(Number);
                            const endHour = (hours + 9) % 24;
                            const endTime24 = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            
                            // Get timezone abbreviation
                            const tzName = clientTimezone ? new Date().toLocaleString('en-US', {
                              timeZone: clientTimezone,
                              timeZoneName: 'short'
                            }).split(' ').pop() : '';
                            
                            return (
                              <div key={fullDay} className="flex flex-col items-center text-sm bg-white px-3 py-2.5 rounded border border-purple-200">
                                <span className="text-gray-900 font-medium mb-1.5">{fullDay}</span>
                                <span className="text-gray-600 text-xs">{convertTo12Hour(workStartTime)} - {convertTo12Hour(endTime24)} {tzName && `(${tzName})`}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">(9 hours per day, including break time)</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not specified</p>
                  )}
                </div>
              )}

              {/* Combined Notes (Client + Admin) */}
              {(() => {
                const clientNotes = interview.clientNotes || '';
                const adminNotes = interview.adminNotes || '';
                
                if (!clientNotes && !adminNotes) return null;

                // Parse notes and combine them
                const parseNotes = (notesText: string, type: 'client' | 'admin') => {
                  if (!notesText) return [];
                  
                  // Split by timestamp pattern - supports both () and [] and plain timestamps
                  const entries = notesText.split(/\n\n(?=[\(\[]|\d)/);
                  
                  return entries.map(entry => {
                    // NEW FORMAT WITH STATUS: (Status Label) timestamp - content
                    const newFormatMatch = entry.match(/^\(([^\)]+)\)\s+([^-]+)\s+-\s+([\s\S]*)$/);
                    if (newFormatMatch) {
                      const [, statusLabel, timestamp, content] = newFormatMatch;
                      try {
                        const date = new Date(timestamp.trim());
                        return { 
                          timestamp: `(${statusLabel}) ${timestamp.trim()}`, 
                          content: content.trim(), 
                          type, 
                          date, 
                          rawText: entry 
                        };
                      } catch {
                        return { 
                          timestamp: `(${statusLabel}) ${timestamp.trim()}`, 
                          content: content.trim(), 
                          type, 
                          date: new Date(0), 
                          rawText: entry 
                        };
                      }
                    }
                    
                    // PLAIN FORMAT: timestamp - content (no status label)
                    const plainFormatMatch = entry.match(/^([^-\(\[]+)\s+-\s+([\s\S]*)$/);
                    if (plainFormatMatch) {
                      const [, timestamp, content] = plainFormatMatch;
                      try {
                        const date = new Date(timestamp.trim());
                        return { 
                          timestamp: timestamp.trim(), 
                          content: content.trim(), 
                          type, 
                          date, 
                          rawText: entry 
                        };
                      } catch {
                        return { 
                          timestamp: timestamp.trim(), 
                          content: content.trim(), 
                          type, 
                          date: new Date(0), 
                          rawText: entry 
                        };
                      }
                    }
                    
                    // OLD FORMAT WITH BRACKETS: [Status Label] timestamp - content
                    const oldNewFormatMatch = entry.match(/^\[([^\]]+)\]\s+([^-]+)\s+-\s+([\s\S]*)$/);
                    if (oldNewFormatMatch) {
                      const [, statusLabel, timestamp, content] = oldNewFormatMatch;
                      try {
                        const date = new Date(timestamp.trim());
                        return { 
                          timestamp: `[${statusLabel}] ${timestamp.trim()}`, 
                          content: content.trim(), 
                          type, 
                          date, 
                          rawText: entry 
                        };
                      } catch {
                        return { 
                          timestamp: `[${statusLabel}] ${timestamp.trim()}`, 
                          content: content.trim(), 
                          type, 
                          date: new Date(0), 
                          rawText: entry 
                        };
                      }
                    }
                    
                    // OLDEST FORMAT: [timestamp] content
                    const oldFormatMatch = entry.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
                    if (oldFormatMatch) {
                      const [, timestamp, content] = oldFormatMatch;
                      try {
                        const date = new Date(timestamp);
                        return { timestamp, content: content.trim(), type, date, rawText: entry };
                      } catch {
                        return { timestamp, content: content.trim(), type, date: new Date(0), rawText: entry };
                      }
                    }
                    return { timestamp: '', content: entry.trim(), type, date: new Date(0), rawText: entry };
                  }).filter(e => e.content);
                };

                const clientEntries = parseNotes(clientNotes, 'client');
                const adminEntries = parseNotes(adminNotes, 'admin');
                const allEntries = [...clientEntries, ...adminEntries].sort((a, b) => a.date.getTime() - b.date.getTime());

                if (allEntries.length === 0) return null;

                return (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Notes</span>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {allEntries.map((entry, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded border ${
                            entry.type === 'client' 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-purple-50 border-purple-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                entry.type === 'client'
                                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                                  : 'bg-purple-100 text-purple-700 border-purple-300'
                              }`}
                            >
                              {entry.type === 'client' ? 'Client' : 'Admin'}
                            </Badge>
                            {entry.timestamp && (
                              <span className="text-xs text-gray-500">
                                {(() => {
                                  // Extract the raw timestamp from the formatted string
                                  const statusLabelMatch = entry.timestamp.match(/^\(([^\)]+)\)\s+(.+)$/) || 
                                                          entry.timestamp.match(/^\[([^\]]+)\]\s+(.+)$/);
                                  const rawTimestamp = statusLabelMatch ? statusLabelMatch[2] : entry.timestamp;
                                  const statusLabel = statusLabelMatch ? statusLabelMatch[1] : null;
                                  
                                  try {
                                    const date = new Date(rawTimestamp);
                                    if (!isNaN(date.getTime())) {
                                      const formatted = date.toLocaleString('en-US', {
                                        timeZone: clientTimezone || undefined,
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      });
                                      
                                      // Add timezone in parentheses
                                      let withTimezone = formatted;
                                      if (clientTimezone) {
                                        const tzName = date.toLocaleString('en-US', {
                                          timeZone: clientTimezone,
                                          timeZoneName: 'short'
                                        }).split(' ').pop();
                                        withTimezone = `${formatted} (${tzName})`;
                                      }
                                      
                                      return statusLabel ? `(${statusLabel}) ${withTimezone}` : withTimezone;
                                    }
                                  } catch {
                                    // Fall back to original timestamp if parsing fails
                                  }
                                  return entry.timestamp;
                                })()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                {/* Hire Request - Show for completed interviews */}
                {interview.status === 'COMPLETED' && (
                  <button
                    onClick={() => {
                      setSelectedInterview(interview)
                      setHireModalOpen(true)
                    }}
                    className="px-4 py-2.5 bg-white border-2 border-green-300 text-green-600 rounded-lg hover:bg-green-50 hover:border-green-400 hover:text-green-700 font-semibold transition-all flex items-center gap-2 text-sm"
                  >
                    <UserCheck className="h-4 w-4" />
                    Request to Hire
                  </button>
                )}

                {/* Reject - Show for completed interviews */}
                {interview.status === 'COMPLETED' && (
                  <button
                    onClick={() => {
                      setSelectedInterview(interview)
                      setRejectModalOpen(true)
                    }}
                    className="px-4 py-2.5 bg-white border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-400 hover:text-red-700 font-semibold transition-all flex items-center gap-2 text-sm"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Candidate
                  </button>
                )}

                {/* Reconsider Candidate - Show for rejected interviews */}
                {interview.status === 'REJECTED' && (
                  <button
                    onClick={() => {
                      setSelectedInterview(interview)
                      setUndoRejectNotes('')
                      setUndoRejectModalOpen(true)
                    }}
                    className="px-4 py-2.5 bg-white border-2 border-emerald-400 text-emerald-600 rounded-lg hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 font-semibold transition-all flex items-center gap-2 text-sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reconsider Candidate
                  </button>
                )}

                {/* Request Reschedule - Show for pending or scheduled */}
                {(interview.status === 'PENDING' || interview.status === 'SCHEDULED') && (
                  <button
                    onClick={() => {
                      setSelectedInterview(interview)
                      setRescheduleModalOpen(true)
                    }}
                    className="px-4 py-2 border-2 border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-all flex items-center gap-2 text-sm"
                  >
                    <CalendarClock className="h-4 w-4" />
                    Request Reschedule
                  </button>
                )}

                {/* Undo Cancel Request - Show for cancelled interviews */}
                {interview.status === 'CANCELLED' && (
                  <button
                    onClick={() => {
                      setSelectedInterview(interview)
                      setUndoCancelNotes('')
                      setUndoCancelModalOpen(true)
                    }}
                    className="px-4 py-2.5 bg-white border-2 border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 font-semibold transition-all flex items-center gap-2 text-sm"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Undo Cancel Request
                  </button>
                )}

                {/* Cancel Interview - Show for pending, scheduled, or reschedule requested */}
                {(interview.status === 'PENDING' || interview.status === 'SCHEDULED' || interview.status === 'RESCHEDULE_REQUESTED') && (
                  <button
                    onClick={() => {
                      setSelectedInterview(interview)
                      setCancelModalOpen(true)
                    }}
                    className="px-4 py-2 border-2 border-rose-400 text-rose-600 rounded-lg hover:bg-rose-50 font-medium transition-all flex items-center gap-2 text-sm"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </button>
                )}

                {/* Add Notes - Show for all statuses */}
                <button
                  onClick={() => {
                    setSelectedInterview(interview)
                    setAdditionalNotes('')
                    setNotesModalOpen(true)
                  }}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 hover:border-gray-400 font-medium transition-all flex items-center gap-2 text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  Add Notes
                </button>
              </div>

            </div>
          </div>
        </Card>
      ))}
        </div>
      )}

      {/* Hire Modal */}
      <Dialog open={hireModalOpen} onOpenChange={setHireModalOpen}>
        <DialogContent className="bg-white text-gray-900 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Request to Hire Candidate
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete the details below to submit your hire request to the admin team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-2">
            {/* Start Date Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
              <Label className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                Preferred Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="preferredStartDate"
                type="date"
                value={hireData.preferredStartDate}
                onChange={(e) => setHireData({ ...hireData, preferredStartDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="bg-white text-gray-900 border-gray-300 text-base h-11"
                required
              />
              <p className="text-xs text-blue-700 mt-2">
                Admin will confirm this date with the candidate and finalize the onboarding schedule.
              </p>
            </div>

            {/* Work Schedule Section */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
              <Label className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-purple-600" />
                Work Schedule <span className="text-red-500">*</span>
              </Label>
              
              {/* Info Banner */}
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded-r-lg">
                <p className="font-semibold text-amber-900 text-sm">9-Hour Work Day</p>
                <p className="text-xs text-amber-800 mt-1">
                  All Filipino staff work 9-hour shifts per day, which includes scheduled break times. 
                  This is standard for full-time employment.
                </p>
              </div>

              {/* Work Days */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-900">
                  Work Days
                </Label>
                <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={hireData.isMonToFri}
                      onChange={(e) => {
                        const checked = e.target.checked
                        const newWorkDays = checked 
                          ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                          : []
                        
                        // If in custom hours mode, update customHours to match new workDays
                        let newCustomHours = { ...hireData.customHours }
                        if (hireData.hasCustomHours) {
                          if (checked) {
                            // Setting Mon-Fri: initialize all with default times
                            newCustomHours = {}
                            newWorkDays.forEach(day => {
                              newCustomHours[day] = '09:00'
                            })
                          } else {
                            // Clearing days: clear custom hours
                            newCustomHours = {}
                          }
                        }
                        
                        setHireData({ 
                          ...hireData, 
                          isMonToFri: checked,
                          workDays: newWorkDays,
                          customHours: newCustomHours
                        })
                      }}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-base font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        Monday to Friday (Standard Schedule)
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        Most common schedule - 5 consecutive weekdays
                      </p>
                    </div>
                  </label>
                  
                  {!hireData.isMonToFri && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                        <p className="font-semibold text-blue-900 text-sm">Custom Schedule - Select Work Days</p>
                        <p className="text-xs text-blue-800">
                          Select the days the candidate will work (typically 5 consecutive days)
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                            <label key={day} className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-blue-200 hover:bg-blue-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={hireData.workDays.includes(day)}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  const newWorkDays = checked
                                    ? [...hireData.workDays, day]
                                    : hireData.workDays.filter((d: string) => d !== day)
                                  
                                  // If in custom hours mode, update customHours accordingly
                                  const newCustomHours = { ...hireData.customHours }
                                  if (hireData.hasCustomHours) {
                                    if (checked) {
                                      // Adding a day - set default time
                                      newCustomHours[day] = '09:00'
                                    } else {
                                      // Removing a day - delete from customHours
                                      delete newCustomHours[day]
                                    }
                                  }
                                  
                                  setHireData({
                                    ...hireData,
                                    workDays: newWorkDays,
                                    customHours: newCustomHours
                                  })
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-900 font-medium">{day}</span>
                            </label>
                          ))}
                        </div>
                        {hireData.workDays.length > 0 && (
                          <div className="bg-white p-2 rounded border border-blue-300">
                            <p className="text-xs text-blue-900">
                              <strong>Selected:</strong> {hireData.workDays.join(', ')} ({hireData.workDays.length} days)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Start Time */}
              <div className="mt-4 space-y-3">
                <Label className="text-sm font-semibold text-gray-900">
                  Daily Work Hours
                </Label>
                <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                  {/* Same time for all days option */}
                  <label className="flex items-start gap-3 cursor-pointer group mb-4">
                    <input
                      type="checkbox"
                      checked={!hireData.hasCustomHours}
                      onChange={(e) => {
                        const checked = e.target.checked
                        if (!checked) {
                          // Switching to custom hours - initialize with default times
                          const defaultCustomHours: Record<string, string> = {}
                          hireData.workDays.forEach((day: string) => {
                            defaultCustomHours[day] = '09:00'
                          })
                          setHireData({ 
                            ...hireData, 
                            hasCustomHours: true,
                            customHours: defaultCustomHours
                          })
                        } else {
                          // Switching back to same hours for all days
                          setHireData({ 
                            ...hireData, 
                            hasCustomHours: false,
                            customHours: {}
                          })
                        }
                      }}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-base font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        Same hours for all days
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        All work days will have the same start time
                      </p>
                    </div>
                  </label>

                  {!hireData.hasCustomHours ? (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1">
                          <Label htmlFor="workStartTime" className="text-xs text-gray-600 mb-1 block">
                            Start Time
                          </Label>
                          <Input
                            id="workStartTime"
                            type="time"
                            value={hireData.workStartTime}
                            onChange={(e) => setHireData({ ...hireData, workStartTime: e.target.value })}
                            className="bg-white text-gray-900 border-gray-300 text-base h-11"
                            required
                          />
                        </div>
                        <div className="flex items-center justify-center pt-6">
                          <span className="text-gray-400 font-bold">→</span>
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600 mb-1 block">
                            End Time <span className="text-[10px] text-gray-500">(Auto-calculated)</span>
                          </Label>
                          <div className="h-11 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg flex items-center justify-center">
                            <span className="text-base font-bold text-green-700">
                              {(() => {
                                const [hours, minutes] = hireData.workStartTime.split(':').map(Number)
                                const endHour = (hours + 9) % 24
                                const endTime24 = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                                return convertTo12Hour(endTime24)
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg mt-3 border border-gray-200">
                        <p className="text-xs text-gray-700">
                          <strong>Example:</strong> If work starts at 9:00 AM, it will end at 6:00 PM (9 hours total, including break time)
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="font-semibold text-blue-900 text-sm">Custom Hours Per Day</p>
                        <p className="text-xs text-blue-800 mt-1">
                          Set different start times for each work day (all shifts are 9 hours total, including break time)
                        </p>
                      </div>
                      {hireData.workDays.length > 0 ? (
                        <div className="space-y-2">
                          {hireData.workDays.map((day: string) => (
                            <div key={day} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-semibold text-gray-900">{day}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <Label className="text-xs text-gray-600 mb-1 block">
                                    Start Time
                                  </Label>
                                  <Input
                                    type="time"
                                    value={hireData.customHours[day]}
                                    onChange={(e) => setHireData({
                                      ...hireData,
                                      customHours: {
                                        ...hireData.customHours,
                                        [day]: e.target.value
                                      }
                                    })}
                                    className="bg-white text-gray-900 border-gray-300 text-sm h-9"
                                  />
                                </div>
                                <div className="flex items-center justify-center pt-5 px-1">
                                  <span className="text-gray-400 font-bold text-sm">→</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Label className="text-xs text-gray-600 mb-1 block">
                                    End Time <span className="text-[10px] text-gray-500">(Auto-calculated)</span>
                                  </Label>
                                  <div className="h-9 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg flex items-center justify-center">
                                    <span className="text-sm font-bold text-green-700">
                                      {(() => {
                                        const startTime = hireData.customHours[day]
                                        if (!startTime) return convertTo12Hour('18:00')
                                        const [hours, minutes] = startTime.split(':').map(Number)
                                        const endHour = (hours + 9) % 24
                                        const endTime24 = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                                        return convertTo12Hour(endTime24)
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <p className="text-xs text-yellow-800">
                            Please select work days first to set custom hours
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Additional Notes */}
            <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
              <Label htmlFor="hireNotes" className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-gray-600" />
                Additional Information <span className="text-gray-400 text-sm font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="hireNotes"
                value={hireData.hireNotes}
                onChange={(e) => setHireData({ ...hireData, hireNotes: e.target.value })}
                placeholder="Share any additional details about the role or offer. e.g., salary package, benefits, specific responsibilities, team structure, special requirements..."
                rows={5}
                className="bg-white text-gray-900 border-gray-300"
              />
              <p className="text-xs text-gray-700 mt-2">
                Provide any additional context that will help the admin team process this hire request
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setHireModalOpen(false)
                  setHireData({ 
                    preferredStartDate: '', 
                    hireNotes: '',
                    isMonToFri: true,
                    workStartTime: '09:00',
                    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    hasCustomHours: false,
                    customHours: {}
                  })
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleHireRequest}
                disabled={
                  !hireData.preferredStartDate || 
                  hireData.workDays.length === 0 || 
                  (!hireData.hasCustomHours && !hireData.workStartTime) ||
                  hireRequestingId !== null
                }
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
              >
                {hireRequestingId ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-lg bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Reject Candidate</DialogTitle>
            <DialogDescription className="text-gray-600">
              Optionally provide a reason for rejecting this candidate. Your feedback helps us improve our screening process.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {/* Rejection Reason Section */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border-2 border-red-200">
              <Label htmlFor="rejectReason" className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <XCircle className="h-5 w-5 text-red-600" />
                Rejection Reason <span className="text-gray-400 text-sm font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="rejectReason"
                value={rejectData.rejectReason}
                onChange={(e) => setRejectData({ rejectReason: e.target.value })}
                placeholder="Share your feedback on why this candidate isn't the right fit. e.g., skills mismatch, communication concerns, experience level, cultural fit..."
                rows={4}
                className="bg-white text-gray-900 border-gray-300 text-base"
              />
              <p className="text-xs text-red-700 mt-2">
                If no reason is provided, a default message will be recorded
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setRejectModalOpen(false)
                  setRejectData({ rejectReason: '' })
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all text-base"
              >
                Cancel
              </button>
              <button
                disabled={rejectingId !== null}
                onClick={handleRejectRequest}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {rejectingId ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Interview Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-lg bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Cancel Interview Request</DialogTitle>
            <DialogDescription className="text-gray-600">
              Please provide a reason for cancelling this interview request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {/* Cancellation Reason Section */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border-2 border-orange-200">
              <Label htmlFor="cancelReason" className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <XCircle className="h-5 w-5 text-orange-600" />
                Reason for Cancellation
              </Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Share why you need to cancel this interview. e.g., position filled, candidate no longer available, timeline changed, requirements updated..."
                rows={4}
                className="bg-white text-gray-900 border-gray-300 text-base"
              />
              <p className="text-xs text-orange-700 mt-2">
                This information helps us understand your hiring needs better
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all text-base"
              >
                Keep Interview
              </button>
              <button
                disabled={interviewSubmitting}
                onClick={async () => {
                  if (!selectedInterview) return
                  setInterviewSubmitting(true)
                  try {
                    const response = await fetch(`/api/client/interviews/${selectedInterview.id}/cancel`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason: cancelReason })
                    })
                    if (response.ok) {
                      toast({ title: "Success", description: "Interview request cancelled" })
                      setCancelModalOpen(false)
                      setCancelReason('')
                      fetchInterviews()
                    } else {
                      throw new Error('Failed to cancel')
                    }
                  } catch (error) {
                    toast({ title: "Error", description: "Failed to cancel interview", variant: "destructive" })
                  } finally {
                    setInterviewSubmitting(false)
                  }
                }}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {interviewSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Reschedule Modal */}
      <Dialog open={rescheduleModalOpen} onOpenChange={(open) => {
        setRescheduleModalOpen(open)
        if (!open) {
          setRescheduleNotes('')
          setReschedulePreferredTimes(['', ''])
        }
      }}>
        <DialogContent className="max-w-lg w-full bg-white text-gray-900 max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Request Reschedule</DialogTitle>
            <DialogDescription className="text-gray-600">
              Provide new preferred times for rescheduling this interview.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {/* Preferred Times Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-200">
              <Label className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-indigo-600" />
                New Preferred Interview Times
              </Label>
              <p className="text-xs text-indigo-700 mb-3">
                Provide 2-3 new time options that work for you. We'll check availability and confirm.
              </p>
              <div className="bg-white/60 border border-indigo-300 rounded-lg p-3 mb-4">
                <p className="text-xs text-indigo-900 font-medium">
                  Times in your timezone: <span className="font-bold">{(() => {
                    const tzMap: Record<string, string> = {
                      'Australia/Sydney': 'Sydney Time (AEDT)',
                      'Australia/Melbourne': 'Melbourne Time (AEDT)',
                      'Australia/Brisbane': 'Brisbane Time (AEST)',
                      'Australia/Adelaide': 'Adelaide Time (ACDT)',
                      'Australia/Perth': 'Perth Time (AWST)',
                      'America/New_York': 'Eastern Time (ET)',
                      'America/Chicago': 'Central Time (CT)',
                      'America/Denver': 'Mountain Time (MT)',
                      'America/Los_Angeles': 'Pacific Time (PT)',
                      'Pacific/Auckland': 'New Zealand Time (NZDT)',
                    }
                    return tzMap[clientTimezone] || clientTimezone
                  })()}</span>
                </p>
              </div>
              <div className="space-y-3">
                {reschedulePreferredTimes.map((time: string, index: number) => {
                  const parseTimeSlot = (t: string) => {
                    if (!t) return { date: '', hour: 9, minute: 0, ampm: 'AM' }
                    const [datePart, timePart] = t.split('T')
                    const [hourStr, minuteStr] = timePart.split(':')
                    const hour24 = parseInt(hourStr)
                    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
                    const ampm = hour24 >= 12 ? 'PM' : 'AM'
                    return { date: datePart, hour: hour12, minute: parseInt(minuteStr), ampm }
                  }
                  
                  const buildTimeSlot = (date: string, hour: number, minute: number, ampm: string) => {
                    const hour24 = ampm === 'PM' ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour)
                    return `${date}T${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
                  }

                  const parsed = parseTimeSlot(time)
                  return (
                    <div key={index} className="flex gap-1.5 items-center">
                      <input
                        type="date"
                        value={parsed.date}
                        onChange={(e) => {
                          const newTime = buildTimeSlot(e.target.value, parsed.hour, parsed.minute, parsed.ampm)
                          const updated = [...reschedulePreferredTimes]
                          updated[index] = newTime
                          setReschedulePreferredTimes(updated)
                        }}
                        className="flex-1 min-w-0 px-2 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white text-sm"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <select
                        value={parsed.hour}
                        onChange={(e) => {
                          const newTime = buildTimeSlot(parsed.date, parseInt(e.target.value), parsed.minute, parsed.ampm)
                          const updated = [...reschedulePreferredTimes]
                          updated[index] = newTime
                          setReschedulePreferredTimes(updated)
                        }}
                        className="w-16 px-1 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white text-sm"
                      >
                        {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <select
                        value={parsed.minute}
                        onChange={(e) => {
                          const newTime = buildTimeSlot(parsed.date, parsed.hour, parseInt(e.target.value), parsed.ampm)
                          const updated = [...reschedulePreferredTimes]
                          updated[index] = newTime
                          setReschedulePreferredTimes(updated)
                        }}
                        className="w-16 px-1 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white text-sm"
                      >
                        {[0, 15, 30, 45].map(m => (
                          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                        ))}
                      </select>
                      <select
                        value={parsed.ampm}
                        onChange={(e) => {
                          const newTime = buildTimeSlot(parsed.date, parsed.hour, parsed.minute, e.target.value)
                          const updated = [...reschedulePreferredTimes]
                          updated[index] = newTime
                          setReschedulePreferredTimes(updated)
                        }}
                        className="w-16 px-1 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white text-sm"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      {index > 1 && (
                        <button
                          onClick={() => setReschedulePreferredTimes(reschedulePreferredTimes.filter((_: string, i: number) => i !== index))}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
                {reschedulePreferredTimes.length < 5 && (
                  <button
                    onClick={() => setReschedulePreferredTimes([...reschedulePreferredTimes, ''])}
                    className="w-full px-4 py-2 border-2 border-dashed border-indigo-300 text-indigo-700 rounded-xl hover:bg-white/80 hover:border-indigo-400 transition-all font-medium text-sm"
                  >
                    + Add Another Time Option
                  </button>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border-2 border-slate-200">
              <Label htmlFor="rescheduleNotes" className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-slate-600" />
                Additional Notes <span className="text-gray-400 text-sm font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="rescheduleNotes"
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                placeholder="Share why you need to reschedule. e.g., scheduling conflict, need more preparation time, unexpected meeting, availability changed..."
                rows={3}
                className="bg-white text-gray-900 border-gray-300 text-base"
              />
              <p className="text-xs text-slate-700 mt-2">
                Let us know why you need to reschedule
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setRescheduleModalOpen(false)
                  setRescheduleNotes('')
                  setReschedulePreferredTimes(['', ''])
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all text-base"
              >
                Cancel
              </button>
              <button
                disabled={interviewSubmitting || !reschedulePreferredTimes.filter((t: string) => t.trim() !== '').length}
                onClick={async () => {
                  if (!selectedInterview) return
                  
                  // Filter out empty times
                  const times = reschedulePreferredTimes.filter((t: string) => t.trim() !== '')
                  if (times.length === 0) {
                    toast({ title: "Error", description: "Please provide at least one preferred time", variant: "destructive" })
                    return
                  }

                  setInterviewSubmitting(true)
                  try {
                    // Format times with timezone information
                    const timesWithTimezone = times.map((time: string) => ({
                      datetime: time,
                      timezone: clientTimezone,
                      timezoneDisplay: (() => {
                        const tzMap: Record<string, string> = {
                          'Australia/Sydney': 'Sydney Time (AEDT)',
                          'Australia/Melbourne': 'Melbourne Time (AEDT)',
                          'Australia/Brisbane': 'Brisbane Time (AEST)',
                          'Australia/Adelaide': 'Adelaide Time (ACDT)',
                          'Australia/Perth': 'Perth Time (AWST)',
                          'America/New_York': 'Eastern Time (ET)',
                          'America/Chicago': 'Central Time (CT)',
                          'America/Denver': 'Mountain Time (MT)',
                          'America/Los_Angeles': 'Pacific Time (PT)',
                          'Pacific/Auckland': 'New Zealand Time (NZDT)',
                        }
                        return tzMap[clientTimezone] || clientTimezone
                      })()
                    }))

                    const response = await fetch(`/api/client/interviews/${selectedInterview.id}/reschedule-request`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        notes: rescheduleNotes || undefined,
                        preferred_times: timesWithTimezone
                      })
                    })
                    if (response.ok) {
                      toast({ title: "Success", description: "Reschedule request sent to admin team with new preferred times" })
                      setRescheduleModalOpen(false)
                      setRescheduleNotes('')
                      setReschedulePreferredTimes(['', ''])
                      fetchInterviews()
                    } else {
                      throw new Error('Failed to send request')
                    }
                  } catch (error) {
                    toast({ title: "Error", description: "Failed to send reschedule request", variant: "destructive" })
                  } finally {
                    setInterviewSubmitting(false)
                  }
                }}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {interviewSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Update Notes Modal */}
      <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <DialogContent className="max-w-lg bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Add Notes to Interview</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add new notes to this interview request. They will be appended to your existing notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {/* Notes Section */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border-2 border-slate-200">
              <Label htmlFor="additionalNotes" className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-slate-600" />
                New Notes
              </Label>
              <Textarea
                id="additionalNotes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Add your notes about this interview. e.g., candidate impressions, follow-up items, questions to ask, scheduling preferences..."
                rows={4}
                className="bg-white text-gray-900 border-gray-300 text-base"
              />
              <p className="text-xs text-slate-700 mt-2">
                Notes will be timestamped and added to the interview history
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setNotesModalOpen(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all text-base"
              >
                Cancel
              </button>
              <button
                disabled={interviewSubmitting || !additionalNotes.trim()}
                onClick={async () => {
                  if (!selectedInterview) return
                  setInterviewSubmitting(true)
                  try {
                    // API will add timestamp automatically
                    const response = await fetch(`/api/client/interviews/${selectedInterview.id}/notes`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ notes: additionalNotes.trim() })
                    })
                    if (response.ok) {
                      toast({ title: "Success", description: "Notes updated successfully" })
                      setNotesModalOpen(false)
                      fetchInterviews()
                    } else {
                      throw new Error('Failed to update notes')
                    }
                  } catch (error) {
                    toast({ title: "Error", description: "Failed to update notes", variant: "destructive" })
                  } finally {
                    setInterviewSubmitting(false)
                  }
                }}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {interviewSubmitting ? 'Adding...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Undo Cancel Request Modal */}
      <Dialog open={undoCancelModalOpen} onOpenChange={(open) => {
        setUndoCancelModalOpen(open)
        if (!open) setUndoCancelNotes('')
      }}>
        <DialogContent className="max-w-lg bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Reopen Interview Request</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add optional notes about reopening this interview request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {/* Reopening Notes Section */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border-2 border-teal-200">
              <Label htmlFor="undoCancelNotes" className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-teal-600" />
                Reopening Notes <span className="text-gray-400 text-sm font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="undoCancelNotes"
                value={undoCancelNotes}
                onChange={(e) => setUndoCancelNotes(e.target.value)}
                placeholder="Share why you're reopening this interview. e.g., position still available, reconsidered timeline, candidate still interested, new information..."
                rows={4}
                className="bg-white text-gray-900 border-gray-300 text-base"
              />
              <p className="text-xs text-teal-700 mt-2">
                The interview will be set back to pending status
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setUndoCancelModalOpen(false)
                  setUndoCancelNotes('')
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all text-base"
              >
                Cancel
              </button>
              <button
                disabled={interviewSubmitting}
                onClick={async () => {
                  if (!selectedInterview) return
                  
                  setInterviewSubmitting(true)
                  try {
                    // Undo the cancellation with optional notes
                    const response = await fetch(`/api/client/interviews/${selectedInterview.id}/undo-cancel`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        notes: undoCancelNotes.trim() || undefined 
                      })
                    })
                    
                    if (!response.ok) {
                      throw new Error('Failed to undo cancellation')
                    }
                    
                    toast({ 
                      title: "Success", 
                      description: "Interview request has been reopened and set to pending status" 
                    })
                    setUndoCancelModalOpen(false)
                    setUndoCancelNotes('')
                    fetchInterviews()
                  } catch (error) {
                    toast({ 
                      title: "Error", 
                      description: "Failed to undo cancellation", 
                      variant: "destructive" 
                    })
                  } finally {
                    setInterviewSubmitting(false)
                  }
                }}
                className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {interviewSubmitting ? 'Reopening...' : 'Reopen Interview'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reconsider Candidate Modal */}
      <Dialog open={undoRejectModalOpen} onOpenChange={(open) => {
        setUndoRejectModalOpen(open)
        if (!open) setUndoRejectNotes('')
      }}>
        <DialogContent className="max-w-lg bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Reconsider Candidate</DialogTitle>
            <DialogDescription className="text-gray-600">
              This will change the interview status back to Completed, allowing you to request to hire this candidate. Share your thoughts on reconsidering them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {/* Reconsideration Notes Section */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border-2 border-emerald-200">
              <Label htmlFor="undoRejectNotes" className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Reconsideration Notes <span className="text-gray-400 text-sm font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="undoRejectNotes"
                value={undoRejectNotes}
                onChange={(e) => setUndoRejectNotes(e.target.value)}
                placeholder="Share why you're reconsidering this candidate. e.g., new position opened, received positive feedback, reconsidered requirements, timeline changed..."
                rows={4}
                className="bg-white text-gray-900 border-gray-300 text-base"
              />
              <p className="text-xs text-emerald-700 mt-2">
                The candidate will be moved back to Completed status
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setUndoRejectModalOpen(false)
                  setUndoRejectNotes('')
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all text-base"
              >
                Cancel
              </button>
              <button
                disabled={interviewSubmitting}
                onClick={async () => {
                  if (!selectedInterview) return
                  
                  setInterviewSubmitting(true)
                  try {
                    // Undo the rejection with optional notes
                    const response = await fetch(`/api/client/interviews/${selectedInterview.id}/undo-reject`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        notes: undoRejectNotes.trim() || undefined 
                      })
                    })
                    
                    if (!response.ok) {
                      throw new Error('Failed to undo rejection')
                    }
                    
                    toast({ 
                      title: "Candidate Reconsidered", 
                      description: "The candidate is now back to Completed status. You can request to hire them again." 
                    })
                    setUndoRejectModalOpen(false)
                    setUndoRejectNotes('')
                    fetchInterviews()
                  } catch (error) {
                    toast({ 
                      title: "Error", 
                      description: "Failed to reconsider candidate", 
                      variant: "destructive" 
                    })
                  } finally {
                    setInterviewSubmitting(false)
                  }
                }}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {interviewSubmitting ? 'Reconsidering...' : 'Reconsider'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
