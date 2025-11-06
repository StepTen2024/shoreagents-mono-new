/**
 * Break Handler Service
 * Manages break tracking and notifications for Electron app
 */

class BreakHandler {
    constructor() {
      this.currentBreak = null
      this.breakSchedule = []
      this.reminderTimers = []
    }
  
    /**
     * Initialize break handler
     */
    initialize() {
      console.log('[BreakHandler] Initialized')
      return Promise.resolve()
    }
  
    /**
     * Start a break
     */
    startBreak(breakData) {
      console.log('[BreakHandler] Starting break:', breakData)
      this.currentBreak = {
        ...breakData,
        startTime: new Date(),
      }
      return this.currentBreak
    }
  
    /**
     * End current break
     */
    endBreak() {
      console.log('[BreakHandler] Ending break')
      if (!this.currentBreak) {
        return null
      }
  
      const breakData = {
        ...this.currentBreak,
        endTime: new Date(),
        duration: Math.floor((new Date() - new Date(this.currentBreak.startTime)) / 1000 / 60), // minutes
      }
  
      this.currentBreak = null
      return breakData
    }
  
    /**
     * Get current break status
     */
    getCurrentBreak() {
      return this.currentBreak
    }
  
    /**
     * Set break schedule
     */
    setSchedule(schedule) {
      console.log('[BreakHandler] Setting break schedule:', schedule)
      this.breakSchedule = schedule
    }
  
    /**
     * Get break schedule
     */
    getSchedule() {
      return this.breakSchedule
    }
  
    /**
     * Cleanup
     */
    cleanup() {
      console.log('[BreakHandler] Cleaning up')
      this.reminderTimers.forEach(timer => clearTimeout(timer))
      this.reminderTimers = []
      this.currentBreak = null
    }
  }
  
  module.exports = new BreakHandler()
  