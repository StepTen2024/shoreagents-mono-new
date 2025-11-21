/**
 * Night Shift Special Handling
 * When staff creates tickets during night shift (10 PM - 6 AM Manila time),
 * route to special night shift managers (Thirdy/Namaoi) instead of regular departments
 */

import { prisma } from "@/lib/prisma"
import type { Department } from "./category-department-map"

// Night shift hours (Manila time - 24-hour format)
const NIGHT_SHIFT_START = 22 // 10 PM
const NIGHT_SHIFT_END = 6     // 6 AM

/**
 * Check if current time is during night shift (Manila timezone)
 */
export function isNightShift(): boolean {
  // Get current time in Manila (Asia/Manila timezone)
  const now = new Date()
  const manilaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
  const hour = manilaTime.getHours()
  
  // Night shift is 10 PM (22:00) to 6 AM (06:00)
  const isNight = hour >= NIGHT_SHIFT_START || hour < NIGHT_SHIFT_END
  
  if (isNight) {
    console.log(`🌙 [NIGHT SHIFT] Current time in Manila: ${manilaTime.toLocaleTimeString()} - NIGHT SHIFT ACTIVE`)
  }
  
  return isNight
}

/**
 * Get available night shift managers (Thirdy/Namaoi)
 * Returns null if no night shift managers are available
 */
export async function getNightShiftManager(): Promise<{
  managerId: string
  managerName: string
  department: Department
} | null> {
  try {
    // Look for night shift managers by name
    // When you add Thirdy/Namaoi, they'll be auto-detected
    const nightShiftManagers = await prisma.management_users.findMany({
      where: {
        OR: [
          { name: { contains: 'Thirdy', mode: 'insensitive' } },
          { name: { contains: 'Namaoi', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        department: true
      }
    })
    
    if (nightShiftManagers.length === 0) {
      console.log('⚠️  [NIGHT SHIFT] No night shift managers found (Thirdy/Namaoi not added yet)')
      return null
    }
    
    console.log(`🌙 [NIGHT SHIFT] Found ${nightShiftManagers.length} night shift manager(s):`, nightShiftManagers.map(m => m.name))
    
    // If multiple night shift managers, do simple workload balancing
    if (nightShiftManagers.length > 1) {
      const workloads = await Promise.all(
        nightShiftManagers.map(async (manager) => {
          const openTickets = await prisma.tickets.count({
            where: {
              managementUserId: manager.id,
              status: { in: ["OPEN", "IN_PROGRESS"] }
            }
          })
          
          return {
            managerId: manager.id,
            managerName: manager.name,
            department: manager.department as Department,
            openTickets
          }
        })
      )
      
      // Sort by least workload
      workloads.sort((a, b) => a.openTickets - b.openTickets)
      const selected = workloads[0]
      
      console.log(`🌙 [NIGHT SHIFT] Load balancing - Assigning to: ${selected.managerName} (${selected.openTickets} open tickets)`)
      
      return {
        managerId: selected.managerId,
        managerName: selected.managerName,
        department: selected.department
      }
    }
    
    // Only one night shift manager
    const manager = nightShiftManagers[0]
    console.log(`🌙 [NIGHT SHIFT] Single night shift manager - Assigning to: ${manager.name}`)
    
    return {
      managerId: manager.id,
      managerName: manager.name,
      department: manager.department as Department
    }
  } catch (error) {
    console.error('❌ [NIGHT SHIFT] Error finding night shift manager:', error)
    return null
  }
}

/**
 * Check if night shift routing is enabled and available
 */
export async function isNightShiftRoutingAvailable(): Promise<boolean> {
  if (!isNightShift()) {
    return false
  }
  
  const manager = await getNightShiftManager()
  return manager !== null
}

