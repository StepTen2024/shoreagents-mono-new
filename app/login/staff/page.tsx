"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { DesktopAppDownload } from "@/components/staff/desktop-app-download"

export default function StaffLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials")
        setLoading(false)
        return
      }

      // Success - redirect to staff portal
      router.push("/")
      router.refresh()
    } catch (err) {
      setError("Login failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-4">
      <div className="w-full max-w-4xl">
        {/* Desktop App Download Banner */}
        <DesktopAppDownload />

        {/* Login Card */}
        <Card className="w-full max-w-md mx-auto p-8 bg-slate-800/50 backdrop-blur border-slate-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 mb-4">
            <span className="text-2xl font-bold text-white">SP</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Staff Portal</h1>
          <p className="text-slate-400">Offshore Staff Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@shoreagents.com"
              className="bg-slate-900/50 border-slate-600 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-slate-900/50 border-slate-600 text-white"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {loading ? "Signing in..." : "Sign In to Staff Portal"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700 text-center">
          <p className="text-sm text-slate-400">
            Don't have an account?{" "}
            <a
              href="/login/staff/signup"
              className="text-purple-400 hover:text-purple-300 font-semibold"
            >
              Sign Up
            </a>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700">
          <p className="text-sm text-slate-400 text-center mb-4">Other Portals:</p>
          <div className="space-y-2">
            <a
              href="/login/admin"
              className="block text-center text-sm text-slate-400 hover:text-white transition-colors"
            >
              → System Admin Login
            </a>
            <a
              href="/login/client"
              className="block text-center text-sm text-slate-400 hover:text-white transition-colors"
            >
              → Client Portal Login
            </a>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-400 font-semibold mb-1">Demo Credentials:</p>
          <p className="text-xs text-blue-300 font-mono">staff@shoreagents.com</p>
          <p className="text-xs text-blue-300 font-mono">staff123</p>
        </div>
      </Card>
      </div>
    </div>
  )
}

