"use client"

import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from '@/lib/websocket-provider'

interface StaffMetrics {
  latest: {
    date: string
    mouseMovements: number
    mouseClicks: number
    keystrokes: number
    activeTime: number
    idleTime: number
    screenTime: number
    downloads: number
    uploads: number
    bandwidth: number
    clipboardActions: number
    filesAccessed: number
    urlsVisited: number
    tabsSwitched: number
    productivityScore: number
  } | null
  totals: {
    mouseMovements: number
    mouseClicks: number
    keystrokes: number
    activeTime: number
    idleTime: number
    screenTime: number
    downloads: number
    uploads: number
    bandwidth: number
    clipboardActions: number
    filesAccessed: number
    urlsVisited: number
    tabsSwitched: number
    productivityScore: number
  }
  history: any[]
  recordCount: number
}

interface StaffMember {
  id: string
  name: string
  email: string
  avatar: string | null
  position: string
  department: string
  employmentStatus: string
  startDate: string | null
  salary: number | null
  location: string | null
  metrics: StaffMetrics | null
  productivityScore: number
  isActive: boolean
  lastActivity: string | null
}

interface MonitoringData {
  staff: StaffMember[]
  summary: {
    totalStaff: number
    activeStaff: number
    averageProductivity: number
    dateRange: {
      start: string
      end: string
      days: number
    }
    overallTotals: {
      mouseMovements: number
      mouseClicks: number
      keystrokes: number
      activeTime: number
      idleTime: number
      screenTime: number
      downloads: number
      uploads: number
      bandwidth: number
      clipboardActions: number
      filesAccessed: number
      urlsVisited: number
      tabsSwitched: number
    }
  }
}

interface PerformanceUpdate {
  staffUserId: string
  type: 'latest' | 'totals'
  metrics: any
  isActive: boolean
  lastActivity: string
}

export function useRealtimeMonitoring(selectedDays: number) {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const { socket, isConnected, emit, on, off } = useWebSocket()

  // Fetch initial data
  const fetchMonitoringData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsUpdating(true)
      } else {
        setLoading(true)
      }
      console.log('Fetching monitoring data for days:', selectedDays)
      const response = await fetch(`/api/client/analytics?days=${selectedDays}`)
      if (!response.ok) throw new Error("Failed to fetch monitoring data")
      const result = await response.json()
      setData(result)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
      setIsUpdating(false)
    }
  }, [selectedDays])

  // Subscribe to monitoring updates
  const subscribeToUpdates = useCallback(() => {
    if (socket && isConnected) {
      console.log('[RealtimeMonitoring] Subscribing to monitoring updates')
      emit('monitoring:subscribe', { clientId: 'monitoring-client' })
    }
  }, [socket, isConnected, emit])

  // Unsubscribe from monitoring updates
  const unsubscribeFromUpdates = useCallback(() => {
    if (socket) {
      console.log('[RealtimeMonitoring] Unsubscribing from monitoring updates')
      emit('monitoring:unsubscribe', {})
    }
  }, [socket, emit])

  // Handle performance updates
  const handlePerformanceUpdate = useCallback((update: PerformanceUpdate) => {
    console.log('[RealtimeMonitoring] Received performance update:', update)
    
    setData(prevData => {
      if (!prevData) return prevData

      const updatedStaff = prevData.staff.map(staff => {
        if (staff.id === update.staffUserId) {
          const updatedStaff = { ...staff }
          
          // Update activity status
          updatedStaff.isActive = update.isActive
          updatedStaff.lastActivity = update.lastActivity
          
          // Update metrics if provided
          if (update.metrics) {
            if (update.type === 'latest') {
              updatedStaff.metrics = {
                ...staff.metrics,
                latest: update.metrics,
                totals: staff.metrics?.totals || {
                  mouseMovements: 0,
                  mouseClicks: 0,
                  keystrokes: 0,
                  activeTime: 0,
                  idleTime: 0,
                  screenTime: 0,
                  downloads: 0,
                  uploads: 0,
                  bandwidth: 0,
                  clipboardActions: 0,
                  filesAccessed: 0,
                  urlsVisited: 0,
                  tabsSwitched: 0,
                  productivityScore: 0
                },
                recordCount: (staff.metrics?.recordCount || 0) + 1,
                history: staff.metrics?.history || []
              }
            } else if (update.type === 'totals') {
              updatedStaff.metrics = {
                ...staff.metrics,
                latest: staff.metrics?.latest || null,
                totals: update.metrics,
                recordCount: staff.metrics?.recordCount || 0,
                history: staff.metrics?.history || []
              }
            }
            
            // Recalculate productivity score
            if (updatedStaff.metrics?.latest) {
              const latest = updatedStaff.metrics.latest
              const productivityScore = Math.min(100, Math.max(0, 
                (latest.mouseClicks * 0.1) + 
                (latest.keystrokes * 0.05) + 
                (latest.activeTime * 0.2) + 
                (latest.urlsVisited * 0.1) + 
                (latest.clipboardActions * 0.05)
              ))
              updatedStaff.productivityScore = Math.round(productivityScore)
            }
          }
          
          return updatedStaff
        }
        return staff
      })

      // Recalculate summary
      const activeStaff = updatedStaff.filter(s => s.isActive).length
      const totalStaff = updatedStaff.length
      const averageProductivity = totalStaff > 0 
        ? Math.round(updatedStaff.reduce((sum, s) => sum + s.productivityScore, 0) / totalStaff)
        : 0

      return {
        ...prevData,
        staff: updatedStaff,
        summary: {
          ...prevData.summary,
          activeStaff,
          averageProductivity
        }
      }
    })
    
    setLastUpdate(new Date())
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchMonitoringData()
  }, [fetchMonitoringData])

  // Note: Periodic refresh removed - using WebSocket for real-time updates only

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (isConnected) {
      subscribeToUpdates()
      
      // Listen for performance updates
      on('monitoring:performance-update', handlePerformanceUpdate)
      
      // Listen for force refresh events
      on('monitoring:refresh-requested', () => {
        console.log('[RealtimeMonitoring] Force refresh requested via WebSocket')
        fetchMonitoringData(true)
      })
      
      return () => {
        unsubscribeFromUpdates()
        off('monitoring:performance-update', handlePerformanceUpdate)
        off('monitoring:refresh-requested')
      }
    }
  }, [isConnected, subscribeToUpdates, unsubscribeFromUpdates, on, off, handlePerformanceUpdate, fetchMonitoringData])

  // Refresh data manually
  const refresh = useCallback(() => {
    fetchMonitoringData(true)
  }, [fetchMonitoringData])

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
    isConnected,
    isUpdating
  }
}
