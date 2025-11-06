"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewDocumentPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main knowledge base page
    // The upload dialog is already there
    router.push("/client/knowledge-base")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  )
}



