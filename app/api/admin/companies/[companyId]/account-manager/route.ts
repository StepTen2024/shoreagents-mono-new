/**
 * Update Company Account Manager
 * PATCH /api/admin/companies/[companyId]/account-manager
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/manager (allow both ADMIN and MANAGER)
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser || (managementUser.role !== "ADMIN" && managementUser.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden. Admin or Manager role required." }, { status: 403 })
    }

    const { companyId } = await params
    const body = await request.json()
    const { accountManagerId } = body

    console.log('📋 [ADMIN] Updating Account Manager:', {
      companyId,
      newAccountManagerId: accountManagerId,
      requestedBy: managementUser.name
    })

    // Validate accountManagerId if provided (allow null to unassign)
    if (accountManagerId) {
      const manager = await prisma.management_users.findUnique({
        where: { id: accountManagerId }
      })

      if (!manager) {
        return NextResponse.json({ error: "Invalid account manager ID" }, { status: 400 })
      }

      console.log('✅ [ADMIN] Valid manager found:', manager.name, manager.role)
    }

    // Update company
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        accountManagerId: accountManagerId || null,
        updatedAt: new Date()
      },
      include: {
        management_users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true
          }
        },
        client_users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log('✅ [ADMIN] Account Manager updated successfully:', {
      companyId: updatedCompany.id,
      companyName: updatedCompany.companyName,
      accountManager: updatedCompany.management_users?.name || 'Unassigned',
      affectedClients: updatedCompany.client_users.length,
      affectedStaff: updatedCompany.staff_users.length
    })

    return NextResponse.json({
      success: true,
      company: {
        id: updatedCompany.id,
        companyName: updatedCompany.companyName,
        accountManager: updatedCompany.management_users
      },
      message: accountManagerId 
        ? `Account Manager assigned: ${updatedCompany.management_users?.name}`
        : 'Account Manager unassigned'
    })

  } catch (error) {
    console.error('❌ [ADMIN] Error updating account manager:', error)
    return NextResponse.json(
      { error: "Failed to update account manager" },
      { status: 500 }
    )
  }
}

