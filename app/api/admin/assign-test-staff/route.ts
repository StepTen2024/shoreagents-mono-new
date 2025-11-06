import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { staffEmail, clientEmail } = await req.json()

    console.log(`🔍 Finding client: ${clientEmail}`)
    
    // Find the client user
    const client = await prisma.client_users.findFirst({
      where: { email: clientEmail },
      include: {
        company: {
          include: {
            management_users: true
          }
        }
      }
    })

    if (!client || !client.companyId) {
      return NextResponse.json({ 
        error: "Client not found or has no company" 
      }, { status: 404 })
    }

    console.log(`✅ Found client: ${client.name}, Company: ${client.company?.companyName}`)

    const companyId = client.companyId
    const jinevaId = 'e79455a3-d2a8-4f82-8e49-716e10bc362d'

    // Assign Jineva as account manager if not already assigned
    if (!client.company.accountManagerId) {
      console.log('📝 Assigning Jineva as account manager...')
      await prisma.company.update({
        where: { id: companyId },
        data: {
          accountManagerId: jinevaId,
          updatedAt: new Date()
        }
      })
      console.log('✅ Jineva assigned!')
    }

    // Find the staff user
    console.log(`🔍 Finding staff: ${staffEmail}`)
    const staff = await prisma.staff_users.findFirst({
      where: { email: staffEmail }
    })

    if (!staff) {
      return NextResponse.json({ 
        error: "Staff not found" 
      }, { status: 404 })
    }

    console.log(`✅ Found staff: ${staff.name}`)

    // Assign staff to company
    console.log(`📝 Assigning ${staff.name} to ${client.company?.companyName}...`)
    await prisma.staff_users.update({
      where: { id: staff.id },
      data: {
        companyId: companyId,
        updatedAt: new Date()
      }
    })

    // Verify
    const updatedStaff = await prisma.staff_users.findUnique({
      where: { id: staff.id },
      include: {
        company: {
          include: {
            management_users: true
          }
        }
      }
    })

    console.log('🎉 SUCCESS!')
    console.log(`   Staff: ${updatedStaff.name}`)
    console.log(`   Company: ${updatedStaff.company?.companyName}`)
    console.log(`   Account Manager: ${updatedStaff.company?.management_users?.name}`)

    return NextResponse.json({
      success: true,
      staff: {
        name: updatedStaff.name,
        email: updatedStaff.email,
        company: updatedStaff.company?.companyName,
        accountManager: updatedStaff.company?.management_users?.name
      }
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to assign staff" 
    }, { status: 500 })
  }
}

