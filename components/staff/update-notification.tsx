"use client"

import { useEffect, useState } from "react"
import { Download, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// Declare electron types
declare global {
  interface Window {
    electron?: {
      isElectron: boolean
      updater: {
        checkForUpdates: () => Promise<any>
        downloadUpdate: () => Promise<void>
        quitAndInstall: () => Promise<void>
        onUpdateStatus: (callback: (data: UpdateStatus) => void) => () => void
      }
    }
  }
}

interface UpdateStatus {
  status: string
  data?: any
}

export function UpdateNotification() {
  const [isElectron, setIsElectron] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<string>("idle")
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [downloadProgress, setDownloadProgress] = useState<number>(0)
  const [checking, setChecking] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Mark as mounted (client-side)
    setMounted(true)
    
    // Check if running in Electron AND updater API is available
    if (typeof window !== 'undefined' && window.electron?.isElectron && window.electron?.updater) {
      setIsElectron(true)

      // Listen for update status changes
      try {
        const unsubscribe = window.electron.updater.onUpdateStatus((data: UpdateStatus) => {
          console.log('[UpdateNotification] Update status:', data)
          
          setUpdateStatus(data.status)
          
          if (data.status === 'update-available') {
            setUpdateInfo(data.data)
          } else if (data.status === 'download-progress') {
            setDownloadProgress(data.data?.percent || 0)
          } else if (data.status === 'update-downloaded') {
            setUpdateInfo(data.data)
          }
        })

        return () => {
          unsubscribe()
        }
      } catch (error) {
        console.error('[UpdateNotification] Error setting up update listener:', error)
      }
    } else if (typeof window !== 'undefined') {
      // Debug logging
      console.log('[UpdateNotification] Electron detection:', {
        hasElectron: !!window.electron,
        isElectron: window.electron?.isElectron,
        hasUpdater: !!window.electron?.updater
      })
    }
  }, [])

  const handleCheckForUpdates = async () => {
    if (typeof window === 'undefined' || !window.electron?.updater) {
      console.warn('[UpdateNotification] Updater API not available')
      return
    }
    
    setChecking(true)
    try {
      await window.electron.updater.checkForUpdates()
    } catch (error) {
      console.error('[UpdateNotification] Error checking for updates:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleDownloadUpdate = async () => {
    if (typeof window === 'undefined' || !window.electron?.updater) {
      console.warn('[UpdateNotification] Updater API not available')
      return
    }
    
    try {
      await window.electron.updater.downloadUpdate()
    } catch (error) {
      console.error('[UpdateNotification] Error downloading update:', error)
    }
  }

  const handleInstallUpdate = async () => {
    if (typeof window === 'undefined' || !window.electron?.updater) {
      console.warn('[UpdateNotification] Updater API not available')
      return
    }
    
    try {
      await window.electron.updater.quitAndInstall()
    } catch (error) {
      console.error('[UpdateNotification] Error installing update:', error)
    }
  }

  // Don't render until mounted (avoid SSR issues)
  if (!mounted) {
    return null
  }

  // Don't render if not in Electron
  if (!isElectron) {
    return null
  }

  // Render based on update status
  if (updateStatus === 'update-available' && updateInfo) {
    return (
      <Card className="border-blue-500/50 bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <Download className="h-5 w-5" />
            Update Available
          </CardTitle>
          <CardDescription>
            Version {updateInfo.version} is now available
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-slate-300">
            <p className="font-medium mb-2">What's new:</p>
            <div className="text-slate-400 whitespace-pre-wrap">
              {updateInfo.releaseNotes || 'No release notes available'}
            </div>
          </div>
          <Button 
            onClick={handleDownloadUpdate}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Update
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (updateStatus === 'downloading' || (updateStatus === 'download-progress' && downloadProgress < 100)) {
    return (
      <Card className="border-blue-500/50 bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Downloading Update
          </CardTitle>
          <CardDescription>
            Please wait while the update is downloaded
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Progress</span>
              <span className="text-slate-300">{Math.round(downloadProgress)}%</span>
            </div>
            <Progress value={downloadProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (updateStatus === 'update-downloaded' && updateInfo) {
    return (
      <Card className="border-green-500/50 bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-5 w-5" />
            Update Ready
          </CardTitle>
          <CardDescription>
            Version {updateInfo.version} has been downloaded
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300">
            The update is ready to install. The app will restart to complete the installation.
          </p>
          <Button 
            onClick={handleInstallUpdate}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Restart and Install
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (updateStatus === 'update-not-available') {
    return (
      <Card className="border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-300">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Up to Date
          </CardTitle>
          <CardDescription>
            You're running the latest version
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleCheckForUpdates}
            variant="outline"
            className="w-full"
            disabled={checking}
          >
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Again
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (updateStatus === 'error') {
    return (
      <Card className="border-red-500/50 bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            Update Error
          </CardTitle>
          <CardDescription>
            Failed to check for updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleCheckForUpdates}
            variant="outline"
            className="w-full"
            disabled={checking}
          >
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Default: Show check for updates button
  return (
    <Card className="border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-300">Software Updates</CardTitle>
        <CardDescription>
          Click below to check now for the latest features, performance improvements, and security patches.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleCheckForUpdates}
          variant="outline"
          className="w-full"
          disabled={checking}
        >
          {checking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check for Updates
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

