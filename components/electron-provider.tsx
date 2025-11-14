"use client"

import { useEffect, useState } from "react"
import TrackingConsent from "./tracking-consent"
import TrackingStatus from "./tracking-status"

// File-level log to verify this module is loaded
console.log('🔥🔥🔥 [ElectronProvider] FILE LOADED 🔥🔥🔥')

declare global {
  interface Window {
    electron?: {
      isElectron: boolean
      performance?: {
        getStatus: () => Promise<any>
        onStatusChange: (callback: (status: any) => void) => () => void
        getCurrentMetrics: () => Promise<any>
        onMetricsUpdate: (callback: (data: any) => void) => () => void
      }
      sync: {
        start: (sessionToken: string) => Promise<any>
        stop: () => Promise<any>
        getStatus: () => Promise<any>
        forceSync: () => Promise<any>
      }
      breaks?: {
        start: (breakData: any) => Promise<any>
        end: () => Promise<any>
        notifyBreakStart: (breakData: any) => void
        notifyBreakEnd: (breakData: any) => void
      }
      activityTracker?: {
        getStatus: () => Promise<{
          isTracking: boolean
          lastActivityTime: number
          inactivityDuration: number
          isInactive: boolean
          inactiveSeconds: number
        }>
        start: () => Promise<{ success: boolean }>
        stop: () => Promise<{ success: boolean }>
        setTimeout: (milliseconds: number) => Promise<{ success: boolean }>
        onBreakRequested: (callback: () => void) => () => void
        onActivityDebug: (callback: (data: any) => void) => () => void
      }
      screenshots?: {
        getStatus: () => Promise<any>
        captureNow: () => Promise<any>
        runDiagnostic: () => Promise<any>
        setStaffUserId: (staffUserId: string) => Promise<{ success: boolean }>
      }
    }
  }
}

export default function ElectronProvider({ children }: { children: React.ReactNode }) {
  console.log('[ElectronProvider] 🚀 Component mounted!')
  
  const [isElectron, setIsElectron] = useState(false)
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null)

  useEffect(() => {
    console.log('[ElectronProvider] 🔍 First useEffect running...')
    
    // Check if running in Electron
    const inElectron = typeof window !== 'undefined' && window.electron?.isElectron
    console.log('[ElectronProvider] window.electron exists:', !!window.electron)
    console.log('[ElectronProvider] isElectron:', !!inElectron)
    setIsElectron(!!inElectron)

    // Check consent from localStorage
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('tracking_consent')
      console.log('[ElectronProvider] Consent from localStorage:', consent)
      setConsentGiven(consent === 'true')
    }
  }, [])

  // Start sync service when consent is given (ONLY for staff users)
  useEffect(() => {
    if (isElectron && consentGiven) {
      // Check if we're on a staff portal (not client or admin)
      const currentPath = window.location.pathname
      const isStaffPortal = !currentPath.includes('/client') && !currentPath.includes('/admin')
      
      if (!isStaffPortal) {
        console.log('[ElectronProvider] 🚫 Client/Admin portal detected - NOT starting sync service')
        return
      }
      
      console.log('[ElectronProvider] ✅ Staff portal detected - starting sync service')
      
      // Try to extract session token from cookies
      const cookies = document.cookie.split(';')
      console.log('[ElectronProvider] All cookies:', cookies)
      
      // Try different possible cookie names (NextAuth v5 uses different names)
      const possibleCookieNames = [
        'next-auth.session-token',
        'authjs.session-token',
        '__Secure-next-auth.session-token',
        '__Secure-authjs.session-token'
      ]
      
      let sessionCookie = null
      for (const cookieName of possibleCookieNames) {
        sessionCookie = cookies.find(c => c.trim().startsWith(cookieName + '='))
        if (sessionCookie) {
          console.log('[ElectronProvider] Found session cookie:', cookieName)
          break
        }
      }
      
      if (sessionCookie) {
        const token = sessionCookie.split('=')[1]
        console.log('[ElectronProvider] Extracted token (first 20 chars):', token.substring(0, 20))
        window.electron?.sync.start(token).then(() => {
          console.log('[ElectronProvider] ✅ Sync service started successfully')
        }).catch((err) => {
          console.error('[ElectronProvider] ❌ Error starting sync service:', err)
        })

        // Fetch staff user profile and send ID to screenshot service
        fetch('/api/staff/profile', {
          credentials: 'include' // ✅ Include session cookies in the request
        })
          .then(res => {
            console.log('[ElectronProvider] Profile API response status:', res.status)
            return res.json()
          })
          .then(data => {
            if (data.success && data.staffUser) {
              console.log('[ElectronProvider] 📸 Setting staff user ID for screenshots:', data.staffUser.id)
              window.electron?.screenshots?.setStaffUserId(data.staffUser.id)
            } else {
              console.warn('[ElectronProvider] ⚠️ Could not fetch staff user profile:', data)
            }
          })
          .catch(err => {
            console.error('[ElectronProvider] ❌ Error fetching staff profile:', err)
          })
      } else {
        console.warn('[ElectronProvider] ⚠️ No session token found in cookies')
        console.log('[ElectronProvider] Available cookies:', document.cookie)
      }
    }
  }, [isElectron, consentGiven])

  // Stop sync service when navigating to client/admin portals
  useEffect(() => {
    if (isElectron) {
      const handleNavigation = () => {
        const currentPath = window.location.pathname
        const isStaffPortal = !currentPath.includes('/client') && !currentPath.includes('/admin')
        
        if (!isStaffPortal) {
          console.log('[ElectronProvider] 🚫 Navigated to client/admin portal - stopping sync service')
          window.electron?.sync.stop().then(() => {
            console.log('[ElectronProvider] ✅ Sync service stopped')
          }).catch((err) => {
            console.error('[ElectronProvider] ❌ Error stopping sync service:', err)
          })
        } else {
          console.log('[ElectronProvider] ✅ Navigated to staff portal - sync service should be running')
        }
      }

      // Listen for navigation changes
      window.addEventListener('popstate', handleNavigation)
      
      // Also check on mount
      handleNavigation()

      return () => {
        window.removeEventListener('popstate', handleNavigation)
      }
    }
  }, [isElectron])

  const handleConsent = (accepted: boolean) => {
    console.log('[ElectronProvider] 📝 handleConsent called:', accepted)
    setConsentGiven(accepted)
    
    if (accepted) {
      console.log('[ElectronProvider] ✅ User accepted tracking consent')
    } else {
      console.log('[ElectronProvider] ❌ User declined tracking consent')
    }
  }

  console.log('[ElectronProvider] 📊 Render state:', { isElectron, consentGiven })

  return (
    <>
      {children}
      {isElectron && consentGiven === null && (
        <TrackingConsent onConsent={handleConsent} />
      )}
      {isElectron && consentGiven && <TrackingStatus />}
    </>
  )
}




