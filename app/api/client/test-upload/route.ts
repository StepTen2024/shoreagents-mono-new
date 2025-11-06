import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client user
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!clientUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Test 1: Check if client bucket exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    const clientBucket = buckets?.find(b => b.name === 'client')
    
    // Test 2: Try to list files in the client bucket
    let listFilesResult = null
    let listFilesError = null
    
    try {
      const { data: files, error } = await supabaseAdmin.storage
        .from('client')
        .list(clientUser.authUserId, { limit: 10 })
      listFilesResult = files
      listFilesError = error
    } catch (e: any) {
      listFilesError = e.message
    }

    // Test 3: Check Supabase connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    return NextResponse.json({
      success: true,
      tests: {
        authentication: {
          status: "✅ Pass",
          sessionUserId: session.user.id,
          clientUserId: clientUser.id,
          authUserId: clientUser.authUserId
        },
        supabaseConfig: {
          status: hasServiceKey ? "✅ Pass" : "❌ Fail",
          url: supabaseUrl,
          hasServiceRoleKey: hasServiceKey
        },
        clientBucket: {
          status: clientBucket ? "✅ Pass" : "❌ Fail",
          exists: !!clientBucket,
          isPublic: clientBucket?.public,
          details: clientBucket
        },
        bucketsError: bucketsError?.message,
        filesList: {
          status: listFilesError ? "❌ Fail" : "✅ Pass",
          files: listFilesResult,
          error: listFilesError
        }
      }
    })

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: "Test failed",
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}

