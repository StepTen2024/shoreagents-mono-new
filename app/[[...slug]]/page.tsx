import { notFound } from 'next/navigation'
import Link from 'next/link'

// Catch-all route to handle 404s dynamically
// This prevents Next.js from trying to statically generate a 404 page
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function CatchAll() {
  // This will only be called for routes that don't match any other route
  // Return a 404 page
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-slate-400 mb-8">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}

