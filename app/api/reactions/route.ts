import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"

/**
 * UNIVERSAL REACTIONS API
 * 
 * Handles reactions for ANY entity in the system:
 * - TICKET, TASK, POST, DOCUMENT, CANDIDATE, INTERVIEW, 
 * - ONBOARDING, COMMENT, REVIEW, TIME_ENTRY, etc.
 * 
 * Uses polymorphic pattern: reactableType + reactableId
 * 
 * Reaction Types:
 * - LIKE 👍
 * - LOVE ❤️
 * - CELEBRATE 🎉
 * - FIRE 🔥
 * - CLAP 👏
 * - LAUGH 😂
 * - POO 💩
 * - ROCKET 🚀
 * - SHOCKED 😱
 * - MIND_BLOWN 🤯
 */

// ============================================================================
// GET - Fetch all reactions for an entity (grouped by type)
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reactableType = searchParams.get("reactableType")
    const reactableId = searchParams.get("reactableId")

    if (!reactableType || !reactableId) {
      return NextResponse.json(
        { error: "reactableType and reactableId are required" },
        { status: 400 }
      )
    }

    console.log(`📊 [REACTIONS] Fetching reactions for ${reactableType}:${reactableId}`)

    // Fetch all reactions using Prisma
    const reactions = await prisma.reactions.findMany({
      where: {
        reactableType,
        reactableId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get current user's reaction (if any)
    const [staffUser, clientUser, managementUser] = await Promise.all([
      prisma.staff_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true }
      }),
      prisma.client_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true }
      }),
      prisma.management_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true }
      })
    ])

    const currentUserId = staffUser?.id || clientUser?.id || managementUser?.id
    const currentUserReaction = reactions.find(r => r.authorId === currentUserId)

    // Group by reaction type for counts
    const reactionCounts = reactions.reduce((acc: any, reaction: any) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1
      return acc
    }, {})

    console.log(`✅ [REACTIONS] Found ${reactions.length} reactions`)

    return NextResponse.json({
      success: true,
      reactions,
      reactionCounts,
      currentUserReaction: currentUserReaction || null,
      totalReactions: reactions.length
    }, { status: 200 })

  } catch (error: any) {
    console.error("❌ [REACTIONS] Error fetching reactions:", error)
    return NextResponse.json(
      { error: "Failed to fetch reactions", details: error.message },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Add or update a reaction (toggle behavior)
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reactableType, reactableId, type } = body

    // Validation
    if (!reactableType || !reactableId) {
      return NextResponse.json(
        { error: "reactableType and reactableId are required" },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        { error: "Reaction type is required" },
        { status: 400 }
      )
    }

    // Valid reaction types
    const validTypes = [
      "LIKE", "LOVE", "CELEBRATE", "FIRE", "CLAP", 
      "LAUGH", "POO", "ROCKET", "SHOCKED", "MIND_BLOWN"
    ]
    
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid reaction type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Determine user type and get user info
    const [staffUser, clientUser, managementUser] = await Promise.all([
      prisma.staff_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true, avatar: true }
      }),
      prisma.client_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true, avatar: true }
      }),
      prisma.management_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true, name: true, avatar: true }
      })
    ])

    let authorType: string
    let authorId: string
    let authorName: string
    let authorAvatar: string | null

    if (staffUser) {
      authorType = "STAFF"
      authorId = staffUser.id
      authorName = staffUser.name
      authorAvatar = staffUser.avatar
    } else if (clientUser) {
      authorType = "CLIENT"
      authorId = clientUser.id
      authorName = clientUser.name
      authorAvatar = clientUser.avatar
    } else if (managementUser) {
      authorType = "MANAGEMENT"
      authorId = managementUser.id
      authorName = managementUser.name
      authorAvatar = managementUser.avatar
    } else {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log(`❤️ [REACTIONS] Processing ${type} reaction on ${reactableType}:${reactableId} by ${authorType}:${authorName}`)

    // Check if user already reacted
    const existingReaction = await prisma.reactions.findFirst({
      where: {
        reactableType,
        reactableId,
        authorId
      }
    })

    if (existingReaction) {
      // If same reaction type, remove it (toggle off)
      if (existingReaction.type === type) {
        console.log(`🔄 [REACTIONS] Removing reaction: ${existingReaction.id}`)
        
        await prisma.reactions.delete({
          where: { id: existingReaction.id }
        })

        return NextResponse.json({
          success: true,
          action: "removed",
          message: "Reaction removed"
        }, { status: 200 })
      } else {
        // Update to new reaction type
        console.log(`🔄 [REACTIONS] Updating reaction from ${existingReaction.type} to ${type}`)
        
        const updated = await prisma.reactions.update({
          where: { id: existingReaction.id },
          data: {
            type: type as any,
            createdAt: new Date()
          }
        })

        return NextResponse.json({
          success: true,
          action: "updated",
          reaction: updated
        }, { status: 200 })
      }
    } else {
      // Create new reaction
      console.log(`✨ [REACTIONS] Creating new ${type} reaction`)
      
      const created = await prisma.reactions.create({
        data: {
          id: randomUUID(),
          reactableType,
          reactableId,
          authorType,
          authorId,
          authorName,
          authorAvatar,
          type: type as any,
          createdAt: new Date()
        }
      })

      console.log(`✅ [REACTIONS] Reaction created: ${created.id}`)

      return NextResponse.json({
        success: true,
        action: "added",
        reaction: created
      }, { status: 201 })
    }

  } catch (error: any) {
    console.error("❌ [REACTIONS] Error processing reaction:", error)
    return NextResponse.json(
      { error: "Failed to process reaction", details: error.message },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Remove a reaction
// ============================================================================
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reactableType = searchParams.get("reactableType")
    const reactableId = searchParams.get("reactableId")

    if (!reactableType || !reactableId) {
      return NextResponse.json(
        { error: "reactableType and reactableId are required" },
        { status: 400 }
      )
    }

    // Get user ID
    const [staffUser, clientUser, managementUser] = await Promise.all([
      prisma.staff_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true }
      }),
      prisma.client_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true }
      }),
      prisma.management_users.findUnique({
        where: { authUserId: session.user.id },
        select: { id: true }
      })
    ])

    const authorId = staffUser?.id || clientUser?.id || managementUser?.id

    if (!authorId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log(`🗑️ [REACTIONS] Removing reaction from ${reactableType}:${reactableId}`)

    // Delete user's reaction
    await prisma.reactions.deleteMany({
      where: {
        reactableType,
        reactableId,
        authorId
      }
    })

    console.log(`✅ [REACTIONS] Reaction removed`)

    return NextResponse.json({
      success: true,
      message: "Reaction removed"
    }, { status: 200 })

  } catch (error: any) {
    console.error("❌ [REACTIONS] Error removing reaction:", error)
    return NextResponse.json(
      { error: "Failed to remove reaction", details: error.message },
      { status: 500 }
    )
  }
}

