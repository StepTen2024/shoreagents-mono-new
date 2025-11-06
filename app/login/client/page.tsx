"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function ClientLoginPage() {
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

      // Success - redirect to client portal
      router.push("/client")
      router.refresh()
    } catch (err) {
      setError("Login failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-blue-900">
      <Card className="w-full max-w-md p-8 bg-slate-800/50 backdrop-blur border-slate-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 mb-4">
            <span className="text-2xl font-bold text-white">CP</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Client Portal</h1>
          <p className="text-slate-400">Client Organization Dashboard</p>
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
              placeholder="client@techcorp.com"
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
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            {loading ? "Signing in..." : "Sign In to Client Portal"}
          </Button>
        </form>

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
              href="/login/staff"
              className="block text-center text-sm text-slate-400 hover:text-white transition-colors"
            >
              → Staff Portal Login
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700 text-center">
          <p className="text-sm text-slate-400 mb-4">
            Don't have an account?
          </p>
          <a
            href="/login/client/signup"
            className="inline-block text-sm text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            Create Client Account →
          </a>
        </div>
      </Card>
    </div>
  )
}

