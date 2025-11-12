// THIS SCRIPT IS FOR USER TO RUN ON THE PC WITH ELECTRON

// Add this to Electron's renderer console to check tracking status:
// Open DevTools in Electron app and paste:

console.log(`
═══════════════════════════════════════════════════════════════
🔍 ELECTRON TRACKING DIAGNOSTIC
═══════════════════════════════════════════════════════════════

Run this in Electron DevTools Console (F12):

window.electron.getTrackingStatus().then(status => {
  console.log('📊 TRACKING STATUS:', status)
  console.log('')
  console.log('✅ Is Tracking:', status.isTracking)
  console.log('⏸️  Is Paused:', status.isPaused)
  console.log('⏱️  Session Duration:', Math.floor(status.sessionDuration / 60), 'minutes')
  console.log('🔄 Last Update:', new Date(status.lastUpdate).toLocaleTimeString())
  console.log('')
  console.log('📡 Has System Idle Time:', status.hasSystemIdleTime)
  console.log('🪟 Has Active Win:', status.hasActiveWin)
  console.log('🎹 Input Tracking By:', status.inputTrackingBy)
})

// Then check current metrics:
window.electron.getCurrentMetrics().then(metrics => {
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('📈 CURRENT METRICS (in Electron memory):')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('⌨️  Keystrokes:', metrics.keystrokes)
  console.log('🖱️  Mouse Clicks:', metrics.mouseClicks)
  console.log('🏃 Active Time (seconds):', metrics.activeTime)
  console.log('💤 Idle Time (seconds):', metrics.idleTime)
  console.log('📺 Screen Time (seconds):', metrics.screenTime)
  console.log('🔄 Last Updated:', new Date(metrics.lastUpdated).toLocaleTimeString())
  console.log('')
  console.log('⏱️  Active Time (formatted):', Math.floor(metrics.activeTime / 60), 'minutes')
  console.log('💤 Idle Time (formatted):', Math.floor(metrics.idleTime / 60), 'minutes')
})

═══════════════════════════════════════════════════════════════
`)

/**
 * DIAGNOSIS GUIDE:
 * 
 * ✅ EXPECTED FOR 3 HOURS OF WORK:
 *    - isTracking: true
 *    - isPaused: false
 *    - sessionDuration: ~10,800 seconds (180 minutes)
 *    - activeTime: ~9,000-10,800 seconds (150-180 minutes)
 *    - keystrokes: 2,000+ (if typing)
 * 
 * ❌ IF YOU SEE:
 *    - isTracking: false → Tracking not started!
 *    - isPaused: true → Tracking is paused (check if on break)
 *    - activeTime: < 100 after hours → updateMetrics() not running!
 *    - sessionDuration very low → Electron restarted recently
 * 
 * 🔧 FIXES:
 *    1. If isTracking = false: Restart Electron app
 *    2. If isPaused = true: End any active breaks
 *    3. If activeTime is low but keystrokes high: 
 *       → Bug in updateMetrics() loop
 *       → Check console for errors
 *    4. If sessionDuration resets frequently:
 *       → Electron is crashing/restarting
 *       → Check for app errors
 */

