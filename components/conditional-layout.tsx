"use client"

import { usePathname } from "next/navigation"
import { Suspense } from "react"
import Sidebar from "@/components/sidebar"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Don't show staff sidebar on login pages, admin pages, or client pages
  const isLoginPage = pathname?.startsWith("/login")
  const isAdminPage = pathname?.startsWith("/admin")
  const isClientPage = pathname?.startsWith("/client")
  
  if (isLoginPage || isAdminPage || isClientPage) {
    return <>{children}</>
  }
  
  // Only show staff sidebar for staff portal pages
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Sidebar />
      </Suspense>
      <main className="lg:pl-64">{children}</main>
    </>
  )
}


import { usePathname } from "next/navigation"
import { Suspense } from "react"
import Sidebar from "@/components/sidebar"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Don't show staff sidebar on login pages, admin pages, or client pages
  const isLoginPage = pathname?.startsWith("/login")
  const isAdminPage = pathname?.startsWith("/admin")
  const isClientPage = pathname?.startsWith("/client")
  
  if (isLoginPage || isAdminPage || isClientPage) {
    return <>{children}</>
  }
  
  // Only show staff sidebar for staff portal pages
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Sidebar />
      </Suspense>
      <main className="lg:pl-64">{children}</main>
    </>
  )
}
