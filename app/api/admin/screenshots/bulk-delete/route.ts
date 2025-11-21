import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { screenshotUrls, staffUserId } = body

    if (!screenshotUrls || !Array.isArray(screenshotUrls) || screenshotUrls.length === 0) {
      return NextResponse.json(
        { error: "screenshotUrls array is required and must not be empty" },
        { status: 400 }
      )
    }

    if (!staffUserId) {
      return NextResponse.json(
        { error: "staffUserId is required" },
        { status: 400 }
      )
    }

    console.log('[Bulk Delete Screenshots] Attempting to delete:', { count: screenshotUrls.length, staffUserId })

    // Find all performance metrics that contain these screenshot URLs
    const metrics = await prisma.performance_metrics.findMany({
      where: {
        staffUserId: staffUserId,
      },
    })

    const metricsToUpdate: Map<string, string[]> = new Map()
    const filePaths: string[] = []

    // Map each screenshot URL to its metric and extract file paths
    for (const url of screenshotUrls) {
      for (const metric of metrics) {
        const screenshots = (metric as any).screenshoturls
        if (screenshots && Array.isArray(screenshots) && screenshots.includes(url)) {
          const existingUrls = metricsToUpdate.get(metric.id) || []
          existingUrls.push(url)
          metricsToUpdate.set(metric.id, existingUrls)

          // Extract file path for storage deletion
          const urlParts = url.split('/staff/')
          if (urlParts.length >= 2) {
            filePaths.push(urlParts[1])
          }
          break
        }
      }
    }

    console.log('[Bulk Delete Screenshots] Found metrics to update:', metricsToUpdate.size)
    console.log('[Bulk Delete Screenshots] File paths to delete:', filePaths.length)

    // Delete from Supabase Storage in bulk
    if (filePaths.length > 0) {
      const { data: deleteData, error: deleteError } = await supabaseAdmin.storage
        .from('staff')
        .remove(filePaths)

      if (deleteError) {
        console.error('[Bulk Delete Screenshots] Storage deletion error:', deleteError)
        // Continue anyway - we still want to remove from database
      } else {
        console.log('[Bulk Delete Screenshots] Successfully deleted from storage:', deleteData?.length || filePaths.length)
      }
    }

    // Update database for each metric that has screenshots to remove
    let updatedCount = 0
    for (const [metricId, urlsToRemove] of metricsToUpdate.entries()) {
      try {
        // Remove the screenshot URLs from the database using raw SQL
        for (const url of urlsToRemove) {
          await prisma.$executeRaw`
            UPDATE performance_metrics 
            SET "screenshoturls" = (
              SELECT jsonb_agg(elem)
              FROM jsonb_array_elements("screenshoturls") elem
              WHERE elem::text != ${JSON.stringify(url)}
            )
            WHERE id = ${metricId}
          `
        }

        // Also decrement clipboardActions count
        const metric = metrics.find(m => m.id === metricId)
        if (metric && metric.clipboardActions > 0) {
          const decrementBy = Math.min(urlsToRemove.length, metric.clipboardActions)
          await prisma.performance_metrics.update({
            where: { id: metricId },
            data: {
              clipboardActions: Math.max(0, metric.clipboardActions - decrementBy)
            }
          })
        }

        updatedCount++
      } catch (error) {
        console.error(`[Bulk Delete Screenshots] Error updating metric ${metricId}:`, error)
      }
    }

    console.log('[Bulk Delete Screenshots] Successfully updated metrics:', updatedCount)

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${screenshotUrls.length} screenshot(s)`,
      deleted: screenshotUrls.length,
      metricsUpdated: updatedCount
    })

  } catch (error) {
    console.error("[Bulk Delete Screenshots] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

