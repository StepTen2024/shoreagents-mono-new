export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "CANCELLED"
export type TicketCategory =
  // Staff & Management shared
  | "IT"
  | "HR"
  | "MANAGEMENT"
  | "EQUIPMENT"
  | "STATION"
  | "CLINIC"
  | "MEETING_ROOM"
  | "OTHER"
  // Management-only
  | "ONBOARDING"
  | "OFFBOARDING"
  | "MAINTENANCE"
  | "CLEANING"
  | "FINANCE"
  | "OPERATIONS"
  | "SURROUNDINGS"
  | "COMPENSATION"
  | "TRANSPORT"
  // Client-only
  | "ACCOUNT_SUPPORT"
  | "STAFF_PERFORMANCE"
  | "PURCHASE_REQUEST"
  | "BONUS_REQUEST"
  | "REFERRAL"
  | "REPORTING_ISSUES"
  | "SYSTEM_ACCESS"
  | "GENERAL_INQUIRY"
  
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"

export interface TicketResponse {
  id: string
  message: string
  createdByType: string
  createdAt: string
  attachments: string[]
  staffUser?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
  }
  managementUser?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
  }
  clientUser?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export interface Ticket {
  id: string
  ticketId: string
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  assignedTo: string | null
  attachments: string[]
  createdAt: string
  updatedAt: string
  resolvedDate: string | null
  createdByType: string
  managementUserId: string | null
  clientUserId: string | null
  responses: TicketResponse[]
  // ✨ NEW FIELDS
  dueDate?: string | null // Admin-set deadline
  cancelledReason?: string | null // Why ticket was cancelled
  cancelledBy?: string | null // Who cancelled it (staff/admin ID)
  cancelledAt?: string | null // When it was cancelled
  lastEditedAt?: string | null // Last edit timestamp
  lastEditedBy?: string | null // Who last edited (audit trail)
  staffUser?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
  }
  clientUser?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  accountManager?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
  } | null
  management_users?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
    department: string
  } | null
  client_users?: {
    id: string
    name: string
    email: string
    avatar?: string
  } | null
  staff_users?: {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
  } | null
}

