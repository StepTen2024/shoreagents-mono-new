/**
 * Productivity Categorization System
 * 
 * Categorizes applications and URLs as productive, neutral, or distracting
 * Used for enhanced productivity scoring and AI analysis
 */

// ✅ PRODUCTIVE APPLICATIONS
export const PRODUCTIVE_APPS = [
  // Communication (Work)
  "Slack", "Microsoft Teams", "Zoom", "Google Meet", "Discord",
  "Skype", "WhatsApp Business", "Telegram",
  
  // Browsers (Neutral - depends on usage)
  "Google Chrome", "Microsoft Edge", "Firefox", "Safari", "Brave",
  
  // Office & Productivity
  "Microsoft Word", "Microsoft Excel", "Microsoft PowerPoint", "Microsoft Outlook",
  "Google Docs", "Google Sheets", "Google Slides", "Gmail",
  "LibreOffice", "OpenOffice",
  
  // Project Management & Organization
  "Notion", "Asana", "Trello", "Jira", "Monday.com", "ClickUp",
  "Todoist", "Evernote", "OneNote",
  
  // Development & Technical
  "Visual Studio Code", "VS Code", "IntelliJ", "PyCharm", "WebStorm",
  "Sublime Text", "Atom", "Notepad++",
  "Terminal", "iTerm", "PowerShell", "Command Prompt",
  "GitHub Desktop", "GitKraken", "Sourcetree",
  "Postman", "Insomnia", "Docker Desktop",
  
  // Design & Creative
  "Figma", "Adobe Photoshop", "Adobe Illustrator", "Adobe XD",
  "Sketch", "Canva", "GIMP", "Blender",
  
  // Business & CRM
  "Salesforce", "HubSpot", "Zoho", "QuickBooks", "Xero",
  "SAP", "Oracle", "Microsoft Dynamics",
  
  // Data & Analytics
  "Tableau", "Power BI", "Excel", "Google Analytics",
  
  // File Management
  "Google Drive", "Dropbox", "OneDrive", "Box",
  "Windows Explorer", "Finder", "File Explorer",
]

// 🚫 NON-PRODUCTIVE / DISTRACTION SITES
export const DISTRACTION_DOMAINS = [
  // Social Media
  "facebook.com", "fb.com", "instagram.com", "twitter.com", "x.com",
  "tiktok.com", "snapchat.com", "pinterest.com", "linkedin.com/feed",
  "reddit.com", "tumblr.com", "whatsapp.com/web",
  
  // Entertainment
  "youtube.com", "netflix.com", "hulu.com", "disneyplus.com",
  "twitch.tv", "vimeo.com", "dailymotion.com", "9gag.com",
  "spotify.com", "soundcloud.com", "pandora.com",
  
  // Gaming
  "steampowered.com", "epicgames.com", "roblox.com", "minecraft.net",
  "leagueoflegends.com", "twitch.tv", "ign.com", "gamespot.com",
  
  // Shopping
  "amazon.com", "ebay.com", "alibaba.com", "aliexpress.com",
  "shopee.com", "lazada.com", "walmart.com", "target.com",
  "etsy.com", "wish.com",
  
  // News & Gossip (excessive)
  "buzzfeed.com", "tmz.com", "dailymail.co.uk",
  
  // Dating
  "tinder.com", "bumble.com", "match.com", "okcupid.com",
  
  // Forums (non-work)
  "4chan.org", "8kun.top",
]

// ✅ PRODUCTIVE DOMAINS (Work-related)
export const PRODUCTIVE_DOMAINS = [
  // Documentation & Learning
  "docs.google.com", "drive.google.com", "sheets.google.com",
  "notion.so", "github.com", "gitlab.com", "bitbucket.org",
  "stackoverflow.com", "stackexchange.com", "w3schools.com",
  "developer.mozilla.org", "mdn.webdocs.org",
  "medium.com", "dev.to", "hashnode.dev",
  
  // Work Platforms
  "slack.com", "teams.microsoft.com", "zoom.us", "meet.google.com",
  "asana.com", "trello.com", "jira.atlassian.com", "monday.com",
  
  // Cloud Services
  "aws.amazon.com", "console.aws.amazon.com", "azure.microsoft.com",
  "cloud.google.com", "heroku.com", "vercel.com", "netlify.com",
  "railway.app", "render.com",
  
  // Design Tools
  "figma.com", "canva.com", "adobe.com",
  
  // CRM & Business
  "salesforce.com", "hubspot.com", "zoho.com",
  
  // Email
  "mail.google.com", "outlook.com", "outlook.office.com",
  
  // Project Management
  "clickup.com", "basecamp.com", "wrike.com",
]

// 📰 NEUTRAL DOMAINS (Acceptable in moderation)
export const NEUTRAL_DOMAINS = [
  // News (brief checks OK)
  "cnn.com", "bbc.com", "reuters.com", "apnews.com",
  "nytimes.com", "wsj.com", "bloomberg.com",
  
  // Reference
  "wikipedia.org", "google.com/search",
  
  // General productivity
  "google.com", "bing.com", "duckduckgo.com",
]

/**
 * Categorize an application name
 */
export function categorizeApp(appName: string): 'productive' | 'neutral' | 'distraction' {
  if (!appName) return 'neutral'
  
  const lowerName = appName.toLowerCase()
  
  // Check if it's a productive app
  if (PRODUCTIVE_APPS.some(app => lowerName.includes(app.toLowerCase()))) {
    return 'productive'
  }
  
  // Entertainment apps
  const entertainmentApps = ['spotify', 'netflix', 'steam', 'game', 'discord', 'youtube']
  if (entertainmentApps.some(app => lowerName.includes(app))) {
    return 'distraction'
  }
  
  // Default to neutral for unknown apps
  return 'neutral'
}

/**
 * Categorize a URL
 */
export function categorizeURL(url: string): 'productive' | 'neutral' | 'distraction' {
  if (!url) return 'neutral'
  
  try {
    // Handle page:Title format
    if (url.startsWith('page:')) {
      const title = url.substring(5).toLowerCase()
      
      // Check for work-related keywords in title
      const workKeywords = ['dashboard', 'admin', 'portal', 'docs', 'document', 'sheet', 'presentation', 'meeting', 'task', 'project']
      if (workKeywords.some(keyword => title.includes(keyword))) {
        return 'productive'
      }
      
      // Check for distraction keywords in title
      const distractionKeywords = ['facebook', 'instagram', 'twitter', 'youtube', 'netflix', 'game', 'shopping', 'reddit']
      if (distractionKeywords.some(keyword => title.includes(keyword))) {
        return 'distraction'
      }
      
      return 'neutral'
    }
    
    // Parse URL
    const urlLower = url.toLowerCase()
    
    // Check distraction domains first (higher priority)
    if (DISTRACTION_DOMAINS.some(domain => urlLower.includes(domain))) {
      return 'distraction'
    }
    
    // Check productive domains
    if (PRODUCTIVE_DOMAINS.some(domain => urlLower.includes(domain))) {
      return 'productive'
    }
    
    // Check neutral domains
    if (NEUTRAL_DOMAINS.some(domain => urlLower.includes(domain))) {
      return 'neutral'
    }
    
    // Default to neutral for unknown domains
    return 'neutral'
  } catch (error) {
    return 'neutral'
  }
}

/**
 * Analyze work focus from applications and URLs
 */
export interface WorkFocusAnalysis {
  productiveApps: string[]
  distractionApps: string[]
  neutralApps: string[]
  productiveUrls: string[]
  distractionUrls: string[]
  neutralUrls: string[]
  productivePercentage: number
  distractionPercentage: number
  focusScore: number // 0-25 points
}

export function analyzeWorkFocus(
  applications: string[],
  urls: string[]
): WorkFocusAnalysis {
  // Categorize apps
  const productiveApps = applications.filter(app => categorizeApp(app) === 'productive')
  const distractionApps = applications.filter(app => categorizeApp(app) === 'distraction')
  const neutralApps = applications.filter(app => categorizeApp(app) === 'neutral')
  
  // Categorize URLs
  const productiveUrls = urls.filter(url => categorizeURL(url) === 'productive')
  const distractionUrls = urls.filter(url => categorizeURL(url) === 'distraction')
  const neutralUrls = urls.filter(url => categorizeURL(url) === 'neutral')
  
  // Calculate percentages
  const totalActivities = applications.length + urls.length
  const productiveCount = productiveApps.length + productiveUrls.length
  const distractionCount = distractionApps.length + distractionUrls.length
  
  const productivePercentage = totalActivities > 0 
    ? Math.round((productiveCount / totalActivities) * 100) 
    : 0
  const distractionPercentage = totalActivities > 0 
    ? Math.round((distractionCount / totalActivities) * 100) 
    : 0
  
  // Calculate focus score (0-25 points)
  // 100% productive = 25 points
  // 0% distraction = bonus
  let focusScore = (productivePercentage / 100) * 25
  
  // Penalty for distractions
  const distractionPenalty = (distractionPercentage / 100) * 10
  focusScore = Math.max(0, focusScore - distractionPenalty)
  
  return {
    productiveApps,
    distractionApps,
    neutralApps,
    productiveUrls,
    distractionUrls,
    neutralUrls,
    productivePercentage,
    distractionPercentage,
    focusScore: Math.round(focusScore)
  }
}

/**
 * Get human-readable category label
 */
export function getCategoryLabel(category: 'productive' | 'neutral' | 'distraction'): string {
  switch (category) {
    case 'productive':
      return '✅ Work-Related'
    case 'distraction':
      return '⚠️ Non-Productive'
    case 'neutral':
      return '📊 Neutral'
  }
}

/**
 * Get category color for UI
 */
export function getCategoryColor(category: 'productive' | 'neutral' | 'distraction'): string {
  switch (category) {
    case 'productive':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    case 'distraction':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'neutral':
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

