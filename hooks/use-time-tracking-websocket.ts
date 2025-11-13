"use client"

import { useEffect, useState, useCallback } from 'react'
import { useWebSocket } from '@/lib/websocket-provider'

interface TimeTrackingState {
  isClockedIn: boolean
  activeEntry: any | null
  timeEntries: any[]
  scheduledBreaks: any[]
  activeBreak: any | null
  weeklySchedule: any[]
  showBreakScheduler: boolean
  pendingTimeEntryId: string | null
  stats: {
    today: number
    week: number
    month: number
  }
}

export function useTimeTrackingWebSocket() {
  const { socket, isConnected, emit, on, off } = useWebSocket()
  
  const [state, setState] = useState<TimeTrackingState>({
    isClockedIn: false,
    activeEntry: null,
    timeEntries: [],
    scheduledBreaks: [],
    activeBreak: null,
    weeklySchedule: [],
    showBreakScheduler: false,
    pendingTimeEntryId: null,
    stats: { today: 0, week: 0, month: 0 }
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isWebSocketUpdate, setIsWebSocketUpdate] = useState(false)

  // Clock in/out functions
  const clockIn = useCallback(async () => {
    if (!isConnected) {
      console.warn('[WebSocket] Cannot clock in, not connected')
      return
    }
    
    console.log('[WebSocket] Attempting clock in...')
    
    try {
      // Make API call directly
      const response = await fetch('/api/time-tracking/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        console.error('Clock in failed - HTTP status:', response.status, response.statusText)
        const errorData = await response.json()
        console.error('Clock in error response:', errorData)
        throw new Error(errorData.error || `Clock in failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ [Clock-In] Clock-in successful, now resetting Electron tracking...')
        
        // 🔄 Reset local metrics in Electron (start fresh tracking)
        if (typeof window !== 'undefined' && window.electron?.sync?.reset) {
          try {
            console.log('🔄 [Clock-In] Calling window.electron.sync.reset()...')
            const resetResult = await window.electron.sync.reset()
            console.log('✅ [Clock-In] Electron metrics reset result:', resetResult)
            console.log('✅ [Clock-In] Local metrics and sync state reset successfully')
            console.log('🎯 [Clock-In] Activity tracking will now count from zero')
          } catch (resetError) {
            console.error('⚠️ [Clock-In] Failed to reset local metrics:', resetError)
            console.error('⚠️ [Clock-In] This may cause tracking to not work properly')
            console.error('⚠️ [Clock-In] You may need to restart the app')
          }
        } else {
          console.warn('⚠️ [Clock-In] Electron sync reset not available')
          console.warn('⚠️ [Clock-In] Running in browser or Electron API not exposed')
          console.warn('⚠️ [Clock-In] window.electron:', typeof window !== 'undefined' ? window.electron : 'undefined')
        }
        
        // Emit WebSocket event for real-time updates
        emit('time:clockin', data)
      } else {
        console.error('Clock in failed - API error:', data)
        throw new Error(data.error || 'Clock in failed')
      }
    } catch (error) {
      console.error('Clock in error:', error)
      throw error // Re-throw so component can handle it
    }
  }, [emit, isConnected])

  const clockOut = useCallback((reason?: string, notes?: string) => {
    if (!isConnected) {
      console.warn('[WebSocket] Cannot clock out, not connected')
      return
    }
    
    // Make API call in background (don't await)
    fetch('/api/time-tracking/clock-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, notes })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Emit WebSocket event for real-time updates
        emit('time:clockout', data)
      } else {
        console.error('Clock out failed:', data)
      }
    })
    .catch(error => {
      console.error('Clock out error:', error)
    })
  }, [emit, isConnected])

  // Break functions
  const startBreak = useCallback(async (breakType: string, awayReason?: string) => {
    if (!isConnected) {
      console.warn('[WebSocket] Cannot start break, not connected')
      return
    }
    
    try {
      // Make API call directly
      const response = await fetch('/api/breaks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: breakType, awayReason })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Pause activity tracking in Electron
        if (typeof window !== 'undefined' && (window as any).electron?.breaks?.start) {
          console.log('[WebSocket] Calling Electron to pause activity tracking for', breakType, 'break')
          // Duration in minutes: LUNCH = 60, MORNING/AFTERNOON = 15, AWAY = 15
          const duration = breakType === 'LUNCH' ? 60 : 15
          await (window as any).electron.breaks.start({
            type: breakType,
            duration: duration,
            breakId: data.break?.id
          })
          console.log('[WebSocket] ✅ Activity tracking paused in Electron')
        } else {
          console.log('[WebSocket] Electron API not available (running in browser)')
        }
        
        // Emit WebSocket event for real-time updates
        emit('break:start', data)
      } else {
        console.error('Start break failed:', data)
      }
    } catch (error) {
      console.error('Start break error:', error)
    }
  }, [emit, isConnected])

  const endBreak = useCallback(async (breakId: string) => {
    if (!isConnected) {
      console.warn('[WebSocket] Cannot end break, not connected')
      return
    }
    
    try {
      // Make API call directly
      const response = await fetch('/api/breaks/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breakId })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Resume activity tracking in Electron
        if (typeof window !== 'undefined' && (window as any).electron?.breaks?.end) {
          console.log('[WebSocket] Calling Electron to resume activity tracking')
          await (window as any).electron.breaks.end()
          console.log('[WebSocket] ✅ Activity tracking resumed in Electron')
        } else {
          console.log('[WebSocket] Electron API not available (running in browser)')
        }
        
        // Emit WebSocket event for real-time updates
        emit('break:end', data)
      } else {
        console.error('End break failed:', data)
      }
    } catch (error) {
      console.error('End break error:', error)
    }
  }, [emit, isConnected])

  const pauseBreak = useCallback(async (breakId: string) => {
    console.warn('[WebSocket] Pause break not implemented in backend')
    // Pause functionality is not implemented in the backend
    // This is just a UI-only pause for closing the modal
  }, [])

  const resumeBreak = useCallback(async (breakId: string) => {
    console.warn('[WebSocket] Resume break not implemented in backend')
    // Resume functionality is not implemented in the backend
    // This is just a UI-only resume for reopening the modal
  }, [])

  // Request initial data
  const requestInitialData = useCallback(async () => {
    if (!isConnected) return
    
    // Don't override WebSocket updates
    if (isWebSocketUpdate) {
      console.log('[WebSocket] Skipping API call - WebSocket update in progress')
      return
    }
    
    try {
      // Fetch all time tracking data directly
      const [statusResponse, entriesResponse, breaksResponse] = await Promise.all([
        fetch('/api/time-tracking/status'),
        fetch('/api/time-tracking'),
        fetch('/api/breaks/scheduled')
      ])

      const [statusData, entriesData, breaksData] = await Promise.all([
        statusResponse.json(),
        entriesResponse.json(),
        breaksResponse.json()
      ])

      // Map active break data if it exists
      const activeBreak = statusData.activeBreak ? {
        id: statusData.activeBreak.id,
        type: statusData.activeBreak.type,
        startTime: statusData.activeBreak.actualStart,
        actualStart: statusData.activeBreak.actualStart,
        duration: statusData.activeBreak.duration || (statusData.activeBreak.type === 'LUNCH' ? 60 : 15),
        awayReason: statusData.activeBreak.awayReason,
        isPaused: statusData.activeBreak.ispaused || false,
        pausedDuration: statusData.activeBreak.pausedduration || 0,
        pauseUsed: statusData.activeBreak.pauseused || false
      } : null
      
      console.log('[WebSocket] Active break from API:', statusData.activeBreak)
      if (statusData.activeBreak) {
        console.log('[WebSocket] pauseused value:', statusData.activeBreak.pauseused, 'type:', typeof statusData.activeBreak.pauseused)
      }
      console.log('[WebSocket] Mapped active break:', activeBreak)

      // Update state with fetched data (filter out any undefined entries)
      setState({
        isClockedIn: statusData.isClockedIn || false,
        activeEntry: statusData.activeEntry || null,
        timeEntries: (entriesData.entries || []).filter(e => e && e.clockIn),
        scheduledBreaks: breaksData.breaks || [],
        activeBreak: activeBreak,
        weeklySchedule: statusData.workSchedules || [],
        showBreakScheduler: false,
        pendingTimeEntryId: null,
        stats: entriesData.stats || { today: 0, week: 0, month: 0 }
      })
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching initial data:', error)
      setIsLoading(false)
    }
  }, [isConnected, isWebSocketUpdate])

  // WebSocket event handlers
  const handleClockInSuccess = useCallback(async (data: any) => {
    console.log('[WebSocket] Clock in success:', data)
    
    // Update state immediately
    setState(prev => ({
      ...prev,
      isClockedIn: true,
      activeEntry: data.timeEntry, // ← FIXED: was data.time_entries (plural)
      // Add new entry to the top of the history (filter out undefined)
      timeEntries: data.timeEntry 
        ? [data.timeEntry, ...prev.timeEntries.filter(e => e && e.id !== data.timeEntry.id)]
        : prev.timeEntries.filter(e => e),
      weeklySchedule: data.workSchedules || prev.weeklySchedule,
      showBreakScheduler: data.showBreakScheduler || false,
      pendingTimeEntryId: data.timeEntry?.id || null
    }))
    
    // Refresh stats from API to get accurate calculations
    try {
      const entriesResponse = await fetch('/api/time-tracking')
      const entriesData = await entriesResponse.json()
      
      if (entriesData.stats) {
        setState(prev => ({
          ...prev,
          stats: entriesData.stats
        }))
      }
    } catch (error) {
      console.error('[WebSocket] Error refreshing stats after clock in:', error)
    }
  }, [])

  const handleClockOutSuccess = useCallback(async (data: any) => {
    console.log('[WebSocket] Clock out success:', data)
    
    // Update state immediately
    setState(prev => ({
      ...prev,
      isClockedIn: false,
      activeEntry: null,
      // Remove the old entry (if it exists) and add the updated one with clockOut time (filter out undefined)
      timeEntries: data.timeEntry
        ? [data.timeEntry, ...prev.timeEntries.filter(e => e && e.id !== data.timeEntry.id)]
        : prev.timeEntries.filter(e => e),
      weeklySchedule: data.workSchedules || prev.weeklySchedule
    }))
    
    // Refresh stats from API to get accurate calculations
    try {
      const entriesResponse = await fetch('/api/time-tracking')
      const entriesData = await entriesResponse.json()
      
      if (entriesData.stats) {
        setState(prev => ({
          ...prev,
          stats: entriesData.stats
        }))
      }
    } catch (error) {
      console.error('[WebSocket] Error refreshing stats after clock out:', error)
    }
  }, [])

  const handleBreakStarted = useCallback((data: any) => {
    console.log('[WebSocket] Break started:', data)
    setIsWebSocketUpdate(true) // Flag to prevent API override
    
    // Map the break data to match the expected format
    const breakData = {
      id: data.break.id,
      type: data.break.type,
      startTime: data.break.actualStart, // Use actualStart as startTime
      actualStart: data.break.actualStart,
      duration: data.break.type === 'LUNCH' ? 60 : 15, // Always set proper duration: 60min for lunch, 15min for others
      awayReason: data.break.awayReason,
      isPaused: data.break.ispaused || false,
      pausedDuration: data.break.pausedduration || 0,
      pauseUsed: data.break.pauseused || false
    }
    
    setState(prev => ({
      ...prev,
      activeBreak: breakData,
      scheduledBreaks: prev.scheduledBreaks.map(b => 
        b.id === data.break.id ? { ...b, actualStart: data.break.actualStart } : b
      )
    }))
    
    // Reset flag after a short delay to allow normal API updates
    setTimeout(() => setIsWebSocketUpdate(false), 1000)
    
    // Don't refresh data immediately - the WebSocket update is sufficient
    // The break modal will show immediately with the updated state
  }, [])

  const handleBreakEnded = useCallback((data: any) => {
    console.log('[WebSocket] Break ended:', data)
    setIsWebSocketUpdate(true) // Flag to prevent API override
    setState(prev => {
      console.log('[WebSocket] Setting activeBreak to null, previous state:', prev.activeBreak)
      console.log('[WebSocket] Updating scheduled breaks, breakId:', data.break?.id, 'actualEnd:', data.break?.actualEnd)
      console.log('[WebSocket] Current scheduled breaks:', prev.scheduledBreaks.map(b => ({ id: b.id, actualStart: b.actualStart, actualEnd: b.actualEnd })))
      
      const updatedScheduledBreaks = prev.scheduledBreaks.map(b => {
        if (b.id === data.break?.id) {
          console.log('[WebSocket] Updating break in scheduled list:', b.id, 'with actualEnd:', data.break?.actualEnd)
          return { ...b, actualEnd: data.break?.actualEnd }
        }
        return b
      })
      
      // If no break was found by ID, try to find the most recent break that started but hasn't ended
      const foundBreak = updatedScheduledBreaks.find(b => b.id === data.break?.id)
      if (!foundBreak) {
        console.log('[WebSocket] Break not found by ID, looking for most recent active break')
        const mostRecentActiveBreak = updatedScheduledBreaks
          .filter(b => b.actualStart && !b.actualEnd)
          .sort((a, b) => new Date(b.actualStart).getTime() - new Date(a.actualStart).getTime())[0]
        
        if (mostRecentActiveBreak) {
          console.log('[WebSocket] Found most recent active break:', mostRecentActiveBreak.id, 'updating with actualEnd:', data.break?.actualEnd)
          return {
            ...prev,
            activeBreak: null,
            scheduledBreaks: updatedScheduledBreaks.map(b => 
              b.id === mostRecentActiveBreak.id ? { ...b, actualEnd: data.break?.actualEnd } : b
            )
          }
        }
      }
      
      console.log('[WebSocket] Updated scheduled breaks:', updatedScheduledBreaks.map(b => ({ id: b.id, actualStart: b.actualStart, actualEnd: b.actualEnd })))
      
      return {
        ...prev,
        activeBreak: null,
        scheduledBreaks: updatedScheduledBreaks
      }
    })
    
    // Reset flag after a short delay to allow normal API updates
    setTimeout(() => {
      setIsWebSocketUpdate(false)
      // Force refresh scheduled breaks data as a fallback
      console.log('[WebSocket] Fallback: Refreshing scheduled breaks data')
      fetch('/api/breaks/scheduled')
        .then(response => response.json())
        .then(data => {
          console.log('[WebSocket] Fallback: Received scheduled breaks:', data.breaks)
          setState(prev => ({
            ...prev,
            scheduledBreaks: data.breaks || prev.scheduledBreaks
          }))
        })
        .catch(error => console.error('[WebSocket] Fallback: Error refreshing scheduled breaks:', error))
    }, 1000)
  }, [])

  const handleDataUpdate = useCallback((data: any) => {
    console.log('[WebSocket] Data update received:', data)
    setState(prev => ({
      ...prev,
      ...data
    }))
    setIsLoading(false)
  }, [])

  const handleBreakPaused = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      activeBreak: prev.activeBreak ? { 
        ...prev.activeBreak, 
        isPaused: true,
        pausedDuration: data.break?.pausedduration || prev.activeBreak.pausedDuration
      } : null
    }))
  }, [])

  const handleBreakResumed = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      activeBreak: prev.activeBreak ? { 
        ...prev.activeBreak, 
        isPaused: false,
        pausedDuration: data.break?.pausedduration || 0
      } : null
    }))
  }, [])

  const handleBreakAutoStartTrigger = useCallback(async (data: any) => {
    console.log('[WebSocket] Break auto-start trigger:', data)
    
    // Only process if it's for this user (check would need staffUserId comparison)
    // For now, let's auto-start the break via API
    try {
      const response = await fetch('/api/breaks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breakId: data.breakId,
          type: data.breakType
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('[WebSocket] Auto-started break:', result)
        // The handleBreakStarted will be triggered by the WebSocket event from the API
      }
    } catch (error) {
      console.error('[WebSocket] Error auto-starting break:', error)
    }
  }, [])

  // Set up event listeners
  useEffect(() => {
    if (!socket || !isConnected) return

    on('time:clockedin', handleClockInSuccess)
    on('time:clockedout', handleClockOutSuccess)
    on('break:started', handleBreakStarted)
    on('break:ended', handleBreakEnded)
    on('break:paused', handleBreakPaused)
    on('break:resumed', handleBreakResumed)
    on('break:auto-start-trigger', handleBreakAutoStartTrigger)
    on('time:data-updated', handleDataUpdate)

    // Don't request initial data here - it's handled by the connection effect
    // This prevents race conditions with WebSocket updates

    // Cleanup
    return () => {
      off('time:clockedin', handleClockInSuccess)
      off('time:clockedout', handleClockOutSuccess)
      off('break:started', handleBreakStarted)
      off('break:ended', handleBreakEnded)
      off('break:paused', handleBreakPaused)
      off('break:resumed', handleBreakResumed)
      off('break:auto-start-trigger', handleBreakAutoStartTrigger)
      off('time:data-updated', handleDataUpdate)
    }
  }, [socket, isConnected, on, off, requestInitialData, handleClockInSuccess, handleClockOutSuccess, handleBreakStarted, handleBreakEnded, handleBreakPaused, handleBreakResumed, handleBreakAutoStartTrigger, handleDataUpdate])

  // Request initial data when connection is established (only once)
  useEffect(() => {
    if (isConnected) {
      requestInitialData()
    }
  }, [isConnected]) // Remove requestInitialData from dependencies to prevent loops

  // Reset break scheduler state
  const resetBreakScheduler = useCallback(() => {
    setState(prev => ({
      ...prev,
      showBreakScheduler: false,
      pendingTimeEntryId: null
    }))
  }, [])

  // Refresh scheduled breaks after scheduling
  const refreshScheduledBreaks = useCallback(async () => {
    try {
      const response = await fetch('/api/breaks/scheduled')
      const data = await response.json()
      
      if (response.ok) {
        console.log('[WebSocket] Refreshed scheduled breaks:', data.breaks)
        setState(prev => ({
          ...prev,
          scheduledBreaks: data.breaks || []
        }))
      }
    } catch (error) {
      console.error('Error refreshing scheduled breaks:', error)
    }
  }, [])

  return {
    ...state,
    isLoading,
    isConnected,
    // Actions
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    pauseBreak,
    resumeBreak,
    requestInitialData,
    resetBreakScheduler,
    refreshScheduledBreaks
  }
}
