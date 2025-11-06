/**
 * Permissions Utility
 * 
 * Handles OS-level permissions for activity monitoring
 */

const { systemPreferences } = require('electron')
const os = require('os')

class PermissionsManager {
  constructor() {
    this.platform = os.platform()
  }

  /**
   * Check if the app has accessibility permissions (macOS)
   */
  async checkAccessibilityPermissions() {
    if (this.platform !== 'darwin') {
      return true // Not needed on Windows/Linux
    }

    try {
      const status = systemPreferences.getMediaAccessStatus('accessibility')
      return status === 'granted'
    } catch (error) {
      console.error('Error checking accessibility permissions:', error)
      return false
    }
  }

  /**
   * Request accessibility permissions (macOS)
   */
  async requestAccessibilityPermissions() {
    if (this.platform !== 'darwin') {
      return true
    }

    try {
      // On macOS, we can't programmatically request accessibility permissions
      // We need to guide the user to System Preferences
      const hasPermission = await this.checkAccessibilityPermissions()
      
      if (!hasPermission) {
        console.log('Accessibility permissions needed. Please enable in System Preferences.')
        // The app should show a dialog to guide users
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error requesting accessibility permissions:', error)
      return false
    }
  }

  /**
   * Check all required permissions
   */
  async checkAllPermissions() {
    const results = {
      accessibility: await this.checkAccessibilityPermissions(),
      platform: this.platform,
      ready: false
    }

    // On macOS, accessibility is required
    if (this.platform === 'darwin') {
      results.ready = results.accessibility
    } else {
      // On Windows/Linux, no special permissions needed
      results.ready = true
    }

    return results
  }

  /**
   * Get platform-specific permission instructions
   */
  getPermissionInstructions() {
    switch (this.platform) {
      case 'darwin':
        return {
          title: 'Accessibility Permission Required',
          message: 'This app needs accessibility permissions to track keyboard and mouse activity.',
          instructions: [
            '1. Open System Preferences',
            '2. Go to Security & Privacy',
            '3. Select the Privacy tab',
            '4. Click on Accessibility',
            '5. Add this app to the list and enable it'
          ]
        }
      case 'win32':
        return {
          title: 'Administrator Access',
          message: 'For full functionality, run this app as Administrator.',
          instructions: [
            '1. Right-click the app icon',
            '2. Select "Run as administrator"'
          ]
        }
      case 'linux':
        return {
          title: 'X11 Access',
          message: 'Ensure X11 or Wayland display server access is available.',
          instructions: []
        }
      default:
        return {
          title: 'Permissions',
          message: 'No special permissions required.',
          instructions: []
        }
    }
  }
}

module.exports = new PermissionsManager()



