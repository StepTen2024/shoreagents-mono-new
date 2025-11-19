// ============================================
// FILO WORKS - PERFORMANCE REVIEW TEMPLATES
// Complete question sets for all 4 review types
// ============================================

export type ReviewType = "MONTH_1" | "MONTH_3" | "MONTH_5" | "RECURRING"

export interface ReviewQuestion {
  id: string
  category: string
  question: string
  required: boolean
}

export interface ReviewCategory {
  name: string
  description: string
  questions: ReviewQuestion[]
}

export interface ReviewTemplate {
  reviewType: ReviewType
  title: string
  description: string
  categories: ReviewCategory[]
  totalQuestions: number
}

export interface ScoreCalculation {
  totalQuestions: number
  totalEarned: number
  totalPossible: number
  percentage: number
  level: 'critical' | 'needs_improvement' | 'good' | 'excellent'
  color: string
}

// ============================================
// MONTH 1 REVIEW (18 Questions)
// Early Probationary Assessment
// ============================================

export const MONTH_1_TEMPLATE: ReviewTemplate = {
  reviewType: "MONTH_1",
  title: "Month 1 Probationary Review",
  description: "Initial assessment after 30 days of employment",
  totalQuestions: 18,
  
  categories: [
    {
      name: "Work Quality",
      description: "Quality and accuracy of work delivered",
      questions: [
        {
          id: "m1_wq_01",
          category: "Work Quality",
          question: "How would you rate the overall quality of work delivered?",
          required: true
        },
        {
          id: "m1_wq_02",
          category: "Work Quality",
          question: "Does the staff member complete tasks according to specifications?",
          required: true
        },
        {
          id: "m1_wq_03",
          category: "Work Quality",
          question: "How accurate and error-free is their work?",
          required: true
        }
      ]
    },
    {
      name: "Productivity",
      description: "Speed and efficiency of task completion",
      questions: [
        {
          id: "m1_prod_01",
          category: "Productivity",
          question: "Does the staff member meet deadlines consistently?",
          required: true
        },
        {
          id: "m1_prod_02",
          category: "Productivity",
          question: "How efficient are they in completing assigned tasks?",
          required: true
        },
        {
          id: "m1_prod_03",
          category: "Productivity",
          question: "Do they require excessive supervision to complete work?",
          required: true
        }
      ]
    },
    {
      name: "Communication",
      description: "Effectiveness of communication and responsiveness",
      questions: [
        {
          id: "m1_comm_01",
          category: "Communication",
          question: "How effective is their written communication?",
          required: true
        },
        {
          id: "m1_comm_02",
          category: "Communication",
          question: "Do they ask clarifying questions when requirements are unclear?",
          required: true
        },
        {
          id: "m1_comm_03",
          category: "Communication",
          question: "How responsive are they to messages and requests?",
          required: true
        }
      ]
    },
    {
      name: "Learning & Adaptation",
      description: "Ability to learn and adapt to processes",
      questions: [
        {
          id: "m1_learn_01",
          category: "Learning & Adaptation",
          question: "How quickly do they learn new tasks and processes?",
          required: true
        },
        {
          id: "m1_learn_02",
          category: "Learning & Adaptation",
          question: "Do they apply feedback and corrections effectively?",
          required: true
        },
        {
          id: "m1_learn_03",
          category: "Learning & Adaptation",
          question: "How well have they adapted to company culture and processes?",
          required: true
        }
      ]
    },
    {
      name: "Professionalism",
      description: "Professional conduct and reliability",
      questions: [
        {
          id: "m1_prof_01",
          category: "Professionalism",
          question: "How professional are their interactions with you and the team?",
          required: true
        },
        {
          id: "m1_prof_02",
          category: "Professionalism",
          question: "How is their attendance and punctuality?",
          required: true
        },
        {
          id: "m1_prof_03",
          category: "Professionalism",
          question: "Do they take initiative when appropriate?",
          required: true
        }
      ]
    },
    {
      name: "Overall Assessment",
      description: "General evaluation and expectations",
      questions: [
        {
          id: "m1_overall_01",
          category: "Overall Assessment",
          question: "Overall, how satisfied are you with this staff member so far?",
          required: true
        },
        {
          id: "m1_overall_02",
          category: "Overall Assessment",
          question: "Do they show potential for long-term success in this role?",
          required: true
        },
        {
          id: "m1_overall_03",
          category: "Overall Assessment",
          question: "Would you recommend continuing their employment beyond probation?",
          required: true
        }
      ]
    }
  ]
}

// ============================================
// MONTH 3 REVIEW (27 Questions)
// Mid-Probation Comprehensive Assessment
// ============================================

export const MONTH_3_TEMPLATE: ReviewTemplate = {
  reviewType: "MONTH_3",
  title: "Month 3 Mid-Probation Review",
  description: "Comprehensive assessment after 90 days of employment",
  totalQuestions: 27,
  
  categories: [
    {
      name: "Performance Improvement",
      description: "Progress since Month 1 review",
      questions: [
        {
          id: "m3_perf_01",
          category: "Performance Improvement",
          question: "Has work quality improved since the Month 1 review?",
          required: true
        },
        {
          id: "m3_perf_02",
          category: "Performance Improvement",
          question: "Have they addressed feedback from the Month 1 review?",
          required: true
        },
        {
          id: "m3_perf_03",
          category: "Performance Improvement",
          question: "Are they mastering their core job responsibilities?",
          required: true
        },
        {
          id: "m3_perf_04",
          category: "Performance Improvement",
          question: "Do they now require less supervision than before?",
          required: true
        }
      ]
    },
    {
      name: "Work Quality & Output",
      description: "Current quality and consistency of work",
      questions: [
        {
          id: "m3_qual_01",
          category: "Work Quality & Output",
          question: "How would you rate the current quality of their work?",
          required: true
        },
        {
          id: "m3_qual_02",
          category: "Work Quality & Output",
          question: "Is their work consistently accurate and error-free?",
          required: true
        },
        {
          id: "m3_qual_03",
          category: "Work Quality & Output",
          question: "Do they meet or exceed your quality standards?",
          required: true
        },
        {
          id: "m3_qual_04",
          category: "Work Quality & Output",
          question: "How thorough and detail-oriented are they?",
          required: true
        }
      ]
    },
    {
      name: "Productivity & Efficiency",
      description: "Speed and effectiveness of task completion",
      questions: [
        {
          id: "m3_prod_01",
          category: "Productivity & Efficiency",
          question: "How would you rate their overall productivity?",
          required: true
        },
        {
          id: "m3_prod_02",
          category: "Productivity & Efficiency",
          question: "Do they consistently meet deadlines?",
          required: true
        },
        {
          id: "m3_prod_03",
          category: "Productivity & Efficiency",
          question: "Can they handle multiple tasks effectively?",
          required: true
        },
        {
          id: "m3_prod_04",
          category: "Productivity & Efficiency",
          question: "How efficient are they with their time management?",
          required: true
        }
      ]
    },
    {
      name: "Skills & Competency",
      description: "Technical skills and capability growth",
      questions: [
        {
          id: "m3_skill_01",
          category: "Skills & Competency",
          question: "Have they developed new skills in the past 3 months?",
          required: true
        },
        {
          id: "m3_skill_02",
          category: "Skills & Competency",
          question: "How quickly do they learn new tasks?",
          required: true
        },
        {
          id: "m3_skill_03",
          category: "Skills & Competency",
          question: "Do they demonstrate growing expertise in their role?",
          required: true
        }
      ]
    },
    {
      name: "Communication & Collaboration",
      description: "Teamwork and communication effectiveness",
      questions: [
        {
          id: "m3_comm_01",
          category: "Communication & Collaboration",
          question: "How effective is their communication with you and the team?",
          required: true
        },
        {
          id: "m3_comm_02",
          category: "Communication & Collaboration",
          question: "Do they proactively provide updates on their work?",
          required: true
        },
        {
          id: "m3_comm_03",
          category: "Communication & Collaboration",
          question: "How well do they collaborate with other team members?",
          required: true
        }
      ]
    },
    {
      name: "Reliability & Trust",
      description: "Dependability and trustworthiness",
      questions: [
        {
          id: "m3_reli_01",
          category: "Reliability & Trust",
          question: "Can you trust them with important or sensitive tasks?",
          required: true
        },
        {
          id: "m3_reli_02",
          category: "Reliability & Trust",
          question: "Do they follow through on commitments consistently?",
          required: true
        },
        {
          id: "m3_reli_03",
          category: "Reliability & Trust",
          question: "How is their attendance, punctuality, and availability?",
          required: true
        }
      ]
    },
    {
      name: "Overall Assessment",
      description: "Readiness for continued employment",
      questions: [
        {
          id: "m3_overall_01",
          category: "Overall Assessment",
          question: "Overall, how satisfied are you with their performance?",
          required: true
        },
        {
          id: "m3_overall_02",
          category: "Overall Assessment",
          question: "Are they on track to complete probation successfully?",
          required: true
        },
        {
          id: "m3_overall_03",
          category: "Overall Assessment",
          question: "Would you recommend them for regularization at Month 6?",
          required: true
        }
      ]
    }
  ]
}

// ============================================
// MONTH 5 REVIEW (24 Questions)
// Pre-Regularization Final Assessment
// ============================================

export const MONTH_5_TEMPLATE: ReviewTemplate = {
  reviewType: "MONTH_5",
  title: "Month 5 Pre-Regularization Review",
  description: "Final assessment before permanent employment status",
  totalQuestions: 24,
  
  categories: [
    {
      name: "Performance Trajectory",
      description: "Overall progress throughout probation",
      questions: [
        {
          id: "m5_traj_01",
          category: "Performance Trajectory",
          question: "How has their performance evolved over the past 5 months?",
          required: true
        },
        {
          id: "m5_traj_02",
          category: "Performance Trajectory",
          question: "Have they consistently improved throughout probation?",
          required: true
        },
        {
          id: "m5_traj_03",
          category: "Performance Trajectory",
          question: "Do they now meet or exceed your original expectations?",
          required: true
        },
        {
          id: "m5_traj_04",
          category: "Performance Trajectory",
          question: "How well have they integrated into your operations?",
          required: true
        }
      ]
    },
    {
      name: "Current Performance Level",
      description: "Current work quality and consistency",
      questions: [
        {
          id: "m5_curr_01",
          category: "Current Performance Level",
          question: "How would you rate their current work quality?",
          required: true
        },
        {
          id: "m5_curr_02",
          category: "Current Performance Level",
          question: "How productive and efficient are they now?",
          required: true
        },
        {
          id: "m5_curr_03",
          category: "Current Performance Level",
          question: "Can you rely on them to work independently?",
          required: true
        },
        {
          id: "m5_curr_04",
          category: "Current Performance Level",
          question: "How consistent is their performance week to week?",
          required: true
        }
      ]
    },
    {
      name: "Value & Impact",
      description: "Contribution to business operations",
      questions: [
        {
          id: "m5_value_01",
          category: "Value & Impact",
          question: "How valuable are they to your day-to-day operations?",
          required: true
        },
        {
          id: "m5_value_02",
          category: "Value & Impact",
          question: "Have they made a positive impact on your business?",
          required: true
        },
        {
          id: "m5_value_03",
          category: "Value & Impact",
          question: "Do they add value beyond just completing tasks?",
          required: true
        },
        {
          id: "m5_value_04",
          category: "Value & Impact",
          question: "Would you struggle if they were suddenly unavailable?",
          required: true
        }
      ]
    },
    {
      name: "Long-Term Potential",
      description: "Future growth and development potential",
      questions: [
        {
          id: "m5_future_01",
          category: "Long-Term Potential",
          question: "Do you see long-term potential in this staff member?",
          required: true
        },
        {
          id: "m5_future_02",
          category: "Long-Term Potential",
          question: "Would you recommend them for increased responsibilities?",
          required: true
        },
        {
          id: "m5_future_03",
          category: "Long-Term Potential",
          question: "Could they potentially take on more complex work?",
          required: true
        },
        {
          id: "m5_future_04",
          category: "Long-Term Potential",
          question: "Do you want them as part of your team long-term?",
          required: true
        }
      ]
    },
    {
      name: "Readiness for Regularization",
      description: "Final assessment for permanent status",
      questions: [
        {
          id: "m5_ready_01",
          category: "Readiness for Regularization",
          question: "Should this staff member be granted regular employment status?",
          required: true
        },
        {
          id: "m5_ready_02",
          category: "Readiness for Regularization",
          question: "Do you have any remaining concerns about their performance?",
          required: true
        },
        {
          id: "m5_ready_03",
          category: "Readiness for Regularization",
          question: "How confident are you in their ability to succeed long-term?",
          required: true
        },
        {
          id: "m5_ready_04",
          category: "Readiness for Regularization",
          question: "Overall recommendation: Regularize or Extend Probation?",
          required: true
        }
      ]
    }
  ]
}

// ============================================
// RECURRING REVIEW (18 Questions)
// Ongoing Performance Assessment (Post-Regularization)
// ============================================

export const RECURRING_TEMPLATE: ReviewTemplate = {
  reviewType: "RECURRING",
  title: "Recurring Performance Review",
  description: "Ongoing assessment for regular employees (every 6 months)",
  totalQuestions: 18,
  
  categories: [
    {
      name: "Work Quality",
      description: "Quality and consistency of work output",
      questions: [
        {
          id: "rec_qual_01",
          category: "Work Quality",
          question: "How would you rate the overall quality of their work?",
          required: true
        },
        {
          id: "rec_qual_02",
          category: "Work Quality",
          question: "Is their work consistently accurate and error-free?",
          required: true
        },
        {
          id: "rec_qual_03",
          category: "Work Quality",
          question: "Do they meet your quality standards and expectations?",
          required: true
        }
      ]
    },
    {
      name: "Productivity",
      description: "Efficiency and task completion",
      questions: [
        {
          id: "rec_prod_01",
          category: "Productivity",
          question: "How productive and efficient are they?",
          required: true
        },
        {
          id: "rec_prod_02",
          category: "Productivity",
          question: "Do they consistently meet deadlines?",
          required: true
        },
        {
          id: "rec_prod_03",
          category: "Productivity",
          question: "Can they effectively manage multiple priorities?",
          required: true
        }
      ]
    },
    {
      name: "Communication",
      description: "Communication effectiveness",
      questions: [
        {
          id: "rec_comm_01",
          category: "Communication",
          question: "How effective is their communication?",
          required: true
        },
        {
          id: "rec_comm_02",
          category: "Communication",
          question: "Do they proactively provide updates and feedback?",
          required: true
        },
        {
          id: "rec_comm_03",
          category: "Communication",
          question: "How responsive are they to messages and requests?",
          required: true
        }
      ]
    },
    {
      name: "Reliability",
      description: "Dependability and trustworthiness",
      questions: [
        {
          id: "rec_reli_01",
          category: "Reliability",
          question: "How reliable and dependable are they?",
          required: true
        },
        {
          id: "rec_reli_02",
          category: "Reliability",
          question: "Do they consistently follow through on commitments?",
          required: true
        },
        {
          id: "rec_reli_03",
          category: "Reliability",
          question: "How is their attendance and availability?",
          required: true
        }
      ]
    },
    {
      name: "Growth & Development",
      description: "Skill development and improvement",
      questions: [
        {
          id: "rec_grow_01",
          category: "Growth & Development",
          question: "Have they developed new skills in this period?",
          required: true
        },
        {
          id: "rec_grow_02",
          category: "Growth & Development",
          question: "Do they show initiative in improving their work?",
          required: true
        },
        {
          id: "rec_grow_03",
          category: "Growth & Development",
          question: "Are they open to feedback and learning?",
          required: true
        }
      ]
    },
    {
      name: "Overall Assessment",
      description: "General performance evaluation",
      questions: [
        {
          id: "rec_overall_01",
          category: "Overall Assessment",
          question: "Overall, how satisfied are you with their performance?",
          required: true
        },
        {
          id: "rec_overall_02",
          category: "Overall Assessment",
          question: "Would you recommend them for continued employment?",
          required: true
        },
        {
          id: "rec_overall_03",
          category: "Overall Assessment",
          question: "How valuable are they to your operations?",
          required: true
        }
      ]
    }
  ]
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get review template by type
 */
export function getReviewTemplate(type: ReviewType): ReviewTemplate {
  switch (type) {
    case "MONTH_1":
      return MONTH_1_TEMPLATE
    case "MONTH_3":
      return MONTH_3_TEMPLATE
    case "MONTH_5":
      return MONTH_5_TEMPLATE
    case "RECURRING":
      return RECURRING_TEMPLATE
    default:
      return MONTH_1_TEMPLATE
  }
}

/**
 * Calculate review score from ratings array
 */
export function calculateReviewScore(ratings: number[]): ScoreCalculation {
  const totalQuestions = ratings.length
  const totalEarned = ratings.reduce((sum, rating) => sum + rating, 0)
  const totalPossible = totalQuestions * 5
  const percentage = Math.round((totalEarned / totalPossible) * 100)
  
  let level: ScoreCalculation['level']
  let color: string
  
  if (percentage < 50) {
    level = 'critical'
    color = 'red'
  } else if (percentage < 70) {
    level = 'needs_improvement'
    color = 'yellow'
  } else if (percentage < 85) {
    level = 'good'
    color = 'green'
  } else {
    level = 'excellent'
    color = 'blue'
  }
  
  return {
    totalQuestions,
    totalEarned,
    totalPossible,
    percentage,
    level,
    color
  }
}

/**
 * Get all questions from template as flat array
 */
export function getAllQuestions(template: ReviewTemplate): ReviewQuestion[] {
  return template.categories.flatMap(category => category.questions)
}

/**
 * Get review due date based on start date and type
 * For RECURRING reviews, this returns the FIRST recurring review date (day 330)
 * Subsequent recurring reviews should be calculated by adding 180 days to the previous review
 */
export function getReviewDueDate(startDate: Date, type: ReviewType): Date {
  const dueDate = new Date(startDate)
  
  switch (type) {
    case "MONTH_1":
      dueDate.setDate(dueDate.getDate() + 30)
      break
    case "MONTH_3":
      dueDate.setDate(dueDate.getDate() + 90)
      break
    case "MONTH_5":
      dueDate.setDate(dueDate.getDate() + 150)
      break
    case "RECURRING":
      // First recurring review: 150 (regularisation) + 180 = day 330
      dueDate.setDate(dueDate.getDate() + 330)
      break
  }
  
  return dueDate
}

/**
 * Check if review should be created (from 7 days before due date, including overdue)
 */
export function shouldCreateReview(startDate: Date, type: ReviewType): boolean {
  const now = new Date()
  const dueDate = getReviewDueDate(startDate, type)
  const createDate = new Date(dueDate)
  createDate.setDate(createDate.getDate() - 7) // 7 days before due
  
  // Check if today is on or after the create date (allows overdue reviews to be created)
  return now >= createDate
}

/**
 * Get review type label
 */
export function getReviewTypeLabel(type: ReviewType): string {
  const labels = {
    MONTH_1: "Month 1 Review",
    MONTH_3: "Month 3 Review",
    MONTH_5: "Month 5 - Regularization",
    RECURRING: "6-Month Check-In"
  }
  return labels[type] || type
}
