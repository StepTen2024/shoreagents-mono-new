import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    // List all buckets
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets()

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        details: error 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })),
      total: buckets?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

