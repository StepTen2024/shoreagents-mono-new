import { prisma } from './prisma'

export interface StaffContextData {
  staff: {
    id: string
    name: string
    email: string
    role: string
    avatar?: string | null
  } | null
  interests: {
    personalityType?: string | null
    hobby?: string | null
    favoriteGame?: string | null
    favoriteMusic?: string | null
    favoriteFood?: string | null
    dreamDestination?: string | null
  } | null
  profile: {
    currentRole?: string | null
    daysEmployed?: number | null
    employmentStatus?: string | null
    salary?: number | null
    totalLeave?: number | null
    usedLeave?: number | null
  } | null
  recentTasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    deadline?: Date | null
    description?: string | null
  }>
  recentReviews: Array<{
    overallScore?: number | null
    strengths?: string | null
    improvements?: string | null
    createdAt: Date
  }>
  recentTimeEntries: Array<{
    date: Date
    hours: number
    description?: string | null
  }>
}

/**
 * Build comprehensive context about a staff member for AI personalization
 * @param staffUserId - The staff member's ID
 * @returns Complete staff context data
 */
export async function buildStaffContext(
  staffUserId: string
): Promise<StaffContextData> {
  console.log(`🔍 [STAFF-CONTEXT] Building context for staff ${staffUserId}`)

  try {
    const [staff, interests, profile, recentTasks, recentReviews, recentTimeEntries] =
      await Promise.all([
        // Basic staff info
        prisma.staff_users.findUnique({
          where: { id: staffUserId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        }),

        // Personal interests (hobbies, games, etc.)
        prisma.staff_interests.findUnique({
          where: { staffUserId },
          select: {
            personalityType: true,
            hobby: true,
            favoriteGame: true,
            favoriteMusic: true,
            favoriteFood: true,
            dreamDestination: true,
          },
        }),

        // Employment profile
        prisma.staff_profiles.findUnique({
          where: { staffUserId },
          select: {
            currentRole: true,
            daysEmployed: true,
            employmentStatus: true,
            salary: true,
            totalLeave: true,
            usedLeave: true,
          },
        }),

        // Recent tasks (last 10, ordered by deadline)
        prisma.tasks.findMany({
          where: {
            OR: [
              { staffUserId }, // Tasks assigned to them
              {
                // Tasks they're assigned to via task_assignments
                task_assignments: {
                  some: {
                    staffUserId,
                  },
                },
              },
            ],
          },
          orderBy: [
            { deadline: 'asc' }, // Urgent tasks first
            { createdAt: 'desc' }, // Then by recency
          ],
          take: 10,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            deadline: true,
            description: true,
          },
        }),

        // Recent performance reviews (last 3)
        prisma.reviews.findMany({
          where: { staffUserId },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            overallScore: true,
            strengths: true,
            improvements: true,
            createdAt: true,
          },
        }),

        // Recent time entries (last 7 days)
        prisma.time_entries.findMany({
          where: {
            staffUserId,
            date: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
          orderBy: { date: 'desc' },
          select: {
            date: true,
            hours: true,
            description: true,
          },
        }),
      ])

    console.log(`✅ [STAFF-CONTEXT] Context built successfully`)
    console.log(`  - Staff: ${staff?.name}`)
    console.log(`  - Recent tasks: ${recentTasks.length}`)
    console.log(`  - Reviews: ${recentReviews.length}`)
    console.log(`  - Time entries (7d): ${recentTimeEntries.length}`)

    return {
      staff,
      interests,
      profile,
      recentTasks,
      recentReviews,
      recentTimeEntries,
    }
  } catch (error) {
    console.error(`❌ [STAFF-CONTEXT] Failed to build context:`, error)
    // Return empty context instead of throwing
    return {
      staff: null,
      interests: null,
      profile: null,
      recentTasks: [],
      recentReviews: [],
      recentTimeEntries: [],
    }
  }
}

/**
 * Format staff context into a readable string for AI prompts
 * @param context - The staff context data
 * @returns Formatted string for AI consumption
 */
export function formatStaffContextForAI(context: StaffContextData): string {
  const parts: string[] = []

  // Basic info
  if (context.staff) {
    parts.push(`STAFF MEMBER: ${context.staff.name}`)
    parts.push(`Role: ${context.staff.role}`)
  }

  // Profile details
  if (context.profile) {
    parts.push(`\nEMPLOYMENT PROFILE:`)
    if (context.profile.currentRole) parts.push(`Position: ${context.profile.currentRole}`)
    if (context.profile.daysEmployed)
      parts.push(`Days Employed: ${context.profile.daysEmployed}`)
    if (context.profile.employmentStatus)
      parts.push(`Status: ${context.profile.employmentStatus}`)
    if (context.profile.totalLeave && context.profile.usedLeave) {
      const remaining = context.profile.totalLeave - context.profile.usedLeave
      parts.push(`Leave: ${remaining}/${context.profile.totalLeave} days remaining`)
    }
  }

  // Interests
  if (context.interests) {
    parts.push(`\nINTERESTS & PERSONALITY:`)
    if (context.interests.personalityType)
      parts.push(`Personality: ${context.interests.personalityType}`)
    if (context.interests.hobby) parts.push(`Hobbies: ${context.interests.hobby}`)
    if (context.interests.favoriteGame)
      parts.push(`Favorite Game: ${context.interests.favoriteGame}`)
    if (context.interests.favoriteMusic)
      parts.push(`Favorite Music: ${context.interests.favoriteMusic}`)
    if (context.interests.favoriteFood)
      parts.push(`Favorite Food: ${context.interests.favoriteFood}`)
  }

  // Recent tasks
  if (context.recentTasks.length > 0) {
    parts.push(`\nRECENT TASKS (${context.recentTasks.length}):`)
    context.recentTasks.forEach((task) => {
      const deadlineStr = task.deadline
        ? ` (Due: ${task.deadline.toLocaleDateString()})`
        : ''
      parts.push(`- [${task.status}] ${task.title} ${deadlineStr}`)
    })
  }

  // Performance reviews
  if (context.recentReviews.length > 0) {
    parts.push(`\nRECENT PERFORMANCE REVIEWS:`)
    context.recentReviews.forEach((review, i) => {
      parts.push(`Review ${i + 1} (${review.createdAt.toLocaleDateString()}):`)
      if (review.overallScore) parts.push(`  Score: ${review.overallScore}/5`)
      if (review.strengths) parts.push(`  Strengths: ${review.strengths}`)
      if (review.improvements) parts.push(`  Areas to improve: ${review.improvements}`)
    })
  }

  // Time entries
  if (context.recentTimeEntries.length > 0) {
    parts.push(`\nRECENT WORK LOG (Last 7 days):`)
    context.recentTimeEntries.forEach((entry) => {
      const desc = entry.description ? ` - ${entry.description}` : ''
      parts.push(`${entry.date.toLocaleDateString()}: ${entry.hours}h${desc}`)
    })
  }

  return parts.join('\n')
}

