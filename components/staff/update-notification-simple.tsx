"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

/**
 * Simple version of UpdateNotification for debugging
 */
export function UpdateNotificationSimple() {
  const [isElectron, setIsElectron] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if running in Electron
    if (typeof window !== 'undefined') {
      const hasElectron = window.hasOwnProperty('electron')
      console.log('[UpdateNotificationSimple] Has electron:', hasElectron)
      if (hasElectron) {
        const electronObj = (window as any).electron
        console.log('[UpdateNotificationSimple] Electron object:', electronObj)
        setIsElectron(!!electronObj?.isElectron)
      }
    }
  }, [])

  // Don't render until mounted
  if (!mounted) {
    return null
  }

  // Don't render if not in Electron
  if (!isElectron) {
    return null
  }

  return (
    <Card className="border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-300">
          <Download className="h-5 w-5 inline mr-2" />
          Software Updates
        </CardTitle>
        <CardDescription>
          Auto-update functionality is enabled
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-400">
          Your app will automatically check for updates. Manual checking is available in production builds.
        </p>
      </CardContent>
    </Card>
  )
}


