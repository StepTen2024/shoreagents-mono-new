import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/admin/urls/bulk-delete
 * Bulk delete URL data from performance metrics
 * Admin only
 */
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
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { urlsToDelete, staffUserId } = body

    if (!Array.isArray(urlsToDelete) || urlsToDelete.length === 0) {
      return NextResponse.json(
        { error: "URLs array is required and must not be empty" },
        { status: 400 }
      )
    }

    if (!staffUserId) {
      return NextResponse.json(
        { error: "Staff user ID is required" },
        { status: 400 }
      )
    }

    console.log(`🗑️ [Admin URL Delete] Deleting ${urlsToDelete.length} URLs for staff: ${staffUserId}`)

    // Get all performance metrics for this staff user
    const performanceMetrics = await prisma.performance_metrics.findMany({
      where: {
        staffUserId: staffUserId,
      },
    })

    let totalDeleted = 0
    const updatePromises: Promise<any>[] = []

    // Iterate through each performance metric record
    for (const metric of performanceMetrics) {
      if (!metric.visitedurls) continue

      let visitedUrls = metric.visitedurls as any[]
      if (!Array.isArray(visitedUrls)) continue

      // Filter out the URLs to delete
      const urlsBeforeDelete = visitedUrls.length
      const updatedUrls = visitedUrls.filter((urlData: any) => {
        const urlString = typeof urlData === 'string' ? urlData : urlData?.url || ''
        // Check if this URL should be kept (not in the delete list)
        return !urlsToDelete.some((deleteUrl: any) => {
          const deleteUrlString = typeof deleteUrl === 'string' ? deleteUrl : deleteUrl?.url || ''
          return urlString === deleteUrlString
        })
      })

      const urlsDeleted = urlsBeforeDelete - updatedUrls.length

      if (urlsDeleted > 0) {
        totalDeleted += urlsDeleted

        // Update the metric with filtered URLs
        updatePromises.push(
          prisma.performance_metrics.update({
            where: { id: metric.id },
            data: {
              visitedurls: updatedUrls,
              urlsVisited: updatedUrls.length, // Update the count
              updatedAt: new Date(),
            },
          })
        )
      }
    }

    // Execute all updates
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
    }

    console.log(`✅ [Admin URL Delete] Successfully deleted ${totalDeleted} URL records`)

    return NextResponse.json({
      success: true,
      deleted: totalDeleted,
      message: `Successfully deleted ${totalDeleted} URL record(s)`,
    })
  } catch (error: any) {
    console.error("❌ [Admin URL Delete] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete URLs",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

