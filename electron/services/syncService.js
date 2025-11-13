/**
 * Sync Service
 * 
 * Handles syncing performance metrics to the API
 */

const { net } = require('electron')
const config = require('../config/trackerConfig')

class SyncService {
  constructor() {
    this.queue = []
    this.isSyncing = false
    this.syncInterval = null
    this.sessionToken = null
    this.retryCount = 0
    this.lastSyncTime = null
    this.syncEnabled = true
    this.lastSyncedMetrics = null // 🔧 Track last synced values for delta calculation
  }

  /**
   * Start the sync service
   */
  start(sessionToken) {
    if (this.syncInterval) {
      this.log('Sync service already running')
      return
    }

    this.sessionToken = sessionToken
    this.syncEnabled = true
    
    this.log('Starting sync service...')
    
    // Sync immediately
    this.sync()
    
    // Then sync periodically
    this.syncInterval = setInterval(() => {
      this.sync()
    }, config.SYNC_INTERVAL)
    
    this.log('Sync service started')
  }

  /**
   * Stop the sync service
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    
    this.syncEnabled = false
    this.log('Sync service stopped')
  }

  /**
   * Set session token for authentication
   */
  setSessionToken(token) {
    this.sessionToken = token
    this.log('Session token updated')
  }

  /**
   * Calculate delta (difference) between current and last synced metrics
   * This prevents sending cumulative totals that get added repeatedly
   */
  calculateDelta(previousMetrics, currentMetrics) {
    // First sync - send all metrics as-is
    if (!previousMetrics) {
      console.log('🔢 [SyncService] First sync - sending all metrics')
      return currentMetrics
    }
    
    const delta = {}
    
    for (const key in currentMetrics) {
      const currentValue = currentMetrics[key]
      const previousValue = previousMetrics[key]
      
      if (typeof currentValue === 'number') {
        // Calculate difference for numeric values
        delta[key] = currentValue - (previousValue || 0)
      } else {
        // Non-numeric fields (arrays, etc.) send as-is
        delta[key] = currentValue
      }
    }
    
    console.log('🔢 [SyncService] Delta calculation:')
    console.log(`   🖱️  Mouse movements: ${previousMetrics.mouseMovements || 0} → ${currentMetrics.mouseMovements} (delta: +${delta.mouseMovements})`)
    console.log(`   🖱️  Mouse clicks: ${previousMetrics.mouseClicks || 0} → ${currentMetrics.mouseClicks} (delta: +${delta.mouseClicks})`)
    console.log(`   ⌨️  Keystrokes: ${previousMetrics.keystrokes || 0} → ${currentMetrics.keystrokes} (delta: +${delta.keystrokes})`)
    
    return delta
  }

  /**
   * Sync metrics to API
   */
  async sync() {
    if (!this.syncEnabled || this.isSyncing) {
      return
    }

    this.isSyncing = true
    this.log('Starting sync...')

    try {
      // Get current cumulative metrics from tracker
      const performanceTracker = require('./performanceTracker')
      const currentMetrics = performanceTracker.getMetricsForAPI()

      // 🔧 Calculate delta (difference since last sync)
      const delta = this.calculateDelta(this.lastSyncedMetrics, currentMetrics)

      // Send ONLY the delta to API (will be added to existing DB values)
      const success = await this.sendMetrics(delta)
      
      if (success) {
        // 🔧 Store current metrics for next delta calculation
        this.lastSyncedMetrics = { ...currentMetrics }
        this.lastSyncTime = Date.now()
        this.retryCount = 0
        console.log('✅ [SyncService] Sync successful - snapshot saved for next delta')
      } else {
        this.handleSyncFailure()
      }
    } catch (error) {
      this.log(`Sync error: ${error.message}`)
      this.handleSyncFailure()
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Get session cookie from Electron's cookie store
   */
  async getSessionCookie() {
    const { session } = require('electron')
    
    try {
      const cookies = await session.defaultSession.cookies.get({
        url: config.API_BASE_URL
      })
      
      // Try different possible cookie names
      const possibleNames = [
        'next-auth.session-token',
        'authjs.session-token',
        '__Secure-next-auth.session-token',
        '__Secure-authjs.session-token'
      ]
      
      for (const name of possibleNames) {
        const cookie = cookies.find(c => c.name === name)
        if (cookie) {
          this.log(`Found session cookie: ${name}`)
          return cookie.value
        }
      }
      
      this.log('No session cookie found in Electron cookie store')
      this.log(`Available cookies: ${cookies.map(c => c.name).join(', ')}`)
      return null
    } catch (error) {
      this.log(`Error getting cookies: ${error.message}`)
      return null
    }
  }

  /**
   * Send metrics to API
   */
  async sendMetrics(metrics) {
    return new Promise(async (resolve) => {
      const url = `${config.API_BASE_URL}${config.API_PERFORMANCE_ENDPOINT}`
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🚀 [SyncService] SENDING METRICS TO API')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📍 URL: ${url}`)
      console.log(`📊 Metrics Summary:`)
      console.log(`   🖱️  Mouse: ${metrics.mouseMovements} movements, ${metrics.mouseClicks} clicks`)
      console.log(`   ⌨️  Keystrokes: ${metrics.keystrokes}`)
      console.log(`   ✅ Active Time: ${metrics.activeTime} min`)
      console.log(`   🖥️  Screen Time: ${metrics.screenTime} min`)
      console.log(`   🌐 URLs: ${metrics.urlsVisited} count, ${metrics.visitedUrls?.length || 0} array items`)
      console.log(`   📱 Apps: ${metrics.applicationsUsed?.length || 0} apps`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      
      // Check if session cookie exists (for logging purposes)
      const sessionToken = await this.getSessionCookie()
      if (!sessionToken) {
        console.log('⚠️  [SyncService] Warning: No session cookie found, request may fail with 401')
      } else {
        console.log('✅ [SyncService] Session cookie found, proceeding with sync')
      }
      
      // Create request
      const request = net.request({
        method: 'POST',
        url: url
      })

      // Set headers
      request.setHeader('Content-Type', 'application/json')
      
      // Manually set cookie if available
      if (sessionToken) {
        // Try to find the exact cookie name that was found
        const { session } = require('electron')
        const cookies = await session.defaultSession.cookies.get({ url: config.API_BASE_URL })
        const sessionCookie = cookies.find(c => 
          c.name === 'authjs.session-token' || 
          c.name === 'next-auth.session-token' ||
          c.name === '__Secure-authjs.session-token' || 
          c.name === '__Secure-next-auth.session-token'
        )
        
        if (sessionCookie) {
          request.setHeader('Cookie', `${sessionCookie.name}=${sessionCookie.value}`)
          this.log(`Set cookie header: ${sessionCookie.name}`)
        }
      }

      // Handle response
      request.on('response', (response) => {
        let data = ''

        response.on('data', (chunk) => {
          data += chunk
        })

        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            console.log(`✅ [SyncService] Metrics sent successfully! Status: ${response.statusCode}`)
            try {
              const parsed = JSON.parse(data)
              if (parsed.metric) {
                console.log(`📊 [SyncService] Server confirmed update:`)
                console.log(`   🖱️  Mouse: ${parsed.metric.mouseMovements} movements, ${parsed.metric.mouseClicks} clicks`)
                console.log(`   ⌨️  Keystrokes: ${parsed.metric.keystrokes}`)
                console.log(`   🌐 URLs: ${parsed.metric.urlsVisited}`)
              }
            } catch (e) {
              // Ignore parse errors
            }
            resolve(true)
          } else {
            console.error(`❌ [SyncService] API returned error: ${response.statusCode}`)
            console.error(`Response body: ${data}`)
            resolve(false)
          }
        })
      })

      // Handle errors
      request.on('error', (error) => {
        this.log(`Network error: ${error.message}`)
        resolve(false)
      })

      // Send the data
      request.write(JSON.stringify(metrics))
      request.end()
    })
  }

  /**
   * Handle sync failure with retry logic
   */
  handleSyncFailure() {
    this.retryCount++
    
    if (this.retryCount < config.MAX_RETRY_ATTEMPTS) {
      this.log(`Sync failed, will retry (attempt ${this.retryCount}/${config.MAX_RETRY_ATTEMPTS})`)
      
      // Schedule retry
      setTimeout(() => {
        if (this.syncEnabled) {
          this.sync()
        }
      }, config.RETRY_DELAY * this.retryCount) // Exponential backoff
    } else {
      this.log('Max retry attempts reached, will try again on next interval')
      this.retryCount = 0
    }
  }

  /**
   * Force immediate sync
   */
  async forcSync() {
    this.log('Force sync requested')
    await this.sync()
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isEnabled: this.syncEnabled,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      queueSize: this.queue.length,
      retryCount: this.retryCount,
      hasSessionToken: !!this.sessionToken,
    }
  }

  /**
   * Clear queue (for testing)
   */
  clearQueue() {
    this.queue = []
    this.log('Queue cleared')
  }

  /**
   * Reset sync state (called on clock-in to start fresh)
   */
  reset() {
    console.log('🔄 [SyncService] ========================================')
    console.log('🔄 [SyncService] RESETTING SYNC STATE (CLOCK-IN DETECTED)')
    console.log('🔄 [SyncService] ========================================')
    
    // Clear the last synced metrics snapshot
    // This forces the next sync to be treated as a "first sync"
    // and send all metrics as-is (not as deltas)
    this.lastSyncedMetrics = null
    this.retryCount = 0
    this.lastSyncTime = null
    
    // Force an immediate sync after reset to establish new baseline
    console.log('🔄 [SyncService] Scheduling immediate sync in 2 seconds...')
    setTimeout(() => {
      if (this.syncEnabled) {
        console.log('🔄 [SyncService] Running post-clock-in sync...')
        this.sync()
      }
    }, 2000) // Wait 2 seconds for clock-in API to complete
    
    console.log('🔄 [SyncService] Sync state reset complete - starting fresh tracking session')
  }

  log(message) {
    if (config.DEBUG) {
      console.log(`[SyncService] ${message}`)
    }
  }
}

module.exports = new SyncService()


