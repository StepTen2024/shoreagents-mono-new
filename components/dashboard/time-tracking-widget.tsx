"use client"

import { useState } from 'react'
import { Clock, LogIn, LogOut, Coffee, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useDashboardTimeTracking } from '@/hooks/use-dashboard-time-tracking'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export function TimeTrackingWidget() {
  const { status, loading, error, handleClockIn, handleClockOut, handleStartBreak } = useDashboardTimeTracking()
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState(false)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const onClockIn = async () => {
    setActionLoading(true)
    const result = await handleClockIn()
    setActionLoading(false)

    if (result.success) {
      toast({
        title: "Clocked In Successfully",
        description: "Your time tracking has started",
      })
    } else {
      toast({
        title: "Clock In Failed",
        description: result.error,
        variant: "destructive"
      })
    }
  }

  const onClockOut = async () => {
    setActionLoading(true)
    const result = await handleClockOut()
    setActionLoading(false)

    if (result.success) {
      toast({
        title: "Clocked Out Successfully",
        description: "Great work today!",
      })
    } else {
      toast({
        title: "Clock Out Failed",
        description: result.error,
        variant: "destructive"
      })
    }
  }

  const onStartBreak = async () => {
    setActionLoading(true)
    const result = await handleStartBreak()
    setActionLoading(false)

    if (result.success) {
      toast({
        title: "Break Started",
        description: "Enjoy your break!",
      })
    } else {
      toast({
        title: "Break Start Failed",
        description: result.error,
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-blue-400 animate-spin" />
          <h2 className="text-xl font-bold text-white">Loading Time Status...</h2>
        </div>
      </div>
    )
  }

  if (error || !status) {
    return (
      <div className="rounded-2xl bg-red-900/20 backdrop-blur-xl ring-1 ring-red-500/50 p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Time Tracking Unavailable</h2>
            <p className="text-sm text-red-300 mt-1">{error || 'Failed to load time tracking status'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-900/30 to-indigo-900/30 backdrop-blur-xl ring-1 ring-blue-500/50 p-6 shadow-xl transition-all duration-500 hover:ring-blue-500 hover:shadow-blue-500/30">
      <div className="flex items-start justify-between gap-4">
        {/* Left Side - Status */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Time Tracking</h2>
          </div>

          {status.isClockedIn ? (
            <div className="space-y-3">
              {/* Clocked In Status */}
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-lg font-semibold text-green-400">CLOCKED IN</span>
              </div>

              {/* Clock In Time */}
              {status.clockInTime && (
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Started at {formatTime(status.clockInTime)}</span>
                </div>
              )}

              {/* Hours Worked */}
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-500/20 px-4 py-2 ring-1 ring-blue-500/50">
                  <div className="text-sm text-blue-300">Hours Today</div>
                  <div className="text-3xl font-bold text-blue-400">
                    {(status.hoursWorked ?? 0).toFixed(1)}h
                  </div>
                </div>
              </div>

              {/* Break Status */}
              {status.isOnBreak && (
                <div className="flex items-center gap-2 text-orange-400">
                  <Coffee className="h-4 w-4" />
                  <span>Currently on {status.currentBreakType} break</span>
                </div>
              )}

              {/* Next Break */}
              {!status.isOnBreak && status.nextBreak && (
                <div className="text-sm text-slate-300">
                  Next: {status.nextBreak.type} at {status.nextBreak.time}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Not Clocked In */}
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-500" />
                <span className="text-lg font-semibold text-slate-400">NOT CLOCKED IN</span>
              </div>

              {/* Schedule */}
              {status.schedule && (
                <div className="text-white">
                  <div className="text-sm text-slate-400">Today's Schedule</div>
                  <div className="text-lg font-semibold">
                    {status.schedule.startTime} - {status.schedule.endTime}
                  </div>
                  <div className="text-xs text-slate-400">{status.schedule.timezone}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Actions */}
        <div className="flex flex-col gap-2">
          {status.isClockedIn ? (
            <>
              <Button
                onClick={onClockOut}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Clock Out
              </Button>

              {!status.isOnBreak && (
                <Button
                  onClick={onStartBreak}
                  disabled={actionLoading}
                  variant="outline"
                  className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  Take Break
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={onClockIn}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              Clock In
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

