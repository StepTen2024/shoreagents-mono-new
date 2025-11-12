import { NextRequest, NextResponse } from "next/server"
import { getStaffUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { BreakType, AwayReason } from "@prisma/client"
import { logBreakStarted } from "@/lib/activity-generator"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()
    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { breakId, type, awayReason } = body
    
    // Check if user already has an active break
    const activeBreak = await prisma.breaks.findFirst({
      where: {
        staffUserId: staffUser.id,
        actualStart: { not: null },
        actualEnd: null
      }
    })
    
    if (activeBreak) {
      return NextResponse.json({ 
        error: "You already have an active break. Please end it first." 
      }, { status: 400 })
    }
    
    // ✅ Find active time entry with shift info
    const activeTimeEntry = await prisma.time_entries.findFirst({
      where: {
        staffUserId: staffUser.id,
        clockOut: null
      },
      select: {
        id: true,
        shiftDate: true,         // ✅ Get shift date
        shiftDayOfWeek: true     // ✅ Get shift day of week
      }
    })
    
    if (!activeTimeEntry) {
      return NextResponse.json({ 
        error: "You must be clocked in to start a break" 
      }, { status: 400 })
    }
    
    const now = new Date()
    let breakRecord
    
    // SCENARIO 1: Manual break start (no breakId, just type)
    if (type && !breakId) {
      breakRecord = await prisma.breaks.create({
        data: {
          id: randomUUID(),
          staffUserId: staffUser.id,
          timeEntryId: activeTimeEntry.id,
          type: type as BreakType,
          actualStart: now,
          awayReason: type === "AWAY" ? (awayReason as AwayReason) : null,
          shiftDate: activeTimeEntry.shiftDate,          // ✅ Inherit from time entry
          shiftDayOfWeek: activeTimeEntry.shiftDayOfWeek, // ✅ Inherit from time entry
          createdAt: now,
          updatedAt: now
        }
      })
      
      console.log(`☕ Manual break started for shift:`, {
        type,
        shiftDate: activeTimeEntry.shiftDate,
        shiftDayOfWeek: activeTimeEntry.shiftDayOfWeek
      })
      
      // ✨ Auto-generate activity post (skip AWAY breaks - too noisy)
      if (type !== "AWAY") {
        await logBreakStarted(staffUser.id, staffUser.name, type)
      }
      
      return NextResponse.json({ 
        success: true, 
        break: breakRecord,
        message: `${type} break started! Don't forget to end it when you return.`
      })
    }
    
    // SCENARIO 2: Scheduled break start (has breakId)
    if (breakId) {
      const existingBreak = await prisma.breaks.findUnique({
        where: { id: breakId }
      })
      
      if (!existingBreak || existingBreak.staffUserId !== staffUser.id) {
        return NextResponse.json({ error: "Invalid break" }, { status: 403 })
      }
      
      if (existingBreak.actualStart) {
        return NextResponse.json({ error: "Break already started" }, { status: 400 })
      }
      
      breakRecord = await prisma.breaks.update({
        where: { id: breakId },
        data: { actualStart: now }
      })
      
      // ✨ Auto-generate activity post (skip AWAY breaks)
      if (existingBreak.type !== "AWAY") {
        await logBreakStarted(staffUser.id, staffUser.name, existingBreak.type)
      }
      
      return NextResponse.json({ 
        success: true, 
        break: breakRecord,
        message: "Break started! Enjoy!"
      })
    }
    
    return NextResponse.json({ 
      error: "Please provide either 'type' or 'breakId'" 
    }, { status: 400 })
    
  } catch (error) {
    console.error("Error starting break:", error)
    return NextResponse.json({ error: "Failed to start break" }, { status: 500 })
  }
}

