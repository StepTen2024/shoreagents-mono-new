import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!managementUser || managementUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const screenshotUrl = searchParams.get("url")
    const staffUserId = searchParams.get("staffUserId")

    if (!screenshotUrl || !staffUserId) {
      return NextResponse.json(
        { error: "Screenshot URL and Staff User ID are required" },
        { status: 400 }
      )
    }

    console.log('[Delete Screenshot] Attempting to delete:', { screenshotUrl, staffUserId })

    // Find the performance metric that contains this screenshot URL
    const metrics = await prisma.performance_metrics.findMany({
      where: {
        staffUserId: staffUserId,
      },
    })

    let metricToUpdate = null
    for (const metric of metrics) {
      const screenshots = (metric as any).screenshoturls
      if (screenshots && Array.isArray(screenshots) && screenshots.includes(screenshotUrl)) {
        metricToUpdate = metric
        break
      }
    }

    if (!metricToUpdate) {
      return NextResponse.json(
        { error: "Screenshot not found in database" },
        { status: 404 }
      )
    }

    console.log('[Delete Screenshot] Found metric:', metricToUpdate.id)

    // Extract the file path from the URL
    // URL format: https://[supabase-url]/storage/v1/object/public/staff/staff_screenshot/...
    const urlParts = screenshotUrl.split('/staff/')
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: "Invalid screenshot URL format" },
        { status: 400 }
      )
    }
    const filePath = urlParts[1]

    console.log('[Delete Screenshot] Extracted file path:', filePath)

    // Delete from Supabase Storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from('staff')
      .remove([filePath])

    if (deleteError) {
      console.error('[Delete Screenshot] Storage deletion error:', deleteError)
      // Continue anyway - we still want to remove from database
    } else {
      console.log('[Delete Screenshot] Successfully deleted from storage')
    }

    // Remove the screenshot URL from the database using raw SQL
    // This removes the URL from the JSON array
    await prisma.$executeRaw`
      UPDATE performance_metrics 
      SET "screenshoturls" = (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements("screenshoturls") elem
        WHERE elem::text != ${JSON.stringify(screenshotUrl)}
      )
      WHERE id = ${metricToUpdate.id}
    `

    console.log('[Delete Screenshot] Successfully removed from database')

    // Also decrement clipboardActions count if it's greater than 0
    if (metricToUpdate.clipboardActions > 0) {
      await prisma.performance_metrics.update({
        where: { id: metricToUpdate.id },
        data: {
          clipboardActions: metricToUpdate.clipboardActions - 1
        }
      })
      console.log('[Delete Screenshot] Decremented clipboardActions count')
    }

    return NextResponse.json({
      success: true,
      message: "Screenshot deleted successfully"
    })

  } catch (error) {
    console.error("[Delete Screenshot] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

