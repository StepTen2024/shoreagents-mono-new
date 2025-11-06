"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  Search, 
  Briefcase, 
  Users, 
  Calendar, 
  Eye,
  Filter,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  UserCheck,
  TrendingUp,
  Star,
  Award,
  Zap,
  CheckCircle,
  Mail,
  XCircle,
  User,
  Phone,
  FileText,
  Loader2,
  CalendarCheck
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { RecruitmentCandidatesTab } from "@/components/admin/recruitment-candidates-tab"

// Types
interface Candidate {
  id: string
  first_name: string
  avatar_url: string | null
  location_city: string
  location_country: string
  position: string
  bio: string
  resume_data: any
  latest_primary_type: string
  overall_score: number
}

interface JobRequest {
  id: number
  job_title: string
  job_description: string
  work_type: string
  work_arrangement: string
  experience_level: string
  salary_min: string
  salary_max: string
  currency: string
  department: string
  industry: string
  status: string
  skills: string[]
  created_at: string
  applicants: number
  views: number
  company_id: string
}

interface PreferredTime {
  datetime: string
  timezone: string
  timezoneDisplay: string
}

interface InterviewRequest {
  id: string
  clientUserId: string
  bpocCandidateId: string
  bpoc_candidate_id?: string // snake_case variant
  candidateFirstName: string
  preferredTimes: (string | PreferredTime)[]
  preferred_times?: (string | PreferredTime)[] // snake_case variant
  clientNotes: string | null
  client_notes?: string | null // snake_case variant
  status: string
  createdAt: string
  created_at?: string // snake_case variant
  clientPreferredStart?: string | null
  scheduledTime?: string | null
  meetingLink?: string | null
  adminNotes?: string | null
  workSchedule?: {
    workDays: string[]
    workStartTime: string | null
    isMonToFri: boolean
    clientTimezone?: string
    hasCustomHours?: boolean
    customHours?: Record<string, string>
  } | null
  client_name?: string
  client_email?: string
  client_phone?: string | null
  client_address?: string | null
  company_name?: string
  // Candidate data from BPOC
  candidate_avatar_url?: string | null
  candidate_position?: string | null
  candidate_location?: string | null
  candidate_email?: string | null
  candidate_phone?: string | null
  client_users?: {
    id: string
    name: string
    email: string
    companyId: string
    company?: {
      id: string
      companyName: string
      logo?: string
    }
    client_profiles?: {
      timezone: string
    }
  }
}

type TabType = 'candidates' | 'job-requests' | 'interviews'

// Helper function to convert 24-hour time to 12-hour format with AM/PM
const convertTo12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`
}

// Helper functions for time picker (30-minute intervals)
function parseTimeSlot(time: string) {
  if (!time) return { date: '', hour: 9, minute: 0, ampm: 'AM' } // Default to 9 AM
  const [datePart, timePart] = time.split('T')
  const [hourStr, minuteStr] = timePart.split(':')
  const hour24 = parseInt(hourStr)
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
  const ampm = hour24 >= 12 ? 'PM' : 'AM'
  return { date: datePart, hour: hour12, minute: parseInt(minuteStr), ampm }
}

function buildTimeSlot(date: string, hour: number, minute: number, ampm: string) {
  let hour24 = hour
  if (ampm === 'PM' && hour !== 12) hour24 = hour + 12
  if (ampm === 'AM' && hour === 12) hour24 = 0
  
  const hourStr = hour24.toString().padStart(2, '0')
  const minStr = minute.toString().padStart(2, '0')
  return `${date}T${hourStr}:${minStr}`
}

export default function AdminRecruitmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize activeTab from URL or default to 'candidates'
  const tabFromUrl = searchParams.get('tab') as TabType | null
  const initialTab = (tabFromUrl && ['candidates', 'job-requests', 'interviews'].includes(tabFromUrl)) 
    ? tabFromUrl 
    : 'candidates'
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  
  // Function to change tab and update URL
  const changeTab = (tab: TabType) => {
    setActiveTab(tab)
    router.push(`/admin/recruitment?tab=${tab}`, { scroll: false })
  }
  
  // Candidates State
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidatesLoading, setCandidatesLoading] = useState(true)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  
  // Job Requests State
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobSearch, setJobSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState<JobRequest | null>(null)
  
  // Interview Requests State
  const [interviews, setInterviews] = useState<InterviewRequest[]>([])
  const [interviewsLoading, setInterviewsLoading] = useState(true)
  const [interviewSearch, setInterviewSearch] = useState('')
  const [selectedInterview, setSelectedInterview] = useState<InterviewRequest | null>(null)
  
  // Hire Modal State
  const [hireModalOpen, setHireModalOpen] = useState(false)
  const [interviewToHire, setInterviewToHire] = useState<InterviewRequest | null>(null)
  const [companies, setCompanies] = useState<Array<{id: string, companyName: string}>>([])
  const [hireFormData, setHireFormData] = useState({
    position: '',
    companyId: '',
    candidateEmail: '',
    candidatePhone: '',
    clientPreferredStart: '',
    salary: '',
    shiftType: 'DAY_SHIFT' as 'DAY_SHIFT' | 'NIGHT_SHIFT' | 'MID_SHIFT',
    workLocation: 'OFFICE' as 'WORK_FROM_HOME' | 'OFFICE' | 'HYBRID',
    hmoIncluded: false,
    leaveCredits: 12,
    clientTimezone: '',
    workHours: '9 hours (includes 1 hour break, 15 min either side)'
  })
  const [hiring, setHiring] = useState(false)
  
  // Schedule Interview Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [interviewToSchedule, setInterviewToSchedule] = useState<InterviewRequest | null>(null)
  const [scheduleFormData, setScheduleFormData] = useState({
    scheduledTime: '',
    meetingLink: '',
    adminNotes: ''
  })
  const [scheduling, setScheduling] = useState(false)
  
  // Admin Notes Modal State
  const [adminNotesModalOpen, setAdminNotesModalOpen] = useState(false)
  const [interviewForNotes, setInterviewForNotes] = useState<InterviewRequest | null>(null)
  const [adminNotesText, setAdminNotesText] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  
  // Completing state
  const [completing, setCompleting] = useState(false)
  
  // Finalize Hire Modal State (consolidated with confirm acceptance)
  const [confirmAcceptanceModalOpen, setConfirmAcceptanceModalOpen] = useState(false)
  const [interviewToConfirm, setInterviewToConfirm] = useState<InterviewRequest | null>(null)

  // Helper function to format times with dual timezone display
  function formatPreferredTimeWithTimezone(time: string | PreferredTime) {
    try {
      // Handle new object format
      if (typeof time === 'object' && time !== null && time.datetime) {
        const clientTimezone = time.timezone || 'UTC'
        const clientTzDisplay = time.timezoneDisplay || time.timezone || 'UTC'
        
        const localDateStr = time.datetime
        const parts = localDateStr.split('T')
        const [year, month, day] = parts[0].split('-').map(Number)
        const [hour, minute] = (parts[1] || '00:00').split(':').map(Number)
        
        // Format client time (just display the numbers as-is since they're in client's local time)
        const clientDate = new Date(year, month - 1, day, hour, minute)
        const clientTimeStr = clientDate.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        
        // To convert timezone properly:
        // 1. Create a UTC date (arbitrary, we'll adjust it)
        const utcRef = new Date(Date.UTC(year, month - 1, day, hour, minute))
        
        // 2. Format this UTC date in the client's timezone to see what time it shows
        const clientTestStr = utcRef.toLocaleString('en-US', {
          timeZone: clientTimezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
        
        // 3. Parse the result to find the offset
        const match = clientTestStr.match(/(\d+)\/(\d+)\/(\d+),?\s*(\d+):(\d+)/)
        if (!match) {
          return {
            clientTime: clientTimeStr,
            clientTimezone: clientTzDisplay,
            phTime: 'Error',
            fullDisplay: `${clientTimeStr} (${clientTzDisplay})`
          }
        }
        
        const [, testMonth, testDay, testYear, testHour, testMinute] = match.map(Number)
        
        // 4. Calculate the difference between what we wanted and what we got
        const wantedTime = new Date(year, month - 1, day, hour, minute).getTime()
        const gotTime = new Date(testYear, testMonth - 1, testDay, testHour, testMinute).getTime()
        const offsetMs = wantedTime - gotTime
        
        // 5. Create the correct UTC date by applying the offset
        const correctUTC = new Date(utcRef.getTime() + offsetMs)
        
        // 6. Format this correct UTC date in Manila timezone
        const phTimeStr = correctUTC.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Manila'
        })
        
        return {
          clientTime: clientTimeStr,
          clientTimezone: clientTzDisplay,
          phTime: phTimeStr,
          fullDisplay: `${clientTimeStr} (${clientTzDisplay}) → ${phTimeStr} (PH)`
        }
      }
      
      // Handle old string format
      const dateObj = new Date(time as string)
      if (isNaN(dateObj.getTime())) {
        return {
          clientTime: 'Invalid Date',
          clientTimezone: '',
          phTime: 'Invalid Date',
          fullDisplay: time as string
        }
      }
      
      // Format as UTC
      const utcTime = dateObj.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
      })
      
      // Convert to Philippine Time (Asia/Manila)
      const phTime = dateObj.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila'
      })
      
      return {
        clientTime: utcTime,
        clientTimezone: 'UTC',
        phTime,
        fullDisplay: `${utcTime} (UTC) → ${phTime} (PH)`
      }
    } catch (error) {
      console.error('Error formatting time:', error, time)
      return {
        clientTime: 'Error',
        clientTimezone: '',
        phTime: 'Error',
        fullDisplay: typeof time === 'string' ? time : JSON.stringify(time)
      }
    }
  }

  // Helper function to get friendly timezone display name
  function getTimezoneDisplay(timezone: string): string {
    const tzMap: Record<string, string> = {
      'Australia/Sydney': 'Sydney Time (AEDT)',
      'Australia/Melbourne': 'Melbourne Time (AEDT)',
      'Australia/Brisbane': 'Brisbane Time (AEST)',
      'Australia/Adelaide': 'Adelaide Time (ACDT)',
      'Australia/Perth': 'Perth Time (AWST)',
      'Australia/Darwin': 'Darwin Time (ACST)',
      'America/New_York': 'Eastern Time (ET)',
      'America/Chicago': 'Central Time (CT)',
      'America/Denver': 'Mountain Time (MT)',
      'America/Los_Angeles': 'Pacific Time (PT)',
      'America/Anchorage': 'Alaska Time (AKT)',
      'Pacific/Honolulu': 'Hawaii Time (HST)',
      'Pacific/Auckland': 'New Zealand Time (NZDT)',
      'Europe/London': 'London Time (GMT)',
      'Asia/Manila': 'Manila Time (PHT)',
    }
    return tzMap[timezone] || timezone
  }

  // Helper function to format work schedule times with timezone conversion
  function formatWorkTimeWithTimezone(time24: string, clientTimezone: string) {
    try {
      const [hours, minutes] = time24.split(':').map(Number)
      
      // Get friendly timezone display
      const tzDisplay = getTimezoneDisplay(clientTimezone)
      
      // Create a date object representing today at the given time
      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth()
      const day = today.getDate()
      
      // Create a UTC date
      const utcRef = new Date(Date.UTC(year, month, day, hours, minutes))
      
      // Format this UTC date in the client's timezone to see what time it shows
      const clientTestStr = utcRef.toLocaleString('en-US', {
        timeZone: clientTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      
      // Parse the result to find the offset
      const match = clientTestStr.match(/(\d+)\/(\d+)\/(\d+),?\s*(\d+):(\d+)/)
      if (!match) {
        // Fallback: just display the time as-is
        return {
          clientTime: convertTo12Hour(time24),
          clientTimezone: tzDisplay,
          phTime: convertTo12Hour(time24),
          fullDisplay: `${convertTo12Hour(time24)} (${tzDisplay})`
        }
      }
      
      const [, testMonth, testDay, testYear, testHour, testMinute] = match.map(Number)
      
      // Calculate the difference between what we wanted and what we got
      const wantedTime = new Date(year, month, day, hours, minutes).getTime()
      const gotTime = new Date(testYear, testMonth - 1, testDay, testHour, testMinute).getTime()
      const offsetMs = wantedTime - gotTime
      
      // Create the correct UTC date by applying the offset
      const correctUTC = new Date(utcRef.getTime() + offsetMs)
      
      // Format this correct UTC date in Manila timezone
      const phTimeStr = correctUTC.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila'
      })
      
      // Format client time
      const clientTimeStr = convertTo12Hour(time24)
      
      return {
        clientTime: clientTimeStr,
        clientTimezone: tzDisplay,
        phTime: phTimeStr,
        fullDisplay: `${clientTimeStr} (${tzDisplay}) → ${phTimeStr} (PH)`
      }
    } catch (error) {
      console.error('Error formatting work time with timezone:', error)
      const tzDisplay = getTimezoneDisplay(clientTimezone)
      return {
        clientTime: convertTo12Hour(time24),
        clientTimezone: tzDisplay,
        phTime: convertTo12Hour(time24),
        fullDisplay: `${convertTo12Hour(time24)} (${tzDisplay})`
      }
    }
  }

  const [confirmFormData, setConfirmFormData] = useState({
    confirmedStartDate: '',
    staffEmail: '',
    adminNotes: ''
  })
  const [confirming, setConfirming] = useState(false)
  
  // Decline Offer Modal State
  const [declineModalOpen, setDeclineModalOpen] = useState(false)
  const [interviewToDecline, setInterviewToDecline] = useState<InterviewRequest | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [declining, setDeclining] = useState(false)
  
  // Cancel Interview Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [interviewToCancel, setInterviewToCancel] = useState<InterviewRequest | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  
  // Undo Cancel Interview Modal State
  const [undoCancelModalOpen, setUndoCancelModalOpen] = useState(false)
  const [interviewToUndoCancel, setInterviewToUndoCancel] = useState<InterviewRequest | null>(null)
  const [undoCancelNotes, setUndoCancelNotes] = useState('')
  const [undoCancelling, setUndoCancelling] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    totalCandidates: 0,
    activeJobs: 0,
    pendingInterviews: 0,
    totalApplications: 0
  })
  
  const { toast } = useToast()

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'candidates') {
      fetchCandidates()
    } else if (activeTab === 'job-requests') {
      fetchJobRequests()
    } else if (activeTab === 'interviews') {
      fetchInterviews()
    }
  }, [activeTab])

  async function fetchCandidates() {
    try {
      setCandidatesLoading(true)
      const response = await fetch('/api/admin/recruitment/candidates')
      const data = await response.json()
      if (data.success) {
        setCandidates(data.candidates)
        setStats(prev => ({ ...prev, totalCandidates: data.candidates.length }))
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setCandidatesLoading(false)
    }
  }

  async function fetchJobRequests() {
    try {
      setJobsLoading(true)
      const response = await fetch('/api/admin/recruitment/job-requests')
      const data = await response.json()
      if (data.success) {
        setJobRequests(data.jobRequests)
        const activeCount = data.jobRequests.filter((j: JobRequest) => j.status === 'active').length
        const totalApps = data.jobRequests.reduce((sum: number, j: JobRequest) => sum + (j.applicants || 0), 0)
        setStats(prev => ({ 
          ...prev, 
          activeJobs: activeCount,
          totalApplications: totalApps 
        }))
      }
    } catch (error) {
      console.error('Error fetching job requests:', error)
    } finally {
      setJobsLoading(false)
    }
  }

  async function fetchInterviews() {
    try {
      setInterviewsLoading(true)
      const response = await fetch('/api/admin/recruitment/interviews')
      const data = await response.json()
      if (data.success) {
        console.log('🔍 [FRONTEND] Interviews received:', data.interviews.length)
        console.log('🔍 [FRONTEND] Interview statuses:', data.interviews.map((i: InterviewRequest) => ({ name: i.candidateFirstName, status: i.status })))
        console.log('📧 [FRONTEND] Sample candidate data:', data.interviews.map((i: InterviewRequest) => ({
          name: i.candidateFirstName,
          email: i.candidate_email,
          phone: i.candidate_phone,
          position: i.candidate_position,
          location: i.candidate_location
        })))
        setInterviews(data.interviews)
        const pendingCount = data.interviews.filter((i: InterviewRequest) => i.status === 'pending').length
        console.log('🔍 [FRONTEND] Pending count:', pendingCount)
        setStats(prev => ({ ...prev, pendingInterviews: pendingCount }))
      }
    } catch (error) {
      console.error('Error fetching interviews:', error)
    } finally {
      setInterviewsLoading(false)
    }
  }

  async function fetchCompanies() {
    try {
      const response = await fetch('/api/admin/companies')
      const data = await response.json()
      if (data.success) {
        setCompanies(data.companies)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  // Load companies on mount
  useEffect(() => {
    fetchCompanies()
  }, [])

  async function handleScheduleInterview() {
    if (!interviewToSchedule) return

    // Validation
    if (!scheduleFormData.scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please provide a scheduled time for the interview.",
        variant: "destructive"
      })
      return
    }

    setScheduling(true)
    try {
      const response = await fetch(`/api/admin/recruitment/interviews/${interviewToSchedule.id}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledTime: scheduleFormData.scheduledTime,
          meetingLink: scheduleFormData.meetingLink,
          adminNotes: scheduleFormData.adminNotes
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Interview Scheduled!",
          description: `Interview with ${interviewToSchedule.candidateFirstName} has been scheduled.`,
        })
        setScheduleModalOpen(false)
        fetchInterviews() // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to schedule interview')
      }
    } catch (error: any) {
      console.error('Error scheduling interview:', error)
      toast({
        title: "Schedule Failed",
        description: error.message || "Failed to schedule the interview. Please try again.",
        variant: "destructive"
      })
    } finally {
      setScheduling(false)
    }
  }

  async function handleSaveAdminNotes() {
    if (!interviewForNotes) return

    // Validation
    if (!adminNotesText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter notes to add.",
        variant: "destructive"
      })
      return
    }

    setSavingNotes(true)
    try {
      // API will add timestamp automatically
      const response = await fetch(`/api/admin/recruitment/interviews/${interviewForNotes.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: adminNotesText.trim() })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Notes Added!",
          description: `Notes added to interview with ${interviewForNotes.candidateFirstName}.`,
        })
        setAdminNotesModalOpen(false)
        setAdminNotesText('')
        fetchInterviews() // Refresh the list
        // Also update selectedInterview if it's the same one
        if (selectedInterview?.id === interviewForNotes.id) {
          setSelectedInterview(null)
        }
      } else {
        throw new Error(data.error || 'Failed to add notes')
      }
    } catch (error: any) {
      console.error('Error adding notes:', error)
      toast({
        title: "Failed to Add Notes",
        description: error.message || "Failed to add notes. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSavingNotes(false)
    }
  }

  async function openHireModal(interview: InterviewRequest) {
    console.log('🔍 [ADMIN] Opening hire modal with interview data:', {
      id: interview.id,
      candidateName: interview.candidateFirstName,
      workSchedule: interview.workSchedule
    })
    
    setInterviewToHire(interview)
    setHiring(true) // Show loading state
    
    try {
      // Fetch candidate details from BPOC database to get email
      console.log('🔍 Fetching candidate from BPOC:', interview.bpocCandidateId)
      const bpocResponse = await fetch(`/api/admin/recruitment/candidates/${interview.bpocCandidateId}`)
      let candidateEmail = ''
      let candidatePhone = ''
      let candidatePosition = ''
      
      console.log('📡 BPOC Response status:', bpocResponse.status)
      
      if (bpocResponse.ok) {
        const bpocData = await bpocResponse.json()
        console.log('📦 BPOC Data received:', JSON.stringify(bpocData, null, 2))
        
        if (bpocData.success && bpocData.candidate) {
          candidateEmail = bpocData.candidate.email || ''
          candidatePhone = bpocData.candidate.phone || ''
          candidatePosition = bpocData.candidate.position || ''
          console.log('✅ Candidate data extracted:', { candidateEmail, candidatePhone, candidatePosition })
        } else {
          console.warn('⚠️ BPOC response missing success or candidate field')
        }
      } else {
        console.error('❌ BPOC fetch failed:', bpocResponse.statusText)
      }
      
      // Get client's company ID from interview request
      const clientCompanyId = interview.client_users?.company?.id || interview.client_users?.companyId || ''
      
      // Format client preferred start date if it exists
      let preferredStart = ''
      if (interview.clientPreferredStart) {
        const date = new Date(interview.clientPreferredStart)
        preferredStart = date.toISOString().split('T')[0] // Format as YYYY-MM-DD
      }
      
      // Get client timezone from their profile or workSchedule
      console.log('🌍 Looking for client timezone in:', interview.client_users)
      const clientTimezone = interview.workSchedule?.clientTimezone || interview.client_users?.client_profiles?.timezone || 'UTC'
      console.log('🌍 Client timezone found:', clientTimezone)
      
      // Calculate work hours from client's schedule if provided
      let workHoursDisplay = '9 hours (includes 1 hour break, 15 min either side)' // Default
      let shiftType: 'DAY_SHIFT' | 'NIGHT_SHIFT' | 'MID_SHIFT' = 'DAY_SHIFT' // Default
      
      if (interview.workSchedule) {
        const { workStartTime, workDays, isMonToFri, hasCustomHours, customHours } = interview.workSchedule
        
        if (hasCustomHours && customHours) {
          // Format custom hours display
          const scheduleType = isMonToFri ? 'Monday to Friday' : workDays.join(', ')
          const hoursDisplay = Object.entries(customHours).map(([day, time]) => {
            const [hours, minutes] = time.split(':').map(Number)
            const endHour = (hours + 9) % 24
            const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
            return `${day}: ${time}-${endTime}`
          }).join('; ')
          workHoursDisplay = `${hoursDisplay} ${clientTimezone} (9 hours/day, ${scheduleType})`
        } else if (workStartTime) {
          // Calculate end time (start + 9 hours)
          const [startHour, startMinute] = workStartTime.split(':').map(Number)
          const endHour = (startHour + 9) % 24
          const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`
          
          // Format schedule display
          const scheduleType = isMonToFri ? 'Monday to Friday' : '5 Consecutive Days'
          workHoursDisplay = `${workStartTime} - ${endTime} ${clientTimezone} (9 hours, ${scheduleType})`
        }
        
        console.log('📅 Using client work schedule:', {
          workDays,
          workStartTime,
          hasCustomHours,
          customHours,
          clientTimezone,
          isMonToFri
        })
      }
      
      console.log('📋 [ADMIN] Pre-filling hire form:', {
        position: candidatePosition,
        companyId: clientCompanyId,
        companyName: interview.client_users?.company?.companyName || interview.company_name,
        preferredStart: preferredStart,
        clientName: interview.client_users?.name || interview.client_name,
        candidateEmail,
        candidatePhone,
        clientTimezone,
        workHoursDisplay,
        hasWorkSchedule: !!interview.workSchedule
      })
      
      setHireFormData({
        position: candidatePosition, // Pre-fill from BPOC
        companyId: clientCompanyId, // Pre-fill from client's company
        candidateEmail: candidateEmail, // Pre-fill from BPOC
        candidatePhone: candidatePhone, // Pre-fill from BPOC
        clientPreferredStart: preferredStart, // Pre-fill from client's request
        salary: '', // Admin will enter
        shiftType: shiftType, // From client's schedule
        workLocation: 'OFFICE', // Default (first option)
        hmoIncluded: false, // Default NO, approved after regularization
        leaveCredits: 12, // Company standard
        clientTimezone: clientTimezone, // Client's business timezone
        workHours: workHoursDisplay // From client's schedule
      })
    } catch (error) {
      console.error('Error fetching candidate details:', error)
      // Still open modal with empty form if fetch fails
      setHireFormData({
        position: '',
        companyId: '',
        candidateEmail: '',
        candidatePhone: '',
        clientPreferredStart: '',
        salary: '',
        shiftType: 'DAY_SHIFT',
        workLocation: 'OFFICE',
        hmoIncluded: false,
        leaveCredits: 12,
        clientTimezone: '',
        workHours: '9 hours (includes 1 hour break, 15 min either side)'
      })
    } finally {
      setHiring(false)
    }
    
    setHireModalOpen(true)
  }

  async function handleHireCandidate() {
    if (!interviewToHire) return

    // Validation
    if (!hireFormData.position) {
      toast({
        title: "Error",
        description: "Position is required",
        variant: "destructive"
      })
      return
    }

    if (!hireFormData.companyId) {
      toast({
        title: "Error",
        description: "Company is required",
        variant: "destructive"
      })
      return
    }

    if (!hireFormData.salary) {
      toast({
        title: "Error",
        description: "Salary is required",
        variant: "destructive"
      })
      return
    }

    if (!hireFormData.candidateEmail) {
      toast({
        title: "Error",
        description: "Candidate email is required",
        variant: "destructive"
      })
      return
    }

    try {
      setHiring(true)

      const response = await fetch('/api/admin/recruitment/interviews/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewRequestId: interviewToHire.id,
          position: hireFormData.position,
          companyId: hireFormData.companyId,
          candidateEmail: hireFormData.candidateEmail,
          candidatePhone: hireFormData.candidatePhone,
          bpocCandidateId: interviewToHire.bpocCandidateId,
          clientPreferredStart: hireFormData.clientPreferredStart,
          // New comprehensive offer details
          salary: hireFormData.salary,
          shiftType: hireFormData.shiftType,
          workLocation: hireFormData.workLocation,
          hmoIncluded: hireFormData.hmoIncluded,
          leaveCredits: hireFormData.leaveCredits,
          clientTimezone: hireFormData.clientTimezone,
          workHours: hireFormData.workHours,
          // Pass client's work schedule to be saved in job_acceptances
          workSchedule: interviewToHire.workSchedule
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Job Offer Sent Successfully! 🎉",
          description: `Offer email has been sent to ${hireFormData.candidateEmail}. Waiting for candidate response.`,
        })

        console.log('📧 Offer acceptance link:', data.offerLink)

        // Refresh interviews list
        await fetchInterviews()

        // Close modal
        setHireModalOpen(false)
        setInterviewToHire(null)
      } else {
        throw new Error(data.error || 'Failed to send job offer')
      }
    } catch (error) {
      console.error('Error sending job offer:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send job offer",
        variant: "destructive"
      })
    } finally {
      setHiring(false)
    }
  }

  // Finalize Hire (consolidated with confirm acceptance)
  async function openConfirmAcceptanceModal(interview: InterviewRequest) {
    setInterviewToConfirm(interview)
    
    // Pre-fill with client's preferred start date if available
    let startDate = ''
    if (interview.clientPreferredStart) {
      const date = new Date(interview.clientPreferredStart)
      startDate = date.toISOString().split('T')[0]
    }
    
    // Fetch candidate email from BPOC database
    let candidateEmail = ''
    try {
      const response = await fetch(`/api/admin/recruitment/candidates/${interview.bpocCandidateId}`)
      if (response.ok) {
        const candidateData = await response.json()
        console.log('🔍 [Finalize Hire] Full candidate data:', candidateData)
        candidateEmail = candidateData.candidate?.email || ''
        console.log('📧 [Finalize Hire] Pre-filled candidate email:', candidateEmail)
      }
    } catch (error) {
      console.error('❌ [Finalize Hire] Error fetching candidate email:', error)
    }
    
    setConfirmFormData({
      confirmedStartDate: startDate,
      staffEmail: candidateEmail,
      adminNotes: ''
    })
    
    setConfirmAcceptanceModalOpen(true)
  }

  async function handleConfirmAcceptance() {
    if (!interviewToConfirm) return

    // Validation
    if (!confirmFormData.confirmedStartDate) {
      toast({
        title: "Validation Error",
        description: "Please provide a confirmed start date",
        variant: "destructive"
      })
      return
    }

    if (!confirmFormData.staffEmail) {
      toast({
        title: "Validation Error",
        description: "Please provide the staff email address",
        variant: "destructive"
      })
      return
    }

    try {
      setConfirming(true)

      const response = await fetch('/api/admin/recruitment/interviews/confirm-acceptance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewRequestId: interviewToConfirm.id,
          bpocCandidateId: interviewToConfirm.bpocCandidateId,
          confirmedStartDate: confirmFormData.confirmedStartDate,
          staffEmail: confirmFormData.staffEmail,
          adminNotes: confirmFormData.adminNotes
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Hire Finalized! 🎉",
          description: `${interviewToConfirm.candidateFirstName} can now sign up using ${confirmFormData.staffEmail} to begin onboarding.`,
        })

        // Refresh interviews list
        await fetchInterviews()

        // Close modal
        setConfirmAcceptanceModalOpen(false)
        setInterviewToConfirm(null)
      } else {
        throw new Error(data.error || 'Failed to finalize hire')
      }
    } catch (error) {
      console.error('Error finalizing hire:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to finalize hire",
        variant: "destructive"
      })
    } finally {
      setConfirming(false)
    }
  }

  // Mark Offer as Declined
  async function openDeclineModal(interview: InterviewRequest) {
    setInterviewToDecline(interview)
    setDeclineReason('')
    setDeclineModalOpen(true)
  }

  async function handleMarkDeclined() {
    if (!interviewToDecline) return

    // Validation
    if (!declineReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for the decline",
        variant: "destructive"
      })
      return
    }

    try {
      setDeclining(true)

      const response = await fetch('/api/admin/recruitment/interviews/mark-declined', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewRequestId: interviewToDecline.id,
          declineReason: declineReason
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Offer Marked as Declined",
          description: `${interviewToDecline.candidateFirstName} has declined the offer. The interview request has been closed.`,
        })

        // Refresh interviews list
        await fetchInterviews()

        // Close modal
        setDeclineModalOpen(false)
        setInterviewToDecline(null)
      } else {
        throw new Error(data.error || 'Failed to mark as declined')
      }
    } catch (error) {
      console.error('Error marking as declined:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark as declined",
        variant: "destructive"
      })
    } finally {
      setDeclining(false)
    }
  }

  // Cancel Interview
  async function handleCancelInterview() {
    if (!interviewToCancel) return

    try {
      setCancelling(true)

      const response = await fetch(`/api/admin/recruitment/interviews/${interviewToCancel.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelReason.trim()
        })
      })

      if (response.ok) {
        toast({
          title: "Interview Cancelled",
          description: `Interview with ${interviewToCancel.candidateFirstName} has been cancelled.`,
        })

        // Refresh interviews list
        await fetchInterviews()

        // Close modals
        setCancelModalOpen(false)
        setInterviewToCancel(null)
        setSelectedInterview(null)
      } else {
        throw new Error('Failed to cancel interview')
      }
    } catch (error) {
      console.error('Error cancelling interview:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel interview",
        variant: "destructive"
      })
    } finally {
      setCancelling(false)
    }
  }

  async function handleUndoCancelInterview() {
    if (!interviewToUndoCancel) return

    try {
      setUndoCancelling(true)

      const response = await fetch(`/api/admin/recruitment/interviews/${interviewToUndoCancel.id}/undo-cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: undoCancelNotes.trim() || undefined
        })
      })

      if (response.ok) {
        toast({
          title: "Cancellation Undone",
          description: `Interview with ${interviewToUndoCancel.candidateFirstName} has been reopened and set to pending status.`,
        })

        // Refresh interviews list
        await fetchInterviews()

        // Close modals
        setUndoCancelModalOpen(false)
        setInterviewToUndoCancel(null)
        setUndoCancelNotes('')
        setSelectedInterview(null)
      } else {
        throw new Error('Failed to undo cancellation')
      }
    } catch (error) {
      console.error('Error undoing cancellation:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to undo cancellation",
        variant: "destructive"
      })
    } finally {
      setUndoCancelling(false)
    }
  }

  // Filter candidates
  const filteredCandidates = candidates.filter(c => {
    const searchLower = candidateSearch.toLowerCase()
    const firstName = c.first_name?.toLowerCase() || ''
    const position = c.position?.toLowerCase() || ''
    const locationCity = c.location_city?.toLowerCase() || ''
    const locationCountry = c.location_country?.toLowerCase() || ''
    const bio = c.bio?.toLowerCase() || ''
    const skills = c.resume_data?.skills || []
    
    return firstName.includes(searchLower) ||
      position.includes(searchLower) ||
      locationCity.includes(searchLower) ||
      locationCountry.includes(searchLower) ||
      bio.includes(searchLower) ||
      skills.some((s: string) => s?.toLowerCase().includes(searchLower))
  })

  // Filter job requests
  const filteredJobs = jobRequests.filter(j =>
    j.job_title.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.department?.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.industry?.toLowerCase().includes(jobSearch.toLowerCase())
  )

  // Filter interviews
  const filteredInterviews = (interviews || []).filter(i =>
    (i.candidateFirstName || '')?.toLowerCase().includes(interviewSearch.toLowerCase()) ||
    (i.status || '')?.toLowerCase().includes(interviewSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recruitment Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage candidates, job postings, and interview requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Users className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalCandidates}</p>
              <p className="text-sm text-muted-foreground">Total Candidates</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Briefcase className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.activeJobs}</p>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <Calendar className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pendingInterviews}</p>
              <p className="text-sm text-muted-foreground">Pending Interviews</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <TrendingUp className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalApplications}</p>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="p-6">
        <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
          <Button
            variant={activeTab === 'candidates' ? 'default' : 'ghost'}
            onClick={() => changeTab('candidates')}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Candidates
            <Badge variant="secondary" className="ml-1">{candidates.length}</Badge>
          </Button>
          <Button
            variant={activeTab === 'job-requests' ? 'default' : 'ghost'}
            onClick={() => changeTab('job-requests')}
            className="gap-2"
          >
            <Briefcase className="h-4 w-4" />
            Job Requests
            <Badge variant="secondary" className="ml-1">{jobRequests.length}</Badge>
          </Button>
          <Button
            variant={activeTab === 'interviews' ? 'default' : 'ghost'}
            onClick={() => changeTab('interviews')}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Interviews
            <Badge variant="secondary" className="ml-1">{interviews.length}</Badge>
          </Button>
        </div>

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <RecruitmentCandidatesTab />
        )}

        {/* Job Requests Tab */}
        {activeTab === 'job-requests' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search job requests by title, department, or industry..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {jobsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading job requests...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No job requests found</div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="p-3 bg-muted rounded-lg">
                      <Briefcase className="h-6 w-6 text-foreground" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{job.job_title}</h3>
                        <Badge className={
                          job.status === 'active' 
                            ? 'bg-green-600 text-white border border-green-500' 
                            : 'bg-muted text-foreground border border-border'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {job.department || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.work_arrangement}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {job.work_type}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {job.currency} {job.salary_min} - {job.salary_max}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          👁️ {job.views} views
                        </span>
                        <span className="text-xs text-muted-foreground">
                          📝 {job.applicants} applicants
                        </span>
                        <span className="text-xs text-muted-foreground">
                          📅 {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="space-y-6">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-300">
                      {interviews.filter(i => i.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-400/70" />
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-400">Offers Pending</p>
                    <p className="text-2xl font-bold text-orange-300">
                      {interviews.filter(i => {
                        const s = i.status.toLowerCase().replace(/_/g, '-')
                        return ['hire-requested', 'offer-sent'].includes(s)
                      }).length}
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-orange-400/70" />
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-400">Offer Accepted</p>
                    <p className="text-2xl font-bold text-green-300">
                      {interviews.filter(i => i.status === 'offer-accepted').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400/70" />
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-400">Completed</p>
                    <p className="text-2xl font-bold text-blue-300">
                      {interviews.filter(i => i.status === 'completed').length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-400/70" />
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-400">Hired</p>
                    <p className="text-2xl font-bold text-purple-300">
                      {interviews.filter(i => i.status === 'hired').length}
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-purple-400/70" />
                </div>
              </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search interviews by candidate name or status..."
                  value={interviewSearch}
                  onChange={(e) => setInterviewSearch(e.target.value)}
                  className="pl-9 bg-slate-800/50 border-slate-700/50 text-foreground placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Interview Cards */}
            {interviewsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading interviews...</div>
            ) : filteredInterviews.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Interview Requests</h3>
                <p className="text-muted-foreground">
                  Interview requests from clients will appear here
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredInterviews.map((interview) => {
                  // Normalize status to lowercase for comparison
                  const status = interview.status.toLowerCase().replace(/_/g, '-')
                  
                  return (
                  <Card key={interview.id} className="p-6 hover:shadow-lg transition-all border-l-4 border-l-blue-500">
                    <div className="space-y-4">
                      
                      {/* Header - Full Width with Buttons */}
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={interview.candidate_avatar_url || undefined} />
                          <AvatarFallback>{interview.candidateFirstName?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-xl font-semibold text-foreground">{interview.candidateFirstName}</h3>
                              <Badge className={
                                status === 'pending' 
                                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 hover:bg-yellow-500/30'
                                  : status === 'scheduled'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30'
                                  : status === 'reschedule-requested'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                                  : status === 'hire-requested'
                                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 hover:bg-orange-500/30'
                                  : status === 'offer-sent'
                                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 hover:bg-indigo-500/30'
                                  : status === 'offer-accepted'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                                  : status === 'offer-declined'
                                  ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30'
                                  : status === 'hired'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                                  : status === 'completed'
                                  ? 'bg-green-500/20 text-green-300 border-green-500/50 hover:bg-green-500/30'
                                : status === 'cancelled'
                                ? 'bg-gray-500/20 text-gray-300 border-gray-500/50 hover:bg-gray-500/30'
                                : status === 'rejected'
                                ? 'bg-slate-500/20 text-slate-300 border-slate-500/50 hover:bg-slate-500/30'
                                  : 'bg-gray-500/20 text-gray-300 border-gray-500/50'
                              }>
                                {status.toUpperCase().replace(/-/g, ' ')}
                              </Badge>
                            </div>
                            {/* Candidate Info */}
                            <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground mt-1">
                              <span className="text-blue-400 font-medium">
                                {interview.candidate_position || 'Not Provided'}
                              </span>
                              <span className="flex items-center gap-1">
                                <span>•</span>
                                <MapPin className="h-3 w-3 inline" />
                                <span>{interview.candidate_location || 'Not Provided'}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span>•</span>
                                <Mail className="h-3 w-3 inline" />
                                <span>{interview.candidate_email || 'Not Provided'}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span>•</span>
                                <Phone className="h-3 w-3 inline" />
                                <span>{interview.candidate_phone || 'Not Provided'}</span>
                              </span>
                            </div>
                        </div>

                        {/* Action Buttons in Header */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setSelectedInterview(interview)}
                            className="bg-gray-600 hover:bg-gray-700 text-white"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Full
                          </Button>
                          {/* Undo Cancellation - Show for cancelled interviews */}
                          {status === 'cancelled' && (
                            <Button 
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                setInterviewToUndoCancel(interview)
                                setUndoCancelNotes('')
                                setUndoCancelModalOpen(true)
                              }}
                            >
                              <CalendarCheck className="h-4 w-4 mr-2" />
                              Undo Cancellation
                            </Button>
                          )}
                          {(status === 'pending' || status === 'reschedule-requested') && (
                            <Button 
                              variant="default" 
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                setInterviewToSchedule(interview)
                                setScheduleFormData({
                                  scheduledTime: '',
                                  meetingLink: '',
                                  adminNotes: ''
                                })
                                setScheduleModalOpen(true)
                              }}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              {status === 'reschedule-requested' ? 'Reschedule' : 'Schedule'}
                            </Button>
                          )}
                          {status === 'scheduled' && (
                            <Button 
                              variant="default" 
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              disabled={completing}
                              onClick={async (e) => {
                                e.stopPropagation()
                                setCompleting(true)
                                try {
                                  const response = await fetch(`/api/admin/recruitment/interviews/${interview.id}/complete`, {
                                    method: 'PATCH'
                                  })
                                  if (response.ok) {
                                    toast({ title: "Success", description: "Interview marked as completed" })
                                    fetchInterviews()
                                  } else {
                                    throw new Error('Failed to mark complete')
                                  }
                                } catch (error) {
                                  toast({ title: "Error", description: "Failed to mark interview as complete", variant: "destructive" })
                                } finally {
                                  setCompleting(false)
                                }
                              }}
                            >
                              {completing ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Completing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Completed
                                </>
                              )}
                            </Button>
                          )}
                          {/* Cancel Interview - Show for pending, scheduled, or reschedule requested */}
                          {(status === 'pending' || status === 'scheduled' || status === 'reschedule-requested') && (
                            <Button 
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                setInterviewToCancel(interview)
                                setCancelReason('')
                                setCancelModalOpen(true)
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          )}
                          {status === 'hire-requested' && (
                            <>
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openHireModal(interview)
                                }}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Send Offer
                              </Button>
                              <Button 
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setInterviewToCancel(interview)
                                  setCancelReason('')
                                  setCancelModalOpen(true)
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            </>
                          )}
                          {status === 'offer-sent' && (
                            <>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                openConfirmAcceptanceModal(interview)
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Finalize
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeclineModal(interview)
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Declined
                            </Button>
                            </>
                          )}
                          </div>
                        </div>

                      {/* Content - Full Width */}
                      <div className="space-y-4">

                        {/* Status Message Box */}
                        <div className={`rounded-lg p-4 ${
                          status === 'pending'
                            ? 'bg-yellow-500/10'
                            : status === 'scheduled'
                            ? 'bg-blue-500/10'
                            : status === 'reschedule-requested'
                            ? 'bg-amber-500/10'
                            : status === 'hire-requested'
                            ? 'bg-orange-500/10'
                            : status === 'offer-sent'
                            ? 'bg-indigo-500/10'
                            : status === 'offer-accepted'
                            ? 'bg-emerald-500/10'
                            : status === 'offer-declined'
                            ? 'bg-red-500/10'
                            : status === 'hired'
                            ? 'bg-purple-500/10'
                            : status === 'completed'
                            ? 'bg-green-500/10'
                            : status === 'rejected'
                            ? 'bg-red-500/10'
                            : 'bg-gray-500/10'
                        }`}>
                          {status === 'pending' && (
                            <div className="flex items-start gap-3">
                              <Clock className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-yellow-300">Action Required</p>
                                <p className="text-sm text-yellow-400/80 mt-1">
                                  Coordinate with the candidate to schedule this interview. Click "Schedule" to set a time.
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'scheduled' && (
                            <div className="flex items-start gap-3">
                              <Calendar className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-blue-300">Interview Scheduled</p>
                                <p className="text-sm text-blue-400/80 mt-1">
                                  Interview has been scheduled. Waiting for completion.
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'reschedule-requested' && (
                            <div className="flex items-start gap-3">
                              <Calendar className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-amber-300">Reschedule Requested</p>
                                <p className="text-sm text-amber-400/80 mt-1">
                                  Client has requested to reschedule this interview. Please coordinate a new time.
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'hire-requested' && (
                            <div className="flex items-start gap-3">
                              <UserCheck className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-semibold text-orange-300">Client Wants to Hire! 🎯</p>
                                <p className="text-sm text-orange-400/80 mt-1">
                                  Client has requested to hire this candidate. Click "Send Offer" to proceed.
                                </p>
                                {interview.clientPreferredStart && (
                                  <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                    <p className="text-xs text-orange-400 mb-1">Client Preferred Start Date</p>
                                    <p className="text-sm font-semibold text-orange-200">
                                      📅 {new Date(interview.clientPreferredStart).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                )}
                                
                                {interview.workSchedule && (
                                  <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs text-orange-400">Work Schedule</p>
                                      {interview.workSchedule.isMonToFri && (
                                        <p className="text-xs text-orange-400/60">(Standard Mon-Fri)</p>
                                      )}
                                    </div>
                                    {interview.workSchedule.hasCustomHours && interview.workSchedule.customHours ? (
                                      <div>
                                        <div className="grid grid-cols-3 gap-2">
                                          {Object.entries(interview.workSchedule.customHours).map(([day, time]) => {
                                            const [hours, minutes] = (time as string).split(':').map(Number)
                                            const endHour = (hours + 9) % 24
                                            const endTime24 = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                                            const clientTimezone = interview.workSchedule?.clientTimezone || interview.client_users?.client_profiles?.timezone || 'UTC'
                                            const startFormatted = formatWorkTimeWithTimezone(time as string, clientTimezone)
                                            const endFormatted = formatWorkTimeWithTimezone(endTime24, clientTimezone)
                                            return (
                                              <div key={day} className="flex flex-col items-center text-xs bg-orange-500/10 px-2 py-2 rounded border border-orange-500/20">
                                                <span className="text-orange-200 font-medium mb-1">{day}</span>
                                                <span className="text-orange-300 text-[9px] text-center leading-tight">{startFormatted.clientTime} ({startFormatted.clientTimezone})</span>
                                                <span className="text-orange-400 text-[9px]">→</span>
                                                <span className="text-orange-200 text-[9px]">{startFormatted.phTime} (PH)</span>
                                              </div>
                                            )
                                          })}
                                        </div>
                                        <p className="text-xs text-orange-400/60 mt-1.5">(9 hrs/day, incl. break)</p>
                                      </div>
                                    ) : interview.workSchedule.workStartTime && interview.workSchedule.workDays ? (
                                      <div>
                                        <div className="grid grid-cols-3 gap-2">
                                          {interview.workSchedule.workDays.map((day: string) => {
                                            const workStartTime = interview.workSchedule?.workStartTime || '09:00'
                                            const [hours, minutes] = workStartTime.split(':').map(Number)
                                            const endHour = (hours + 9) % 24
                                            const endTime24 = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                                            const clientTimezone = interview.workSchedule?.clientTimezone || interview.client_users?.client_profiles?.timezone || 'UTC'
                                            const startFormatted = formatWorkTimeWithTimezone(workStartTime, clientTimezone)
                                            const endFormatted = formatWorkTimeWithTimezone(endTime24, clientTimezone)
                                            return (
                                              <div key={day} className="flex flex-col items-center text-xs bg-orange-500/10 px-2 py-2 rounded border border-orange-500/20">
                                                <span className="text-orange-200 font-medium mb-1">{day}</span>
                                                <span className="text-orange-300 text-[9px] text-center leading-tight">{startFormatted.clientTime} ({startFormatted.clientTimezone})</span>
                                                <span className="text-orange-400 text-[9px]">→</span>
                                                <span className="text-orange-200 text-[9px]">{startFormatted.phTime} (PH)</span>
                                              </div>
                                            )
                                          })}
                                        </div>
                                        <p className="text-xs text-orange-400/60 mt-1.5">(9 hrs/day, incl. break)</p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-orange-400/60">Not specified</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {status === 'offer-sent' && (
                            <div className="flex items-start gap-3">
                              <Mail className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-indigo-300">Job Offer Sent 📧</p>
                                <p className="text-sm text-indigo-400/80 mt-1">
                                  Job offer has been sent to candidate. Waiting for their response.
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'offer-accepted' && (
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-emerald-300">Offer Accepted! 🎉</p>
                                <p className="text-sm text-emerald-400/80 mt-1">
                                  Candidate has accepted the job offer! Waiting for them to create account and complete onboarding.
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'offer-declined' && (
                            <div className="flex items-start gap-3">
                              <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-red-300">Offer Declined</p>
                                <p className="text-sm text-red-400/80 mt-1">
                                  Candidate has declined the job offer. You may close this request.
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'hired' && (
                            <div className="flex items-start gap-3">
                              <UserCheck className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-purple-300">Candidate Hired! 🎉</p>
                                <p className="text-sm text-purple-400/80 mt-1">
                                  Candidate has created their account and started onboarding. They are now part of the team!
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'completed' && (
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-green-300">Interview Complete</p>
                                <p className="text-sm text-green-400/80 mt-1">
                                  Interview completed. Waiting for client to either reject candidate or request to hire.
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'cancelled' && (
                            <div className="flex items-start gap-3">
                              <XCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-gray-300">Interview Cancelled</p>
                                <p className="text-sm text-gray-400/80 mt-1">
                                  This interview has been cancelled by the admin.
                                </p>
                              </div>
                            </div>
                          )}
                          {status === 'rejected' && (
                            <div className="flex items-start gap-3">
                              <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-red-300">Candidate Rejected by Client</p>
                                <p className="text-sm text-red-400/80 mt-1">
                                  The client has decided not to move forward with this candidate.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Client Info */}
                        <div className="space-y-2">
                          <h4 className="text-base font-semibold text-foreground">
                            Client Details
                          </h4>
                          <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                            {(interview.client_name || interview.client_users?.name) && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3 inline" />
                                <span className="font-medium">
                                  {interview.client_name || interview.client_users?.name}
                                </span>
                              </span>
                            )}
                            {(interview.company_name || interview.client_users?.company?.companyName) && (
                              <span className="flex items-center gap-1">
                                <span>•</span>
                                <Building2 className="h-3 w-3 inline" />
                                <span>
                                  {interview.company_name || interview.client_users?.company?.companyName}
                                </span>
                              </span>
                            )}
                            {(interview.client_email || interview.client_users?.email) && (
                              <span className="flex items-center gap-1">
                                <span>•</span>
                                <Mail className="h-3 w-3 inline" />
                                <span>
                                  {interview.client_email || interview.client_users?.email}
                                </span>
                              </span>
                            )}
                            {interview.client_phone && (
                              <span className="flex items-center gap-1">
                                <span>•</span>
                                <Phone className="h-3 w-3 inline" />
                                <span>{interview.client_phone}</span>
                              </span>
                            )}
                            {interview.client_address && (
                              <span className="flex items-center gap-1">
                                <span>•</span>
                                <MapPin className="h-3 w-3 inline" />
                                <span>{interview.client_address}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Preferred Interview Times - Hide for completed, hire requested, offer sent, and offer declined */}
                        {status !== 'completed' && status !== 'hire_requested' && status !== 'hire-requested' && status !== 'offer-sent' && status !== 'offer-declined' && (
                        <div>
                          <h4 className="text-base font-semibold text-foreground mb-2">
                            Client's Preferred Interview Times
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const times = interview.preferredTimes || interview.preferred_times || [];
                              const timesArray = Array.isArray(times) ? times : (typeof times === 'string' ? JSON.parse(times) : []);
                                console.log('[Admin] Processing times for', interview.candidateFirstName, timesArray);
                                return timesArray.map((time: string | PreferredTime, idx: number) => {
                                  console.log('[Admin] Time', idx, ':', time, 'Type:', typeof time);
                                  const formatted = formatPreferredTimeWithTimezone(time);
                                  console.log('[Admin] Formatted:', formatted);
                                  return (
                                <Badge key={idx} variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/50">
                                      {formatted.fullDisplay}
                                </Badge>
                                  );
                                });
                            })()}
                          </div>
                        </div>
                        )}

                        {/* Combined Notes (Admin + Client) */}
                        {(() => {
                          const adminNotes = interview.adminNotes || '';
                          const clientNotes = interview.clientNotes || interview.client_notes || '';
                          
                          if (!adminNotes && !clientNotes) return null;

                          // Parse notes and combine them
                          const parseNotes = (notesText: string, type: 'admin' | 'client') => {
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

                          const adminEntries = parseNotes(adminNotes, 'admin');
                          const clientEntries = parseNotes(clientNotes, 'client');
                          const allEntries = [...adminEntries, ...clientEntries].sort((a, b) => a.date.getTime() - b.date.getTime());

                          if (allEntries.length === 0) return null;

                          return (
                            <div>
                              <h4 className="text-base font-semibold text-foreground mb-2">Notes</h4>
                              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {allEntries.map((entry, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`p-3 rounded border text-sm ${
                                      entry.type === 'admin' 
                                        ? 'bg-purple-500/10 border-purple-500/30' 
                                        : 'bg-blue-500/10 border-blue-500/30'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          entry.type === 'admin'
                                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                                            : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                                        }`}
                                      >
                                        {entry.type === 'admin' ? 'Admin' : 'Client'}
                                      </Badge>
                                      {entry.timestamp && (
                                        <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                                      )}
                                    </div>
                                    <p className="text-foreground whitespace-pre-wrap">{entry.content}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                      </div>

                    </div>
                  </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Candidate Detail Modal */}
      <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedCandidate.avatar_url || undefined} />
                  <AvatarFallback>{selectedCandidate.first_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedCandidate.first_name || 'Unknown'}</h3>
                  <p className="text-muted-foreground">{selectedCandidate.position || 'Professional'}</p>
                  <p className="text-sm text-muted-foreground">
                    {[selectedCandidate.location_city, selectedCandidate.location_country].filter(Boolean).join(', ') || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedCandidate.bio && (
                <div>
                  <label className="text-sm text-muted-foreground">Bio</label>
                  <p className="text-foreground">{selectedCandidate.bio}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {selectedCandidate.resume_data?.experience && (
                  <div>
                    <label className="text-sm text-muted-foreground">Experience</label>
                    <p className="text-foreground font-medium">{selectedCandidate.resume_data.experience.length} positions</p>
                  </div>
                )}
                {selectedCandidate.latest_primary_type && (
                  <div>
                    <label className="text-sm text-muted-foreground">DISC Type</label>
                    <p className="text-foreground font-medium">{selectedCandidate.latest_primary_type}</p>
                  </div>
                )}
                {selectedCandidate.overall_score > 0 && (
                  <div>
                    <label className="text-sm text-muted-foreground">Overall Score</label>
                    <p className="text-foreground font-medium">{selectedCandidate.overall_score}</p>
                  </div>
                )}
              </div>

              {selectedCandidate.resume_data?.skills && selectedCandidate.resume_data.skills.length > 0 && (
                <div>
                  <label className="text-sm text-muted-foreground">Skills</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCandidate.resume_data.skills.map((skill: string, idx: number) => (
                      <Badge key={idx} className="bg-muted text-foreground border border-border">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Job Detail Modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Request Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedJob.job_title}</h3>
                <Badge className={
                  selectedJob.status === 'active' 
                    ? 'bg-green-600 text-white border border-green-500' 
                    : 'bg-muted text-foreground border border-border'
                }>
                  {selectedJob.status}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-muted-foreground">Department</label>
                  <p className="text-foreground font-medium">{selectedJob.department || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Industry</label>
                  <p className="text-foreground font-medium">{selectedJob.industry || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Work Type</label>
                  <p className="text-foreground font-medium">{selectedJob.work_type}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Work Arrangement</label>
                  <p className="text-foreground font-medium">{selectedJob.work_arrangement}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Experience Level</label>
                  <p className="text-foreground font-medium">{selectedJob.experience_level}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Salary Range</label>
                  <p className="text-foreground font-medium">
                    {selectedJob.currency} {selectedJob.salary_min} - {selectedJob.salary_max}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Description</label>
                <p className="text-foreground mt-1">{selectedJob.job_description}</p>
              </div>

              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div>
                  <label className="text-sm text-muted-foreground">Required Skills</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedJob.skills.map((skill, idx) => (
                      <Badge key={idx} className="bg-muted text-foreground border border-border">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>👁️ {selectedJob.views} views</span>
                <span>📝 {selectedJob.applicants} applicants</span>
                <span>📅 Posted {new Date(selectedJob.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Interview Detail Modal */}
      <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] bg-slate-900 border-slate-700 text-slate-100 overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-slate-700 pb-4">
            <DialogTitle className="text-3xl font-bold text-slate-100">
              Interview Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedInterview && (() => {
            // Normalize status to lowercase for comparison
            const modalStatus = selectedInterview.status.toLowerCase().replace(/_/g, '-')
            
            return (
            <div className="space-y-6 overflow-y-auto overflow-x-hidden pr-2 pb-6">
              {/* Header - Candidate Info Card */}
              <div className="bg-gradient-to-r from-blue-500/10 via-slate-800/50 to-purple-500/10 border border-slate-700 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20 border-4 border-slate-700 shadow-lg">
                    <AvatarImage src={selectedInterview.candidate_avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                      {selectedInterview.candidateFirstName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-slate-100">{selectedInterview.candidateFirstName}</h3>
                      <Badge className={`text-sm px-3 py-1 ${
                        modalStatus === 'pending' 
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 hover:bg-yellow-500/30'
                          : modalStatus === 'scheduled'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30'
                          : modalStatus === 'hire-requested'
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 hover:bg-orange-500/30'
                          : modalStatus === 'offer-sent'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 hover:bg-indigo-500/30'
                          : modalStatus === 'offer-accepted'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                          : modalStatus === 'offer-declined'
                          ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30'
                          : modalStatus === 'hired'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30'
                          : modalStatus === 'completed'
                          ? 'bg-green-500/20 text-green-300 border-green-500/50 hover:bg-green-500/30'
                          : modalStatus === 'cancelled'
                          ? 'bg-gray-500/20 text-gray-300 border-gray-500/50 hover:bg-gray-500/30'
                          : modalStatus === 'rejected'
                          ? 'bg-slate-500/20 text-slate-300 border-slate-500/50 hover:bg-slate-500/30'
                          : 'bg-gray-500/20 text-gray-300 border-gray-500/50'
                      }`}>
                        {modalStatus.toUpperCase().replace(/-/g, ' ')}
                      </Badge>
                    </div>
                    {/* Candidate Info Grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {selectedInterview.candidate_position && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-400 font-medium">{selectedInterview.candidate_position}</span>
                        </div>
                      )}
                      {selectedInterview.candidate_location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">{selectedInterview.candidate_location}</span>
                        </div>
                      )}
                      {selectedInterview.candidate_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300 truncate">{selectedInterview.candidate_email}</span>
                        </div>
                      )}
                      {selectedInterview.candidate_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">{selectedInterview.candidate_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancelled Interview Message */}
              {modalStatus === 'cancelled' && (
                <div className="bg-gray-500/10 border border-gray-500/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="h-5 w-5 text-gray-400" />
                    <h4 className="font-semibold text-gray-300">Interview Cancelled</h4>
                  </div>
                  <p className="text-sm text-gray-400">
                    This interview has been cancelled by the admin. The client has been notified.
                  </p>
                </div>
              )}

              {/* Scheduled Interview Details - Show if status is scheduled, completed, or hired */}
              {(modalStatus === 'scheduled' || modalStatus === 'completed' || modalStatus === 'hired') && selectedInterview.scheduledTime && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-green-400" />
                    <h4 className="font-semibold text-green-300">Scheduled Interview</h4>
                  </div>
                  <div className="space-y-2">
              <div>
                      <label className="text-xs text-slate-400">Date & Time</label>
                      <p className="text-slate-100 font-medium">
                        {new Date(selectedInterview.scheduledTime).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
              </div>
                    {selectedInterview.meetingLink && (
              <div>
                        <label className="text-xs text-slate-400">Meeting Link</label>
                        <a 
                          href={selectedInterview.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline block break-all"
                        >
                          {selectedInterview.meetingLink}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Client Details */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                <h4 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-400" />
                  Client Details
                </h4>
                <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
                  {(selectedInterview.client_name || selectedInterview.client_users?.name) && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-500">Contact:</span>
                      <span className="text-slate-200 font-medium">
                        {selectedInterview.client_name || selectedInterview.client_users?.name}
                      </span>
                    </div>
                  )}
                  {(selectedInterview.company_name || selectedInterview.client_users?.company?.companyName) && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-500">Company:</span>
                      <span className="text-slate-200 font-medium">
                        {selectedInterview.company_name || selectedInterview.client_users?.company?.companyName}
                      </span>
                    </div>
                  )}
                  {(selectedInterview.client_email || selectedInterview.client_users?.email) && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-200">
                        {selectedInterview.client_email || selectedInterview.client_users?.email}
                      </span>
                    </div>
                  )}
                  {selectedInterview.client_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-500">Phone:</span>
                      <span className="text-slate-200">{selectedInterview.client_phone}</span>
                    </div>
                  )}
                  {selectedInterview.client_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-500">Address:</span>
                      <span className="text-slate-200">{selectedInterview.client_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Schedule */}
              {selectedInterview.workSchedule && (
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-400" />
                      Work Schedule
                    </h4>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const clientTimezone = selectedInterview.workSchedule?.clientTimezone || selectedInterview.client_users?.client_profiles?.timezone
                        return clientTimezone && (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50 text-xs">
                            {getTimezoneDisplay(clientTimezone)}
                          </Badge>
                        )
                      })()}
                      {selectedInterview.workSchedule.isMonToFri && (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/50 text-xs">
                          Mon-Fri
                        </Badge>
                      )}
                    </div>
                  </div>
                  {selectedInterview.workSchedule.hasCustomHours && selectedInterview.workSchedule.customHours ? (
                    <div>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(selectedInterview.workSchedule.customHours).map(([day, time]) => {
                          const [hours, minutes] = time.split(':').map(Number)
                          const endHour = (hours + 9) % 24
                          const endTime24 = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                          const clientTimezone = selectedInterview.workSchedule?.clientTimezone || selectedInterview.client_users?.client_profiles?.timezone || 'UTC'
                          const startFormatted = formatWorkTimeWithTimezone(time, clientTimezone)
                          const endFormatted = formatWorkTimeWithTimezone(endTime24, clientTimezone)
                          return (
                            <div key={day} className="flex flex-col items-center bg-slate-900/50 px-5 py-3 rounded-lg border border-slate-700 min-w-[140px]">
                              <div className="text-slate-200 font-bold mb-2 text-sm whitespace-nowrap">{day}</div>
                              <div className="text-slate-300 text-xs text-center mb-1">{startFormatted.clientTime}</div>
                              <div className="text-slate-500 text-[10px]">({startFormatted.clientTimezone})</div>
                              <div className="text-green-400 text-xs my-1">↓</div>
                              <div className="text-green-300 text-xs font-medium">{startFormatted.phTime}</div>
                              <div className="text-slate-500 text-[10px]">(PH Time)</div>
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-xs text-slate-400 mt-4 text-center">(9 hours per day, including break time)</p>
                    </div>
                  ) : selectedInterview.workSchedule.workStartTime && selectedInterview.workSchedule.workDays ? (
                    <div>
                      <div className="flex flex-wrap gap-3">
                        {selectedInterview.workSchedule.workDays.map((day: string) => {
                          const workStartTime = selectedInterview.workSchedule?.workStartTime || '09:00'
                          const [hours, minutes] = workStartTime.split(':').map(Number)
                          const endHour = (hours + 9) % 24
                          const endTime24 = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
                          const clientTimezone = selectedInterview.workSchedule?.clientTimezone || selectedInterview.client_users?.client_profiles?.timezone || 'UTC'
                          const startFormatted = formatWorkTimeWithTimezone(workStartTime, clientTimezone)
                          const endFormatted = formatWorkTimeWithTimezone(endTime24, clientTimezone)
                          return (
                            <div key={day} className="flex flex-col items-center bg-slate-900/50 px-5 py-3 rounded-lg border border-slate-700 min-w-[140px]">
                              <div className="text-slate-200 font-bold mb-2 text-sm whitespace-nowrap">{day}</div>
                              <div className="text-slate-300 text-xs text-center mb-1">{startFormatted.clientTime}</div>
                              <div className="text-slate-500 text-[10px]">({startFormatted.clientTimezone})</div>
                              <div className="text-green-400 text-xs my-1">↓</div>
                              <div className="text-green-300 text-xs font-medium">{startFormatted.phTime}</div>
                              <div className="text-slate-500 text-[10px]">(PH Time)</div>
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-xs text-slate-400 mt-4 text-center">(9 hours per day, including break time)</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">Not specified</p>
                  )}
                </div>
              )}

              {/* Client's Preferred Times - Hide for completed, hire requested, offer sent, and offer declined */}
              {modalStatus !== 'completed' && 
               modalStatus !== 'hire_requested' && 
               modalStatus !== 'hire-requested' && 
               modalStatus !== 'offer-sent' && 
               modalStatus !== 'offer-declined' && (
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h4 className="text-base font-semibold text-slate-100 mb-3">Client's Preferred Interview Times</h4>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const times = selectedInterview.preferredTimes || selectedInterview.preferred_times || [];
                    const timesArray = Array.isArray(times) ? times : (typeof times === 'string' ? JSON.parse(times) : []);
                    return timesArray.map((time: string | PreferredTime, idx: number) => {
                      const formatted = formatPreferredTimeWithTimezone(time);
                      return (
                        <Badge key={idx} variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/50">
                          {formatted.fullDisplay}
                        </Badge>
                      );
                    });
                  })()}
                </div>
              </div>
              )}

              {/* Combined Notes (Admin + Client) */}
              {(() => {
                const adminNotes = selectedInterview.adminNotes || '';
                const clientNotes = selectedInterview.client_notes || selectedInterview.clientNotes || '';
                
                if (!adminNotes && !clientNotes) return null;

                // Parse notes and combine them
                const parseNotes = (notesText: string, type: 'admin' | 'client') => {
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

                const adminEntries = parseNotes(adminNotes, 'admin');
                const clientEntries = parseNotes(clientNotes, 'client');
                const allEntries = [...adminEntries, ...clientEntries].sort((a, b) => a.date.getTime() - b.date.getTime());

                if (allEntries.length === 0) return null;

                return (
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <h4 className="text-base font-semibold text-slate-100 mb-3">Notes</h4>
                    <div className="space-y-3">
                      {allEntries.map((entry, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded border ${
                            entry.type === 'admin' 
                              ? 'bg-purple-500/10 border-purple-500/30' 
                              : 'bg-blue-500/10 border-blue-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                entry.type === 'admin'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                              }`}
                            >
                              {entry.type === 'admin' ? 'Admin' : 'Client'}
                            </Badge>
                            {entry.timestamp && (
                              <span className="text-xs text-slate-400">{entry.timestamp}</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">{entry.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700">
                {/* Add Notes - Show for all statuses */}
                <Button 
                  variant="outline" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 min-w-[120px]"
                  onClick={() => {
                    setInterviewForNotes(selectedInterview)
                    setAdminNotesText('')
                    setAdminNotesModalOpen(true)
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Notes
                </Button>
                
                {/* Schedule - Show for pending and reschedule-requested interviews */}
                {(modalStatus === 'pending' || modalStatus === 'reschedule-requested') && (
                  <Button 
                    variant="default" 
                    className="flex-1 min-w-[150px] bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setInterviewToSchedule(selectedInterview)
                      setScheduleFormData({
                        scheduledTime: '',
                        meetingLink: '',
                        adminNotes: ''
                      })
                      setSelectedInterview(null)
                      setScheduleModalOpen(true)
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {modalStatus === 'reschedule-requested' ? 'Reschedule' : 'Schedule'}
                  </Button>
                )}

                {/* Mark as Complete - Show for scheduled interviews */}
                {modalStatus === 'scheduled' && (
                  <Button 
                    variant="default" 
                    className="flex-1 min-w-[180px] bg-emerald-600 hover:bg-emerald-700"
                    disabled={completing}
                    onClick={async () => {
                      setCompleting(true)
                      try {
                        const response = await fetch(`/api/admin/recruitment/interviews/${selectedInterview.id}/complete`, {
                          method: 'PATCH'
                        })
                        if (response.ok) {
                          toast({ title: "Success", description: "Interview marked as completed" })
                          setSelectedInterview(null)
                          fetchInterviews()
                        } else {
                          throw new Error('Failed to mark complete')
                        }
                      } catch (error) {
                        toast({ title: "Error", description: "Failed to mark interview as complete", variant: "destructive" })
                      } finally {
                        setCompleting(false)
                      }
                    }}
                  >
                    {completing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </>
                    )}
                  </Button>
                )}

                {/* Reschedule - Show for scheduled interviews */}
                {modalStatus === 'scheduled' && (
                  <Button 
                    variant="outline" 
                    className="flex-1 min-w-[150px] border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
                    onClick={() => {
                      setInterviewToSchedule(selectedInterview)
                      setScheduleFormData({
                        scheduledTime: selectedInterview.scheduledTime || '',
                        meetingLink: selectedInterview.meetingLink || '',
                        adminNotes: ''
                      })
                      setSelectedInterview(null)
                      setScheduleModalOpen(true)
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>
                )}

                {/* Cancel Interview - Show for pending, scheduled, reschedule requested, or hire requested */}
                {(modalStatus === 'pending' || modalStatus === 'scheduled' || modalStatus === 'reschedule-requested' || modalStatus === 'hire-requested') && (
                  <Button 
                    variant="destructive" 
                    className="flex-1 min-w-[180px] bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      setInterviewToCancel(selectedInterview)
                      setCancelReason('')
                      setCancelModalOpen(true)
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Interview
                  </Button>
                )}

                {/* Undo Cancellation - Show for cancelled interviews */}
                {modalStatus === 'cancelled' && (
                  <Button 
                    className="flex-1 min-w-[180px] bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      setInterviewToUndoCancel(selectedInterview)
                      setUndoCancelNotes('')
                      setUndoCancelModalOpen(true)
                    }}
                  >
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    Undo Cancellation
                  </Button>
                )}
              </div>
            </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Send Job Offer Modal */}
      <Dialog open={hireModalOpen} onOpenChange={setHireModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-slate-100">
              <Mail className="h-6 w-6 text-green-400" />
              Send Job Offer
            </DialogTitle>
          </DialogHeader>
          {interviewToHire && (
            <div className="space-y-6">
              {/* Client Company Information */}
              {interviewToHire.client_users?.company && (
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    {interviewToHire.client_users.company.logo ? (
                      <img 
                        src={interviewToHire.client_users.company.logo} 
                        alt={interviewToHire.client_users.company.companyName}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-blue-500/50"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-blue-500/50">
                        <Building2 className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Hiring Company</p>
                      <h3 className="text-lg font-bold text-foreground">{interviewToHire.client_users.company.companyName}</h3>
                      <p className="text-sm text-muted-foreground">Client: {interviewToHire.client_users.name}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <h3 className="font-semibold text-slate-200 mb-2">Candidate Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-slate-400">Name:</span> <span className="text-slate-100 font-medium">{interviewToHire.candidateFirstName}</span></p>
                  <p><span className="text-slate-400">BPOC ID:</span> <span className="text-slate-300 font-mono text-xs">{interviewToHire.bpocCandidateId}</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-medium text-slate-200">Position / Job Title *</Label>
                  <Input
                    id="position"
                    placeholder="e.g., Customer Service Representative"
                    value={hireFormData.position}
                    onChange={(e) => setHireFormData(prev => ({ ...prev, position: e.target.value }))}
                    required
                    className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium text-slate-200">Assign to Company *</Label>
                  {interviewToHire?.client_users?.company ? (
                    <div className="p-3 bg-blue-500/10 border-2 border-blue-500/50 rounded-xl">
                      <p className="text-sm font-medium text-blue-300">
                        ✓ {interviewToHire.client_users.company.companyName}
                      </p>
                      <p className="text-xs text-blue-400 mt-1">
                        Pre-selected from client's hire request
                      </p>
                    </div>
                  ) : (
                  <Select
                    value={hireFormData.companyId}
                    onValueChange={(value) => setHireFormData(prev => ({ ...prev, companyId: value }))}
                  >
                    <SelectTrigger id="company" className="bg-slate-800/50 border-slate-700/50 text-slate-200">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id} className="text-slate-200">
                          {company.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="candidateEmail" className="text-sm font-medium text-slate-200">Candidate Email *</Label>
                  <Input
                    id="candidateEmail"
                    type="email"
                    placeholder="candidate@example.com"
                    value={hireFormData.candidateEmail}
                    onChange={(e) => setHireFormData(prev => ({ ...prev, candidateEmail: e.target.value }))}
                    required
                    className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                  <p className="text-xs text-slate-400">Job offer will be sent to this email</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="candidatePhone" className="text-sm font-medium text-slate-200">Candidate Phone (Optional)</Label>
                  <Input
                    id="candidatePhone"
                    type="tel"
                    placeholder="+63 XXX XXX XXXX"
                    value={hireFormData.candidatePhone}
                    onChange={(e) => setHireFormData(prev => ({ ...prev, candidatePhone: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientPreferredStart" className="text-sm font-medium text-slate-200">Client's Preferred Start Date (Optional)</Label>
                  <Input
                    id="clientPreferredStart"
                    type="date"
                    value={hireFormData.clientPreferredStart}
                    onChange={(e) => setHireFormData(prev => ({ ...prev, clientPreferredStart: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                  <p className="text-xs text-slate-400">
                    The final start date will be negotiated with the candidate.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary" className="text-sm font-medium text-slate-200">Salary (Total Monthly) *</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="e.g., 25000"
                    value={hireFormData.salary}
                    onChange={(e) => setHireFormData(prev => ({ ...prev, salary: e.target.value }))}
                    required
                    className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                  <p className="text-xs text-slate-400">Total monthly salary in PHP. Can be adjusted later after speaking with candidate.</p>
              </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shiftType" className="text-sm font-medium text-slate-200">Shift Type *</Label>
                    <Select
                      value={hireFormData.shiftType}
                      onValueChange={(value: any) => setHireFormData(prev => ({ ...prev, shiftType: value }))}
                    >
                      <SelectTrigger id="shiftType" className="bg-slate-800/50 border-slate-700/50 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="DAY_SHIFT" className="text-slate-200">Day Shift</SelectItem>
                        <SelectItem value="NIGHT_SHIFT" className="text-slate-200">Night Shift</SelectItem>
                        <SelectItem value="MID_SHIFT" className="text-slate-200">Mid Shift</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workLocation" className="text-sm font-medium text-slate-200">Work Location *</Label>
                    <Select
                      value={hireFormData.workLocation}
                      onValueChange={(value: any) => setHireFormData(prev => ({ ...prev, workLocation: value }))}
                    >
                      <SelectTrigger id="workLocation" className="bg-slate-800/50 border-slate-700/50 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="OFFICE" className="text-slate-200">Office</SelectItem>
                        <SelectItem value="HYBRID" className="text-slate-200">Hybrid</SelectItem>
                        <SelectItem value="WORK_FROM_HOME" className="text-slate-200">Work From Home</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientTimezone" className="text-sm font-medium text-slate-200">Client's Business Timezone</Label>
                  <Input
                    id="clientTimezone"
                    placeholder="e.g., Australia/Brisbane, America/Los_Angeles"
                    value={hireFormData.clientTimezone}
                    onChange={(e) => setHireFormData(prev => ({ ...prev, clientTimezone: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                  <p className="text-xs text-slate-400">The timezone where the client operates their business hours.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workHours" className="text-sm font-medium text-slate-200">Work Hours Schedule</Label>
                  <Input
                    id="workHours"
                    value={hireFormData.workHours}
                    readOnly
                    disabled
                    className="bg-slate-900/50 border-slate-700/50 text-slate-300 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400">This is the client's offer. Any schedule changes will be negotiated with the candidate over the phone.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leaveCredits" className="text-sm font-medium text-slate-200">Annual Leave Credits</Label>
                    <Input
                      id="leaveCredits"
                      type="number"
                      value={hireFormData.leaveCredits}
                      onChange={(e) => setHireFormData(prev => ({ ...prev, leaveCredits: parseInt(e.target.value) || 12 }))}
                      className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                    />
                    <p className="text-xs text-slate-400">Company standard: 12 days per year</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hmoIncluded" className="flex items-center justify-between text-sm font-medium text-slate-200">
                      <span>HMO Included</span>
                      <Switch
                        id="hmoIncluded"
                        checked={hireFormData.hmoIncluded}
                        onCheckedChange={(checked) => setHireFormData(prev => ({ ...prev, hmoIncluded: checked }))}
                      />
                    </Label>
                    <p className="text-xs text-slate-400">
                      {hireFormData.hmoIncluded 
                        ? "🎉 Bonus! Client providing HMO from Day 1" 
                        : "Default: HMO approved after regularization"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-xl">
                <div className="flex gap-2">
                  <Mail className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-300">Next Steps</p>
                    <p className="text-xs text-blue-400">
                      After sending the offer, the candidate will receive an email with details. They can accept or decline the offer.
                      Once accepted, they'll receive a signup link to create their account and complete onboarding.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleHireCandidate}
                  disabled={hiring}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {hiring ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Sending Offer...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Job Offer to Candidate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setHireModalOpen(false)}
                  disabled={hiring}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-100">
              Schedule Interview with {interviewToSchedule?.candidateFirstName}
            </DialogTitle>
          </DialogHeader>

          {interviewToSchedule && (
            <div className="space-y-4">
              {/* Client's Preferred Times */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                <p className="text-sm font-medium text-blue-300 mb-2">Client's Preferred Times:</p>
                <div className="space-y-1">
                  {interviewToSchedule.preferredTimes.map((time, idx) => {
                    const formatted = formatPreferredTimeWithTimezone(time);
                    return (
                      <p key={idx} className="text-xs text-blue-400/80">
                        • {formatted.fullDisplay}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Scheduled Time */}
              <div className="space-y-2">
                <Label htmlFor="scheduledTime" className="text-sm font-medium text-slate-200">
                  Scheduled Time *
                </Label>
                {(() => {
                  const parsed = parseTimeSlot(scheduleFormData.scheduledTime)
                  return (
                    <div className="flex gap-2">
                      {/* Date */}
                      <input
                        type="date"
                        value={parsed.date}
                        onChange={(e) => {
                          const newTime = buildTimeSlot(e.target.value, parsed.hour, parsed.minute, parsed.ampm)
                          setScheduleFormData(prev => ({ ...prev, scheduledTime: newTime }))
                        }}
                        className="flex-1 px-3 py-2 bg-slate-800/50 border-2 border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-200"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                      
                      {/* Hour */}
                      <select
                        value={parsed.hour}
                        onChange={(e) => {
                          const newTime = buildTimeSlot(parsed.date, parseInt(e.target.value), parsed.minute, parsed.ampm)
                          setScheduleFormData(prev => ({ ...prev, scheduledTime: newTime }))
                        }}
                        className="w-20 px-2 py-2 bg-slate-800/50 border-2 border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-200"
                        required
                      >
                        {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      
                      {/* Minute - 15 min intervals */}
                      <select
                        value={parsed.minute}
                        onChange={(e) => {
                          const newTime = buildTimeSlot(parsed.date, parsed.hour, parseInt(e.target.value), parsed.ampm)
                          setScheduleFormData(prev => ({ ...prev, scheduledTime: newTime }))
                        }}
                        className="w-20 px-2 py-2 bg-slate-800/50 border-2 border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-200"
                        required
                      >
                        <option value="0">:00</option>
                        <option value="15">:15</option>
                        <option value="30">:30</option>
                        <option value="45">:45</option>
                      </select>
                      
                      {/* AM/PM */}
                      <select
                        value={parsed.ampm}
                        onChange={(e) => {
                          const newTime = buildTimeSlot(parsed.date, parsed.hour, parsed.minute, e.target.value)
                          setScheduleFormData(prev => ({ ...prev, scheduledTime: newTime }))
                        }}
                        className="w-20 px-2 py-2 bg-slate-800/50 border-2 border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-200"
                        required
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  )
                })()}
                
                {/* Client Time Preview */}
                {(() => {
                  const parsed = parseTimeSlot(scheduleFormData.scheduledTime)
                  if (!parsed.date || !parsed.hour || parsed.minute === undefined) {
                    return null
                  }
                  
                  // Get client timezone - check all possible sources
                  const clientTimezone = interviewToSchedule.workSchedule?.clientTimezone || 
                                        interviewToSchedule.client_users?.client_profiles?.timezone || 
                                        null
                  
                  // Don't show preview if we don't have a valid client timezone
                  if (!clientTimezone || clientTimezone === 'UTC') {
                    return null
                  }
                  
                  try {
                    // Convert 12-hour to 24-hour format
                    let hour24 = parsed.hour
                    if (parsed.ampm === 'PM' && parsed.hour !== 12) {
                      hour24 = parsed.hour + 12
                    } else if (parsed.ampm === 'AM' && parsed.hour === 12) {
                      hour24 = 0
                    }
                    
                    const [year, month, day] = parsed.date.split('-').map(Number)
                    
                    // Admin enters time in PH/Manila timezone (UTC+8)
                    // Create UTC time by subtracting 8 hours from Manila time
                    // Manila 22:00 = UTC 14:00 (22:00 - 8 hours)
                    
                    const utcDate = new Date(Date.UTC(year, month - 1, day, hour24 - 8, parsed.minute))
                    
                    // Format this UTC date in client's timezone
                    const clientTimeStr = utcDate.toLocaleString('en-US', {
                      timeZone: clientTimezone,
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                      timeZoneName: 'short'
                    })
                    
                    return (
                      <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-300">
                          <span className="font-medium">Client's Time:</span> {clientTimeStr}
                        </p>
                      </div>
                    )
                  } catch (error) {
                    console.error('Error converting timezone:', error)
                    return null
                  }
                })()}
              </div>

              {/* Meeting Link */}
              <div className="space-y-2">
                <Label htmlFor="meetingLink" className="text-sm font-medium text-slate-200">
                  Meeting Link (Optional)
                </Label>
                <Input
                  id="meetingLink"
                  type="url"
                  value={scheduleFormData.meetingLink}
                  onChange={(e) => setScheduleFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                  placeholder="https://meet.google.com/..."
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="adminNotes" className="text-sm font-medium text-slate-200">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="adminNotes"
                  value={scheduleFormData.adminNotes}
                  onChange={(e) => setScheduleFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Any notes about this interview..."
                  rows={3}
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleScheduleInterview}
                  disabled={scheduling}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {scheduling ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Confirm Schedule
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setScheduleModalOpen(false)}
                  disabled={scheduling}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Notes Modal */}
      <Dialog open={adminNotesModalOpen} onOpenChange={setAdminNotesModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-100">
              Add Admin Notes
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Add notes to this interview. They will be appended to existing admin notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Notes Text Area */}
            <div className="space-y-2">
              <Label htmlFor="adminNotesText" className="text-sm font-medium text-slate-200">
                Notes
              </Label>
              <Textarea
                id="adminNotesText"
                value={adminNotesText}
                onChange={(e) => setAdminNotesText(e.target.value)}
                placeholder="Type your notes here..."
                rows={5}
                className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 whitespace-pre-wrap"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveAdminNotes}
                disabled={savingNotes || !adminNotesText.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {savingNotes ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Add Notes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAdminNotesModalOpen(false)
                  setAdminNotesText('')
                }}
                disabled={savingNotes}
                className="border-slate-700 hover:bg-slate-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Finalize Hire Modal (consolidated) */}
      <Dialog open={confirmAcceptanceModalOpen} onOpenChange={setConfirmAcceptanceModalOpen}>
        <DialogContent className="bg-slate-900 text-slate-100 border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Finalize Hire & Create Staff Account
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Candidate has accepted the offer! Finalize the hire by confirming the start date and email for onboarding.
            </DialogDescription>
          </DialogHeader>

          {interviewToConfirm && (
            <div className="space-y-6 py-4">
              {/* Success Message */}
              <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-lg">
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-300">Candidate: {interviewToConfirm.candidateFirstName} 🎉</p>
                    <p className="text-xs text-emerald-400/80">
                      The candidate has accepted the job offer! Complete the details below to finalize the hire.
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmed Start Date */}
                <div className="space-y-2">
                <Label htmlFor="confirmedStartDate" className="text-slate-200 font-medium">
                  Confirmed Start Date *
                  </Label>
                  <Input
                  id="confirmedStartDate"
                    type="date"
                  value={confirmFormData.confirmedStartDate}
                  onChange={(e) => setConfirmFormData({ ...confirmFormData, confirmedStartDate: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                  <p className="text-xs text-slate-400">
                  Pre-filled from client's preferred date. Update if candidate requested a different date.
                  </p>
                </div>

              {/* Staff Email */}
                <div className="space-y-2">
                <Label htmlFor="staffEmail" className="text-slate-200 font-medium">
                    Staff Email Address *
                  </Label>
                  <Input
                    id="staffEmail"
                    type="email"
                  value={confirmFormData.staffEmail}
                  onChange={(e) => setConfirmFormData({ ...confirmFormData, staffEmail: e.target.value })}
                    placeholder="staff@example.com"
                  className="bg-slate-800 border-slate-700 text-slate-100 font-medium placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-400">
                  Pre-filled from candidate's BPOC profile. This email will be used for staff signup and onboarding.
                  </p>
                </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="confirmNotes" className="text-slate-200 font-medium">
                  Admin Notes (Optional)
                </Label>
                <Textarea
                  id="confirmNotes"
                  placeholder="E.g., Spoke with candidate on phone, they're excited to start..."
                  value={confirmFormData.adminNotes}
                  onChange={(e) => setConfirmFormData({ ...confirmFormData, adminNotes: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100 min-h-[100px]"
                />
              </div>

              {/* What Happens Next Info Box */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                <div className="flex gap-2">
                  <UserCheck className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-300">What Happens Next?</p>
                    <ul className="text-xs text-blue-400/80 space-y-1 list-disc list-inside">
                      <li>Job acceptance record will be created/updated</li>
                      <li>Interview status will be updated to "HIRED"</li>
                      <li>Staff member can create their account using <strong className="text-blue-300">{confirmFormData.staffEmail}</strong></li>
                      <li>When they sign up, their profile will auto-populate from BPOC data</li>
                      <li>They'll be automatically assigned to the correct company</li>
                      <li>Contract signing & onboarding process will begin</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleConfirmAcceptance}
                  disabled={confirming || !confirmFormData.confirmedStartDate || !confirmFormData.staffEmail}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {confirming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Finalizing Hire...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalize Hire & Prepare Onboarding
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmAcceptanceModalOpen(false)}
                  disabled={confirming}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark as Declined Modal */}
      <Dialog open={declineModalOpen} onOpenChange={setDeclineModalOpen}>
        <DialogContent className="bg-slate-900 text-slate-100 border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-400">
              ❌ Mark Offer as Declined
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Record why the candidate declined the offer
            </DialogDescription>
          </DialogHeader>

          {interviewToDecline && (
            <div className="space-y-6 py-4">
              {/* Candidate Info */}
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <h3 className="font-semibold text-red-300 mb-2">Candidate: {interviewToDecline.candidateFirstName}</h3>
                <p className="text-sm text-slate-300">
                  Document the reason for declining so the team understands what happened.
                </p>
              </div>

              {/* Decline Reason */}
              <div className="space-y-2">
                <Label htmlFor="declineReason" className="text-slate-200 font-medium">
                  Reason for Declining *
                </Label>
                <Textarea
                  id="declineReason"
                  placeholder="E.g., Accepted another job offer, Personal circumstances changed, Salary expectations not met..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100 min-h-[120px]"
                  required
                />
              </div>

              {/* Quick Reason Buttons */}
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Quick reasons:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeclineReason('Candidate accepted another job offer')}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    Accepted Another Job
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeclineReason('Personal circumstances changed')}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    Personal Circumstances
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeclineReason('Salary/compensation not acceptable')}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    Salary Issues
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeclineReason('Location/remote work requirements not met')}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    Location Issues
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="destructive"
                  onClick={handleMarkDeclined}
                  disabled={declining || !declineReason.trim()}
                  className="flex-1"
                >
                  {declining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Marking as Declined...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Mark as Declined
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeclineModalOpen(false)}
                  disabled={declining}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Interview Confirmation Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-100">
              Cancel Interview with {interviewToCancel?.candidateFirstName}
            </DialogTitle>
          </DialogHeader>

          {interviewToCancel && (
            <div className="space-y-4">
              {/* Warning Info */}
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-300">This action will cancel the interview</p>
                    <p className="text-xs text-red-400/80 mt-1">
                      The client will be notified. You can optionally provide a reason below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancel Reason */}
              <div className="space-y-2">
                <Label htmlFor="cancelReason" className="text-sm font-medium text-slate-200">
                  Reason for Cancellation (Optional)
                </Label>
                <Textarea
                  id="cancelReason"
                  placeholder="E.g., Candidate no longer available, Client requested cancellation, Scheduling conflicts..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="destructive"
                  onClick={handleCancelInterview}
                  disabled={cancelling}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {cancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Yes, Cancel Interview
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCancelModalOpen(false)
                    setInterviewToCancel(null)
                    setCancelReason('')
                  }}
                  disabled={cancelling}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Keep Interview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Undo Cancel Interview Modal */}
      <Dialog open={undoCancelModalOpen} onOpenChange={setUndoCancelModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-100">
              Undo Interview Cancellation
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This will reopen the interview request and set it back to pending status.
            </DialogDescription>
          </DialogHeader>

          {interviewToUndoCancel && (
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <CalendarCheck className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-300">Reopening interview with {interviewToUndoCancel.candidateFirstName}</p>
                    <p className="text-xs text-blue-400/80 mt-1">
                      The interview will be set back to pending status. Both you and the client can proceed with scheduling.
                    </p>
                  </div>
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-2">
                <Label htmlFor="undoCancelNotes" className="text-sm font-medium text-slate-200">
                  Reopening Notes (Optional)
                </Label>
                <Textarea
                  id="undoCancelNotes"
                  placeholder="Add any notes about why you're reopening this interview..."
                  value={undoCancelNotes}
                  onChange={(e) => setUndoCancelNotes(e.target.value)}
                  rows={3}
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleUndoCancelInterview}
                  disabled={undoCancelling}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {undoCancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Reopening...
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="h-4 w-4 mr-2" />
                      Reopen Interview
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUndoCancelModalOpen(false)
                    setInterviewToUndoCancel(null)
                    setUndoCancelNotes('')
                  }}
                  disabled={undoCancelling}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

