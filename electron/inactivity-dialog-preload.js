/**
 * Preload script for Inactivity Dialog
 * Exposes safe APIs for the dialog window
 */

const { contextBridge, ipcRenderer } = require('electron')

// Expose secure APIs to the dialog window
contextBridge.exposeInMainWorld('electronAPI', {
  // Listen for counter updates
  onUpdateCounter: (callback) => {
    ipcRenderer.on('update-counter', (event, seconds) => {
      callback(seconds)
    })
  },
  
  // Format seconds to human-readable time (1h 2m 30s)
  formatTime: (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    const parts = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
    
    return parts.join(' ')
  }
})

console.log('[Inactivity Dialog Preload] APIs exposed')
