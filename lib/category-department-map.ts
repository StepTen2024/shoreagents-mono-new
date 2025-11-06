/**
 * Maps Ticket Categories to Management Department Enums
 * Used for auto-assigning tickets to the appropriate department manager
 */

import { TicketCategory } from "@prisma/client"

// Type for Department enum (matches Prisma schema)
export type Department = 
  | "CEO_EXECUTIVE"
  | "IT_DEPARTMENT"
  | "HR_DEPARTMENT"
  | "NURSE_DEPARTMENT"
  | "RECRUITMENT_DEPARTMENT"
  | "ACCOUNT_MANAGEMENT"
  | "FINANCE_DEPARTMENT"
  | "NERDS_DEPARTMENT"
  | "OPERATIONS"

/**
 * Maps ticket category to management department
 * Returns the department enum value that should handle this category
 */
export function mapCategoryToDepartment(category: TicketCategory): Department | null {
  const mapping: Partial<Record<TicketCategory, Department>> = {
    // IT Support goes to IT Department
    IT: "IT_DEPARTMENT",
    
    // HR requests go to HR Department
    HR: "HR_DEPARTMENT",
    
    // Clinic/Medical goes to Nurse Department
    CLINIC: "NURSE_DEPARTMENT",
    
    // Equipment and Workstation go to Operations
    EQUIPMENT: "OPERATIONS",
    STATION: "OPERATIONS",
    
    // Meeting room bookings go to Operations
    MEETING_ROOM: "OPERATIONS",
    
    // General management requests go to CEO/Executive
    MANAGEMENT: "CEO_EXECUTIVE",
    
    // Software bugs/features go to Nerds (Software Team)
    // Note: This category might not exist yet, add if needed
    // SOFTWARE: "NERDS_DEPARTMENT",
    
    // Other/uncategorized go to Operations (default handler)
    OTHER: "OPERATIONS",
  }
  
  return mapping[category] || null
}

/**
 * Gets a human-readable label for the department
 */
export function getDepartmentLabel(department: Department): string {
  const labels: Record<Department, string> = {
    CEO_EXECUTIVE: "CEO / Executive",
    IT_DEPARTMENT: "IT Department",
    HR_DEPARTMENT: "HR Department",
    NURSE_DEPARTMENT: "Nurse Department",
    RECRUITMENT_DEPARTMENT: "Recruitment Department",
    ACCOUNT_MANAGEMENT: "Account Management",
    FINANCE_DEPARTMENT: "Finance Department",
    NERDS_DEPARTMENT: "Nerds (Software Team)",
    OPERATIONS: "Operations",
  }
  
  return labels[department] || department
}

/**
 * Gets an emoji for the department
 */
export function getDepartmentEmoji(department: Department): string {
  const emojis: Record<Department, string> = {
    CEO_EXECUTIVE: "👔",
    IT_DEPARTMENT: "💻",
    HR_DEPARTMENT: "👤",
    NURSE_DEPARTMENT: "🏥",
    RECRUITMENT_DEPARTMENT: "🎯",
    ACCOUNT_MANAGEMENT: "📊",
    FINANCE_DEPARTMENT: "💰",
    NERDS_DEPARTMENT: "🤓",
    OPERATIONS: "⚙️",
  }
  
  return emojis[department] || "📋"
}

