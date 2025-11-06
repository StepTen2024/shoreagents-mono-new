import { TicketCategory } from "@/types/ticket"

export const getCategoriesForUserType = (userType: 'staff' | 'client' | 'management'): TicketCategory[] => {
  const categories = {
    staff: [
      'IT',
      'HR',
      'EQUIPMENT',
      'CLINIC',
      'MEETING_ROOM',
      'MANAGEMENT',
      'OTHER'
    ] as TicketCategory[],
    
    client: [
      'ACCOUNT_SUPPORT',
      'STAFF_PERFORMANCE',
      'PURCHASE_REQUEST',
      'BONUS_REQUEST',
      'REFERRAL',
      'REPORTING_ISSUES',
      'SYSTEM_ACCESS',
      'GENERAL_INQUIRY'
    ] as TicketCategory[],
    
    management: [
      'IT',
      'HR',
      'EQUIPMENT',
      'ONBOARDING',
      'OFFBOARDING',
      'MAINTENANCE',
      'CLEANING',
      'FINANCE',
      'CLINIC',
      'OPERATIONS',
      'MEETING_ROOM',
      'SURROUNDINGS',
      'COMPENSATION',
      'TRANSPORT',
      'MANAGEMENT',
      'OTHER'
    ] as TicketCategory[]
  }
  
  return categories[userType]
}

export const getCategoryLabel = (category: TicketCategory): string => {
  const labels: Record<TicketCategory, string> = {
    // Staff & Management
    IT: "IT Support",
    HR: "HR Request",
    MANAGEMENT: "Management",
    EQUIPMENT: "Equipment",
    STATION: "Workstation",
    CLINIC: "Clinic / Nurse",
    MEETING_ROOM: "Meeting Room",
    OTHER: "Other",
    
    // Management-only
    ONBOARDING: "Onboarding",
    OFFBOARDING: "Offboarding",
    MAINTENANCE: "Maintenance",
    CLEANING: "Cleaning",
    FINANCE: "Finance",
    OPERATIONS: "Operations",
    SURROUNDINGS: "Environment",
    COMPENSATION: "Compensation",
    TRANSPORT: "Transport",
    
    // Client-only
    ACCOUNT_SUPPORT: "Account Support",
    STAFF_PERFORMANCE: "Staff Performance",
    PURCHASE_REQUEST: "Purchase Request",
    BONUS_REQUEST: "Bonus / Gift Request",
    REFERRAL: "Referral",
    REPORTING_ISSUES: "Reporting Issues",
    SYSTEM_ACCESS: "System Access",
    GENERAL_INQUIRY: "General Inquiry"
  }
  
  return labels[category] || category
}

export const getCategoryIcon = (category: TicketCategory): string => {
  const icons: Partial<Record<TicketCategory, string>> = {
    IT: "💻",
    HR: "👤",
    MANAGEMENT: "📋",
    EQUIPMENT: "🖥️",
    STATION: "🪑",
    CLINIC: "🏥",
    MEETING_ROOM: "🚪",
    ONBOARDING: "👋",
    OFFBOARDING: "👋",
    MAINTENANCE: "🔧",
    CLEANING: "🧹",
    FINANCE: "💰",
    OPERATIONS: "⚙️",
    SURROUNDINGS: "🌳",
    COMPENSATION: "💵",
    TRANSPORT: "🚗",
    ACCOUNT_SUPPORT: "🎯",
    STAFF_PERFORMANCE: "⭐",
    PURCHASE_REQUEST: "🛒",
    BONUS_REQUEST: "🎁",
    REFERRAL: "🤝",
    REPORTING_ISSUES: "📊",
    SYSTEM_ACCESS: "🔐",
    GENERAL_INQUIRY: "💬",
    OTHER: "❓"
  }
  
  return icons[category] || "📝"
}

