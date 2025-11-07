/**
 * Performance Tracker Configuration
 * 
 * Configurable settings for activity monitoring and data collection
 */

module.exports = {
  // Tracking intervals (in milliseconds)
  TRACKING_INTERVAL: 5000, // Collect metrics every 5 seconds
  SYNC_INTERVAL: 10000, // Sync to API every 10 seconds (real-time)
  
  // Idle detection
  IDLE_THRESHOLD: 30, // Consider user idle after 30 seconds (matches activity tracker)
  
  // Mouse tracking
  MOUSE_MOVEMENT_THROTTLE: 100, // Throttle mouse movement tracking to every 100ms
  
  // API configuration
  // 🚀 PRODUCTION: Use Railway URL (set via environment variable)
  // 🧪 DEVELOPMENT: Use localhost
  API_BASE_URL: process.env.API_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  API_PERFORMANCE_ENDPOINT: '/api/analytics',
  
  // Privacy settings
  TRACK_MOUSE: true,
  TRACK_KEYBOARD: true,
  TRACK_CLIPBOARD: true,
  TRACK_APPLICATIONS: true,
  TRACK_IDLE_TIME: true,
  
  // Storage
  STORAGE_KEY_PREFIX: 'performance_tracker_',
  CONSENT_KEY: 'tracking_consent',
  SESSION_TOKEN_KEY: 'session_token',
  
  // Retry configuration for API sync
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 seconds
  
  // Debug mode
  DEBUG: process.env.NODE_ENV === 'development',
  
  // Queue limits
  MAX_QUEUE_SIZE: 100, // Maximum number of unsent metric batches to queue
  
  // Daily reset time
  DAILY_RESET_HOUR: 0, // Reset counters at midnight (0:00)
}


