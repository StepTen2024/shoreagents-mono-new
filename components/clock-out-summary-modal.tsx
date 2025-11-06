"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Coffee, TrendingUp } from "lucide-react"

interface ClockOutSummaryProps {
  isOpen: boolean
  data: {
    totalTime: string
    breakTime: string
    netWorkTime: string
    clockIn: string
    clockOut: string
    breaks: Array<{
      type: string
      duration: number
    }>
  }
  onClose: () => void
}

export function ClockOutSummaryModal({ isOpen, data, onClose }: ClockOutSummaryProps) {
  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
  }

  const formatTimeFromString = (timeStr: string) => {
    const hours = parseFloat(timeStr)
    return formatTime(hours)
  }

  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent 
        className="sm:max-w-lg bg-slate-900 border-slate-700"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-6 py-6">
          {/* Success Icon */}
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-green-500/10 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-400" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              Shift Complete!
            </DialogTitle>
            <p className="text-slate-400 text-sm">
              You've successfully clocked out
            </p>
          </div>

          {/* Shift Summary */}
          <div className="space-y-4 bg-slate-800/50 rounded-lg p-5 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Shift Summary
            </h3>
            
            {/* Time Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatTimeFromString(data.totalTime)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Total Time</div>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Coffee className="h-5 w-5 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatTimeFromString(data.breakTime)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Break Time</div>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {formatTimeFromString(data.netWorkTime)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Net Work</div>
              </div>
            </div>

            {/* Clock Times */}
            <div className="pt-4 border-t border-slate-700 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Clock In:</span>
                <span className="text-white font-medium">
                  {new Date(data.clockIn).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Clock Out:</span>
                <span className="text-white font-medium">
                  {new Date(data.clockOut).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </span>
              </div>
            </div>

            {/* Breaks List */}
            {data.breaks && data.breaks.length > 0 && (
              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">
                  Breaks Taken ({data.breaks.length})
                </h4>
                <div className="space-y-2">
                  {data.breaks.map((breakItem, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-slate-300 flex items-center gap-2">
                        <Coffee className="h-3 w-3 text-amber-400" />
                        {breakItem.type.charAt(0) + breakItem.type.slice(1).toLowerCase()}
                      </span>
                      <span className="text-slate-400">
                        {breakItem.duration} min
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            Great! Close Summary
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

