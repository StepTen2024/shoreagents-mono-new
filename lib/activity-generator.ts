/**
 * Activity Feed Auto-Generation Service
 * 
 * Automatically creates activity posts for important team events:
 * - Staff onboarded
 * - Clocked in/out
 * - Break started/ended
 * - Good reviews (75%+ score)
 * - Tasks completed
 * - Documents added by clients
 */

import { prisma } from "@/lib/prisma"

type ActivityType = 
  | "STAFF_ONBOARDED"
  | "CLOCKED_IN"
  | "CLOCKED_OUT"
  | "BREAK_STARTED"
  | "BREAK_ENDED"
  | "REVIEW_COMPLETED"
  | "TASK_COMPLETED"
  | "DOCUMENT_UPLOADED"

interface ActivityData {
  type: ActivityType
  staffUserId: string
  staffName: string
  data?: {
    reviewScore?: number
    reviewType?: string
    taskTitle?: string
    taskPriority?: string
    documentTitle?: string
    clientName?: string
    companyName?: string
    breakType?: string
    totalHours?: number
  }
}

/**
 * Generate a fun, engaging post content based on activity type
 */
function generatePostContent(activity: ActivityData): string {
  const { type, staffName, data } = activity

  switch (type) {
    case "STAFF_ONBOARDED":
      return `🎉 Welcome ${staffName} to the team! Excited to have you on board! 👋`

    case "CLOCKED_IN":
      return `☀️ ${staffName} just clocked in! Let's crush it today! 💪`

    case "CLOCKED_OUT":
      const hours = data?.totalHours ? ` after ${data.totalHours.toFixed(1)} hours` : ""
      return `🏁 ${staffName} clocked out${hours}! Great work today! 🌟`

    case "BREAK_STARTED":
      const breakType = data?.breakType || "a break"
      const breakEmoji = breakType === "LUNCH" ? "🍽️" : breakType === "MORNING" || breakType === "AFTERNOON" ? "☕" : "⏸️"
      return `${breakEmoji} ${staffName} is taking ${breakType.toLowerCase()} break. Enjoy the recharge! 😊`

    case "BREAK_ENDED":
      return `⚡ ${staffName} is back from break! Ready to tackle the day! 🚀`

    case "REVIEW_COMPLETED":
      const score = data?.reviewScore || 0
      const reviewType = data?.reviewType || "review"
      let emoji = "🌟"
      let message = "Great work"
      
      if (score >= 95) {
        emoji = "🏆"
        message = "Outstanding performance"
      } else if (score >= 90) {
        emoji = "⭐"
        message = "Exceptional work"
      } else if (score >= 85) {
        emoji = "🌟"
        message = "Great work"
      } else if (score >= 75) {
        emoji = "👏"
        message = "Solid performance"
      }
      
      return `${emoji} ${staffName} completed their ${reviewType} with a ${score}% score! ${message}! 🎉`

    case "TASK_COMPLETED":
      const priority = data?.taskPriority
      const taskTitle = data?.taskTitle || "a task"
      
      // Exciting messages based on priority
      if (priority === "URGENT") {
        const urgentMessages = [
          `🔥 ${staffName} crushed the urgent task "${taskTitle}"! BEAST MODE! 💪`,
          `🔥 ${staffName} just demolished "${taskTitle}"! That's how it's done! 🚀`,
          `🔥 URGENT TASK DOWN! ${staffName} completed "${taskTitle}"! Legend! 🏆`,
        ]
        return urgentMessages[Math.floor(Math.random() * urgentMessages.length)]
      } else if (priority === "HIGH") {
        const highMessages = [
          `⚡ ${staffName} knocked out "${taskTitle}"! One more down! 🎯`,
          `⚡ ${staffName} completed "${taskTitle}"! Productivity on fire! 🔥`,
          `⚡ HIGH PRIORITY DONE! ${staffName} finished "${taskTitle}"! Amazing! 🌟`,
        ]
        return highMessages[Math.floor(Math.random() * highMessages.length)]
      } else {
        const normalMessages = [
          `✅ ${staffName} completed "${taskTitle}"! One more off the list! 🎯`,
          `✅ ${staffName} finished "${taskTitle}"! Keep that momentum going! 💫`,
          `✅ Task complete! ${staffName} wrapped up "${taskTitle}"! Nice work! 👏`,
        ]
        return normalMessages[Math.floor(Math.random() * normalMessages.length)]
      }

    case "DOCUMENT_UPLOADED":
      const client = data?.clientName || data?.companyName || "a client"
      return `📄 ${client} uploaded "${data?.documentTitle}"! New materials available for the team! 📚`

    default:
      return `${staffName} just accomplished something great! 🎉`
  }
}

/**
 * Determine which post type to use
 */
function getPostType(activityType: ActivityType): "UPDATE" | "WIN" | "CELEBRATION" | "ACHIEVEMENT" {
  switch (activityType) {
    case "STAFF_ONBOARDED":
      return "CELEBRATION"
    case "TASK_COMPLETED":
    case "REVIEW_COMPLETED":
      return "ACHIEVEMENT"
    case "CLOCKED_IN":
    case "BREAK_STARTED":
    case "BREAK_ENDED":
      return "UPDATE"
    case "DOCUMENT_UPLOADED":
      return "WIN"
    default:
      return "UPDATE"
  }
}

/**
 * Create an activity post in the database
 */
export async function createActivityPost(activity: ActivityData) {
  try {
    const content = generatePostContent(activity)
    const postType = getPostType(activity.type)

    const { randomUUID } = await import('crypto')
    const now = new Date()
    
    const post = await prisma.activity_posts.create({
      data: {
        id: randomUUID(),
        staffUserId: activity.staffUserId,
        type: postType,
        content,
        achievement: activity.data ? {
          activityType: activity.type,
          ...activity.data
        } : null,
        images: [],
        audience: 'STAFF',
        updatedAt: now  // ← ADD MISSING updatedAt!
      },
    })

    console.log(`✅ Activity post created: ${activity.type} for ${activity.staffName}`)
    return post
  } catch (error) {
    console.error(`❌ Failed to create activity post:`, error)
    return null
  }
}

/**
 * Helper functions for specific activity types
 */

export async function logStaffOnboarded(staffUserId: string, staffName: string) {
  return createActivityPost({
    type: "STAFF_ONBOARDED",
    staffUserId,
    staffName,
  })
}

export async function logClockedIn(staffUserId: string, staffName: string) {
  return createActivityPost({
    type: "CLOCKED_IN",
    staffUserId,
    staffName,
  })
}

export async function logClockedOut(staffUserId: string, staffName: string, totalHours?: number) {
  return createActivityPost({
    type: "CLOCKED_OUT",
    staffUserId,
    staffName,
    data: { totalHours },
  })
}

export async function logBreakStarted(staffUserId: string, staffName: string, breakType: string) {
  return createActivityPost({
    type: "BREAK_STARTED",
    staffUserId,
    staffName,
    data: { breakType },
  })
}

export async function logBreakEnded(staffUserId: string, staffName: string) {
  return createActivityPost({
    type: "BREAK_ENDED",
    staffUserId,
    staffName,
  })
}

export async function logReviewCompleted(
  staffUserId: string,
  staffName: string,
  reviewScore: number,
  reviewType: string
) {
  // Only post if score is 75% or higher (no shaming!)
  if (reviewScore >= 75) {
    return createActivityPost({
      type: "REVIEW_COMPLETED",
      staffUserId,
      staffName,
      data: { reviewScore, reviewType },
    })
  }
  return null
}

export async function logTaskCompleted(
  staffUserId: string,
  staffName: string,
  taskTitle: string,
  taskPriority: string
) {
  return createActivityPost({
    type: "TASK_COMPLETED",
    staffUserId,
    staffName,
    data: { taskTitle, taskPriority },
  })
}

export async function logDocumentUploaded(
  staffUserId: string, // The staff who will post it (can be first staff in company)
  documentTitle: string,
  clientName: string,
  companyName: string
) {
  return createActivityPost({
    type: "DOCUMENT_UPLOADED",
    staffUserId,
    staffName: companyName, // Use company name as the "actor"
    data: { documentTitle, clientName, companyName },
  })
}

