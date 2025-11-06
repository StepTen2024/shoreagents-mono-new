import { TicketStatus, TicketPriority, TicketCategory } from "@/types/ticket"

export const getStatusColor = (status: TicketStatus): string => {
  switch (status) {
    case 'OPEN':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'IN_PROGRESS':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'RESOLVED':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'CLOSED':
      return 'text-gray-600 bg-gray-50 border-gray-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export const getPriorityColor = (priority: TicketPriority): string => {
  switch (priority) {
    case 'URGENT':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'HIGH':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'LOW':
      return 'text-green-600 bg-green-50 border-green-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export const getStatusIcon = (status: TicketStatus) => {
  switch (status) {
    case 'OPEN':
      return '🔵'
    case 'IN_PROGRESS':
      return '🟡'
    case 'RESOLVED':
      return '🟢'
    case 'CLOSED':
      return '⚫'
    default:
      return '⚪'
  }
}

export const getPriorityIcon = (priority: TicketPriority) => {
  switch (priority) {
    case 'URGENT':
      return '🔴'
    case 'HIGH':
      return '🟠'
    case 'MEDIUM':
      return '🟡'
    case 'LOW':
      return '🟢'
    default:
      return '⚪'
  }
}

export const getCategoryLabel = (category: TicketCategory): string => {
  switch (category) {
    // Staff & Management shared
    case 'IT':
      return 'IT Support'
    case 'HR':
      return 'Human Resources'
    case 'MANAGEMENT':
      return 'Management'
    case 'EQUIPMENT':
      return 'Equipment'
    case 'STATION':
      return 'Station'
    case 'CLINIC':
      return 'Clinic'
    case 'MEETING_ROOM':
      return 'Meeting Room'
    case 'OTHER':
      return 'Other'
    // Management-only
    case 'ONBOARDING':
      return 'Onboarding'
    case 'OFFBOARDING':
      return 'Offboarding'
    case 'MAINTENANCE':
      return 'Maintenance'
    case 'CLEANING':
      return 'Cleaning'
    case 'FINANCE':
      return 'Finance'
    case 'OPERATIONS':
      return 'Operations'
    case 'SURROUNDINGS':
      return 'Surroundings'
    case 'COMPENSATION':
      return 'Compensation'
    case 'TRANSPORT':
      return 'Transport'
    // Client-only
    case 'ACCOUNT_SUPPORT':
      return 'Account Support'
    case 'STAFF_PERFORMANCE':
      return 'Staff Performance'
    case 'PURCHASE_REQUEST':
      return 'Purchase Request'
    case 'BONUS_REQUEST':
      return 'Bonus Request'
    case 'REFERRAL':
      return 'Referral'
    case 'REPORTING_ISSUES':
      return 'Reporting Issues'
    case 'SYSTEM_ACCESS':
      return 'System Access'
    case 'GENERAL_INQUIRY':
      return 'General Inquiry'
    default:
      return category
  }
}
