// ============================================
// FILO WORKS - REVIEW UTILITY FUNCTIONS
// Helper functions for review system
// ============================================

import { ReviewType } from "./review-templates"

export type PerformanceLevel = "critical" | "needs_improvement" | "good" | "excellent"
export type ReviewStatusType = "PENDING" | "SUBMITTED" | "UNDER_REVIEW" | "COMPLETED"

/**
 * Get performance level based on percentage score
 */
export function getPerformanceLevel(percentage: number): PerformanceLevel {
  if (percentage < 50) return "critical"
  if (percentage < 70) return "needs_improvement"
  if (percentage < 85) return "good"
  return "excellent"
}

/**
 * Get performance badge configuration
 */
export function getPerformanceBadge(level: PerformanceLevel): {
  label: string
  color: string
  bgColor: string
  icon: string
} {
  const badges = {
    critical: {
      label: "Critical",
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      icon: "🔴"
    },
    needs_improvement: {
      label: "Needs Improvement",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      icon: "🟡"
    },
    good: {
      label: "Good",
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      icon: "🟢"
    },
    excellent: {
      label: "Excellent",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      icon: "🔵"
    }
  }
  return badges[level]
}

/**
 * Get review status badge configuration
 */
export function getStatusBadge(status: ReviewStatusType): {
  label: string
  color: string
  bgColor: string
} {
  const badges = {
    PENDING: {
      label: "Pending Client Review",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20"
    },
    SUBMITTED: {
      label: "Client Reviewed",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    UNDER_REVIEW: {
      label: "Waiting for Acknowledgement",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20"
    },
    COMPLETED: {
      label: "Completed",
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    }
  }
  return badges[status]
}

/**
 * Get review type badge configuration
 */
export function getReviewTypeBadge(type: ReviewType): {
  label: string
  color: string
  bgColor: string
  icon: string
} {
  const badges = {
    MONTH_1: {
      label: "Month 1",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      icon: "🔵"
    },
    MONTH_3: {
      label: "Month 3",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
      icon: "🟢"
    },
    MONTH_5: {
      label: "Month 5",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      icon: "🟣"
    },
    RECURRING: {
      label: "Month 6",
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
      icon: "🟠"
    }
  }
  return badges[type]
}

/**
 * Format date for display
 */
export function formatReviewDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${month}/${day}/${year}`
}

/**
 * Format date for display with time
 */
export function formatReviewDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  const dateStr = formatReviewDate(d)
  const hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, "0")
  const ampm = hours >= 12 ? "PM" : "AM"
  const hour12 = hours % 12 || 12
  return `${dateStr} ${hour12}:${minutes} ${ampm}`
}

/**
 * Check if review is overdue
 */
export function isReviewOverdue(dueDate: Date | string): boolean {
  const days = getDaysUntilDue(dueDate)
  return days < 0
}

/**
 * Get days until/since due date
 */
export function getDaysUntilDue(dueDate: Date | string): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate
  const now = new Date()
  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Get due date display text
 */
export function getDueDateText(dueDate: Date | string): string {
  const days = getDaysUntilDue(dueDate)
  
  if (days < 0) {
    return `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue`
  } else if (days === 0) {
    return "Due today"
  } else if (days === 1) {
    return "Due tomorrow"
  } else if (days <= 7) {
    return `Due in ${days} days`
  } else {
    return `Due ${formatReviewDate(dueDate)}`
  }
}

/**
 * Calculate days since start date
 */
export function getDaysSinceStart(startDate: Date | string): number {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate
  const now = new Date()
  const diffTime = now.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Determine which review type is due based on start date
 */
export function getNextReviewType(startDate: Date | string, completedReviews: ReviewType[]): ReviewType | null {
  const days = getDaysSinceStart(startDate)
  
  // Check Month 1 (30 days)
  if (days >= 23 && days < 30 && !completedReviews.includes("MONTH_1")) {
    return "MONTH_1"
  }
  
  // Check Month 3 (90 days)
  if (days >= 83 && days < 90 && !completedReviews.includes("MONTH_3")) {
    return "MONTH_3"
  }
  
  // Check Month 5 (150 days)
  if (days >= 143 && days < 150 && !completedReviews.includes("MONTH_5")) {
    return "MONTH_5"
  }
  
  // Check Recurring (180 days)
  if (days >= 173 && days < 180) {
    return "RECURRING"
  }
  
  return null
}

/**
 * Check if score is critical (requires management alert)
 */
export function isCriticalScore(percentage: number): boolean {
  return percentage < 50
}

/**
 * Check if Month 5 score indicates regularization risk
 */
export function isRegularizationRisk(reviewType: ReviewType, percentage: number): boolean {
  return reviewType === "MONTH_5" && percentage < 70
}

/**
 * Get score color for UI display
 */
export function getScoreColor(percentage: number): string {
  if (percentage < 50) return "text-red-400"
  if (percentage < 70) return "text-yellow-400"
  if (percentage < 85) return "text-green-400"
  return "text-blue-400"
}

/**
 * Calculate average score from multiple reviews
 */
export function calculateAverageScore(scores: number[]): number {
  if (scores.length === 0) return 0
  const sum = scores.reduce((acc, score) => acc + score, 0)
  return Math.round(sum / scores.length)
}

/**
 * Get performance trend (improving, stable, declining)
 */
export function getPerformanceTrend(scores: number[]): "improving" | "stable" | "declining" | null {
  if (scores.length < 2) return null
  
  const recent = scores[scores.length - 1]
  const previous = scores[scores.length - 2]
  const diff = recent - previous
  
  if (diff > 5) return "improving"
  if (diff < -5) return "declining"
  return "stable"
}

/**
 * Get trend icon
 */
export function getTrendIcon(trend: "improving" | "stable" | "declining" | null): string {
  if (!trend) return ""
  const icons = {
    improving: "📈",
    stable: "➡️",
    declining: "📉"
  }
  return icons[trend]
}

/**
 * Get trend color
 */
export function getTrendColor(trend: "improving" | "stable" | "declining" | null): string {
  if (!trend) return "text-gray-400"
  const colors = {
    improving: "text-green-400",
    stable: "text-blue-400",
    declining: "text-red-400"
  }
  return colors[trend]
}

/**
 * Validate rating value (1-5)
 */
export function isValidRating(rating: number): boolean {
  return rating >= 1 && rating <= 5 && Number.isInteger(rating)
}

/**
 * Validate all ratings in array
 */
export function validateRatings(ratings: number[]): boolean {
  return ratings.length > 0 && ratings.every(rating => isValidRating(rating))
}

