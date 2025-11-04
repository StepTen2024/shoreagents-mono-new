"use client"

/**
 * COMBINED RECRUITMENT PAGE - Talent Pool + Job Requests
 * 
 * Tab 1: 🔍 Talent Pool - Browse & Search 26 candidates
 * Tab 2: 📋 Job Requests - Create & Manage job postings
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Mail
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
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'HIRED' | 'HIRE-REQUESTED' | 'HIRE_REQUESTED' | 'OFFER-SENT' | 'OFFER_SENT' | 'OFFER-ACCEPTED' | 'OFFER_ACCEPTED' | 'OFFER-DECLINED' | 'OFFER_DECLINED' | 'REJECTED'
  createdAt: string
  updatedAt: string
  scheduledTime: string | null
  adminNotes: string | null
  meetingLink: string | null
  clientPreferredStart?: string | null
  candidateAvatar?: string
}

type TabType = 'talent-pool' | 'job-requests' | 'interviews'

export default function RecruitmentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('talent-pool')
  
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
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  })
  const [rejectData, setRejectData] = useState({ rejectReason: '' })
  
  // Interview Management Modals
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [undoCancelModalOpen, setUndoCancelModalOpen] = useState(false)
  
  // Form states for interview management
  const [cancelReason, setCancelReason] = useState('')
  const [rescheduleNotes, setRescheduleNotes] = useState('')
  const [reschedulePreferredTimes, setReschedulePreferredTimes] = useState<string[]>(['', ''])
  const [clientTimezone, setClientTimezone] = useState<string>('Australia/Brisbane')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [undoCancelNotes, setUndoCancelNotes] = useState('')
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
      const formattedNotes = `[${timestamp}] Hire Request Notes: ${noteText}`
      
      const response = await fetch("/api/client/interviews/hire-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewRequestId: selectedInterview.id,
          preferredStartDate: hireData.preferredStartDate,
          notes: formattedNotes,
          workSchedule: {
            workDays: hireData.workDays,
            workStartTime: hireData.workStartTime,
            isMonToFri: hireData.isMonToFri
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
          workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
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
    if (!selectedInterview || !rejectData.rejectReason.trim()) {
      alert("Please provide a reason for rejection")
      return
    }
    
    try {
      setRejectingId(selectedInterview.id)
      
      // Format rejection reason with timestamp
      const timestamp = new Date().toLocaleString('en-US')
      const formattedReason = `[${timestamp}] Rejection Reason: ${rejectData.rejectReason.trim()}`
      
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
            setActiveTab('talent-pool')
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
          onClick={() => setActiveTab('job-requests')}
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
          onClick={() => setActiveTab('interviews')}
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by skills, role, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            showFilters
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
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
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Skills Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                {availableSkills.slice(0, 20).map((skill: string) => (
                  <label key={skill} className="flex items-center gap-2 py-1 hover:bg-gray-50 px-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="City or Country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Experience Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personality Type (DISC)
            </label>
            <div className="flex gap-2">
              {['D', 'I', 'S', 'C'].map(type => (
                <button
                  key={type}
                  onClick={() => toggleDiscType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedDiscTypes.includes(type)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
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
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No candidates found matching your criteria</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate: Candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onClick={() => router.push(`/client/talent-pool/${candidate.id}`)}
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
      className="relative bg-white rounded-2xl shadow-lg transition-all duration-500 cursor-pointer border border-gray-100 hover:border-transparent hover:-translate-y-2 overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-sm -z-10"></div>
      
      <div className={`h-1.5 bg-gradient-to-r ${getGradient()} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
      </div>

      <div className={`relative bg-gradient-to-br ${getGradient()} p-6 text-white overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-4">
              {candidate.avatar ? (
                <div className="relative">
                  <img
                    src={candidate.avatar}
                    alt={candidate.firstName}
                    className="w-20 h-20 rounded-2xl border-3 border-white/30 shadow-2xl backdrop-blur-sm ring-4 ring-white/20 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                </div>
              ) : (
                <div className="relative w-20 h-20 rounded-2xl border-3 border-white/30 shadow-2xl backdrop-blur-sm bg-white/20 flex items-center justify-center text-3xl font-bold ring-4 ring-white/20 group-hover:scale-105 transition-transform duration-300">
                  {candidate.firstName[0]}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
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
              <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-bold">{candidate.leaderboardScore}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-white/95 backdrop-blur-sm bg-white/10 rounded-lg px-3 py-1.5 w-fit">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">{candidate.location}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {candidate.bio && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-5">
            {candidate.bio}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-5">
          {candidate.culturalFitScore && candidate.culturalFitScore >= 60 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{candidate.culturalFitScore}% Match</span>
            </div>
          )}
          {candidate.discType && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 shadow-sm">
              <Zap className="w-3.5 h-3.5" />
              <span>DISC: {candidate.discType}</span>
            </div>
          )}
          {candidate.typingWpm && candidate.typingWpm >= 40 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200 shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{candidate.typingWpm} WPM</span>
            </div>
          )}
        </div>

        <div className="mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-8 h-px bg-gradient-to-r from-blue-400 to-transparent"></span>
            Top Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 hover:border-blue-300 transition-all duration-200"
              >
                {skill}
              </span>
            ))}
            {candidate.skills.length > 5 && (
              <span className="px-3 py-1.5 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500 rounded-lg text-xs font-semibold border border-gray-200">
                +{candidate.skills.length - 5} more
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-5">
          <Award className="w-4 h-4 text-blue-500" />
          <span className="font-semibold">{candidate.experienceYears}</span>
          <span>years of experience</span>
        </div>

        <button className="relative w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold rounded-xl overflow-hidden group-hover:scale-[1.02] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
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
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading job requests...</p>
          </div>
    )
  }

  if (jobRequests.length === 0) {
    return (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Job Requests Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first job request to find top talent from the BPOC platform
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Job Request
            </Button>
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
  interviewSubmitting,
  setInterviewSubmitting,
  fetchInterviews,
  toast
}: any) {
  // Helper functions
  function getStatusBadge(status: InterviewRequest['status']) {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-300',
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

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function formatPreferredTime(time: string | PreferredTime) {
    try {
      // Handle new object format
      if (typeof time === 'object' && time.datetime) {
        const date = new Date(time.datetime)
        const formatted = date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        return `${formatted} (${time.timezoneDisplay})`
      }
      
      // Handle old string format
      const date = new Date(time as string)
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      // Fallback
      return typeof time === 'string' ? time : time.datetime
    }
  }
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (interviews.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Interview Requests Yet</h3>
        <p className="text-gray-600">
          When you request interviews with candidates, they will appear here
        </p>
      </Card>
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
        <Filter className="h-4 w-4 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">Filter by status:</span>
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
        <Card className="p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} interviews found</h3>
          <p className="text-gray-600">
            Try selecting a different status filter
          </p>
        </Card>
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
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {interview.candidateFirstName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Requested on {formatDate(interview.createdAt)}
                    </p>
                  </div>
                </div>
                {getStatusBadge(interview.status)}
              </div>

              {/* Status Message - Dynamic Background */}
              <div className={`rounded-lg p-6 border-l-4 shadow-sm ${
                interview.status === 'PENDING' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-yellow-500' :
                interview.status === 'SCHEDULED' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-l-blue-500' :
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
                          <span className="font-semibold">Time:</span> {formatDate(interview.scheduledTime)}
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
                        The admin team has been notified of your decision.
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

              {/* Your Preferred Times */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Your Preferred Times:</span>
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

              {/* Combined Notes (Client + Admin) */}
              {(() => {
                const clientNotes = interview.clientNotes || '';
                const adminNotes = interview.adminNotes || '';
                
                if (!clientNotes && !adminNotes) return null;

                // Parse notes and combine them
                const parseNotes = (notesText: string, type: 'client' | 'admin') => {
                  if (!notesText) return [];
                  
                  // Split by timestamp pattern: [date] text
                  const entries = notesText.split(/\n\n(?=\[)/);
                  
                  return entries.map(entry => {
                    const match = entry.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
                    if (match) {
                      const [, timestamp, content] = match;
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
                              <span className="text-xs text-gray-500">{entry.timestamp}</span>
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
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium transition-all flex items-center gap-2 text-sm"
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

                {/* Add Notes - Show for all statuses */}
                <button
                  onClick={() => {
                    setSelectedInterview(interview)
                    setAdditionalNotes('')
                    setNotesModalOpen(true)
                  }}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all flex items-center gap-2 text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  Add Notes
                </button>

                {/* Cancel Interview - Show for pending or scheduled */}
                {(interview.status === 'PENDING' || interview.status === 'SCHEDULED') && (
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

                {/* Undo Cancel Request - Show for cancelled interviews */}
                      {interview.status === 'CANCELLED' && (
                        <button
                          onClick={() => {
                            setSelectedInterview(interview)
                            setUndoCancelNotes('')
                            setUndoCancelModalOpen(true)
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium transition-all flex items-center gap-2 text-sm"
                        >
                          <CalendarCheck className="h-4 w-4" />
                          Undo Cancel Request
                        </button>
                      )}
              </div>

            </div>
          </div>
        </Card>
      ))}
        </div>
      )}

      {/* Hire Modal */}
      <Dialog open={hireModalOpen} onOpenChange={setHireModalOpen}>
        <DialogContent className="bg-white text-gray-900 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Request to Hire Candidate</DialogTitle>
            <DialogDescription className="text-gray-600">
              Provide details about the hire request for the admin team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preferred Start Date */}
            <div>
              <Label htmlFor="preferredStartDate" className="text-gray-900">
                Preferred Start Date *
              </Label>
              <Input
                id="preferredStartDate"
                type="date"
                value={hireData.preferredStartDate}
                onChange={(e) => setHireData({ ...hireData, preferredStartDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="mt-2 bg-white text-gray-900 border-gray-300"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Date will display in your local format (DD/MM/YYYY). Admin will confirm with candidate.
              </p>
            </div>

            {/* Work Schedule Section */}
            <div>
              <Label className="text-gray-900">Work Schedule</Label>
              
              {/* Work Days */}
              <div className="space-y-2 mt-2">
                <Label className="text-gray-900 text-sm">Work Days *</Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hireData.isMonToFri}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setHireData({ 
                          ...hireData, 
                          isMonToFri: checked,
                          workDays: checked 
                            ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                            : hireData.workDays
                        })
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Monday to Friday</span>
                  </label>
                </div>
                {!hireData.isMonToFri && (
                  <div className="ml-6 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="font-medium text-blue-900 mb-1">Custom Schedule</p>
                    <p>Select 5 consecutive working days in the next step with admin</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Filipino staff work 9-hour shifts (including breaks)</p>
              </div>

              {/* Start Time */}
              <div className="mt-3">
                <Label htmlFor="workStartTime" className="text-gray-900 text-sm">
                  Work Start Time *
                </Label>
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    id="workStartTime"
                    type="time"
                    value={hireData.workStartTime}
                    onChange={(e) => setHireData({ ...hireData, workStartTime: e.target.value })}
                    className="bg-white text-gray-900 border-gray-300 w-40"
                    required
                  />
                  <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <span className="font-medium">End: </span>
                    {(() => {
                      const [hours, minutes] = hireData.workStartTime.split(':').map(Number)
                      const endHour = (hours + 9) % 24
                      return `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                    })()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Notes */}
            <div>
              <Label htmlFor="hireNotes" className="text-gray-900">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="hireNotes"
                value={hireData.hireNotes}
                onChange={(e) => setHireData({ ...hireData, hireNotes: e.target.value })}
                placeholder="Any additional information for the admin (e.g., salary offer, benefits, role details, etc.)"
                rows={4}
                className="mt-2 bg-white text-gray-900 border-gray-300"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setHireModalOpen(false)
                  setHireData({ 
                    preferredStartDate: '', 
                    hireNotes: '',
                    isMonToFri: true,
                    workStartTime: '09:00',
                    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                  })
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleHireRequest}
                disabled={!hireData.preferredStartDate || hireRequestingId !== null}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hireRequestingId ? 'Sending...' : 'Send Hire Request'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Reject Candidate</DialogTitle>
            <DialogDescription className="text-gray-600">
              Please provide a reason for rejecting this candidate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason" className="text-gray-900">Rejection Reason</Label>
              <Textarea
                id="rejectReason"
                value={rejectData.rejectReason}
                onChange={(e) => setRejectData({ rejectReason: e.target.value })}
                placeholder="Please explain why this candidate is not a good fit..."
                rows={4}
                className="mt-2 bg-white text-gray-900 border-gray-300"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be sent to the admin team for their records
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectModalOpen(false)
                  setRejectData({ rejectReason: '' })
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                disabled={!rejectData.rejectReason.trim() || rejectingId !== null}
                onClick={handleRejectRequest}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectingId ? 'Rejecting...' : 'Reject Candidate'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Interview Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-md bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Cancel Interview Request</DialogTitle>
            <DialogDescription className="text-gray-600">
              Please provide a reason for cancelling this interview request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason" className="text-gray-900">Reason for Cancellation</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="E.g., Position filled, candidate unavailable..."
                rows={4}
                className="mt-2 bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <DialogTitle className="text-gray-900">Request Reschedule</DialogTitle>
            <DialogDescription className="text-gray-600">
              Provide new preferred times for rescheduling this interview.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Preferred Times */}
            <div>
              <Label className="text-gray-900 font-medium mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                New Preferred Interview Times
              </Label>
              <p className="text-xs text-gray-600 mb-2">
                Provide 2-3 new time options that work for you. We'll check availability and confirm.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                <p className="text-xs text-blue-900 font-medium">
                  🌍 Times in your timezone: <span className="font-bold">{(() => {
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
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-sm"
                  >
                    + Add Another Time Option
                  </button>
                )}
              </div>
            </div>

            {/* Notes (Optional) */}
            <div>
              <Label htmlFor="rescheduleNotes" className="text-gray-900">Additional Notes (Optional)</Label>
              <Textarea
                id="rescheduleNotes"
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                placeholder="E.g., Can we move this to next week? I have a conflict..."
                rows={3}
                className="mt-2 bg-white text-gray-900 border-gray-300"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRescheduleModalOpen(false)
                  setRescheduleNotes('')
                  setReschedulePreferredTimes(['', ''])
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {interviewSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Update Notes Modal */}
      <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <DialogContent className="max-w-md bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add Notes to Interview</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add new notes to this interview request. They will be appended to your existing notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="additionalNotes" className="text-gray-900">New Notes</Label>
              <Textarea
                id="additionalNotes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Type your new notes here..."
                rows={4}
                className="mt-2 bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setNotesModalOpen(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                disabled={interviewSubmitting}
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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {interviewSubmitting ? 'Adding...' : 'Add Notes'}
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
        <DialogContent className="max-w-md bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Reopen Interview Request</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add optional notes about reopening this interview request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="undoCancelNotes" className="text-gray-900">Reopening Notes (Optional)</Label>
              <Textarea
                id="undoCancelNotes"
                value={undoCancelNotes}
                onChange={(e) => setUndoCancelNotes(e.target.value)}
                placeholder="Add any notes about why you're reopening this interview..."
                rows={4}
                className="mt-2 bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setUndoCancelModalOpen(false)
                  setUndoCancelNotes('')
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {interviewSubmitting ? 'Reopening...' : 'Reopen Interview'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
