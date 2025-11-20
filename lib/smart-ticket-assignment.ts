/**
 * Smart Ticket Assignment System
 * Automatically assigns tickets to the right person based on:
 * - Ticket category
 * - Keywords in title/description
 * - Department availability
 * - Workload balancing
 */

import { prisma } from "@/lib/prisma"
import { TicketCategory } from "@prisma/client"
import { mapCategoryToDepartment, type Department } from "./category-department-map"

// Keywords that indicate software/development issues → NERDS_DEPARTMENT
const SOFTWARE_KEYWORDS = [
  "bug", "error", "crash", "code", "software", "app", "application",
  "feature", "update", "deploy", "database", "api", "frontend", "backend",
  "website", "portal", "login issue", "not loading", "broken", "fix",
  "development", "developer", "programming", "system error"
]

// Keywords that indicate hardware/physical IT → IT_DEPARTMENT  
const HARDWARE_KEYWORDS = [
  "computer", "laptop", "keyboard", "mouse", "monitor", "screen",
  "hardware", "device", "printer", "cable", "charger", "battery",
  "headset", "webcam", "microphone", "slow computer", "won't turn on"
]

/**
 * Intelligently determines which department should handle the ticket
 * by analyzing category and content
 */
export function getSmartDepartment(
  category: TicketCategory,
  title: string,
  description: string
): Department | null {
  // Get base department from category
  let department = mapCategoryToDepartment(category)
  
  // Special handling for IT category - detect if it's software or hardware
  if (category === "IT") {
    const content = `${title} ${description}`.toLowerCase()
    
    // Check for software keywords
    const hasSoftwareKeyword = SOFTWARE_KEYWORDS.some(keyword => 
      content.includes(keyword.toLowerCase())
    )
    
    // Check for hardware keywords
    const hasHardwareKeyword = HARDWARE_KEYWORDS.some(keyword => 
      content.includes(keyword.toLowerCase())
    )
    
    // Priority: Software → NERDS, Hardware → IT, Default → IT
    if (hasSoftwareKeyword && !hasHardwareKeyword) {
      console.log('🤓 [SMART ASSIGN] Detected software issue → Routing to NERDS_DEPARTMENT')
      department = "NERDS_DEPARTMENT"
    } else if (hasHardwareKeyword) {
      console.log('💻 [SMART ASSIGN] Detected hardware issue → Routing to IT_DEPARTMENT')
      department = "IT_DEPARTMENT"
    } else {
      console.log('💻 [SMART ASSIGN] General IT issue → Routing to IT_DEPARTMENT')
      department = "IT_DEPARTMENT"
    }
  }
  
  return department
}

/**
 * Finds the best person in a department to assign the ticket to
 * Uses workload balancing - assigns to person with fewest open tickets
 */
export async function assignTicketToPerson(
  department: Department
): Promise<string | null> {
  try {
    // Get all management users in this department
    const managers = await prisma.management_users.findMany({
      where: { department },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })
    
    if (managers.length === 0) {
      console.log(`⚠️  [SMART ASSIGN] No managers found in department: ${department}`)
      return null
    }
    
    console.log(`📋 [SMART ASSIGN] Found ${managers.length} manager(s) in ${department}:`, managers.map(m => m.name))
    
    // If only one manager, assign to them
    if (managers.length === 1) {
      console.log(`✅ [SMART ASSIGN] Only one manager, assigning to: ${managers[0].name}`)
      return managers[0].id
    }
    
    // Multiple managers - find who has the least open tickets (workload balancing)
    const managerWorkloads = await Promise.all(
      managers.map(async (manager) => {
        const openTicketsCount = await prisma.tickets.count({
          where: {
            managementUserId: manager.id,
            status: {
              in: ["OPEN", "IN_PROGRESS"]
            }
          }
        })
        
        return {
          managerId: manager.id,
          managerName: manager.name,
          openTickets: openTicketsCount
        }
      })
    )
    
    // Sort by workload (ascending) and pick the one with least tickets
    managerWorkloads.sort((a, b) => a.openTickets - b.openTickets)
    
    const assignedManager = managerWorkloads[0]
    console.log(`✅ [SMART ASSIGN] Workload balancing - Assigning to: ${assignedManager.managerName} (${assignedManager.openTickets} open tickets)`)
    console.log(`📊 [SMART ASSIGN] Workload distribution:`, managerWorkloads.map(m => `${m.managerName}: ${m.openTickets}`).join(', '))
    
    return assignedManager.managerId
  } catch (error) {
    console.error(`❌ [SMART ASSIGN] Error finding manager in ${department}:`, error)
    return null
  }
}

/**
 * Complete smart assignment flow:
 * 1. Determine smart department based on category + content
 * 2. Find best person in that department
 * 3. Return the assignment
 */
export async function smartAssignTicket(
  category: TicketCategory,
  title: string,
  description: string
): Promise<{
  department: Department | null
  managementUserId: string | null
  assignedToName?: string
}> {
  console.log('🎯 [SMART ASSIGN] Starting smart assignment...')
  console.log(`   Category: ${category}`)
  console.log(`   Title: ${title}`)
  
  // Step 1: Determine department
  const department = getSmartDepartment(category, title, description)
  
  if (!department) {
    console.log('❌ [SMART ASSIGN] Could not determine department')
    return { department: null, managementUserId: null }
  }
  
  console.log(`🏢 [SMART ASSIGN] Department determined: ${department}`)
  
  // Step 2: Find best person in department
  const managementUserId = await assignTicketToPerson(department)
  
  if (!managementUserId) {
    console.log(`⚠️  [SMART ASSIGN] No available manager in ${department}`)
    return { department, managementUserId: null }
  }
  
  // Get manager name for logging
  const manager = await prisma.management_users.findUnique({
    where: { id: managementUserId },
    select: { name: true }
  })
  
  console.log(`✅ [SMART ASSIGN] Ticket assigned to: ${manager?.name} (${department})`)
  
  return {
    department,
    managementUserId,
    assignedToName: manager?.name
  }
}

