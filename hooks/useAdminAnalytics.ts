"use client"

import { useState, useEffect, useCallback } from 'react'

interface DailyTrend {
  date: string
  productivity: number
  activeStaff: number
  totalActivity: number
  companies?: {
    companyName: string
    staffCount: number
    averageProductivity: number
    totalActivity: number
  }[]
}

interface RecentActivity {
  date: string
  activeStaff: number
  totalScreenshots: number
  totalUrls: number
  totalApplications: number
}

interface DepartmentStats {
  companyName: string
  staffCount: number
  activeStaff: number
  averageProductivity: number
  totalActivity: number
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
  }
}

interface TopPerformer {
  id: string
  name: string
  email: string
  company: string
  productivityScore: number
  lastActivity: string | null
}

interface Company {
  id: string
  name: string
  staffCount: number
  activeStaff: number
}

interface AdminAnalyticsData {
  summary: {
    totalStaff: number
    activeStaff: number
    averageProductivity: number
    totalCompanies: number
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
  trends: {
    daily: DailyTrend[]
    recentActivity: RecentActivity[]
  }
  departments: DepartmentStats[]
  topPerformers: TopPerformer[]
  companies: Company[]
}

export function useAdminAnalytics(selectedDays: number = 30) {
  const [data, setData] = useState<AdminAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setLoading(true)
      }
      
      console.log('Fetching admin analytics data for days:', selectedDays)
      const response = await fetch(`/api/admin/analytics?days=${selectedDays}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data")
      }
      
      const result = await response.json()
      setData(result)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }, [selectedDays])

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  // Refresh data manually
  const refresh = useCallback(() => {
    fetchAnalyticsData(true)
  }, [fetchAnalyticsData])

  // Format time helper
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Format number helper
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return Math.round(((current - previous) / previous) * 100)
  }

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
    formatTime,
    formatNumber,
    calculatePercentageChange
  }
}
