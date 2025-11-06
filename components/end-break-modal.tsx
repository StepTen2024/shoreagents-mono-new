"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, X } from "lucide-react"

interface EndBreakModalProps {
  isOpen: boolean
  breakData: {
    id: string
    type: string
    startTime: string
    duration: number
    awayReason?: string
  } | null
  onConfirm: () => void
  onCancel: () => void
  isEnding: boolean
}

export function EndBreakModal({ 
  isOpen, 
  breakData, 
  onConfirm, 
  onCancel, 
  isEnding 
}: EndBreakModalProps) {
  if (!isOpen || !breakData) return null

  const breakEmojis: Record<string, string> = {
    MORNING: "☕",
    LUNCH: "🍽️",
    AFTERNOON: "🍵",
    AWAY: "🚶"
  }
  
  const breakLabels: Record<string, string> = {
    MORNING: "Morning Break",
    LUNCH: "Lunch Break",
    AFTERNOON: "Afternoon Break",
    AWAY: "Away from Desk"
  }

  const awayReasonLabels: Record<string, string> = {
    BATHROOM: "🚻 Restroom",
    NURSE: "🏥 Nurse",
    MEETING: "👥 Meeting",
    MANAGEMENT: "👔 Management",
    OTHER: "📝 Other"
  }

  const startTime = new Date(breakData.startTime || new Date())
  const duration = breakData.duration || 15 // Default to 15 minutes if null
  const endTime = new Date(startTime.getTime() + (duration * 60 * 1000))
  
  const formatTime = (date: Date) => {
    if (isNaN(date.getTime())) {
      return "Invalid Date"
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes}m`
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={(e) => {
        console.log("🔄 OVERLAY CLICKED")
        if (e.target === e.currentTarget) {
          console.log("🔄 OVERLAY BACKGROUND CLICKED - should close modal")
          onCancel()
        }
      }}
    >
      <Card 
        className="w-full max-w-md border-white/10 bg-slate-800"
        onClick={(e) => {
          console.log("🔄 CARD CLICKED")
          e.stopPropagation()
        }}
      >
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">
              {breakEmojis[breakData.type] || "⏰"}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              End {breakLabels[breakData.type] || breakData.type}?
            </h3>
            <p className="text-slate-400">
              Are you sure you want to end this break?
            </p>
          </div>

          {/* Break Details */}
          <div className="bg-slate-700/50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Started:</span>
              <span className="text-white font-medium">
                {formatTime(startTime)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Duration:</span>
              <span className="text-white font-medium">
                {formatDuration(duration)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Expected End:</span>
              <span className="text-white font-medium">
                {formatTime(endTime)}
              </span>
            </div>

            {/* Show away reason if it's an AWAY break */}
            {breakData.type === "AWAY" && breakData.awayReason && (
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Reason:</span>
                <span className="text-amber-400 font-medium">
                  {awayReasonLabels[breakData.awayReason] || breakData.awayReason}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                console.log("🔄 CANCEL BUTTON CLICKED")
                onCancel()
              }}
              disabled={isEnding}
              className="flex-1 px-4 py-2 border border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:border-slate-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ pointerEvents: 'auto', zIndex: 1000 }}
            >
              <X className="w-4 h-4 mr-2 inline" />
              Cancel
            </button>
            
            <button
              onClick={() => {
                console.log("🔄 END BREAK BUTTON CLICKED")
                onConfirm()
              }}
              disabled={isEnding}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ pointerEvents: 'auto', zIndex: 1000 }}
            >
              {isEnding ? (
                <>
                  <Clock className="w-4 h-4 mr-2 inline animate-spin" />
                  Ending...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 inline" />
                  End Break
                </>
              )}
            </button>
          </div>

          {/* Warning for early end */}
          {new Date() < endTime && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm text-center">
                ⚠️ You're ending this break early. This is perfectly fine!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
