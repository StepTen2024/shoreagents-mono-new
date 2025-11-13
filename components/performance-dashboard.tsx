"use client"

import { useState, useEffect } from "react"
import {
  Activity, MousePointer, Keyboard, Clock, Monitor, Download,
  Upload, Wifi, Copy, FileText, Globe, Eye, BarChart3, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PerformanceMetric {
  id: string
  date: string
  mouseMovements: number
  mouseClicks: number
  keystrokes: number
  idleTime: number
  activeTime: number
  screenshotCount: number
  applicationsUsed: string[]
  urlsVisited: number
  visitedUrlsList?: string[]
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [todayMetrics, setTodayMetrics] = useState<PerformanceMetric | null>(null)
  const [totalScreenshots, setTotalScreenshots] = useState(0)
  const [liveMetrics, setLiveMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isElectron, setIsElectron] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [debugEvents, setDebugEvents] = useState<any[]>([])
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if running in Electron
    const inElectron = typeof window !== 'undefined' && window.electron?.isElectron
    setIsElectron(!!inElectron)
    
    // Fetch API metrics
    fetchMetrics()
    
    // Auto-refresh metrics every 10 seconds to pick up new screenshots
    const refreshInterval = setInterval(() => {
      fetchMetrics()
    }, 10000) // 10 seconds
    
    // If in Electron, also get live metrics
    if (inElectron) {
      fetchLiveMetrics()
      
      // Subscribe to real-time updates
      const unsubscribe = window.electron?.performance?.onMetricsUpdate((data) => {
        if (data.metrics) {
          setLiveMetrics(data.metrics)
        }
      })
      
            // Subscribe to debug activity events
            const unsubscribeDebug = window.electron?.activityTracker?.onActivityDebug((event) => {
              setDebugEvents(prev => {
                // Filter out redundant events that don't count towards metrics
                const skipEvents = ['keyup', 'mouseup', 'mousedown', 'wheel']
                if (skipEvents.includes(event.type)) {
                  return prev // Skip redundant events
                }
                const newEvents = [event, ...prev].slice(0, 50) // Keep last 50 events
                return newEvents
              })
            })
      
      return () => {
        clearInterval(refreshInterval)
        unsubscribe?.()
        unsubscribeDebug?.()
      }
    }
    
    return () => {
      clearInterval(refreshInterval)
    }
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/analytics")
      if (!response.ok) throw new Error("Failed to fetch performance metrics")
      const data = await response.json()
      setMetrics(data.metrics)
      setTodayMetrics(data.today || null)
      setTotalScreenshots(data.totalScreenshots || 0)
      
      // If in Electron and we have today's metrics, load them into Electron's local tracker
      // This initializes Electron with database baseline so it continues from there instead of 0
      if (window.electron?.sync?.loadFromDatabase && data.today) {
        try {
          console.log('[Dashboard] Loading database metrics into Electron for live tracking baseline')
          await window.electron.sync.loadFromDatabase(data.today)
          console.log('[Dashboard] ✅ Electron metrics initialized with database values')
        } catch (loadError) {
          console.error('[Dashboard] Failed to load metrics into Electron:', loadError)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load performance data")
    } finally {
      setLoading(false)
    }
  }

  const fetchLiveMetrics = async () => {
    if (!window.electron?.performance) return
    
    try {
      const metrics = await window.electron.performance.getCurrentMetrics()
      setLiveMetrics(metrics)
    } catch (err) {
      console.error('Error fetching live metrics:', err)
    }
  }

  const handleForceSync = async () => {
    if (!window.electron?.sync) return
    
    setIsSyncing(true)
    try {
      await window.electron.sync.forceSync()
      // Refresh API metrics after sync
      await fetchMetrics()
    } catch (err) {
      console.error('Error forcing sync:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  const formatTime = (seconds: number) => {
    // Handle both seconds (live metrics) and minutes (API metrics)
    const totalSeconds = Math.floor(seconds)
    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hours}h ${mins}m ${secs}s`
  }

  const calculateProductivityScore = (metric: PerformanceMetric) => {
    if (!metric) return 0
    
    // Prevent NaN by checking for zero division
    const totalTime = metric.activeTime + metric.idleTime
    const activePercent = totalTime > 0 ? (metric.activeTime / totalTime) * 100 : 0
    const keystrokesScore = Math.min((metric.keystrokes / 5000) * 100, 100)
    const clicksScore = Math.min((metric.mouseClicks / 1000) * 100, 100)
    
    return Math.round((activePercent + keystrokesScore + clicksScore) / 3)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Performance Data</h2>
            <p className="mt-2 text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Use live metrics if available (now properly initialized with database baseline)
  // Otherwise fallback to database metrics
  // Live metrics = database baseline + current session activity (real-time!)
  const displayMetrics = (isElectron && liveMetrics) 
    ? { ...liveMetrics, screenshotCount: todayMetrics?.screenshotCount || 0 }
    : todayMetrics
  
  const productivity = displayMetrics ? calculateProductivityScore(displayMetrics) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-purple-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                <Activity className="h-8 w-8 text-purple-400" />
                Performance Dashboard
                {isElectron && (
                  <Badge variant="outline" className="ml-2 border-emerald-500/50 text-emerald-400">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    Live Tracking
                  </Badge>
                )}
              </h1>
              <p className="mt-1 text-slate-300">
                {isElectron ? 'Real-time desktop activity monitoring' : 'Activity monitoring'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isElectron && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDebug(!showDebug)}
                    className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showDebug ? 'Hide' : 'Show'} Debug
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </>
              )}
              <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{productivity}%</div>
                <div className="text-xs text-slate-400">Productivity</div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Panel - Shows real-time events from uiohook-napi */}
        {showDebug && isElectron && (
          <div className="rounded-2xl bg-gradient-to-br from-amber-900/50 via-orange-900/50 to-amber-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-amber-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-400 animate-pulse" />
                uiohook-napi Event Monitor (Temporary Debug)
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebugEvents([])}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                Clear
              </Button>
            </div>
            <div className="rounded-lg bg-black/50 p-4 h-96 overflow-y-auto font-mono text-sm">
              {debugEvents.length === 0 ? (
                <div className="text-center text-slate-400 mt-8">
                  <p>Waiting for activity...</p>
                  <p className="text-xs mt-2">Move your mouse, click, or type to see events</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {debugEvents.map((event, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-2 rounded ${
                        event.type === 'keydown'
                          ? 'bg-emerald-900/30 text-emerald-300'
                          : event.type === 'click'
                          ? 'bg-purple-900/30 text-purple-300'
                          : event.type === 'mousemove'
                          ? 'bg-blue-900/30 text-blue-300'
                          : 'bg-slate-800/30 text-slate-300'
                      }`}
                    >
                      <span className="text-xs text-slate-500 w-20">{event.timestamp}</span>
                      <span className="font-bold w-28">
                        {event.type === 'keydown' ? 'KEY' : event.type === 'click' ? 'CLICK' : event.type === 'mousemove' ? 'MOVE' : event.type.toUpperCase()}
                      </span>
                      {event.data && (
                        <span className="text-xs flex-1">
                          {/* Keyboard events - show key name prominently */}
                          {event.data.keyName && (
                            <span className="font-bold text-emerald-400 px-3 py-1 bg-emerald-900/40 rounded text-sm">
                              {event.data.keyName}
                            </span>
                          )}
                          
                          {/* Mouse events */}
                          {event.data.x !== undefined && event.data.y !== undefined && !event.data.keyName && (
                            <span>x:{event.data.x} y:{event.data.y}</span>
                          )}
                          {event.data.button !== undefined && (
                            <span className="ml-2 text-purple-400">btn:{event.data.button}</span>
                          )}
                        </span>
                      )}
                      <div className="ml-auto flex gap-1">
                        {event.type === 'keydown' && <Keyboard className="h-4 w-4" />}
                        {event.type === 'click' && <MousePointer className="h-4 w-4" />}
                        {event.type === 'mousemove' && <MousePointer className="h-4 w-4 opacity-50" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-amber-200 bg-amber-900/20 p-3 rounded-lg">
              <p className="font-bold">ℹ️ Debug Mode (Temporary)</p>
              <p className="mt-1 text-xs text-amber-300">
                This panel shows only the events that count towards performance metrics (redundant events are filtered).
                Color coding: <span className="text-emerald-300">Green = Keyboard</span>, <span className="text-purple-300">Purple = Click</span>, <span className="text-blue-300">Blue = Mouse Move</span>
              </p>
              <p className="mt-2 text-xs text-amber-300">
                💡 <strong>Filtered out:</strong> KEYUP, MOUSEUP, MOUSEDOWN, WHEEL - only showing KEYDOWN, CLICK, and MOUSEMOVE
              </p>
            </div>
          </div>
        )}

        {/* Real-time Input Tracking */}
        {displayMetrics && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-gradient-to-br from-blue-900/50 to-blue-800/50 p-4 ring-1 ring-blue-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{displayMetrics.mouseMovements?.toLocaleString() || 0}</div>
                    <div className="mt-1 text-sm text-blue-300">Mouse Movements</div>
                  </div>
                  <MousePointer className="h-8 w-8 text-blue-400" />
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-4 ring-1 ring-purple-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{displayMetrics.mouseClicks?.toLocaleString() || 0}</div>
                    <div className="mt-1 text-sm text-purple-300">Mouse Clicks</div>
                  </div>
                  <MousePointer className="h-8 w-8 text-purple-400" />
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-emerald-900/50 to-emerald-800/50 p-4 ring-1 ring-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{displayMetrics.keystrokes?.toLocaleString() || 0}</div>
                    <div className="mt-1 text-sm text-emerald-300">Keystrokes</div>
                  </div>
                  <Keyboard className="h-8 w-8 text-emerald-400" />
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-amber-900/50 to-amber-800/50 p-4 ring-1 ring-amber-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{formatTime(displayMetrics.idleTime || 0)}</div>
                    <div className="mt-1 text-sm text-amber-300">Idle Time</div>
                  </div>
                  <Clock className="h-8 w-8 text-amber-400" />
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-900/50 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{formatTime(displayMetrics.activeTime || 0)}</div>
                    <div className="mt-1 text-sm text-slate-400">Active Time</div>
                  </div>
                  <Activity className="h-8 w-8 text-emerald-400" />
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/50 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{displayMetrics.applicationsUsed?.length || 0}</div>
                    <div className="mt-1 text-sm text-slate-400">Apps Used</div>
                  </div>
                  <Monitor className="h-8 w-8 text-blue-400" />
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/50 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{displayMetrics.urlsVisited?.toLocaleString() || 0}</div>
                    <div className="mt-1 text-sm text-slate-400">URLs Visited</div>
                  </div>
                  <Globe className="h-8 w-8 text-purple-400" />
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/50 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{displayMetrics.screenshotCount?.toLocaleString() || 0}</div>
                    <div className="mt-1 text-sm text-slate-400">Screenshots Today</div>
                  </div>
                  <Eye className="h-8 w-8 text-amber-400" />
                </div>
              </div>
            </div>

            {/* Applications & URLs */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
                <h2 className="mb-4 text-xl font-bold text-white">Active Applications</h2>
                {!displayMetrics.applicationsUsed || displayMetrics.applicationsUsed.length === 0 ? (
                  <p className="text-slate-400">No applications recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {displayMetrics.applicationsUsed.slice(0, 5).map((app: string, index: number) => (
                      <div key={index} className="rounded-lg bg-slate-800/50 p-3 ring-1 ring-white/5">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-blue-400" />
                          <span className="text-white">{app}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
                <h2 className="mb-4 text-xl font-bold text-white">Browser Activity</h2>
                <div className="space-y-4">
                  
                  
                  {/* Display list of visited URLs */}
                  {isElectron && (
                    <div className="mt-4 space-y-2">
                      <h3 className="text-sm font-semibold text-slate-300">Visited Pages:</h3>
                      {displayMetrics.visitedUrlsList && displayMetrics.visitedUrlsList.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2" style={{ 
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#475569 #1e293b'
                        }}>
                          {displayMetrics.visitedUrlsList.map((url: string, index: number) => {
                            // Remove "page:" prefix if present
                            const displayUrl = url.startsWith('page:') ? url.substring(5) : url
                            
                            return (
                              <div
                                key={index}
                                className="flex items-start gap-2 rounded-lg bg-slate-800/50 p-3 text-sm hover:bg-slate-800 transition-colors"
                              >
                                <Globe className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-300 break-all">{displayUrl}</span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No pages visited yet. Browse some websites to see them here.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Weekly Performance */}
        <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
          <h2 className="mb-4 text-xl font-bold text-white">Weekly Performance</h2>
          {metrics.length === 0 ? (
            <p className="text-slate-400">No performance data available yet</p>
          ) : (
            <div className="space-y-2">
              {metrics.slice(0, 7).map((metric) => {
                const score = calculateProductivityScore(metric)
                return (
                  <div key={metric.id} className="rounded-lg bg-slate-800/50 p-4 ring-1 ring-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">
                          {new Date(metric.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                          {formatTime(metric.activeTime)} active • {metric.keystrokes.toLocaleString()} keystrokes
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{score}%</div>
                        <div className="text-xs text-slate-400">Score</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}