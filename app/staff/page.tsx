import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function StaffHomePage() {
  const session = await auth()

  if (!session || session.user.role !== "STAFF") {
    redirect("/login/staff")
  }

  // Redirect to onboarding - staff can complete their setup
  redirect("/onboarding")
}

