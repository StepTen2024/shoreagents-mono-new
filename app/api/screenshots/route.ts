import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"
import { randomUUID } from "crypto"

// Function to emit performance updates (will be set by server.js)
declare global {
  var emitPerformanceUpdate: ((data: any) => void) | undefined
}

// POST /api/screenshots - Upload a screenshot
export async function POST(request: NextRequest) {
  try {
    // Parse FormData first to get staffUserId if provided
    const formData = await request.formData()
    const staffUserId = formData.get('staffUserId') as string | null

    let staffUser = null

    if (staffUserId) {
      // If staffUserId is provided directly (from Electron app), use it
      staffUser = await prisma.staff_users.findUnique({
        where: { id: staffUserId }
      })
    } else {
      // Fallback to session authentication
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      staffUser = await prisma.staff_users.findUnique({
        where: { authUserId: session.user.id }
      })
    }

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Get screenshot data from already parsed FormData
    const screenshot = formData.get('screenshot') as File | null
    const timestamp = formData.get('timestamp') as string

    if (!screenshot) {
      return NextResponse.json(
        { error: "Screenshot file is required" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!screenshot.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await screenshot.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename
    const fileExt = screenshot.name.split('.').pop()
    const fileName = `${staffUser.id}/${Date.now()}_${timestamp || Date.now()}.${fileExt}`
    const filePath = `staff_screenshot/${fileName}`

    console.log('[Screenshots API] Uploading screenshot:', filePath, buffer.length, 'bytes')

    // Upload to Supabase Storage (staff bucket)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('staff')
      .upload(filePath, buffer, {
        contentType: screenshot.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('[Screenshots API] Upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('[Screenshots API] Upload successful:', uploadData.path)

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('staff')
      .getPublicUrl(filePath)

    // ✅ Get active time entry to find shift date (same logic as analytics API)
    const activeTimeEntry = await prisma.time_entries.findFirst({
      where: {
        staffUserId: staffUser.id,
        clockOut: null
      },
      select: {
        shiftDate: true,
        shiftDayOfWeek: true
      }
    })

    // If no active time entry, staff is not clocked in - don't save screenshot
    if (!activeTimeEntry) {
      console.log('[Screenshots API] ⚠️ No active time entry - staff not clocked in, screenshot not saved to metrics')
      return NextResponse.json({ 
        success: false, 
        message: "Not clocked in - screenshot uploaded but not tracked in metrics",
        screenshot: {
          fileUrl: urlData.publicUrl,
          capturedAt: timestamp ? new Date(parseInt(timestamp)) : new Date(),
        }
      }, { status: 200 })
    }

    const shiftDate = activeTimeEntry.shiftDate

    console.log(`[Screenshots API] Looking for metric with shiftDate: ${shiftDate}`)

    // ✅ Find performance metric using shiftDate (matches shift, not calendar day)
    const startOfShiftDate = shiftDate ? new Date(shiftDate) : new Date()
    startOfShiftDate.setHours(0, 0, 0, 0)
    const endOfShiftDate = new Date(startOfShiftDate)
    endOfShiftDate.setDate(endOfShiftDate.getDate() + 1)

    const existingMetric = await prisma.performance_metrics.findFirst({
      where: {
        staffUserId: staffUser.id,
        shiftDate: {
          gte: startOfShiftDate,
          lt: endOfShiftDate,
        },
      },
    })

    console.log(`[Screenshots API] Existing metric found: ${existingMetric ? existingMetric.id : 'none'}`)

    if (existingMetric) {
      // Use raw SQL to atomically append to the JSON array
      // This prevents race conditions when multiple screenshots are uploaded simultaneously
      await prisma.$executeRaw`
        UPDATE performance_metrics 
        SET 
          "clipboardActions" = "clipboardActions" + 1,
          "screenshoturls" = COALESCE("screenshoturls", '[]'::jsonb) || to_jsonb(${urlData.publicUrl}::text)
        WHERE id = ${existingMetric.id}
      `
      
      // Get the updated metric for the response
      const updated = await prisma.performance_metrics.findUnique({
        where: { id: existingMetric.id }
      })
      console.log(`[Screenshots API] Incremented clipboardActions for metric ${existingMetric.id}: ${existingMetric.clipboardActions} → ${updated?.clipboardActions || 0}`)
      console.log(`[Screenshots API] Added screenshot URL: ${urlData.publicUrl}`)
      console.log(`[Screenshots API] Total screenshot URLs now: ${updated ? (updated as any)?.screenshoturls?.length || 0 : 0}`)
      
      // Emit real-time update for updated metric
      if (global.emitPerformanceUpdate) {
        try {
          global.emitPerformanceUpdate({
            staffUserId: staffUser.id,
            type: 'latest',
            metrics: updated,
            isActive: true,
            lastActivity: new Date().toISOString()
          })
        } catch (wsError) {
          console.error('[Screenshots API] Error emitting real-time update:', wsError)
        }
      }
    } else {
      // ❌ This should NEVER happen - performance row should be created at clock-in
      console.error(`[Screenshots API] ❌ No performance metric found for shift! This should never happen.`)
      console.error(`[Screenshots API] StaffUserId: ${staffUser.id}, ShiftDate: ${shiftDate}`)
      
      return NextResponse.json({ 
        success: false, 
        error: "No performance metric found for current shift. Please clock out and clock in again.",
        screenshot: {
          fileUrl: urlData.publicUrl,
          capturedAt: timestamp ? new Date(parseInt(timestamp)) : new Date(),
        }
      }, { status: 500 })
    }

    const capturedAt = timestamp ? new Date(parseInt(timestamp)) : new Date()

    return NextResponse.json({
      success: true,
      screenshot: {
        fileUrl: urlData.publicUrl,
        capturedAt: capturedAt,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("[Screenshots API] Error uploading screenshot:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/screenshots - Get screenshot count from performance metrics
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the StaffUser record using authUserId
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Get total screenshot count (sum of all clipboardActions)
    const metrics = await prisma.performance_metrics.findMany({
      where: {
        staffUserId: staffUser.id
      },
      select: {
        clipboardActions: true
      }
    })

    const totalScreenshots = metrics.reduce((sum, metric) => sum + metric.clipboardActions, 0)

    return NextResponse.json({ 
      totalScreenshots,
      message: "Screenshot count from clipboardActions" 
    })
  } catch (error) {
    console.error("[Screenshots API] Error fetching screenshot count:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

