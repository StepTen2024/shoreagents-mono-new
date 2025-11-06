import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { prisma } from "@/lib/prisma"
import { Toaster } from "@/components/ui/toaster"

async function fetchManagementUser(authUserId: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await prisma.management_users.findUnique({
        where: { authUserId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          coverPhoto: true,
          role: true,
          department: true,
        }
      })
    } catch (error) {
      console.error(`[AdminLayout] Attempt ${i + 1}/${retries} failed:`, error)
      if (i === retries - 1) throw error
      // Exponential backoff: 100ms, 200ms, 400ms
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)))
    }
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Must be logged in
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin")
  }

  // Must have ADMIN or MANAGER role
  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    // Redirect based on their actual role
    if (session.user.role === "CLIENT") {
      redirect("/client")
    } else {
      // STAFF, TEAM_LEAD go to staff portal
      redirect("/")
    }
  }

  // Fetch full management user profile with retry logic
  let managementUser
  try {
    managementUser = await fetchManagementUser(session.user.id)
  } catch (error) {
    console.error('[AdminLayout] Failed to fetch management user after retries:', error)
    // Redirect to login on persistent connection failure
    redirect("/login/admin?error=connection")
  }

  if (!managementUser) {
    redirect("/login/admin")
  }

  return (
    <div className="dark">
      <AdminSidebar user={managementUser}>{children}</AdminSidebar>
      <Toaster />
    </div>
  )
}

