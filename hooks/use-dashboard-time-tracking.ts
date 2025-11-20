"use client"

import { useState, useEffect } from 'react'

interface TimeTrackingStatus {
  isClockedIn: boolean
  clockInTime: string | null
  hoursWorked: number
  isOnBreak: boolean
  currentBreakType: string | null
  schedule: {
    startTime: string
    endTime: string
    timezone: string
    breaks: Array<{
      type: string
      scheduledTime: string
      duration: number
    }>
  } | null
  nextBreak: {
    type: string
    time: string
  } | null
}

export function useDashboardTimeTracking() {
  const [status, setStatus] = useState<TimeTrackingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTimeStatus = async () => {
    try {
      const response = await fetch('/api/time-tracking/status')
      
      if (!response.ok) {
        throw new Error('Failed to fetch time tracking status')
      }

      const data = await response.json()
      setStatus(data)
      setError(null)
    } catch (err) {
      console.error('[Dashboard Time Tracking] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchTimeStatus()

    // Update every 30 seconds for real-time hours
    const interval = setInterval(fetchTimeStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleClockIn = async () => {
    try {
      const response = await fetch('/api/time-tracking/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to clock in')
      }

      // Refresh status immediately
      await fetchTimeStatus()
      return { success: true }
    } catch (err) {
      console.error('[Dashboard] Clock in error:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Clock in failed' 
      }
    }
  }

  const handleClockOut = async () => {
    try {
      const response = await fetch('/api/time-tracking/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to clock out')
      }

      // Refresh status immediately
      await fetchTimeStatus()
      return { success: true }
    } catch (err) {
      console.error('[Dashboard] Clock out error:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Clock out failed' 
      }
    }
  }

  const handleStartBreak = async () => {
    try {
      const response = await fetch('/api/breaks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'AWAY' }) // Manual break
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start break')
      }

      // Refresh status immediately
      await fetchTimeStatus()
      return { success: true }
    } catch (err) {
      console.error('[Dashboard] Start break error:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to start break' 
      }
    }
  }

  return {
    status,
    loading,
    error,
    handleClockIn,
    handleClockOut,
    handleStartBreak,
    refresh: fetchTimeStatus
  }
}

