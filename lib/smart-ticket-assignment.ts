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
import { isNightShift, getNightShiftManager } from "./night-shift-handler"

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
 * If no manager in primary department, falls back to OPERATIONS
 */
export async function assignTicketToPerson(
  department: Department,
  allowFallback: boolean = true
): Promise<{ managerId: string | null; usedFallback: boolean; fallbackDepartment?: Department }> {
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
    
    // If no managers found, try fallback to OPERATIONS
    if (managers.length === 0) {
      console.log(`⚠️  [SMART ASSIGN] No managers found in department: ${department}`)
      
      if (allowFallback && department !== "OPERATIONS") {
        console.log(`🔄 [SMART ASSIGN] Falling back to OPERATIONS department...`)
        const fallbackResult = await assignTicketToPerson("OPERATIONS", false) // Prevent infinite loop
        return {
          managerId: fallbackResult.managerId,
          usedFallback: true,
          fallbackDepartment: "OPERATIONS"
        }
      }
      
      return { managerId: null, usedFallback: false }
    }
    
    console.log(`📋 [SMART ASSIGN] Found ${managers.length} manager(s) in ${department}:`, managers.map(m => m.name))
    
    // If only one manager, assign to them
    if (managers.length === 1) {
      console.log(`✅ [SMART ASSIGN] Only one manager, assigning to: ${managers[0].name}`)
      return { managerId: managers[0].id, usedFallback: false }
    }
    
    // Multiple managers - TRUE LOAD BALANCING with 3 criteria:
    // 1. Open tickets (primary)
    // 2. Total assigned (secondary - historical balance)
    // 3. Random when tied (fairness)
    const managerWorkloads = await Promise.all(
      managers.map(async (manager) => {
        // Count OPEN + IN_PROGRESS tickets (current workload)
        const openTicketsCount = await prisma.tickets.count({
          where: {
            managementUserId: manager.id,
            status: {
              in: ["OPEN", "IN_PROGRESS"]
            }
          }
        })
        
        // Count TOTAL tickets ever assigned (historical balance)
        const totalTicketsCount = await prisma.tickets.count({
          where: {
            managementUserId: manager.id
          }
        })
        
        return {
          managerId: manager.id,
          managerName: manager.name,
          openTickets: openTicketsCount,
          totalTickets: totalTicketsCount,
          randomTiebreaker: Math.random() // For fair distribution when tied
        }
      })
    )
    
    // Sort by:
    // 1st: Least open tickets (current workload)
    // 2nd: Least total tickets (historical balance)
    // 3rd: Random (fair distribution when tied)
    managerWorkloads.sort((a, b) => {
      // Primary: Compare open tickets
      if (a.openTickets !== b.openTickets) {
        return a.openTickets - b.openTickets
      }
      // Secondary: Compare total tickets (historical balance)
      if (a.totalTickets !== b.totalTickets) {
        return a.totalTickets - b.totalTickets
      }
      // Tertiary: Random when completely tied
      return a.randomTiebreaker - b.randomTiebreaker
    })
    
    const assignedManager = managerWorkloads[0]
    console.log(`✅ [SMART ASSIGN] Workload balancing - Assigning to: ${assignedManager.managerName}`)
    console.log(`   📊 Open: ${assignedManager.openTickets} | Total: ${assignedManager.totalTickets}`)
    console.log(`📊 [SMART ASSIGN] Full workload distribution:`)
    managerWorkloads.forEach(m => {
      console.log(`   - ${m.managerName}: ${m.openTickets} open, ${m.totalTickets} total`)
    })
    
    return { managerId: assignedManager.managerId, usedFallback: false }
  } catch (error) {
    console.error(`❌ [SMART ASSIGN] Error finding manager in ${department}:`, error)
    return { managerId: null, usedFallback: false }
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
  
  // PRIORITY CHECK: Night Shift Override
  // If it's night shift (10 PM - 6 AM Manila) and night shift managers available,
  // route ALL tickets to them regardless of category
  if (isNightShift()) {
    const nightShiftManager = await getNightShiftManager()
    
    if (nightShiftManager) {
      console.log(`🌙 [NIGHT SHIFT] Overriding normal routing - All tickets go to night shift manager`)
      console.log(`✅ [NIGHT SHIFT] Assigned to: ${nightShiftManager.managerName}`)
      
      return {
        department: nightShiftManager.department,
        managementUserId: nightShiftManager.managerId,
        assignedToName: nightShiftManager.managerName
      }
    } else {
      console.log(`🌙 [NIGHT SHIFT] Night shift active but no managers available - Using normal routing`)
    }
  }
  
  // Step 1: Determine department (normal day routing)
  const department = getSmartDepartment(category, title, description)
  
  if (!department) {
    console.log('❌ [SMART ASSIGN] Could not determine department')
    return { department: null, managementUserId: null }
  }
  
  console.log(`🏢 [SMART ASSIGN] Department determined: ${department}`)
  
  // Step 2: Find best person in department (with fallback)
  const assignmentResult = await assignTicketToPerson(department)
  
  if (!assignmentResult.managerId) {
    console.log(`⚠️  [SMART ASSIGN] No available manager in ${department} and fallback failed`)
    return { department, managementUserId: null }
  }
  
  // Get manager name for logging
  const manager = await prisma.management_users.findUnique({
    where: { id: assignmentResult.managerId },
    select: { name: true, department: true }
  })
  
  if (assignmentResult.usedFallback) {
    console.log(`🔄 [SMART ASSIGN] No manager in ${department}, used FALLBACK`)
    console.log(`✅ [SMART ASSIGN] Ticket assigned to: ${manager?.name} (${manager?.department}) [FALLBACK]`)
  } else {
    console.log(`✅ [SMART ASSIGN] Ticket assigned to: ${manager?.name} (${department})`)
  }
  
  return {
    department: assignmentResult.usedFallback ? assignmentResult.fallbackDepartment : department,
    managementUserId: assignmentResult.managerId,
    assignedToName: manager?.name
  }
}

