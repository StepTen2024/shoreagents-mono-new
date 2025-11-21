import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/admin/applications/bulk-delete
 * Bulk delete application data from performance metrics
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
    const { applicationsToDelete, staffUserId } = body

    if (!Array.isArray(applicationsToDelete) || applicationsToDelete.length === 0) {
      return NextResponse.json(
        { error: "Applications array is required and must not be empty" },
        { status: 400 }
      )
    }

    if (!staffUserId) {
      return NextResponse.json(
        { error: "Staff user ID is required" },
        { status: 400 }
      )
    }

    console.log(`🗑️ [Admin App Delete] Deleting ${applicationsToDelete.length} applications for staff: ${staffUserId}`)

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
      if (!metric.applicationsused) continue

      let applications = metric.applicationsused as any[]
      if (!Array.isArray(applications)) continue

      // Filter out the applications to delete
      const appsBeforeDelete = applications.length
      const updatedApps = applications.filter((appData: any) => {
        // Handle both string and object formats
        const appName = typeof appData === 'string' ? appData : appData?.name || ''
        // Check if this app should be kept (not in the delete list)
        return !applicationsToDelete.some((deleteApp: any) => {
          const deleteAppName = typeof deleteApp === 'string' ? deleteApp : deleteApp?.name || ''
          return appName === deleteAppName
        })
      })

      const appsDeleted = appsBeforeDelete - updatedApps.length

      if (appsDeleted > 0) {
        totalDeleted += appsDeleted

        // Update the metric with filtered apps
        updatePromises.push(
          prisma.performance_metrics.update({
            where: { id: metric.id },
            data: {
              applicationsused: updatedApps,
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

    console.log(`✅ [Admin App Delete] Successfully deleted ${totalDeleted} application records`)

    return NextResponse.json({
      success: true,
      deleted: totalDeleted,
      message: `Successfully deleted ${totalDeleted} application record(s)`,
    })
  } catch (error: any) {
    console.error("❌ [Admin App Delete] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete applications",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

