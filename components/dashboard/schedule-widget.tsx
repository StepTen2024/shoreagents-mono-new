"use client"

import { Calendar, Clock, Coffee } from 'lucide-react'
import { useDashboardTimeTracking } from '@/hooks/use-dashboard-time-tracking'

export function ScheduleWidget() {
  const { status, loading } = useDashboardTimeTracking()

  if (loading || !status?.schedule) {
    return null // Don't show if no schedule available
  }

  const { schedule } = status

  return (
    <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 p-6 shadow-xl transition-all duration-500 hover:ring-white/20 hover:shadow-indigo-500/30">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="h-5 w-5 text-indigo-400" />
        <h2 className="text-xl font-bold text-white">Today's Schedule</h2>
      </div>

      <div className="space-y-4">
        {/* Shift Times */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 ring-1 ring-indigo-500/50">
            <Clock className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-sm text-slate-400">Shift Hours</div>
            <div className="text-lg font-semibold text-white">
              {schedule.startTime} - {schedule.endTime}
            </div>
            <div className="text-xs text-slate-500">{schedule.timezone}</div>
          </div>
        </div>

        {/* Breaks */}
        {schedule.breaks && schedule.breaks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Coffee className="h-4 w-4 text-orange-400" />
              <div className="text-sm font-semibold text-slate-300">Scheduled Breaks</div>
            </div>
            <div className="space-y-2">
              {schedule.breaks.map((breakItem, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 ring-1 ring-white/5"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-white">
                      {breakItem.type}
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">
                    {breakItem.scheduledTime} • {breakItem.duration}min
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

