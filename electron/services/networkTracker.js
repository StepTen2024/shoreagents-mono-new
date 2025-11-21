/**
 * Network Tracker Service
 * 
 * Tracks downloads, uploads, and bandwidth usage
 * Privacy-friendly: Only counts, no file content tracking
 */

const { session } = require('electron')
const config = require('../config/trackerConfig')

class NetworkTracker {
  constructor() {
    this.downloads = 0
    this.uploads = 0
    this.bandwidth = 0 // Total bytes transferred (uploads + downloads)
    this.isTracking = false
    
    this.log('Network Tracker initialized')
  }

  /**
   * Start tracking network activity
   * @param {BrowserWindow} mainWindow - Main Electron window
   */
  start(mainWindow) {
    if (this.isTracking) {
      console.log('[NetworkTracker] ⚠️  Network tracker already running')
      return
    }

    this.isTracking = true
    this.mainWindow = mainWindow
    
    // 🔥 CRITICAL LOGS - ALWAYS SHOW (even in production)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🌐 [NetworkTracker] STARTING NETWORK TRACKING')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('   📥 Downloads tracking: ENABLED')
    console.log('   📤 Uploads tracking: ENABLED')
    console.log('   📊 Bandwidth tracking: ENABLED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Track downloads
    this.startDownloadTracking()

    // Track bandwidth (uploads + downloads)
    this.startBandwidthTracking()

    console.log('✅ [NetworkTracker] Network tracking started successfully')
  }

  /**
   * Stop tracking network activity
   */
  stop() {
    if (!this.isTracking) {
      return
    }

    this.isTracking = false
    
    // Remove listeners
    if (this.downloadListener) {
      session.defaultSession.removeListener('will-download', this.downloadListener)
      this.downloadListener = null
    }

    if (this.requestFilter) {
      session.defaultSession.webRequest.onCompleted(this.requestFilter, null)
      session.defaultSession.webRequest.onErrorOccurred(this.requestFilter, null)
      this.requestFilter = null
    }

    this.log('Network tracking stopped')
  }

  /**
   * Track file downloads
   */
  startDownloadTracking() {
    this.downloadListener = (event, item, webContents) => {
      // 🔥 ALWAYS LOG (even in production)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`📥 [NetworkTracker] DOWNLOAD DETECTED`)
      console.log(`   File: ${item.getFilename()}`)
      console.log(`   URL: ${item.getURL()}`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      
      // Increment download count immediately
      this.downloads++
      console.log(`📊 [NetworkTracker] Total downloads: ${this.downloads}`)
      
      // Track bandwidth when download completes
      item.once('done', (event, state) => {
        if (state === 'completed') {
          const size = item.getTotalBytes()
          this.bandwidth += size
          console.log(`✅ [NetworkTracker] Download COMPLETED: ${item.getFilename()}`)
          console.log(`   Size: ${this.formatBytes(size)}`)
          console.log(`   Total Bandwidth: ${this.formatBytes(this.bandwidth)}`)
        } else if (state === 'cancelled') {
          console.log(`❌ [NetworkTracker] Download CANCELLED: ${item.getFilename()}`)
          // Still count as download attempt
        } else if (state === 'interrupted') {
          console.log(`⚠️  [NetworkTracker] Download INTERRUPTED: ${item.getFilename()}`)
          // Still count as download attempt
        }
      })
    }

    session.defaultSession.on('will-download', this.downloadListener)
    console.log('✅ [NetworkTracker] Download listener registered on session.defaultSession')
  }

  /**
   * Track bandwidth (uploads + downloads)
   * Monitors HTTP requests and responses
   */
  startBandwidthTracking() {
    const filter = {
      urls: ['*://*/*'] // Track all HTTP/HTTPS requests
    }

    this.requestFilter = filter

    // Track completed requests (downloads)
    session.defaultSession.webRequest.onCompleted(filter, (details) => {
      if (this.shouldTrackRequest(details)) {
        // Track response size (download bandwidth)
        const responseSize = this.getResponseSize(details)
        if (responseSize > 0) {
          this.bandwidth += responseSize
        }

        // Track request size (upload bandwidth)
        const requestSize = this.getRequestSize(details)
        if (requestSize > 0) {
          this.bandwidth += requestSize
          // Count as upload if it's a POST/PUT/PATCH with significant data
          if (this.isUploadRequest(details, requestSize)) {
            this.uploads++
            // 🔥 ALWAYS LOG UPLOADS (even in production)
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
            console.log(`📤 [NetworkTracker] UPLOAD DETECTED`)
            console.log(`   Method: ${details.method}`)
            console.log(`   Host: ${new URL(details.url).hostname}`)
            console.log(`   Size: ${this.formatBytes(requestSize)}`)
            console.log(`   Total Uploads: ${this.uploads}`)
            console.log(`   Total Bandwidth: ${this.formatBytes(this.bandwidth)}`)
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
          }
        }
      }
    })

    this.log('✅ Bandwidth tracking enabled')
  }

  /**
   * Check if request should be tracked
   * Skip system requests, tracking APIs, etc.
   */
  shouldTrackRequest(details) {
    const url = details.url.toLowerCase()
    
    // Skip Chrome/Edge internal URLs
    if (url.startsWith('chrome-extension://') || 
        url.startsWith('chrome://') || 
        url.startsWith('edge://') ||
        url.startsWith('devtools://')) {
      return false
    }

    // Skip our own tracking API to avoid circular counting
    if (url.includes('/api/analytics') || 
        url.includes('/api/performance')) {
      return false
    }

    // Skip WebSocket upgrades (they're persistent connections)
    if (details.statusCode === 101) {
      return false
    }

    return true
  }

  /**
   * Get response size from request details
   */
  getResponseSize(details) {
    // Check for Content-Length header in response
    if (details.responseHeaders) {
      const contentLength = details.responseHeaders['content-length'] || 
                           details.responseHeaders['Content-Length']
      if (contentLength && contentLength.length > 0) {
        return parseInt(contentLength[0], 10) || 0
      }
    }

    // Fallback: estimate from status code
    // Successful responses typically have content
    if (details.statusCode >= 200 && details.statusCode < 300) {
      return 1024 // Assume 1KB minimum for successful responses
    }

    return 0
  }

  /**
   * Get request size from request details
   */
  getRequestSize(details) {
    let size = 0

    // Estimate URL size
    size += details.url.length

    // Estimate headers size
    if (details.requestHeaders) {
      for (const [key, value] of Object.entries(details.requestHeaders)) {
        size += key.length
        if (Array.isArray(value)) {
          value.forEach(v => size += v.length)
        } else if (typeof value === 'string') {
          size += value.length
        }
      }
    }

    // Check for Content-Length in request (for POST/PUT)
    if (details.requestHeaders) {
      const contentLength = details.requestHeaders['content-length'] || 
                           details.requestHeaders['Content-Length']
      if (contentLength && contentLength.length > 0) {
        size += parseInt(contentLength[0], 10) || 0
      }
    }

    return size
  }

  /**
   * Check if request is an upload (POST/PUT/PATCH with significant data)
   */
  isUploadRequest(details, requestSize) {
    const method = details.method.toUpperCase()
    
    // Must be a mutation method
    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      return false
    }

    // Must have significant data (> 10KB to avoid counting small API calls)
    if (requestSize < 10240) {
      return false
    }

    // Skip if it's to our own API (already handled elsewhere)
    const url = details.url.toLowerCase()
    if (url.includes('/api/')) {
      return false
    }

    return true
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const metrics = {
      downloads: this.downloads,
      uploads: this.uploads,
      bandwidth: this.bandwidth
    }
    
    // 🔥 LOG EVERY TIME METRICS ARE REQUESTED (helps debug sync issues)
    if (this.downloads > 0 || this.uploads > 0 || this.bandwidth > 0) {
      console.log(`📊 [NetworkTracker] getMetrics() called:`)
      console.log(`   📥 Downloads: ${metrics.downloads}`)
      console.log(`   📤 Uploads: ${metrics.uploads}`)
      console.log(`   📊 Bandwidth: ${this.formatBytes(metrics.bandwidth)}`)
    }
    
    return metrics
  }

  /**
   * Reset metrics (called on clock-in)
   */
  reset() {
    console.log('🔄 [NetworkTracker] ========================================')
    console.log('🔄 [NetworkTracker] RESETTING NETWORK METRICS')
    console.log('🔄 [NetworkTracker] ========================================')
    
    this.downloads = 0
    this.uploads = 0
    this.bandwidth = 0
    
    console.log('🔄 [NetworkTracker] Metrics reset complete - all counters at zero')
  }

  /**
   * Load metrics from database
   */
  loadFromDatabase(databaseMetrics) {
    if (!databaseMetrics) return
    
    this.downloads = databaseMetrics.downloads || 0
    this.uploads = databaseMetrics.uploads || 0
    this.bandwidth = databaseMetrics.bandwidth || 0
    
    console.log('📥 [NetworkTracker] Loaded from database:')
    console.log(`   📥 Downloads: ${this.downloads}`)
    console.log(`   📤 Uploads: ${this.uploads}`)
    console.log(`   📊 Bandwidth: ${this.formatBytes(this.bandwidth)}`)
  }

  /**
   * Get tracking status
   */
  getStatus() {
    return {
      isTracking: this.isTracking,
      downloads: this.downloads,
      uploads: this.uploads,
      bandwidth: this.bandwidth,
      bandwidthFormatted: this.formatBytes(this.bandwidth)
    }
  }

  log(message) {
    if (config.DEBUG) {
      console.log(`[NetworkTracker] ${message}`)
    }
  }
}

module.exports = new NetworkTracker()

