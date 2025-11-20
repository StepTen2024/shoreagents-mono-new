/**
 * Enhanced Productivity Score Calculator
 * 
 * Calculates a comprehensive productivity score (0-100) based on:
 * - Time Efficiency (30 points)
 * - Activity Level (20 points)
 * - Work Focus (25 points)
 * - Task Completion (15 points)
 * - Distraction Penalty (up to -10 points)
 */

import { analyzeWorkFocus } from './productivity-categories'

export interface ProductivityMetrics {
  // Time metrics (in seconds)
  activeTime: number
  idleTime: number
  screenTime: number
  
  // Activity metrics
  mouseMovements: number
  mouseClicks: number
  keystrokes: number
  
  // Digital activity
  clipboardActions: number
  downloads: number
  uploads: number
  urlsVisited: number
  tabsSwitched: number
  
  // Arrays for analysis
  applicationsUsed: string[]
  visitedUrls: string[]
}

export interface ProductivityBreakdown {
  overallScore: number
  timeEfficiencyScore: number
  activityLevelScore: number
  workFocusScore: number
  taskCompletionScore: number
  distractionPenalty: number
  
  // Detailed analysis
  timeEfficiency: {
    activePercentage: number
    idlePercentage: number
    rating: 'excellent' | 'good' | 'fair' | 'poor'
  }
  activityLevel: {
    totalInteractions: number
    rating: 'high' | 'medium' | 'low'
  }
  workFocus: {
    productiveApps: number
    distractionApps: number
    productiveUrls: number
    distractionUrls: number
    productivePercentage: number
    distractionPercentage: number
  }
  taskCompletion: {
    fileActivity: number
    clipboardActivity: number
    rating: 'excellent' | 'good' | 'fair' | 'poor'
  }
  distractions: {
    excessiveTabSwitching: boolean
    socialMediaDetected: boolean
    entertainmentDetected: boolean
    distractionCount: number
  }
}

/**
 * Calculate enhanced productivity score with detailed breakdown
 */
export function calculateEnhancedProductivityScore(
  metrics: ProductivityMetrics
): ProductivityBreakdown {
  // 1. TIME EFFICIENCY (30 points)
  const timeEfficiencyScore = calculateTimeEfficiency(metrics)
  
  // 2. ACTIVITY LEVEL (20 points)
  const activityLevelScore = calculateActivityLevel(metrics)
  
  // 3. WORK FOCUS (25 points)
  const { workFocusScore, workFocusAnalysis } = calculateWorkFocus(metrics)
  
  // 4. TASK COMPLETION (15 points)
  const taskCompletionScore = calculateTaskCompletion(metrics)
  
  // 5. DISTRACTION PENALTY (up to -10 points)
  const { distractionPenalty, distractionAnalysis } = calculateDistractionPenalty(metrics, workFocusAnalysis)
  
  // OVERALL SCORE
  const overallScore = Math.max(0, Math.min(100,
    timeEfficiencyScore.score +
    activityLevelScore.score +
    workFocusScore +
    taskCompletionScore.score -
    distractionPenalty
  ))
  
  return {
    overallScore: Math.round(overallScore),
    timeEfficiencyScore: timeEfficiencyScore.score,
    activityLevelScore: activityLevelScore.score,
    workFocusScore,
    taskCompletionScore: taskCompletionScore.score,
    distractionPenalty,
    
    timeEfficiency: timeEfficiencyScore.details,
    activityLevel: activityLevelScore.details,
    workFocus: workFocusAnalysis,
    taskCompletion: taskCompletionScore.details,
    distractions: distractionAnalysis
  }
}

/**
 * 1. TIME EFFICIENCY (30 points)
 */
function calculateTimeEfficiency(metrics: ProductivityMetrics) {
  const totalTime = metrics.activeTime + metrics.idleTime
  
  if (totalTime === 0) {
    return {
      score: 0,
      details: {
        activePercentage: 0,
        idlePercentage: 0,
        rating: 'poor' as const
      }
    }
  }
  
  const activePercentage = (metrics.activeTime / totalTime) * 100
  const idlePercentage = (metrics.idleTime / totalTime) * 100
  
  // Score based on active time percentage
  // 90%+ active = 30 points (excellent)
  // 80-89% active = 25 points (good)
  // 70-79% active = 20 points (fair)
  // < 70% active = proportional (poor)
  let score = (activePercentage / 100) * 30
  
  let rating: 'excellent' | 'good' | 'fair' | 'poor'
  if (activePercentage >= 90) rating = 'excellent'
  else if (activePercentage >= 80) rating = 'good'
  else if (activePercentage >= 70) rating = 'fair'
  else rating = 'poor'
  
  return {
    score: Math.round(score),
    details: {
      activePercentage: Math.round(activePercentage),
      idlePercentage: Math.round(idlePercentage),
      rating
    }
  }
}

/**
 * 2. ACTIVITY LEVEL (20 points)
 */
function calculateActivityLevel(metrics: ProductivityMetrics) {
  const totalInteractions = metrics.mouseClicks + metrics.keystrokes
  
  // Normalize to typical 8-hour workday
  // 5000 keystrokes + 1000 clicks = 100%
  const keystrokeScore = Math.min((metrics.keystrokes / 5000), 1) * 10
  const mouseScore = Math.min((metrics.mouseClicks / 1000), 1) * 10
  
  const score = keystrokeScore + mouseScore
  
  let rating: 'high' | 'medium' | 'low'
  if (score >= 15) rating = 'high'
  else if (score >= 10) rating = 'medium'
  else rating = 'low'
  
  return {
    score: Math.round(score),
    details: {
      totalInteractions,
      rating
    }
  }
}

/**
 * 3. WORK FOCUS (25 points)
 */
function calculateWorkFocus(metrics: ProductivityMetrics) {
  const analysis = analyzeWorkFocus(
    metrics.applicationsUsed || [],
    metrics.visitedUrls || []
  )
  
  return {
    workFocusScore: analysis.focusScore,
    workFocusAnalysis: {
      productiveApps: analysis.productiveApps.length,
      distractionApps: analysis.distractionApps.length,
      productiveUrls: analysis.productiveUrls.length,
      distractionUrls: analysis.distractionUrls.length,
      productivePercentage: analysis.productivePercentage,
      distractionPercentage: analysis.distractionPercentage
    }
  }
}

/**
 * 4. TASK COMPLETION (15 points)
 */
function calculateTaskCompletion(metrics: ProductivityMetrics) {
  // File activity (uploads/downloads indicate work output)
  const fileActivity = metrics.downloads + metrics.uploads
  const fileScore = Math.min((fileActivity / 10) * 7, 7) // Max 7 points
  
  // Clipboard activity (copy/paste indicates data handling)
  const clipboardScore = Math.min((metrics.clipboardActions / 50) * 8, 8) // Max 8 points
  
  const score = fileScore + clipboardScore
  
  let rating: 'excellent' | 'good' | 'fair' | 'poor'
  if (score >= 12) rating = 'excellent'
  else if (score >= 8) rating = 'good'
  else if (score >= 4) rating = 'fair'
  else rating = 'poor'
  
  return {
    score: Math.round(score),
    details: {
      fileActivity,
      clipboardActivity: metrics.clipboardActions,
      rating
    }
  }
}

/**
 * 5. DISTRACTION PENALTY (up to -10 points)
 */
function calculateDistractionPenalty(
  metrics: ProductivityMetrics,
  workFocusAnalysis: any
) {
  let penalty = 0
  
  const distractionCount = workFocusAnalysis.distractionApps + workFocusAnalysis.distractionUrls
  const socialMediaDetected = distractionCount > 0
  const entertainmentDetected = distractionCount > 0
  
  // Penalty for distractions (max 5 points)
  if (workFocusAnalysis.distractionPercentage > 20) {
    penalty += 5
  } else if (workFocusAnalysis.distractionPercentage > 10) {
    penalty += 3
  } else if (workFocusAnalysis.distractionPercentage > 5) {
    penalty += 1
  }
  
  // Penalty for excessive tab switching (max 3 points)
  const excessiveTabSwitching = metrics.tabsSwitched > 300
  if (excessiveTabSwitching) {
    if (metrics.tabsSwitched > 500) penalty += 3
    else if (metrics.tabsSwitched > 400) penalty += 2
    else penalty += 1
  }
  
  // Penalty for very high URL count without much productivity (max 2 points)
  if (metrics.urlsVisited > 100 && workFocusAnalysis.productivePercentage < 50) {
    penalty += 2
  }
  
  return {
    distractionPenalty: Math.min(penalty, 10), // Cap at 10 points
    distractionAnalysis: {
      excessiveTabSwitching,
      socialMediaDetected,
      entertainmentDetected,
      distractionCount
    }
  }
}

/**
 * Get productivity rating from score
 */
export function getProductivityRating(score: number): {
  rating: string
  emoji: string
  color: string
  description: string
} {
  if (score >= 90) {
    return {
      rating: 'Exceptional',
      emoji: '⭐',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      description: 'Outstanding performance! Keep up the excellent work.'
    }
  } else if (score >= 80) {
    return {
      rating: 'Excellent',
      emoji: '🌟',
      color: 'text-green-600 bg-green-50 border-green-200',
      description: 'Great productivity with minimal distractions.'
    }
  } else if (score >= 70) {
    return {
      rating: 'Good',
      emoji: '✅',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      description: 'Solid performance with room for improvement.'
    }
  } else if (score >= 60) {
    return {
      rating: 'Fair',
      emoji: '📊',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      description: 'Adequate productivity. Focus on reducing distractions.'
    }
  } else if (score >= 50) {
    return {
      rating: 'Below Average',
      emoji: '⚠️',
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      description: 'Productivity needs improvement. Review work habits.'
    }
  } else {
    return {
      rating: 'Needs Improvement',
      emoji: '🚨',
      color: 'text-red-600 bg-red-50 border-red-200',
      description: 'Significant issues detected. Immediate attention needed.'
    }
  }
}

/**
 * Format time for display
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

