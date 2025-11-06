"use client"

import * as React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Clock, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShiftModalProps {
  isOpen: boolean
  type: 'late-clock-in' | 'early-clock-in' | 'break-reminder' | 'clock-out' | 'clock-out-early'
  data?: any
  onAction: (selectedReason?: string) => void
  onDismiss?: () => void
}

export function ShiftModal({ isOpen, type, data, onAction, onDismiss }: ShiftModalProps) {
  const { toast } = useToast()
  const [selectedReason, setSelectedReason] = useState("")
  const [showLateReasonStep, setShowLateReasonStep] = useState(false)
  
  // Reset selected reason and step when modal opens or type changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedReason("")
      setShowLateReasonStep(false)
    }
  }, [isOpen, type])
  
  const configs = {
    'late-clock-in': {
      title: showLateReasonStep ? 'Why Were You Late?' : 'You Are Late for Your Shift',
      message: showLateReasonStep 
        ? 'Please select a reason for being late. This helps management understand attendance patterns.'
        : `Your shift started at ${data?.expectedTime ? new Date(data.expectedTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'your scheduled time'}. You are ${data?.lateBy} minutes late.`,
      icon: AlertCircle,
      iconColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      actionLabel: showLateReasonStep ? 'Start Shift' : 'Acknowledge',
      canDismiss: false
    },
    'early-clock-in': {
      title: '🌅 Amazing! You\'re Early!',
      message: `Your shift starts at ${data?.expectedTime ? new Date(data.expectedTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'your scheduled time'}. You clocked in ${data?.earlyBy} minutes early! This dedication will be recorded as bonus time. 💪`,
      icon: Clock,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      actionLabel: 'Let\'s Go! 🚀',
      canDismiss: false
    },
    'break-reminder': {
      title: 'Time for Your Break',
      message: `It's time for your ${data?.breakType} break (${data?.duration} minutes).`,
      icon: Clock,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      actionLabel: 'Start Break',
      canDismiss: true
    },
    'clock-out': {
      title: 'Clock Out Confirmation',
      message: data?.clockOutTime 
        ? `You are clocking out at ${new Date(data.clockOutTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}. Please select a reason to continue.`
        : 'Please select a reason for clocking out. This will end your shift.',
      icon: LogOut,
      iconColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      actionLabel: 'Confirm Clock Out',
      canDismiss: true
    },
    'clock-out-early': {
      title: '⚠️ Clocking Out Early',
      message: data?.scheduledEnd 
        ? `Your shift is scheduled until ${new Date(data.scheduledEnd).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. You are clocking out ${data?.earlyBy} minutes early. Please select a reason.`
        : 'You are clocking out before your scheduled shift ends. Please select a reason.',
      icon: AlertCircle,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      actionLabel: 'Confirm Early Clock Out',
      canDismiss: true
    }
  }
  
  const config = configs[type]
  const Icon = config.icon
  
  const handleAction = () => {
    // Late clock-in: 2-step flow
    if (type === 'late-clock-in' && !showLateReasonStep) {
      // Step 1: User acknowledged they're late → Show reason step
      setShowLateReasonStep(true)
      return
    }
    
    // Late clock-in Step 2: Check for reason
    if (type === 'late-clock-in' && showLateReasonStep && !selectedReason) {
      toast({
        title: "Reason Required",
        description: "Please select why you were late.",
        variant: "destructive"
      })
      return
    }
    
    // Clock-out reasons
    if ((type === 'clock-out' || type === 'clock-out-early') && !selectedReason) {
      toast({
        title: "Reason Required",
        description: "Please select a clock-out reason to continue.",
        variant: "destructive"
      })
      return
    }
    
    // Call parent action with reason (for late-clock-in, clock-out, or clock-out-early)
    onAction(selectedReason || undefined)
  }
  
  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent 
        className="sm:max-w-md bg-slate-900 border-slate-700"
        onInteractOutside={(e) => !config.canDismiss && e.preventDefault()}
        onEscapeKeyDown={(e) => !config.canDismiss && e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          <div className={`rounded-full ${config.bgColor} p-4`}>
            <Icon className={`h-12 w-12 ${config.iconColor}`} />
          </div>
          
          <div>
            <DialogTitle className="text-2xl font-bold text-white mb-2">{config.title}</DialogTitle>
            <DialogDescription className="text-slate-400">{config.message}</DialogDescription>
          </div>
          
          {/* Show reason dropdown for: late-clock-in (step 2), clock-out, clock-out-early */}
          {((type === 'late-clock-in' && showLateReasonStep) || type === 'clock-out' || type === 'clock-out-early') && (
            <select 
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border-slate-700 text-white p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Select reason...</option>
              {type === 'late-clock-in' ? (
                // Late reasons
                <>
                  <option value="TRAFFIC">Traffic</option>
                  <option value="OVERSLEPT">Overslept</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="POWER_OUTAGE">Power Outage</option>
                  <option value="INTERNET_ISSUE">Internet Issue</option>
                  <option value="FAMILY_MATTER">Family Matter</option>
                  <option value="HEALTH_ISSUE">Health Issue</option>
                  <option value="TRANSPORTATION">Transportation Issue</option>
                  <option value="WEATHER">Weather</option>
                  <option value="OTHER">Other</option>
                </>
              ) : (
                // Clock-out reasons
                <>
                  <option value="END_OF_SHIFT">End of Shift</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="SICK">Feeling Sick</option>
                  <option value="EARLY_LEAVE_APPROVED">Early Leave (Approved)</option>
                  <option value="INTERNET_ISSUE">Internet Issue</option>
                  <option value="POWER_OUTAGE">Power Outage</option>
                  <option value="PERSONAL">Personal Reason</option>
                  <option value="OTHER">Other</option>
                </>
              )}
            </select>
          )}
          
          <div className="flex gap-3 w-full">
            {config.canDismiss && onDismiss && (
              <Button
                variant="outline"
                onClick={onDismiss}
                className="flex-1 border-slate-700 hover:bg-slate-800"
              >
                Not Yet
              </Button>
            )}
            <Button
              onClick={handleAction}
              className={`flex-1 bg-indigo-600 hover:bg-indigo-700 ${!config.canDismiss ? 'w-full' : ''}`}
            >
              {config.actionLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

