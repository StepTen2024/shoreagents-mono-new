"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

export interface CurrentUser {
  id: string
  name: string
  email: string
  avatar: string | null
  type: "CLIENT" | "STAFF" | "MANAGEMENT"
}

export function useCurrentUser() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user?.email) {
      setLoading(false)
      return
    }

    fetchUser()
  }, [session, status])

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/current-user")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error)
    } finally {
      setLoading(false)
    }
  }

  return { user, loading }
}

