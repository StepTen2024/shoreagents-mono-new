"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Rocket, Mail, Lock, Zap } from "lucide-react"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />
      </div>

      {/* SIDE-BY-SIDE LAYOUT */}
      <div className="w-full max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT - Download Info */}
          <div className="hidden lg:block">
            <DesktopAppDownload />
          </div>

          {/* RIGHT - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="rounded-2xl bg-slate-900/90 backdrop-blur-xl p-8 ring-1 ring-white/10 shadow-2xl">
              
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 mb-4">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Staff Portal
                </h1>
                <p className="text-slate-400">Welcome back! 👋</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-email@shoreagents.com"
                      className="bg-slate-800/50 border-slate-700 text-white pl-10 h-12 focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-800/50 border-slate-700 text-white pl-10 h-12 focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/50 px-4 py-3 text-center">
                    <p className="text-sm font-medium text-red-400">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
                <p className="text-sm text-slate-400 mb-3">
                  New to the team?
                </p>
                <a
                  href="/login/staff/signup"
                  className="inline-block px-5 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold hover:bg-emerald-500/30 transition-colors"
                >
                  Create Account
                </a>
              </div>

              {/* Other Portals */}
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 text-center mb-3">
                  Different portal?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="/login/admin"
                    className="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium text-center hover:bg-amber-500/20 transition-colors"
                  >
                    Admin
                  </a>
                  <a
                    href="/login/client"
                    className="px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium text-center hover:bg-cyan-500/20 transition-colors"
                  >
                    Client
                  </a>
                </div>
              </div>

              {/* Demo Credentials */}
              <div className="mt-6 rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
                <p className="text-xs text-blue-400 font-semibold mb-2 text-center">
                  Demo Account
                </p>
                <div className="space-y-1 text-center">
                  <p className="text-xs text-blue-300 font-mono">staff@shoreagents.com</p>
                  <p className="text-xs text-blue-300 font-mono">staff123</p>
                </div>
              </div>
            </div>

            {/* Mobile Download CTA */}
            <div className="lg:hidden mt-6">
              <DesktopAppDownload />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
