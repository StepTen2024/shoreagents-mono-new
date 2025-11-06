import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import GamifiedDashboard from "@/components/gamified-dashboard"

export default async function Home() {
  const session = await auth()

  // Must be logged in
  if (!session?.user?.email) {
    redirect("/login")
  }

  // Verify user exists in StaffUser table
  const staffUser = await prisma.staff_users.findUnique({
    where: { email: session.user.email }
  })

  if (!staffUser) {
    // Check if they're a management user
    const managementUser = await prisma.management_users.findUnique({
      where: { email: session.user.email }
    })

    if (managementUser) {
      // Redirect management users to admin portal
      redirect("/admin")
    }

    // Check if they're a client user
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email }
    })

    if (clientUser) {
      // Redirect client users to client portal
      redirect("/client")
    }

    // Not a valid user - redirect to staff login
    redirect("/login/staff")
  }

  return <GamifiedDashboard />
}
