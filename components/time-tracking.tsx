"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, LogIn, LogOut, Calendar, TrendingUp, AlertCircle, Coffee } from "lucide-react"
import { ShiftModal } from "@/components/shift-modal"
import { BreakScheduler } from "@/components/break-scheduler"
import { BreakModal } from "@/components/break-modal"
import { ClockOutSummaryModal } from "@/components/clock-out-summary-modal"
import { EndBreakModal } from "@/components/end-break-modal"
import { useToast } from "@/hooks/use-toast"
import { useTimeTrackingWebSocket } from "@/hooks/use-time-tracking-websocket"
import { useWebSocket } from "@/lib/websocket-provider"

interface TimeEntry {
  id: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  createdAt: string
  wasLate?: boolean
  lateBy?: number
  expectedClockIn?: string
  breaksScheduled?: boolean
}

interface TimeStats {
  today: number
  week: number
  month: number
}

export default function TimeTracking() {
  const { toast } = useToast()
  
  // Get user information from WebSocket context (already authenticated)
  const { socket } = useWebSocket()
  
  // Use WebSocket hook for all time tracking data
  const {
    isClockedIn,
    activeEntry,
    timeEntries,
    scheduledBreaks,
    activeBreak,
    weeklySchedule,
    showBreakScheduler,
    pendingTimeEntryId,
    stats,
    isLoading,
    isConnected,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    pauseBreak,
    resumeBreak,
    resetBreakScheduler,
    refreshScheduledBreaks
  } = useTimeTrackingWebSocket()
  
  // Local UI state
  const [currentSessionTime, setCurrentSessionTime] = useState("00:00:00")
  const [showLateModal, setShowLateModal] = useState(false)
  const [showEarlyModal, setShowEarlyModal] = useState(false)
  const [showClockOutModal, setShowClockOutModal] = useState(false)
  const [clockOutModalType, setClockOutModalType] = useState<'clock-out' | 'clock-out-early'>('clock-out')
  const [clockOutModalData, setClockOutModalData] = useState<any>({})
  const [showClockOutSummary, setShowClockOutSummary] = useState(false)
  const [clockOutSummaryData, setClockOutSummaryData] = useState<any>(null)
  const [lateMinutes, setLateMinutes] = useState(0)
  const [earlyMinutes, setEarlyMinutes] = useState(0)
  const [breakModalOpen, setBreakModalOpen] = useState(false)
  const [breakIsPaused, setBreakIsPaused] = useState(activeBreak?.isPaused || false)
  const [breakPauseUsed, setBreakPauseUsed] = useState(activeBreak?.pauseUsed || false)
  const [startingBreakType, setStartingBreakType] = useState<string | null>(null)
  const [isEndingBreak, setIsEndingBreak] = useState(false)
  const [isResumingBreak, setIsResumingBreak] = useState(false)
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [isClockingOut, setIsClockingOut] = useState(false)
  const [forceCloseBreakModal, setForceCloseBreakModal] = useState(false)
  const [breakModalForceClosed, setBreakModalForceClosed] = useState(false)
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today')
  
  // Auto clock-out states
  const [showShiftEndWarning, setShowShiftEndWarning] = useState(false)
  const [showFinalWarning, setShowFinalWarning] = useState(false)
  const [shiftEndTime, setShiftEndTime] = useState<Date | null>(null)
  const [timeUntilShiftEnd, setTimeUntilShiftEnd] = useState<string>('')
  const [countdownDisplay, setCountdownDisplay] = useState<string>('')
  const [autoClockOutTimer, setAutoClockOutTimer] = useState<NodeJS.Timeout | null>(null)
  
  // Away reason selector states
  const [showAwayReasonModal, setShowAwayReasonModal] = useState(false)
  const [selectedAwayReason, setSelectedAwayReason] = useState<string>('')
  
  // End break confirmation modal
  const [showEndBreakModal, setShowEndBreakModal] = useState(false)
  
  // Local state for fresh break data
  const [freshBreakData, setFreshBreakData] = useState<any>(null)

  // WebSocket automatically handles data fetching, no need for manual API calls
  
  // Listen for late clock-in event (ONLY triggered on actual clock-in, not page refresh)
  useEffect(() => {
    const handleShowLateModal = (event: CustomEvent) => {
      const { lateBy } = event.detail
      console.log('[Time Tracking] Late modal event received:', lateBy)
      setLateMinutes(lateBy)
      setShowLateModal(true)
    }
    
    window.addEventListener('show-late-modal', handleShowLateModal as EventListener)
    
    return () => {
      window.removeEventListener('show-late-modal', handleShowLateModal as EventListener)
    }
  }, [])

  // Listen for early clock-in event (ONLY triggered on actual clock-in, not page refresh)
  useEffect(() => {
    const handleShowEarlyModal = (event: CustomEvent) => {
      const { earlyBy } = event.detail
      console.log('[Time Tracking] Early modal event received:', earlyBy)
      setEarlyMinutes(earlyBy)
      setShowEarlyModal(true)
    }
    
    window.addEventListener('show-early-modal', handleShowEarlyModal as EventListener)
    
    return () => {
      window.removeEventListener('show-early-modal', handleShowEarlyModal as EventListener)
    }
  }, [])
  
  // Auto clock-out effect - runs when clocked in
  useEffect(() => {
    if (isClockedIn && weeklySchedule.length > 0) {
      startAutoClockOutTimer()
    } else {
      stopAutoClockOutTimer()
    }
    
    return () => stopAutoClockOutTimer()
  }, [isClockedIn, weeklySchedule])
  
  // Sync pause state with database
  useEffect(() => {
    if (activeBreak) {
      setBreakIsPaused(activeBreak.isPaused || false)
      // No need to sync breakPauseUsed - using database state directly
    } else {
      setBreakIsPaused(false)
    }
  }, [activeBreak?.isPaused])
  
  // Auto-open break modal when there's an active break
  useEffect(() => {
    // If force close is set, close the modal and mark it as force-closed
    if (forceCloseBreakModal) {
      console.log('[Break Modal] Force closing modal')
      setBreakModalOpen(false)
      setBreakModalForceClosed(true)
      return
    }
    
    // If modal was force-closed, don't reopen it until a new break starts
    if (breakModalForceClosed) {
      console.log('[Break Modal] Modal was force-closed, waiting for new break')
      return
    }
    
    // Only open modal if there's an active break, not paused, and modal is not already open
    if (activeBreak && !breakIsPaused && !breakModalOpen) {
      console.log('[Break Modal] Active break detected, opening modal:', activeBreak.type, 'breakIsPaused:', breakIsPaused)
      setBreakModalOpen(true)
      setBreakModalForceClosed(false) // Reset force-closed flag when new break starts
    } 
    // Close modal if break is paused or no active break
    else if ((!activeBreak || breakIsPaused) && breakModalOpen) {
      console.log('[Break Modal] Closing modal - activeBreak:', !!activeBreak, 'breakIsPaused:', breakIsPaused, 'breakModalOpen:', breakModalOpen)
      setBreakModalOpen(false)
    }
  }, [activeBreak, breakModalOpen, forceCloseBreakModal, breakModalForceClosed, breakIsPaused])

  // Update current session timer every second
  useEffect(() => {
    if (isClockedIn && activeEntry) {
      const interval = setInterval(() => {
        const clockIn = new Date(activeEntry.clockIn)
        const now = new Date()
        const diff = now.getTime() - clockIn.getTime()
        
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        setCurrentSessionTime(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        )
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isClockedIn, activeEntry])
  
  // Helper function to parse time strings
  const parseTimeString = (timeStr: string) => {
    if (!timeStr) return null
    try {
      const [time, period] = timeStr.trim().split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours)
      const min = parseInt(minutes)
      
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      
      const date = new Date()
      date.setHours(hour, min, 0, 0)
      return date
    } catch (error) {
      console.error('Error parsing time string:', timeStr, error)
      return null
    }
  }
  
  // Auto-start scheduled breaks at their scheduled time
  useEffect(() => {
    if (!isClockedIn || !scheduledBreaks.length || activeBreak) return
    
    const checkScheduledBreaks = () => {
      const now = new Date()
      
      console.log("🕐 CHECKING SCHEDULED BREAKS - Current time:", now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }))
      
      // Find a break that should start now
      const breakToStart = scheduledBreaks.find(b => {
        // Skip if already started or completed
        if (b.actualStart || b.actualEnd) {
          console.log(`  ⏭️ Skipping ${b.type} - already started/completed`)
          return false
        }
        
        // Parse scheduled start time
        const scheduledStartDate = parseTimeString(b.scheduledStart)
        if (!scheduledStartDate) {
          console.warn(`  ⚠️ Failed to parse scheduled time: ${b.scheduledStart}`)
          return false
        }
        
        // Check if current time is within 1 minute of scheduled start (before or after)
        const timeDiff = Math.abs(now.getTime() - scheduledStartDate.getTime())
        const minutesDiff = timeDiff / (1000 * 60)
        const shouldStart = minutesDiff <= 1
        
        if (shouldStart) {
          console.log("🚨 BREAK SHOULD START NOW:", b.type, "scheduled:", b.scheduledStart)
        }
        
        return shouldStart
      })
      
      if (breakToStart) {
        console.log("🎯 AUTO-STARTING SCHEDULED BREAK:", breakToStart.type, breakToStart.id)
        // For scheduled AWAY breaks, use the stored awayReason
        const awayReason = breakToStart.type === "AWAY" ? breakToStart.awayReason : undefined
        handleStartBreak(breakToStart.id, breakToStart.type, awayReason)
      }
    }
    
    // Check every 30 seconds for better accuracy
    const interval = setInterval(checkScheduledBreaks, 30000)
    
    // Also check immediately
    checkScheduledBreaks()
    
    return () => clearInterval(interval)
  }, [isClockedIn, scheduledBreaks, activeBreak])

  // Reset clocking out state immediately when clock-out completes
  useEffect(() => {
    if (!isClockedIn && isClockingOut) {
      console.log('[Time Tracking] Clock-out complete, resetting state immediately')
      setIsClockingOut(false)
    }
  }, [isClockedIn, isClockingOut])
  
  // Listen for clock-out errors from WebSocket
  useEffect(() => {
    const handleClockOutError = (event: CustomEvent) => {
      const errorMsg = event.detail?.error || 'Clock out failed'
      console.error('[Time Tracking] Clock-out error received:', errorMsg)
      
      // Reset loading state
      setIsClockingOut(false)
      
      // Show error toast
      toast({
        title: "Clock Out Failed",
        description: errorMsg,
        variant: "destructive",
        duration: 8000
      })
    }
    
    window.addEventListener('clock-out-error', handleClockOutError as EventListener)
    
    return () => {
      window.removeEventListener('clock-out-error', handleClockOutError as EventListener)
    }
  }, [toast])

  // WebSocket handles all data fetching automatically
  
  // Auto clock-out functions
  const startAutoClockOutTimer = () => {
    if (!isClockedIn || weeklySchedule.length === 0) return
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todaySchedule = weeklySchedule.find(s => s.dayOfWeek === today)
    
    if (!todaySchedule || !todaySchedule.isWorkday) return
    
    // Parse shift end time
    const parseTimeString = (timeStr: string) => {
      if (!timeStr) return null
      const [time, period] = timeStr.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours)
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      
      const date = new Date()
      date.setHours(hour, parseInt(minutes), 0, 0)
      return date
    }
    
    const endTime = parseTimeString(todaySchedule.endTime)
    if (!endTime) return
    
    setShiftEndTime(endTime)
    
    const checkShiftEnd = () => {
      const now = new Date()
      const timeDiff = endTime.getTime() - now.getTime()
      const minutesUntilEnd = Math.floor(timeDiff / (1000 * 60))
      
      if (minutesUntilEnd <= 0) {
        // Shift has ended - auto clock out
        handleAutoClockOut()
        return
      }
      
      // Calculate detailed countdown
      const totalSeconds = Math.floor(timeDiff / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      // Update displays
      const shortDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      const detailedDisplay = `${hours}h ${minutes}m ${seconds}s`
      
      setTimeUntilShiftEnd(shortDisplay)
      setCountdownDisplay(detailedDisplay)
      
      // Show warnings
      if (minutesUntilEnd === 15 && !showShiftEndWarning) {
        setShowShiftEndWarning(true)
        console.log("⚠️ 15-minute shift end warning")
      } else if (minutesUntilEnd === 5 && !showFinalWarning) {
        setShowFinalWarning(true)
        console.log("🚨 5-minute final warning")
      }
    }
    
    // Check immediately
    checkShiftEnd()
    
    // Check every second for precise countdown
    const timer = setInterval(checkShiftEnd, 1000)
    setAutoClockOutTimer(timer)
  }
  
  const stopAutoClockOutTimer = () => {
    if (autoClockOutTimer) {
      clearInterval(autoClockOutTimer)
      setAutoClockOutTimer(null)
    }
    setShowShiftEndWarning(false)
    setShowFinalWarning(false)
    setShiftEndTime(null)
    setTimeUntilShiftEnd('')
    setCountdownDisplay('')
  }
  
  const handleAutoClockOut = async () => {
    if (!isClockedIn) return
    
    console.log("🕐 AUTO CLOCK OUT - Shift end reached")
    
    // Check if on active break
    if (activeBreak) {
      console.log("⚠️ Auto clock-out blocked - user is on active break")
      toast({
        title: "Cannot Auto Clock Out",
        description: "Please end your active break first, then clock out manually.",
        variant: "destructive",
        duration: 8000
      })
      return
    }
    
    try {
      // Auto clock out with "END_OF_SHIFT" reason
      const response = await fetch("/api/time-tracking/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reason: "END_OF_SHIFT",
          notes: "Auto clock-out at shift end time"
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Update UI optimistically
        setShowShiftEndWarning(false)
        setShowFinalWarning(false)
        
        // WebSocket will handle the actual state updates
        
        toast({
          title: "Auto Clock Out",
          description: "You have been automatically clocked out at shift end time.",
          duration: 5000
        })
        
      } else {
        console.log("⚠️ Auto clock-out failed:", data.error)
        toast({
          title: "Auto Clock Out Failed",
          description: "Please clock out manually.",
          variant: "destructive",
          duration: 5000
        })
      }
    } catch (error) {
      console.log("⚠️ Auto clock-out error:", error)
      toast({
        title: "Auto Clock Out Error",
        description: "Please clock out manually.",
        variant: "destructive",
        duration: 5000
      })
    }
  }
  
  // Away reason selector functions
  const handleAwayReasonSelect = (reason: string) => {
    setSelectedAwayReason(reason)
    setShowAwayReasonModal(false)
    // Start the away break with the selected reason
    handleStartBreak(null, "AWAY", reason)
  }
  
  const handleAwayReasonCancel = () => {
    setSelectedAwayReason('')
    setShowAwayReasonModal(false)
  }

  const handleCancelEndBreak = () => {
    setShowEndBreakModal(false)
  }
  
  const handleStartBreak = async (breakId: string | null, breakType: string, awayReason?: string) => {
    if (startingBreakType || !isConnected) {
      console.log("⚠️ ALREADY STARTING BREAK OR NOT CONNECTED - Ignoring duplicate click")
      return
    }
    
    // For AWAY breaks, require a reason
    if (breakType === "AWAY" && !awayReason) {
      console.log("⚠️ AWAY break requires a reason")
      toast({
        title: "Reason Required",
        description: "Please select a reason for your away break.",
        variant: "destructive",
        duration: 5000
      })
      return
    }
    
    setStartingBreakType(breakType)
    console.log("🚀 STARTING BREAK:", { breakId, breakType, awayReason })
    
    try {
      // Reset any force-closed state to allow modal to open
      setBreakModalForceClosed(false)
      
      // Use WebSocket to start break
      await startBreak(breakType, awayReason)
      
      // Ensure modal opens after break starts (with small delay for state update)
      setTimeout(() => {
        console.log("📢 Forcing break modal to open after break start")
        setBreakModalOpen(true)
      }, 100)
      
    } catch (error) {
      console.log("⚠️ Error starting break:", error)
      toast({
        title: "Failed to Start Break",
        description: "An error occurred. Please try again.",
        variant: "destructive",
        duration: 5000
      })
    } finally {
      // Reset loading state after a short delay to allow WebSocket processing
      setTimeout(() => setStartingBreakType(null), 500)
    }
  }
  
  const handleEndBreak = () => {
    if (!activeBreak || !isConnected) return
    if (isEndingBreak) {
      console.log("⚠️ ALREADY ENDING BREAK - Ignoring duplicate click")
      return
    }
    
    console.log("🛑 SHOWING END BREAK CONFIRMATION:", activeBreak.id)
    setShowEndBreakModal(true)
  }

  const handleConfirmEndBreak = async () => {
    if (!activeBreak || !isConnected) return
    if (isEndingBreak) {
      console.log("⚠️ ALREADY ENDING BREAK - Ignoring duplicate click")
      return
    }
    
    setIsEndingBreak(true)
    console.log("🛑 CONFIRMING END BREAK:", activeBreak.id)
    
    const breakId = activeBreak.id
    
    // ⚡ IMMEDIATE UI UPDATE - Close modals instantly for better UX
    setShowEndBreakModal(false)
    setBreakModalOpen(false)
    setBreakIsPaused(false)
    setFreshBreakData(null) // Clear fresh data when break ends
    setForceCloseBreakModal(true) // Force close the break modal immediately
    
    // Show success toast immediately
    toast({
      title: "Break Ended",
      description: "Your break has been ended successfully.",
      duration: 3000
    })
    
    // Continue with the actual end logic in the background (don't await)
    endBreak(breakId).catch(error => {
      console.error("❌ Error ending break:", error)
      toast({
        title: "Break End Error",
        description: "There was an issue ending your break. Please try again.",
        variant: "destructive",
        duration: 5000
      })
    })
    
    // Reset force close flag after WebSocket processes the break end
    setTimeout(() => {
      setForceCloseBreakModal(false)
    }, 5000) // 5 seconds should be enough for WebSocket to process
    
    setIsEndingBreak(false)
  }

  const handleEndBreakDirect = async () => {
    if (!activeBreak || !isConnected) return
    if (isEndingBreak) {
      console.log("⚠️ ALREADY ENDING BREAK - Ignoring duplicate click")
      return
    }
    
    setIsEndingBreak(true)
    console.log("🛑 DIRECT END BREAK:", activeBreak.id)
    
    const breakId = activeBreak.id
    
    // ⚡ IMMEDIATE UI UPDATE - Close modals instantly for better UX
    setBreakModalOpen(false)
    setBreakIsPaused(false)
    setFreshBreakData(null) // Clear fresh data when break ends
    console.log("✨ BREAK MODAL CLOSED IMMEDIATELY (direct)")
    
    // Show success toast immediately
    toast({
      title: "Break Ended",
      description: "Your break has been ended successfully.",
      duration: 3000
    })
    
    // Continue with the actual end logic in the background
    try {
      await endBreak(breakId)
    } catch (error) {
      console.error("❌ Error ending break in background (direct):", error)
      // Show error toast if API fails
      toast({
        title: "Break End Error",
        description: "There was an issue ending your break. Please try again.",
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setIsEndingBreak(false)
    }
  }

  // WebSocket handles break ending automatically
  
  const handlePauseBreak = async () => {
    if (!activeBreak) return
    
    if (breakPauseUsed) {
      toast({
        title: "Pause Already Used",
        description: "You have already used your one pause for this break.",
        variant: "destructive",
        duration: 3000
      })
      return
    }
    
    // ⚡ IMMEDIATE UI UPDATE - Close modal instantly for better UX
    setBreakIsPaused(true)
    setBreakModalOpen(false)
    setForceCloseBreakModal(true)
    
    
    // Show success toast immediately
    toast({
      title: "Break Paused",
      description: "Your break has been paused. You can resume it anytime.",
      duration: 3000
    })
    
    // Continue with the actual pause logic in the background (don't await)
    try {
      const response = await fetch(`/api/breaks/${activeBreak.id}/pause`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to pause break')
      }
      
      // Resume performance tracking when break is paused (staff can work)
      if (typeof window !== 'undefined' && (window as any).electron?.performance?.resume) {
        await (window as any).electron.performance.resume()
      } else {
        console.log("⚠️ Electron performance API not available (running in browser)")
      }
      
      // Disable break mode when break is paused (staff can work)
      if (typeof window !== 'undefined' && (window as any).electron?.activityTracker?.setBreakMode) {
        await (window as any).electron.activityTracker.setBreakMode(false)
      } else {
        console.log("⚠️ Electron activity tracker API not available (running in browser)")
      }
      
      // Emit WebSocket event for break pause
      if (socket) {
        socket.emit('break:pause', { breakId: activeBreak.id, staffUserId: activeBreak.staffUserId })
      }

      // Request fresh data to get updated break status
      if (socket) {
        socket.emit('time:request-data')
      }
      
      // Only set pause as used after successful API call
      setBreakPauseUsed(true)
    } catch (error) {
      console.error("Error pausing break:", error)
      // Show error toast if API fails
      toast({
        title: "Pause Error",
        description: error instanceof Error ? error.message : "Failed to pause break. Please try again.",
        variant: "destructive",
        duration: 3000
      })
    }
    
    // Reset force close flag after a short delay
    setTimeout(() => {
      setForceCloseBreakModal(false)
    }, 1000)
  }
  
  const handleResumeBreak = async () => {
    if (!activeBreak || isResumingBreak) return
    
    // Set loading state immediately
    setIsResumingBreak(true)
    
    console.log("▶️ RESUMING BREAK (Loading state active)")
    
    // Show loading toast
    toast({
      title: "Resuming Break...",
      description: "Please wait while we resume your break.",
      duration: 2000
    })
    
    try {
      const response = await fetch(`/api/breaks/${activeBreak.id}/resume`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Failed to resume break')
      }
      
      // Pause performance tracking when break is resumed (staff is back on break)
      if (typeof window !== 'undefined' && (window as any).electron?.performance?.pause) {
        await (window as any).electron.performance.pause()
      } else {
        console.log("⚠️ Electron performance API not available (running in browser)")
      }
      
      // Enable break mode when break is resumed (staff is back on break)
      if (typeof window !== 'undefined' && (window as any).electron?.activityTracker?.setBreakMode) {
        await (window as any).electron.activityTracker.setBreakMode(true)
      } else {
        console.log("⚠️ Electron activity tracker API not available (running in browser)")
      }
      
      // Emit WebSocket event for break resume
      if (socket) {
        socket.emit('break:resume', { breakId: activeBreak.id, staffUserId: activeBreak.staffUserId })
      }
      
      // Fetch fresh break data directly
      try {
        const breakResponse = await fetch(`/api/breaks/${activeBreak.id}`)
        if (breakResponse.ok) {
          const breakData = await breakResponse.json()
          
          // Format the data to match BreakModal expectations
          const formattedBreakData = {
            id: breakData.break.id,
            type: breakData.break.type,
            startTime: breakData.break.actualStart,
            actualStart: breakData.break.actualStart,
            duration: breakData.break.duration || (breakData.break.type === 'LUNCH' ? 60 : 15),
            awayReason: breakData.break.awayReason,
            isPaused: breakData.break.ispaused || false,
            pausedDuration: breakData.break.pausedduration || 0,
            pauseUsed: breakData.break.pauseused || false
          }
          
          setFreshBreakData(formattedBreakData)
        }
      } catch (error) {
        console.error("Error fetching fresh break data:", error)
      }

      // Request fresh data to get updated pausedDuration first
      if (socket) {
        socket.emit('time:request-data')
      }

      // Wait a moment for fresh data to arrive, then update UI state and open modal
      setTimeout(() => {
        setBreakIsPaused(false)
        setBreakModalOpen(true)
      }, 1000) // Wait 1 second for fresh data to arrive

      // Show success toast
      toast({
        title: "Break Resumed",
        description: "Your break has been resumed and the timer is running.",
        duration: 3000
      })
      
    } catch (error) {
      console.error("Error resuming break:", error)
      // Show error toast if API fails
      toast({
        title: "Resume Error",
        description: "Failed to resume break. Please try again.",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      // Reset loading state after a short delay
      setTimeout(() => {
        setIsResumingBreak(false)
      }, 1000)
    }
  }
  
  const handleCloseBreakModal = () => {
    console.log("🚪 CLOSING BREAK MODAL (break still active)")
    setBreakModalOpen(false)
    setFreshBreakData(null) // Clear fresh data when modal is closed
  }

  // WebSocket handles stats calculation automatically

  const handleClockIn = async () => {
    if (isClockingIn || !isConnected) return // Prevent duplicate clicks or if not connected
    
    try {
      
      setIsClockingIn(true)
      
      // Show loading state
      toast({
        title: "Clocking In...",
        description: "Please wait while we process your clock in.",
        duration: 2000
      })
      
      // Use WebSocket to clock in (await the promise)
      await clockIn()
      
    } catch (error) {
      console.log("⚠️ Error clocking in:", error)
      
      const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again."
      
      toast({
        title: "Clock In Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setIsClockingIn(false)
    }
  }

  const handleClockOut = async () => {
    // ⚠️ PREVENT CLOCK OUT IF ON ACTIVE BREAK (started but not ended)
    if (activeBreak && activeBreak.actualStart && !activeBreak.actualEnd) {
      toast({
        title: "Cannot Clock Out",
        description: "Please end your active break before clocking out!",
        variant: "destructive",
        duration: 5000
      })
      return
    }
    
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please check your connection and try again.",
        variant: "destructive",
        duration: 5000
      })
      return
    }
    
    // Get current time and check if clocking out early
    const now = new Date()
    const clockOutTime = now.toISOString()
    
    // ⏰ Check if clocking out early
    let isEarly = false
    let earlyBy = 0
    let scheduledEnd = null
    
    if (weeklySchedule.length > 0) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
      const todaySchedule = weeklySchedule.find(s => s.dayOfWeek === today)
      
      if (todaySchedule && todaySchedule.isWorkday && todaySchedule.endTime) {
        // Parse shift end time
        const [time, period] = todaySchedule.endTime.split(' ')
        const [hours, minutes] = time.split(':')
        let hour = parseInt(hours)
        if (period === 'PM' && hour !== 12) hour += 12
        if (period === 'AM' && hour === 12) hour = 0
        
        const shiftEnd = new Date()
        shiftEnd.setHours(hour, parseInt(minutes), 0, 0)
        scheduledEnd = shiftEnd.toISOString()
        
        // Check if clocking out before shift end
        if (now < shiftEnd) {
          isEarly = true
          earlyBy = Math.floor((shiftEnd.getTime() - now.getTime()) / (1000 * 60))
        }
      }
    }
    
    // ⚡ SHOW APPROPRIATE MODAL
    if (isEarly) {
      setClockOutModalType('clock-out-early')
      setClockOutModalData({ clockOutTime, scheduledEnd, earlyBy })
      console.log(`⚠️ Early clock-out detected: ${earlyBy} minutes early`)
    } else {
      setClockOutModalType('clock-out')
      setClockOutModalData({ clockOutTime })
    }
    
    setShowClockOutModal(true)
    console.log("⚡ Clock-out modal shown!")
  }
  
  const handleClockOutConfirm = async (reason?: string) => {
    try {
      // Validate reason is provided
      if (!reason) {
        toast({
          title: "Reason Required",
          description: "Please select a clock-out reason to continue.",
          variant: "destructive",
          duration: 5000
        })
        return
      }
      
      if (!isConnected) {
        toast({
          title: "Not Connected",
          description: "Please check your connection and try again.",
          variant: "destructive",
          duration: 5000
        })
        return
      }
      
      // Set loading state FIRST
      setIsClockingOut(true)
      
      // Show immediate feedback
      toast({
        title: "Clocking Out...",
        description: "Processing your clock out request.",
        duration: 2000
      })
      
      // Close confirmation modal - user will see main button loading state
      setShowClockOutModal(false)
      
      // Use WebSocket to clock out + ensure loading state is visible for at least 1 second
      const [, ] = await Promise.all([
        clockOut(reason, ""),
        new Promise(resolve => setTimeout(resolve, 1000))
      ])
      
      // The useEffect will reset isClockingOut immediately when isClockedIn changes to false
      
    } catch (error) {
      console.log("⚠️ Error clocking out:", error)
      setIsClockingOut(false)
      toast({
        title: "Clock Out Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
        duration: 5000
      })
      // Revert
      setShowClockOutModal(true)
    }
  }
  
  const handleBreakScheduled = () => {
    // Close the break scheduler modal
    resetBreakScheduler()
    
    // Refresh scheduled breaks to show the newly scheduled breaks
    refreshScheduledBreaks()
    
    // Show success toast
    toast({
      title: "Breaks Scheduled",
      description: "Your break schedule has been locked in for today's shift.",
      duration: 3000
    })
  }

  const formatDateTime = (dateString: string) => {
    // ✅ UTC timestamp from DB auto-converts to browser's local timezone
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    // ✅ UTC timestamp from DB auto-converts to browser's local timezone
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }
  }

  const formatTime = (dateString: string) => {
    // ✅ UTC timestamp from DB auto-converts to browser's local timezone
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatHoursToHMS = (decimalHours: number) => {
    // Handle negative or invalid values
    if (!decimalHours || decimalHours < 0) {
      return '0h 0m 0s'
    }
    
    const hours = Math.floor(decimalHours)
    const minutes = Math.floor((decimalHours - hours) * 60)
    const seconds = Math.floor(((decimalHours - hours) * 60 - minutes) * 60)
    
    return `${hours}h ${minutes}m ${seconds}s`
  }

  // Format LateReason enum to user-friendly text
  const formatLateReason = (reason: string | null | undefined) => {
    if (!reason) return ''
    const reasonMap: Record<string, string> = {
      'TRAFFIC': 'Traffic',
      'OVERSLEPT': 'Overslept',
      'EMERGENCY': 'Emergency',
      'POWER_OUTAGE': 'Power Outage',
      'INTERNET_ISSUE': 'Internet Issue',
      'FAMILY_MATTER': 'Family Matter',
      'HEALTH_ISSUE': 'Health Issue',
      'TRANSPORTATION': 'Transportation',
      'WEATHER': 'Weather',
      'OTHER': 'Other'
    }
    return reasonMap[reason] || reason
  }

  // Format ClockOutReason enum to user-friendly text
  const formatClockOutReason = (reason: string | null | undefined) => {
    if (!reason) return ''
    const reasonMap: Record<string, string> = {
      'END_OF_SHIFT': 'End of Shift',
      'EMERGENCY': 'Emergency',
      'SICK': 'Sick',
      'EARLY_LEAVE_APPROVED': 'Approved Leave',
      'INTERNET_ISSUE': 'Internet Issue',
      'POWER_OUTAGE': 'Power Outage',
      'PERSONAL': 'Personal',
      'OTHER': 'Other'
    }
    return reasonMap[reason] || reason
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto mb-4 h-12 w-12 animate-spin text-indigo-500" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user has already clocked out today (disable clock in button)
  const todayEntry = timeEntries.find((entry) => {
    if (!entry || !entry.clockIn) return false
    const entryDate = new Date(entry.clockIn)
    const today = new Date()
    return (
      entryDate.getDate() === today.getDate() &&
      entryDate.getMonth() === today.getMonth() &&
      entryDate.getFullYear() === today.getFullYear() &&
      entry.clockOut // Has clocked out
    )
  })
  
  const hasCompletedShiftToday = !!todayEntry
  const canClockIn = !isClockedIn && !hasCompletedShiftToday

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-700">
        {/* Connection Status */}
        {!isConnected && (
          <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4 text-center">
            <p className="text-red-400 font-bold text-lg">
              ⚠️ Disconnected from Server
            </p>
            <p className="text-red-300/80 text-sm">
              Some features may not work properly. Please refresh the page.
            </p>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="flex gap-2 rounded-2xl bg-slate-900/50 p-2 backdrop-blur-xl ring-1 ring-white/10">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 ${
              activeTab === 'today'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Clock className="h-5 w-5" />
            Today's Shift
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Calendar className="h-5 w-5" />
            History
          </button>
        </div>

        {/* Clock In/Out Card */}
        <Card className="border-white/10 bg-slate-800/50 backdrop-blur">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-6">
              {/* Status */}
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      isClockedIn
                        ? "animate-pulse bg-green-500"
                        : "bg-slate-500"
                    }`}
                  />
                  <span className="text-lg font-medium text-white">
                    {isClockedIn ? "Clocked In" : "Clocked Out"}
                  </span>
                </div>
                
                {/* Shift Status (Late/On Time) */}
                {isClockedIn && activeEntry?.wasLate && (
                  <div className="mb-2 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-1 border border-red-500/20">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">
                      Clocked in {activeEntry.lateBy} min late
                    </span>
                  </div>
                )}
                
                {isClockedIn && activeEntry && activeEntry.wasLate === false && (
                  <div className="mb-2 flex items-center justify-center gap-2 rounded-lg bg-green-500/10 px-3 py-1 border border-green-500/20">
                    <span className="text-sm font-medium text-green-400">
                      ✓ On Time
                    </span>
                  </div>
                )}
                
                {isClockedIn && (
                  <div className="text-4xl font-bold tabular-nums text-indigo-400">
                    {currentSessionTime}
                  </div>
                )}
              </div>

               {/* Clock In/Out Button */}
               <Button
                 onClick={isClockedIn ? handleClockOut : handleClockIn}
                 disabled={isClockingIn || isClockingOut || (!isClockedIn && !canClockIn)}
                 size="lg"
                 className={`h-20 w-full max-w-sm text-lg font-semibold ${
                   isClockedIn
                     ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                     : canClockIn
                     ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                     : "bg-gradient-to-r from-slate-600 to-slate-700 cursor-not-allowed opacity-50"
                 }`}
               >
                 {isClockingIn ? (
                   <>
                     <Clock className="mr-2 h-6 w-6 animate-spin" />
                     Clocking In...
                   </>
                 ) : isClockingOut ? (
                   <>
                     <Clock className="mr-2 h-6 w-6 animate-spin" />
                     Clocking Out...
                   </>
                 ) : isClockedIn ? (
                   <>
                     <LogOut className="mr-2 h-6 w-6" />
                     Clock Out
                   </>
                 ) : !canClockIn ? (
                   <>
                     🔒 Shift Complete - See You Tomorrow
                   </>
                 ) : (
                   <>
                     <LogIn className="mr-2 h-6 w-6" />
                     Clock In
                   </>
                 )}
               </Button>

              {isClockedIn && activeEntry && (
                <div className="text-center text-sm text-slate-400">
                  Started at {formatTime(activeEntry.clockIn)}
                </div>
              )}
              
              {!isClockedIn && hasCompletedShiftToday && todayEntry && (
                <div className="text-center space-y-2 max-w-md">
                  <div className="text-sm text-slate-300">
                    Today's shift is complete.
                  </div>
                  <div className="text-xs text-slate-400">
                    {todayEntry.totalHours ? `Worked ${todayEntry.totalHours}h` : 'Session ended'}
                    {todayEntry.clockOutReason && ` - ${formatClockOutReason(todayEntry.clockOutReason)}`}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TODAY TAB CONTENT */}
        {activeTab === 'today' && (
          <>
        {/* Today's Work Schedule */}
        {weeklySchedule.length > 0 && (() => {
          const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
          const todaySchedule = weeklySchedule.find(s => s.dayOfWeek === today)
          
          if (!todaySchedule) return null
          
          return (
            <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-slate-800/50 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 ring-2 ring-indigo-500/50">
                      <Calendar className="h-8 w-8 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">Today's Schedule</h3>
                        <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                      </div>
                      <p className="text-sm text-slate-400">{todaySchedule.dayOfWeek}</p>
                    </div>
                  </div>
                  
                  {todaySchedule.isWorkday ? (
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <Clock className="h-4 w-4 text-indigo-400" />
                        <span className="text-2xl font-bold text-white">
                          {todaySchedule.startTime} - {todaySchedule.endTime}
                        </span>
                      </div>
                      <div className="text-xs text-emerald-400 font-medium">
                        ✓ Work Day
                      </div>
                  {isClockedIn && countdownDisplay && (
                    <div className="text-xs text-amber-400 font-medium mt-1">
                      ⏰ {countdownDisplay} until shift end
                    </div>
                  )}
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-3xl mb-1">🏖️</div>
                      <div className="text-sm text-slate-400">Day Off</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })()}

        {/* Full-Screen Break Modal */}
        <BreakModal
          isOpen={breakModalOpen}
          breakData={freshBreakData || (activeBreak ? { ...activeBreak, isPaused: breakIsPaused } : null)}
          onEnd={handleEndBreak}
          onEndDirect={handleEndBreakDirect}
          onPause={handlePauseBreak}
          onClose={handleCloseBreakModal}
        />

        {/* Paused Break - Resume Button */}
        {activeBreak && breakIsPaused && !breakModalOpen && (
          <Card className="border-yellow-500/30 bg-yellow-500/10 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {activeBreak.type === "MORNING" && "☕"}
                    {activeBreak.type === "LUNCH" && "🍽️"}
                    {activeBreak.type === "AFTERNOON" && "🍵"}
                    {activeBreak.type === "AWAY" && "🚶"}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-400">
                      Break Paused
                    </div>
                    <div className="text-sm text-slate-300">
                      {activeBreak.type === "MORNING" && "Morning Break"}
                      {activeBreak.type === "LUNCH" && "Lunch Break"}
                      {activeBreak.type === "AFTERNOON" && "Afternoon Break"}
                      {activeBreak.type === "AWAY" && "Away from Desk"}
                      {" · Click Resume when ready"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  {activeBreak.pausedDuration && activeBreak.pausedDuration > 0 && (
                    <div className="text-sm font-semibold text-yellow-300 bg-yellow-500/20 px-3 py-1 rounded-lg">
                      Remaining: {Math.floor(activeBreak.pausedDuration / 60)}m {activeBreak.pausedDuration % 60}s
                    </div>
                  )}
                  <Button
                    onClick={handleResumeBreak}
                    disabled={isResumingBreak}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResumingBreak ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Resuming...
                      </>
                    ) : (
                      <>
                        ▶️ Resume Break
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Breaks */}
        {isClockedIn && (!activeBreak || forceCloseBreakModal) && (
          <Card className="border-white/10 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Coffee className="h-5 w-5 text-indigo-400" />
                Start a Break
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                Take a break anytime during your shift
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Morning Break - Only show if NOT scheduled */}
                {!scheduledBreaks.some(b => b.type === "MORNING" && b.scheduledStart && b.scheduledEnd) && (
                  <button
                    onClick={() => handleStartBreak(null, "MORNING")}
                    disabled={startingBreakType !== null || scheduledBreaks.some(b => b.type === "MORNING" && b.actualEnd)}
                    className="w-full flex items-center justify-between rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 hover:bg-orange-500/15 hover:border-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">☕</span>
                      <div className="text-left">
                        <div className="font-medium text-white">Morning Break</div>
                        <div className="text-xs text-slate-400">15 min break</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-orange-400">
                      {startingBreakType === "MORNING" ? "Starting..." : scheduledBreaks.some(b => b.type === "MORNING" && b.actualEnd) ? "✓ Taken" : "Start Now →"}
                    </div>
                  </button>
                )}

                {/* Lunch Break - Only show if NOT scheduled */}
                {!scheduledBreaks.some(b => b.type === "LUNCH" && b.scheduledStart && b.scheduledEnd) && (
                  <button
                    onClick={() => handleStartBreak(null, "LUNCH")}
                    disabled={startingBreakType !== null || scheduledBreaks.some(b => b.type === "LUNCH" && b.actualEnd)}
                    className="w-full flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 hover:bg-blue-500/15 hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍽️</span>
                      <div className="text-left">
                        <div className="font-medium text-white">Lunch Break</div>
                        <div className="text-xs text-slate-400">60 min break</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-blue-400">
                      {startingBreakType === "LUNCH" ? "Starting..." : scheduledBreaks.some(b => b.type === "LUNCH" && b.actualEnd) ? "✓ Taken" : "Start Now →"}
                    </div>
                  </button>
                )}

                {/* Afternoon Break - Only show if NOT scheduled */}
                {!scheduledBreaks.some(b => b.type === "AFTERNOON" && b.scheduledStart && b.scheduledEnd) && (
                  <button
                    onClick={() => handleStartBreak(null, "AFTERNOON")}
                    disabled={startingBreakType !== null || scheduledBreaks.some(b => b.type === "AFTERNOON" && b.actualEnd)}
                    className="w-full flex items-center justify-between rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 hover:bg-purple-500/15 hover:border-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍵</span>
                      <div className="text-left">
                        <div className="font-medium text-white">Afternoon Break</div>
                        <div className="text-xs text-slate-400">15 min break</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-purple-400">
                      {startingBreakType === "AFTERNOON" ? "Starting..." : scheduledBreaks.some(b => b.type === "AFTERNOON" && b.actualEnd) ? "✓ Taken" : "Start Now →"}
                    </div>
                  </button>
                )}

                {/* Away from Desk (Always available - unlimited) */}
                <div className="relative mt-4">
                  <div className="absolute -top-2 left-3 bg-amber-500 text-xs font-bold text-black px-2 py-0.5 rounded-full z-10">
                    ALWAYS AVAILABLE
                  </div>
                  <button
                    onClick={() => setShowAwayReasonModal(true)}
                    disabled={startingBreakType !== null}
                    className="w-full flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 hover:bg-amber-500/15 hover:border-amber-500/50 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚶</span>
                      <div className="text-left">
                        <div className="font-medium text-white">Away from Desk</div>
                        <div className="text-xs text-slate-400">Restroom, water, quick break</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-amber-400">
                      {startingBreakType === "AWAY" ? "Starting..." : "Start Now →"}
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scheduled Breaks */}
        {isClockedIn && scheduledBreaks.length > 0 && (
          <Card className="border-white/10 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Coffee className="h-5 w-5 text-indigo-400" />
                Today's Scheduled Breaks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {scheduledBreaks
                  // Filter: Only show one break per scheduled time - prioritize completed/active over scheduled
                  .filter((breakItem: any, index: number, array: any[]) => {
                    // If this break has been started or completed, always show it
                    if (breakItem.actualStart || breakItem.actualEnd) {
                      return true
                    }
                    
                    // This is a scheduled break (not started yet)
                    // Hide if there's ANY other break with same type that has been started/completed
                    const hasActiveOrCompletedVersion = array.some((other: any) => 
                      other.id !== breakItem.id &&
                      other.type === breakItem.type &&
                      (other.actualStart || other.actualEnd)
                    )
                    
                    return !hasActiveOrCompletedVersion
                  })
                  .map((breakItem) => {
                  const isOnBreak = breakItem.actualStart && !breakItem.actualEnd
                  const isCompleted = breakItem.actualEnd
                  
                  // Parse time strings like "10:00 AM" into Date objects
                  const parseTimeString = (timeStr: string) => {
                    if (!timeStr || timeStr === 'Invalid Date') {
                      console.warn('Invalid time string:', timeStr)
                      return new Date()
                    }
                    
                    try {
                      const [time, period] = timeStr.split(' ')
                      if (!time || !period) {
                        console.warn('Invalid time format:', timeStr)
                        return new Date()
                      }
                      
                      const [hours, minutes] = time.split(':')
                      if (!hours || !minutes) {
                        console.warn('Invalid time format:', timeStr)
                        return new Date()
                      }
                      
                      let hour = parseInt(hours)
                      const min = parseInt(minutes)
                      
                      if (period === 'PM' && hour !== 12) hour += 12
                      if (period === 'AM' && hour === 12) hour = 0
                      
                      const date = new Date()
                      date.setHours(hour, min, 0, 0)
                      return date
                    } catch (error) {
                      console.error('Error parsing time string:', timeStr, error)
                      return new Date()
                    }
                  }
                  
                  // Check if break has expired (scheduled end time has passed and break wasn't taken)
                  const scheduledEndTime = breakItem.scheduledEnd ? parseTimeString(breakItem.scheduledEnd) : new Date()
                  const now = new Date()
                  const isExpired = !isCompleted && !isOnBreak && breakItem.scheduledEnd && now > scheduledEndTime
                  
                  
                  // For completed breaks, show actual times; for scheduled breaks, show scheduled times
                  const startTime = isCompleted ? breakItem.actualStart : breakItem.scheduledStart
                  const endTime = isCompleted ? breakItem.actualEnd : breakItem.scheduledEnd
                  
                  // Parse dates correctly based on whether break is completed or scheduled
                  const startDate = isCompleted 
                    ? (startTime ? new Date(startTime) : new Date())
                    : (breakItem.scheduledStart ? parseTimeString(breakItem.scheduledStart) : new Date())
                  const endDate = isCompleted 
                    ? (endTime ? new Date(endTime) : new Date())
                    : (breakItem.scheduledEnd ? parseTimeString(breakItem.scheduledEnd) : new Date())
                  
                  const breakEmojis: Record<string, string> = {
                    MORNING: "☕",
                    LUNCH: "🍽️",
                    AFTERNOON: "🍵",
                    AWAY: "🚶"
                  }
                  
                  const breakLabels: Record<string, string> = {
                    MORNING: "Morning Break",
                    LUNCH: "Lunch Break",
                    AFTERNOON: "Afternoon Break",
                    AWAY: "Away From Desk"
                  }
                  
                  const awayReasonLabels: Record<string, string> = {
                    BATHROOM: "🚻 Restroom",
                    NURSE: "🏥 Nurse",
                    MEETING: "👥 Meeting",
                    MANAGEMENT: "👔 Management",
                    OTHER: "📝 Other"
                  }
                  
                  return (
                    <div
                      key={`${breakItem.id}-${breakItem.actualStart || breakItem.scheduledStart}`}
                      className={`flex items-center justify-between rounded-lg border p-4 ${
                        isCompleted
                          ? "border-green-500/20 bg-green-500/5"
                          : isOnBreak
                          ? "border-yellow-500/30 bg-yellow-500/10 animate-pulse"
                          : isExpired
                          ? "border-red-500/20 bg-red-500/5 opacity-60"
                          : "border-indigo-500/20 bg-indigo-500/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl ${isExpired ? "grayscale opacity-50" : ""}`}>{breakEmojis[breakItem.type] || "☕"}</span>
                        <div>
                          <div className={`font-medium ${isExpired ? "text-slate-400 line-through" : "text-white"}`}>
                            {breakLabels[breakItem.type] || breakItem.type}
                            {breakItem.type === "AWAY" && breakItem.awayReason && (
                              <span className="ml-2 text-sm text-amber-400">
                                ({awayReasonLabels[breakItem.awayReason] || breakItem.awayReason})
                              </span>
                            )}
                          </div>
                          <div className={`text-sm ${isExpired ? "text-slate-500" : "text-slate-400"}`}>
                            {startDate.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit"
                            })} - {endDate.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit"
                            })}
                          </div>
                          {isOnBreak && (
                            <div className="text-xs font-medium text-yellow-400 mt-1">
                              ⚠️ Currently on break
                            </div>
                          )}
                          {isCompleted && breakItem.isLate && (
                            <div className="text-xs font-medium text-red-400 mt-1">
                              Returned {breakItem.lateBy} min late
                            </div>
                          )}
                        </div>
                      </div>
                      {!isCompleted && !isOnBreak && !isExpired && breakItem.scheduledStart && (() => {
                        const scheduledStartDate = parseTimeString(breakItem.scheduledStart)
                        const now = new Date()
                        const isPastScheduledTime = scheduledStartDate && now >= scheduledStartDate
                        
                        return (
                          <div className="flex flex-col items-end gap-2">
                            {isPastScheduledTime ? (
                              <>
                                <Button
                                  onClick={() => handleStartBreak(breakItem.id, breakItem.type, breakItem.awayReason)}
                                  disabled={startingBreakType !== null}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                                >
                                  {startingBreakType === breakItem.type ? "Starting..." : "▶️ Start Now"}
                                </Button>
                                <span className="text-[10px] text-amber-400">
                                  Missed auto-start
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                  🤖 Auto-starts at {scheduledStartDate?.toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit"
                                  })}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  System will prompt you
                                </span>
                              </>
                            )}
                          </div>
                        )
                      })()}
                      {isExpired && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-medium text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                            ⏰ Expired
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Break window has passed
                          </span>
                        </div>
                      )}
                      {isCompleted && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-medium text-green-400">
                            ✓ Completed
                          </span>
                          {breakItem.actualStart && (
                            <span className="text-[10px] text-slate-400">
                              Started at {new Date(breakItem.actualStart).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit"
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Today Card */}
          <div className="group rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-6 backdrop-blur-xl ring-1 ring-indigo-400/30 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-indigo-300">Today 📅</div>
              <div className="rounded-lg bg-indigo-500/30 p-2 group-hover:rotate-12 transition-transform">
                <Calendar className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div className="text-3xl font-black text-white tabular-nums group-hover:scale-110 transition-transform">
              {formatHoursToHMS(Math.max(0, stats.today || 0))}
            </div>
            <p className="text-xs text-indigo-300/70 mt-1">
              Hours worked today ⏰
            </p>
          </div>

          {/* This Week Card */}
          <div className="group rounded-3xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-6 backdrop-blur-xl ring-1 ring-emerald-400/30 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-emerald-300">This Week 📊</div>
              <div className="rounded-lg bg-emerald-500/30 p-2 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div className="text-3xl font-black text-white tabular-nums group-hover:scale-110 transition-transform">
              {formatHoursToHMS(Math.max(0, stats.week || 0))}
            </div>
            <p className="text-xs text-emerald-300/70 mt-1">
              Mon - Sun 📈
            </p>
          </div>

          {/* This Month Card */}
          <div className="group rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 backdrop-blur-xl ring-1 ring-purple-400/30 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-purple-400 hover:shadow-2xl hover:shadow-purple-500/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-purple-300">This Month 📆</div>
              <div className="rounded-lg bg-purple-500/30 p-2 group-hover:-rotate-12 transition-transform">
                <Clock className="h-5 w-5 text-purple-400 animate-bounce" />
              </div>
            </div>
            <div className="text-3xl font-black text-white tabular-nums group-hover:scale-110 transition-transform">
              {formatHoursToHMS(Math.max(0, stats.month || 0))}
            </div>
            <p className="text-xs text-purple-300/70 mt-1">
              Calendar month 🗓️
            </p>
          </div>
        </div>

        {/* Today's Shift Details */}
        <div className="group rounded-3xl bg-gradient-to-br from-slate-900/80 via-indigo-900/10 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-indigo-400/30 hover:shadow-2xl hover:shadow-indigo-500/30">
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-white">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-2.5 group-hover:rotate-12 transition-transform duration-300">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="group-hover:text-indigo-300 transition-colors">Today's Shift 💼</span>
          </h2>
          <div>
            {(() => {
              // Filter for TODAY's entry only
              const todayStart = new Date()
              todayStart.setHours(0, 0, 0, 0)
              
              const todaysEntries = timeEntries.filter(entry => {
                if (!entry || !entry.clockIn) return false
                const entryDate = new Date(entry.clockIn)
                return entryDate >= todayStart
              })

              if (todaysEntries.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-400">
                    <Clock className="mx-auto mb-4 h-12 w-12 text-slate-600" />
                    <p className="text-lg font-medium mb-2">No shift today yet</p>
                    <p className="text-sm">Clock in when you're ready to start your shift</p>
                  </div>
                )
              }

              return (
                <div className="space-y-4">
                  {todaysEntries.map((entry) => {
                    // Determine card color based on shift status
                    const getShiftStatus = (): { color: 'indigo' | 'emerald' | 'amber' | 'slate', label: string, icon: string } => {
                      if (!entry.clockOut) return { color: 'indigo', label: 'In Progress', icon: '🔵' }
                      if (entry.workedFullShift) return { color: 'emerald', label: 'Full Shift Complete', icon: '✅' }
                      if (entry.wasEarlyClockOut) return { color: 'amber', label: 'Early Clock Out', icon: '⚠️' }
                      return { color: 'slate', label: 'Shift Complete', icon: '✓' }
                    }
                    
                    const status = getShiftStatus()
                    const bgColors = {
                      indigo: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/40',
                      emerald: 'from-emerald-500/20 to-green-500/20 border-emerald-500/40',
                      amber: 'from-amber-500/20 to-yellow-500/20 border-amber-500/40',
                      slate: 'from-slate-500/20 to-slate-600/20 border-slate-500/40'
                    }

                    return (
                      <div
                        key={entry.id}
                        className={`group/card rounded-2xl bg-gradient-to-r ${bgColors[status.color]} border p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ring-1 ring-white/10 hover:ring-2`}
                      >
                        {/* Header: Status Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl group-hover/card:scale-110 transition-transform">{status.icon}</span>
                            <span className="text-xl font-black text-white group-hover/card:text-indigo-300 transition-colors">{status.label}</span>
                          </div>
                          {!entry.clockOut && (
                            <div className="flex items-center gap-2 rounded-full bg-green-500/30 px-3 py-1.5 ring-1 ring-green-400/50">
                              <div className="h-3 w-3 animate-pulse rounded-full bg-green-400 shadow-lg shadow-green-500/50" />
                              <span className="text-sm font-bold text-green-300">LIVE 🔴</span>
                            </div>
                          )}
                        </div>

                        {/* Time Details */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-1 rounded-lg bg-slate-900/30 p-3 ring-1 ring-white/5 group-hover/card:ring-indigo-400/30 transition-all">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              🕐 Clock In
                            </div>
                            <div className="text-2xl font-black text-white group-hover/card:scale-105 transition-transform">
                              {formatTime(entry.clockIn)}
                            </div>
                          </div>
                          <div className="space-y-1 rounded-lg bg-slate-900/30 p-3 ring-1 ring-white/5 group-hover/card:ring-indigo-400/30 transition-all">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              {entry.clockOut ? '🕐 Clock Out' : '⏱️ Active'}
                            </div>
                            <div className="text-2xl font-black text-white group-hover/card:scale-105 transition-transform">
                              {entry.clockOut ? formatTime(entry.clockOut) : (
                                <span className="text-emerald-400 animate-pulse">Running...</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Badges: Late, Early, etc. */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {entry.wasLate && (
                            <span className="text-xs font-bold text-red-300 bg-red-500/30 px-3 py-1.5 rounded-lg border border-red-400/50 ring-1 ring-red-400/30 hover:scale-105 hover:ring-2 hover:ring-red-400 transition-all cursor-default">
                              ⏰ Late {entry.lateBy}m {entry.lateReason && `- ${formatLateReason(entry.lateReason)}`}
                            </span>
                          )}
                          {entry.wasLate === false && (
                            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/30 px-3 py-1.5 rounded-lg border border-emerald-400/50 ring-1 ring-emerald-400/30 hover:scale-105 hover:ring-2 hover:ring-emerald-400 transition-all cursor-default animate-pulse">
                              ✅ On Time
                            </span>
                          )}
                          {entry.wasEarly && (
                            <span className="text-xs font-bold text-blue-300 bg-blue-500/30 px-3 py-1.5 rounded-lg border border-blue-400/50 ring-1 ring-blue-400/30 hover:scale-105 hover:ring-2 hover:ring-blue-400 transition-all cursor-default">
                              🌅 Early {entry.earlyBy}m
                            </span>
                          )}
                          {entry.wasEarlyClockOut && (
                            <span className="text-xs font-bold text-amber-300 bg-amber-500/30 px-3 py-1.5 rounded-lg border border-amber-400/50 ring-1 ring-amber-400/30 hover:scale-105 hover:ring-2 hover:ring-amber-400 transition-all cursor-default">
                              🏃 Left {entry.earlyClockOutBy}m Early {entry.clockOutReason && `- ${formatClockOutReason(entry.clockOutReason)}`}
                            </span>
                          )}
                          {entry.workedFullShift && (
                            <span className="text-xs font-black text-emerald-300 bg-gradient-to-r from-emerald-500/30 to-green-500/30 px-4 py-2 rounded-lg border-2 border-emerald-400/50 ring-2 ring-emerald-400/50 hover:scale-110 hover:ring-4 hover:ring-emerald-400 hover:shadow-lg hover:shadow-emerald-500/50 transition-all cursor-default animate-pulse">
                              ⭐ FULL SHIFT WORKED 🎉
                            </span>
                          )}
                        </div>

                        {/* Total Hours */}
                        <div className="flex items-center justify-between pt-4 border-t-2 border-white/10 rounded-lg bg-gradient-to-r from-slate-900/50 to-slate-800/50 p-4 -mx-2 -mb-2 mt-4 group-hover/card:border-indigo-400/30 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">⏱️</span>
                            <span className="text-sm font-bold text-slate-300">Total Hours</span>
                          </div>
                          {entry.totalHours ? (
                            <div className="text-right">
                              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 group-hover/card:scale-110 transition-transform">
                                {Number(entry.totalHours).toFixed(2)}h
                              </div>
                              <div className="text-xs text-slate-400 font-medium">
                                ({Math.round(Number(entry.totalHours) * 60)} minutes) 📊
                              </div>
                            </div>
                          ) : (
                            <div className="text-right">
                              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 animate-pulse group-hover/card:scale-110 transition-transform">
                                {activeEntry?.clockIn ? (() => {
                                  const timeDiff = (new Date().getTime() - new Date(activeEntry.clockIn).getTime()) / (1000 * 60 * 60)
                                  return formatHoursToHMS(Math.max(0, timeDiff))
                                })() : '0h 0m 0s'}
                              </div>
                              <div className="text-xs text-emerald-300 font-bold animate-pulse">and counting... 🚀</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
        </>
        )}

        {/* HISTORY TAB CONTENT */}
        {activeTab === 'history' && (
          <>
            {/* Time Entry History - Detailed View */}
            <div className="group rounded-3xl bg-gradient-to-br from-slate-900/80 via-indigo-900/10 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-black text-white">
                <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-2.5 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <span className="group-hover:text-indigo-300 transition-colors">Shift History 📋</span>
              </h2>

              {timeEntries.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Clock className="mx-auto mb-4 h-12 w-12 text-slate-600" />
                  <p>No shift history yet</p>
                  <p className="text-sm">Your past shifts will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timeEntries.filter(entry => entry && entry.clockIn).map((entry) => {
                    // Determine shift status color
                    const getShiftColor = () => {
                      if (!entry.clockOut) return 'indigo' // In progress
                      if (entry.workedFullShift) return 'green' // Full shift
                      if (entry.totalHours && Number(entry.totalHours) < 1) return 'red' // Incomplete
                      return 'yellow' // Partial
                    }
                    
                    const shiftColor = getShiftColor()
                    const colorClasses = {
                      green: 'from-emerald-500/20 to-green-500/20 ring-emerald-500/30 hover:ring-emerald-400',
                      yellow: 'from-amber-500/20 to-yellow-500/20 ring-amber-500/30 hover:ring-amber-400',
                      red: 'from-red-500/20 to-rose-500/20 ring-red-500/30 hover:ring-red-400',
                      indigo: 'from-indigo-500/20 to-purple-500/20 ring-indigo-500/30 hover:ring-indigo-400'
                    }
                    
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between rounded-xl bg-gradient-to-r ${colorClasses[shiftColor]} p-4 ring-1 transition-all duration-300 hover:scale-[1.02] hover:ring-2`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-bold text-white text-lg">
                              {formatDate(entry.clockIn)}
                            </div>
                            {!entry.clockOut && (
                              <span className="text-xs font-bold text-indigo-300 bg-indigo-500/30 px-2 py-1 rounded border border-indigo-400/50 animate-pulse">
                                ● ACTIVE
                              </span>
                            )}
                            {entry.workedFullShift && (
                              <span className="text-xs font-bold text-emerald-300 bg-emerald-500/30 px-2 py-1 rounded border border-emerald-400/50">
                                ✓ FULL SHIFT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-300">
                            <div>🕐 {formatTime(entry.clockIn)}</div>
                            <div>→</div>
                            <div>
                              {entry.clockOut ? formatTime(entry.clockOut) : (
                                <span className="text-green-400 font-medium">In Progress</span>
                              )}
                            </div>
                          </div>
                          {/* Shift Details */}
                          <div className="flex items-center gap-4 mt-2">
                            {entry.wasLate && (
                              <span className="text-xs font-medium text-red-300 bg-red-500/20 px-2 py-0.5 rounded border border-red-400/30">
                                ⏰ Late {entry.lateBy}m {entry.lateReason && `- ${formatLateReason(entry.lateReason)}`}
                              </span>
                            )}
                            {entry.wasEarly && (
                              <span className="text-xs font-medium text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/30">
                                🌅 Early {entry.earlyBy}m
                              </span>
                            )}
                            {entry.wasEarlyClockOut && (
                              <span className="text-xs font-medium text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">
                                🏃 Left {entry.earlyClockOutBy}m Early {entry.clockOutReason && `- ${formatClockOutReason(entry.clockOutReason)}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          {entry.totalHours ? (
                            <>
                              <div className="text-3xl font-black text-white">
                                {Number(entry.totalHours).toFixed(2)}h
                              </div>
                              <div className="text-xs text-slate-400 font-medium">
                                {Math.round(Number(entry.totalHours) * 60)} minutes
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              <div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
                              <span className="text-sm text-green-400 font-medium">Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="group rounded-3xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-6 backdrop-blur-xl ring-1 ring-emerald-400/30 transition-all duration-300 hover:ring-2 hover:ring-emerald-400 hover:scale-110 hover:rotate-1 hover:shadow-2xl hover:shadow-emerald-500/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-emerald-300">This Week 📊</div>
                  <div className="rounded-lg bg-emerald-500/30 p-2 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                    <TrendingUp className="h-5 w-5 text-emerald-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 tabular-nums group-hover:scale-110 transition-transform">
                  {formatHoursToHMS(Math.max(0, stats.week || 0))}
                </div>
                <p className="text-xs text-emerald-300/70 mt-2 font-medium">Mon - Sun 📈</p>
              </div>

              <div className="group rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 backdrop-blur-xl ring-1 ring-purple-400/30 transition-all duration-300 hover:ring-2 hover:ring-purple-400 hover:scale-110 hover:-rotate-1 hover:shadow-2xl hover:shadow-purple-500/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-purple-300">This Month 📆</div>
                  <div className="rounded-lg bg-purple-500/30 p-2 group-hover:scale-110 group-hover:-rotate-12 transition-transform">
                    <Calendar className="h-5 w-5 text-purple-400 animate-bounce" />
                  </div>
                </div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tabular-nums group-hover:scale-110 transition-transform">
                  {formatHoursToHMS(Math.max(0, stats.month || 0))}
                </div>
                <p className="text-xs text-purple-300/70 mt-2 font-medium">Calendar month 🗓️</p>
              </div>

              <div className="group rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-6 backdrop-blur-xl ring-1 ring-amber-400/30 transition-all duration-300 hover:ring-2 hover:ring-amber-400 hover:scale-110 hover:rotate-1 hover:shadow-2xl hover:shadow-amber-500/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-amber-300">Total Shifts 🎯</div>
                  <div className="rounded-lg bg-amber-500/30 p-2 group-hover:scale-110 group-hover:rotate-180 transition-transform">
                    <Clock className="h-5 w-5 text-amber-400 animate-spin" />
                  </div>
                </div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 tabular-nums group-hover:scale-110 transition-transform">
                  {timeEntries.filter(e => e && e.clockOut).length}
                </div>
                <p className="text-xs text-amber-300/70 mt-2 font-medium">Completed shifts ✅</p>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Shift Management Modals */}
      <ShiftModal
        isOpen={showLateModal}
        type="late-clock-in"
        data={{ lateBy: lateMinutes, expectedTime: activeEntry?.expectedClockIn }}
        onAction={async (lateReason?: string) => {
          // Save the late reason to database
          if (lateReason && activeEntry?.id) {
            try {
              await fetch('/api/time-tracking/update-late-reason', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  timeEntryId: activeEntry.id,
                  lateReason
                })
              })
              console.log(`✅ Late reason saved: ${lateReason}`)
            } catch (error) {
              console.error('Failed to save late reason:', error)
            }
          }
          setShowLateModal(false)
          // Break scheduler will be shown automatically via WebSocket state
        }}
      />

      {/* Early Clock-In Celebration Modal */}
      <ShiftModal
        isOpen={showEarlyModal}
        type="early-clock-in"
        data={{ earlyBy: earlyMinutes, expectedTime: activeEntry?.expectedClockIn }}
        onAction={() => {
          setShowEarlyModal(false)
          // Break scheduler will be shown automatically via WebSocket state
        }}
      />
      
      {pendingTimeEntryId && (
        <BreakScheduler
          isOpen={showBreakScheduler}
          timeEntryId={pendingTimeEntryId}
          onScheduled={handleBreakScheduled}
          onSkip={handleBreakScheduled}
        />
      )}
      
      <ShiftModal
        isOpen={showClockOutModal}
        type={clockOutModalType}
        data={clockOutModalData}
        onAction={handleClockOutConfirm}
        onDismiss={() => setShowClockOutModal(false)}
      />
      
      {clockOutSummaryData && (
        <ClockOutSummaryModal
          isOpen={showClockOutSummary}
          data={clockOutSummaryData}
          onClose={() => setShowClockOutSummary(false)}
        />
      )}
      
      {/* End Break Confirmation Modal */}
      <EndBreakModal
        isOpen={showEndBreakModal}
        breakData={activeBreak}
        onConfirm={handleConfirmEndBreak}
        onCancel={handleCancelEndBreak}
        isEnding={isEndingBreak}
      />
      
      {/* 15-Minute Shift End Warning */}
      <ShiftModal
        isOpen={showShiftEndWarning}
        type="break-reminder"
        data={{
          title: "Shift Ending Soon",
          message: `Your shift ends in 15 minutes at ${shiftEndTime?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. Please wrap up your work and prepare to clock out.`,
          timeRemaining: countdownDisplay
        }}
        onAction={() => setShowShiftEndWarning(false)}
        onDismiss={() => setShowShiftEndWarning(false)}
      />
      
      {/* 5-Minute Final Warning */}
      <ShiftModal
        isOpen={showFinalWarning}
        type="break-reminder"
        data={{
          title: "Final Warning - Shift Ending",
          message: `Your shift ends in 5 minutes at ${shiftEndTime?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. You will be automatically clocked out.`,
          timeRemaining: countdownDisplay
        }}
        onAction={() => setShowFinalWarning(false)}
        onDismiss={() => setShowFinalWarning(false)}
      />
      
      {/* Away Reason Selector Modal */}
      {showAwayReasonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-white/10 p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🚶</div>
              <h3 className="text-xl font-bold text-white mb-2">Why are you stepping away?</h3>
              <p className="text-sm text-slate-400">Select a reason for your away break</p>
            </div>
            
            <div className="space-y-3 mb-6">
              {[
                { value: 'BATHROOM', label: 'Restroom', icon: '🚻' },
                { value: 'NURSE', label: 'Nurse', icon: '🏥' },
                { value: 'MEETING', label: 'Meeting', icon: '👥' },
                { value: 'MANAGEMENT', label: 'Management', icon: '👔' },
                { value: 'OTHER', label: 'Other', icon: '📝' }
              ].map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => handleAwayReasonSelect(reason.value)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-slate-600 bg-slate-700/50 hover:bg-slate-600/50 hover:border-amber-500/50 transition-all text-left"
                >
                  <span className="text-2xl">{reason.icon}</span>
                  <span className="text-white font-medium">{reason.label}</span>
                  <span className="ml-auto text-slate-400">→</span>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleAwayReasonCancel}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
