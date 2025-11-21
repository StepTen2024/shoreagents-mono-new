"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Coffee, Lock, AlertCircle } from "lucide-react"

interface BreakSchedulerProps {
  isOpen: boolean
  timeEntryId: string
  shiftEndTime?: string | null  // Shift end time (e.g., "18:00:00")
  onScheduled: () => void
  onSkip: () => void
}

export function BreakScheduler({ isOpen, timeEntryId, shiftEndTime, onScheduled, onSkip }: BreakSchedulerProps) {
  const [breaks, setBreaks] = useState([
    { type: 'MORNING', label: 'Morning Break', duration: 15, scheduledStart: '09:00' },
    { type: 'LUNCH', label: 'Lunch Break', duration: 60, scheduledStart: '11:00' },
    { type: 'AFTERNOON', label: 'Afternoon Break', duration: 15, scheduledStart: '13:00' }
  ])
  const [loading, setLoading] = useState(false)
  
  // Check if a break time has already passed
  const isTimePassed = (timeString: string): boolean => {
    const now = new Date()
    const [hours, minutes] = timeString.split(':').map(Number)
    const breakTime = new Date()
    breakTime.setHours(hours, minutes, 0, 0)
    return now > breakTime
  }
  
  // Check if a break time (including duration) exceeds shift end time
  const exceedsShiftEnd = (timeString: string, durationMinutes: number): boolean => {
    if (!shiftEndTime) return false // No validation if shift end time is not provided
    
    const [breakHours, breakMinutes] = timeString.split(':').map(Number)
    const [shiftHours, shiftMinutes] = shiftEndTime.split(':').map(Number)
    
    const breakTime = new Date()
    breakTime.setHours(breakHours, breakMinutes, 0, 0)
    
    const breakEndTime = new Date(breakTime.getTime() + durationMinutes * 60 * 1000)
    
    const shiftEnd = new Date()
    shiftEnd.setHours(shiftHours, shiftMinutes, 0, 0)
    
    return breakEndTime > shiftEnd
  }
  
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)
    const endHour = endDate.getHours()
    const endMin = endDate.getMinutes()
    
    const period = endHour >= 12 ? 'PM' : 'AM'
    const hour12 = endHour === 0 ? 12 : endHour > 12 ? endHour - 12 : endHour
    return `${hour12}:${String(endMin).padStart(2, '0')} ${period}`
  }
  
  const handleSchedule = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/time-tracking/schedule-breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timeEntryId, 
          breaks: breaks.map(b => ({
            type: b.type,
            scheduledStart: convertTo12Hour(b.scheduledStart),
            scheduledEnd: calculateEndTime(b.scheduledStart, b.duration)
          }))
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Breaks scheduled successfully:', data)
        onScheduled()
      } else {
        console.error('❌ Failed to schedule breaks:', data)
        alert(data.error || 'Failed to schedule breaks')
      }
    } catch (error) {
      console.error('Error scheduling breaks:', error)
      alert('Failed to schedule breaks')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSkipWithDefaults = async () => {
    // Save the default break times to database
    setLoading(true)
    try {
      const response = await fetch('/api/time-tracking/schedule-breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timeEntryId, 
          breaks: breaks.map(b => ({
            type: b.type,
            scheduledStart: convertTo12Hour(b.scheduledStart),
            scheduledEnd: calculateEndTime(b.scheduledStart, b.duration)
          }))
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Default breaks scheduled successfully:', data)
        onScheduled()
      } else {
        console.error('❌ Failed to schedule default breaks:', data)
        alert(data.error || 'Failed to schedule breaks')
      }
    } catch (error) {
      console.error('Error scheduling default breaks:', error)
      alert('Failed to schedule breaks')
    } finally {
      setLoading(false)
    }
  }
  
  const convertTo12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${hour12}:${minutes} ${period}`
  }
  
  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700">
        <div className="py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-full bg-indigo-500/10 p-3">
              <Coffee className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Schedule Your Breaks</DialogTitle>
              <DialogDescription className="text-sm text-slate-400">For today's shift</DialogDescription>
            </div>
          </div>
          
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
            <Lock className="h-5 w-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300 mb-1">
                Breaks will be locked in
              </p>
              <p className="text-xs text-slate-400">
                Both options will save and lock your breaks for today's shift. Customize times or use the defaults (9:00 AM, 11:00 AM, 1:00 PM).
              </p>
            </div>
          </div>
          
          {breaks.some(b => isTimePassed(b.scheduledStart)) && (
            <div className="mb-4 flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/30 p-4">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300 mb-1">
                  Warning: Some break times have already passed
                </p>
                <p className="text-xs text-slate-400">
                  Please adjust the times to schedule breaks for later in your shift, or they may be missed.
                </p>
              </div>
            </div>
          )}
          
          {breaks.some(b => exceedsShiftEnd(b.scheduledStart, b.duration)) && (
            <div className="mb-4 flex items-start gap-3 rounded-lg bg-orange-500/10 border border-orange-500/30 p-4">
              <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-300 mb-1">
                  Warning: Some breaks extend past your shift end time
                </p>
                <p className="text-xs text-slate-400">
                  These breaks will end after your scheduled shift. Please adjust to fit within your work hours.
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-4 mb-6">
            {breaks.map((b, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white">{b.label}</span>
                  <span className="text-xs text-slate-400">
                    {b.duration} min duration
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <label className="text-sm text-slate-400 w-16">Start:</label>
                    <input
                      type="time"
                      value={b.scheduledStart}
                      onChange={(e) => {
                        const updated = [...breaks]
                        updated[i].scheduledStart = e.target.value
                        setBreaks(updated)
                      }}
                      className={`flex-1 bg-slate-700 text-white rounded px-3 py-2 border ${
                        isTimePassed(b.scheduledStart) 
                          ? 'border-red-500/50' 
                          : exceedsShiftEnd(b.scheduledStart, b.duration)
                          ? 'border-orange-500/50'
                          : 'border-slate-600'
                      } focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                    />
                  </div>
                  {isTimePassed(b.scheduledStart) && (
                    <div className="flex items-center gap-1 text-xs text-red-400 ml-16">
                      <AlertCircle className="h-3 w-3" />
                      <span>⚠️ This time has already passed</span>
                    </div>
                  )}
                  {exceedsShiftEnd(b.scheduledStart, b.duration) && (
                    <div className="flex items-center gap-1 text-xs text-orange-400 ml-16">
                      <AlertCircle className="h-3 w-3" />
                      <span>⚠️ Break extends past your shift end time</span>
                    </div>
                  )}
                  <div className="flex gap-2 items-center text-sm">
                    <span className="text-slate-500 w-16">Ends:</span>
                    <span className={`${exceedsShiftEnd(b.scheduledStart, b.duration) ? 'text-orange-400' : 'text-slate-300'}`}>
                      {calculateEndTime(b.scheduledStart, b.duration)} (auto)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleSkipWithDefaults}
              variant="outline"
              className="flex-1 border-slate-700 hover:bg-slate-800"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Use Default Times'}
            </Button>
            <Button
              onClick={handleSchedule}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? 'Locking In...' : 'Lock In Schedule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

