// Minimal middleware to ensure Next.js generates middleware-manifest.json
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Optional: Configure which routes middleware runs on
// export const config = {
//   matcher: []  // Empty matcher = runs on no routes
// }

