import type { ReactNode } from "react"

export default function LoginLayout({ children }: { children: ReactNode }) {
  // No sidebar for login pages - just render the children
  return <>{children}</>
}

