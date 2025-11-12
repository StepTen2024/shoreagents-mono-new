"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Video,
  Loader2,
  CalendarCheck,
  UserCheck,
  XCircle,
  MessageSquare,
  CalendarClock
} from "lucide-react"

interface PreferredTime {
  datetime: string
  timezone: string
  timezoneDisplay: string
}

interface InterviewRequest {
  id: string
  candidateFirstName: string
  bpocCandidateId: string
  preferredTimes: (string | PreferredTime)[] // Support both old and new format
  clientNotes: string | null
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'HIRED'
  scheduledTime: string | null
  meetingLink: string | null
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  candidateAvatar?: string
}

export default function ClientInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast } = useToast()
  
  // Modal states
  const [selectedInterview, setSelectedInterview] = useState<InterviewRequest | null>(null)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  
  // Form states
  const [cancelReason, setCancelReason] = useState('')
  const [rescheduleNotes, setRescheduleNotes] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [clientTimezone, setClientTimezone] = useState<string>('Australia/Brisbane')

  useEffect(() => {
    fetchInterviews()
    fetchClientTimezone()
  }, [])
  
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

  async function fetchInterviews() {
    try {
      const response = await fetch('/api/client/interviews')
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      console.log('🖼️🖼️🖼️ AVATAR DEBUG START 🖼️🖼️🖼️')
      console.log('Total interviews:', data.interviews?.length)
      data.interviews?.forEach((interview: any, idx: number) => {
        console.log(`Interview ${idx + 1}: ${interview.candidateFirstName}`)
        console.log(`  - Avatar field exists:`, 'candidateAvatar' in interview)
        console.log(`  - Avatar value:`, interview.candidateAvatar)
        console.log(`  - Avatar type:`, typeof interview.candidateAvatar)
      })
      console.log('🖼️🖼️🖼️ AVATAR DEBUG END 🖼️🖼️🖼️')
      
      setInterviews(data.interviews)
    } catch (error) {
      console.error('Error fetching interviews:', error)
      setError('Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: InterviewRequest['status']) {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-300',
      COMPLETED: 'bg-green-100 text-green-800 border-green-300',
      CANCELLED: 'bg-red-100 text-red-800 border-red-300',
      HIRED: 'bg-purple-100 text-purple-800 border-purple-300'
    }

    const icons = {
      PENDING: <Clock className="h-3 w-3 mr-1" />,
      SCHEDULED: <CalendarCheck className="h-3 w-3 mr-1" />,
      COMPLETED: <CheckCircle2 className="h-3 w-3 mr-1" />,
      CANCELLED: <AlertCircle className="h-3 w-3 mr-1" />,
      HIRED: <UserCheck className="h-3 w-3 mr-1" />
    }

    return (
      <Badge variant="outline" className={`${styles[status]} flex items-center`}>
        {icons[status]}
        {status}
      </Badge>
    )
  }

  function formatDate(dateString: string, timezone?: string) {
    const date = new Date(dateString)
    
    // Format the date/time
    const formatted = date.toLocaleString('en-US', {
      timeZone: timezone || undefined,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    
    // Get timezone abbreviation using appropriate locale
    if (timezone) {
      const getLocaleForTimezone = (tz: string) => {
        if (tz.startsWith('Australia/') || tz.startsWith('Pacific/Auckland')) return 'en-AU'
        if (tz.startsWith('America/')) return 'en-US'
        if (tz.startsWith('Europe/')) return 'en-GB'
        if (tz.startsWith('Asia/')) return 'en-SG'
        return 'en-US'
      }
      
      const locale = getLocaleForTimezone(timezone)
      const tzAbbr = new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        timeZoneName: 'short'
      }).formatToParts(date).find(part => part.type === 'timeZoneName')?.value || ''
      
      return `${formatted} ${tzAbbr}`
    }
    
    return formatted
  }

  function formatPreferredTime(time: string | PreferredTime) {
    try {
      // Handle new object format
      if (typeof time === 'object' && time.datetime) {
        // Parse the datetime string in the context of the stored timezone
        // The datetime is in format "2025-01-15T14:00" and represents that time in the stored timezone
        const [datePart, timePart] = time.datetime.split('T')
        const [year, month, day] = datePart.split('-').map(Number)
        const [hours, minutes] = timePart.split(':').map(Number)
        
        // Create a date object and format it in the client's timezone
        // We use a reference UTC date and adjust it to show in the client's timezone
        const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes))
        
        // Get what time it shows in the client's timezone
        const testStr = utcDate.toLocaleString('en-US', {
          timeZone: time.timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
        
        // Parse to find offset
        const match = testStr.match(/(\d+)\/(\d+)\/(\d+),?\s*(\d+):(\d+)/)
        if (match) {
          const [, testMonth, testDay, testYear, testHour, testMinute] = match.map(Number)
          
          // Calculate offset
          const wantedTime = new Date(year, month - 1, day, hours, minutes).getTime()
          const gotTime = new Date(testYear, testMonth - 1, testDay, testHour, testMinute).getTime()
          const offsetMs = wantedTime - gotTime
          
          // Apply offset to get correct UTC
          const correctDate = new Date(utcDate.getTime() + offsetMs)
          
          // Now format in the client's timezone
          const formatted = correctDate.toLocaleString('en-US', {
            timeZone: time.timezone,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
          
          // Get timezone abbreviation using the appropriate locale for better abbreviations
          // Use locale matching the timezone region to get proper abbreviations (e.g., AEDT instead of GMT+10)
          const getLocaleForTimezone = (tz: string) => {
            if (tz.startsWith('Australia/') || tz.startsWith('Pacific/Auckland')) return 'en-AU'
            if (tz.startsWith('America/')) return 'en-US'
            if (tz.startsWith('Europe/')) return 'en-GB'
            if (tz.startsWith('Asia/')) return 'en-SG'
            return 'en-US'
          }
          
          const locale = getLocaleForTimezone(time.timezone)
          const tzAbbr = new Intl.DateTimeFormat(locale, {
            timeZone: time.timezone,
            timeZoneName: 'short'
          }).formatToParts(correctDate).find(part => part.type === 'timeZoneName')?.value || ''
          
          return `${formatted} (${tzAbbr})`
        }
        
        // Fallback: just display the time as-is
        const fallbackDate = new Date(`${time.datetime}:00`)
        return fallbackDate.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
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
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading interviews...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Interviews</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interview Requests</h1>
            <p className="text-gray-600 mt-1">
              Track your candidate interview requests and schedule updates
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {interviews.length} Total
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-linear-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {interviews.filter(i => i.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-4 bg-linear-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Scheduled</p>
                <p className="text-2xl font-bold text-blue-900">
                  {interviews.filter(i => i.status === 'SCHEDULED').length}
                </p>
              </div>
              <CalendarCheck className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4 bg-linear-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Completed</p>
                <p className="text-2xl font-bold text-green-900">
                  {interviews.filter(i => i.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4 bg-linear-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Hired</p>
                <p className="text-2xl font-bold text-purple-900">
                  {interviews.filter(i => i.status === 'HIRED').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Interview List */}
        {interviews.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Interview Requests Yet
            </h3>
            <p className="text-gray-600">
              Browse the talent pool and request interviews with candidates
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <Card key={interview.id} className="p-6 bg-white hover:shadow-lg transition-shadow border border-gray-200">
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
                          <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {interview.candidateFirstName}
                          </h3>
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
                      interview.status === 'COMPLETED' ? 'bg-gradient-to-br from-green-50 to-green-100 border-l-green-500' :
                      interview.status === 'HIRED' ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-l-purple-500' :
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
                        <div className="flex items-start gap-4">
                          <div className="shrink-0">
                            <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                              <CalendarCheck className="h-6 w-6 text-blue-700" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-blue-900 mb-2">
                              Interview Scheduled
                            </h3>
                            <p className="text-sm text-blue-800 mb-3">
                              <span className="font-semibold">Time:</span> {formatDate(interview.scheduledTime, clientTimezone)}
                            </p>
                            {interview.meetingLink && (
                              <a 
                                href={interview.meetingLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                              >
                                <Video className="h-4 w-4" />
                                Join Meeting
                              </a>
                            )}
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
                              Our team will review and get back to you with next steps.
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

                    {/* Your Notes */}
                    {interview.clientNotes && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Your Notes:</span>
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                          {interview.clientNotes}
                        </p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {interview.adminNotes && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Admin Notes:</span>
                        </div>
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
                          {interview.adminNotes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
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

                      {/* Add Notes - Show for any active interview */}
                      {(interview.status === 'PENDING' || interview.status === 'SCHEDULED') && (
                        <button
                          onClick={() => {
                            setSelectedInterview(interview)
                            setAdditionalNotes(interview.clientNotes || '')
                            setNotesModalOpen(true)
                          }}
                          className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all flex items-center gap-2 text-sm"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Add Notes
                        </button>
                      )}

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
                    </div>

                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>

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
                disabled={submitting}
                onClick={async () => {
                  if (!selectedInterview) return
                  setSubmitting(true)
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
                    setSubmitting(false)
                  }
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl hover:shadow-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Reschedule Modal */}
      <Dialog open={rescheduleModalOpen} onOpenChange={(open) => {
        setRescheduleModalOpen(open)
        if (!open) setRescheduleNotes('')
      }}>
        <DialogContent className="max-w-md bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Request Reschedule</DialogTitle>
            <DialogDescription className="text-gray-600">
              Send a note to the admin team requesting a reschedule for this interview.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rescheduleNotes" className="text-gray-900">Reschedule Request Notes</Label>
              <Textarea
                id="rescheduleNotes"
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                placeholder="E.g., Can we move this to next week? I have a conflict..."
                rows={4}
                className="mt-2 bg-white text-gray-900 border-gray-300"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRescheduleModalOpen(false)
                  setRescheduleNotes('')
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                disabled={submitting || !rescheduleNotes.trim()}
                onClick={async () => {
                  if (!selectedInterview) return
                  setSubmitting(true)
                  try {
                    const response = await fetch(`/api/client/interviews/${selectedInterview.id}/reschedule-request`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ notes: rescheduleNotes })
                    })
                    if (response.ok) {
                      toast({ title: "Success", description: "Reschedule request sent to admin team" })
                      setRescheduleModalOpen(false)
                      setRescheduleNotes('')
                      fetchInterviews()
                    } else {
                      throw new Error('Failed to send request')
                    }
                  } catch (error) {
                    toast({ title: "Error", description: "Failed to send reschedule request", variant: "destructive" })
                  } finally {
                    setSubmitting(false)
                  }
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Update Notes Modal */}
      <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <DialogContent className="max-w-md bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Update Interview Notes</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add or update your notes for this interview request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="additionalNotes" className="text-gray-900">Your Notes</Label>
              <Textarea
                id="additionalNotes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Add any additional information or requirements..."
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
                disabled={submitting}
                onClick={async () => {
                  if (!selectedInterview) return
                  setSubmitting(true)
                  try {
                    const response = await fetch(`/api/client/interviews/${selectedInterview.id}/notes`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ notes: additionalNotes })
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
                    setSubmitting(false)
                  }
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}

