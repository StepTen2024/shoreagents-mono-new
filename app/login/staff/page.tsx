"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Rocket, Mail, Lock, Zap, Star, Sparkles, Coffee, Heart } from "lucide-react"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* CLEAN SIDE-BY-SIDE LAYOUT */}
      <div className="w-full max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-[1fr_500px] gap-8 items-center">
          
          {/* LEFT SIDE - Download Info & Branding */}
          <div className="space-y-6">
            {/* Desktop App Download Banner - Compact Version */}
            <DesktopAppDownload />
          </div>

          {/* RIGHT SIDE - Login Form */}
          <div className="group rounded-3xl bg-gradient-to-br from-slate-900/80 via-purple-900/20 to-slate-900/80 p-8 backdrop-blur-xl ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-[1.02]">
          {/* Header with Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-500 mb-6 ring-4 ring-purple-400/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-xl group-hover:shadow-purple-500/50">
              <Rocket className="h-12 w-12 text-white animate-bounce" />
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-3 animate-pulse">
              Staff Portal 🚀
            </h1>
            <p className="text-slate-300 text-lg font-semibold">Your Offshore Adventure Starts Here! ✨</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Star className="h-4 w-4 text-yellow-400 animate-spin" />
              <span className="text-sm text-slate-400">Join the team of champions!</span>
              <Coffee className="h-4 w-4 text-amber-400 animate-bounce" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input - FUN STYLE */}
            <div className="group/input">
              <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-400" />
                Email Address 📧
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-awesome-email@shoreagents.com"
                  className="bg-slate-900/50 border-2 border-purple-500/30 text-white text-lg rounded-xl pl-12 h-14 transition-all duration-300 hover:border-purple-400/50 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 focus:scale-[1.02]"
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400 group-hover/input:scale-110 transition-transform" />
              </div>
            </div>

            {/* Password Input - FUN STYLE */}
            <div className="group/input">
              <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-400" />
                Password 🔐
              </label>
              <div className="relative">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-slate-900/50 border-2 border-indigo-500/30 text-white text-lg rounded-xl pl-12 h-14 transition-all duration-300 hover:border-indigo-400/50 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 focus:scale-[1.02]"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400 group-hover/input:scale-110 transition-transform" />
              </div>
            </div>

            {/* Error Message - FUN STYLE */}
            {error && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-400/50 px-6 py-4 text-center ring-2 ring-red-400/20 animate-shake">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/0 via-pink-400/10 to-red-400/0 animate-shimmer" />
                <p className="relative font-bold text-red-300 flex items-center justify-center gap-2">
                  <Zap className="h-5 w-5 animate-pulse" />
                  {error}
                  <Zap className="h-5 w-5 animate-pulse" />
                </p>
              </div>
            )}

            {/* Submit Button - SUPER FUN! */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 text-xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 hover:from-purple-500 hover:via-pink-400 hover:to-indigo-500 rounded-2xl ring-4 ring-purple-400/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 hover:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  Launching... 🚀
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <Rocket className="h-6 w-6 group-hover/btn:translate-x-1 transition-transform" />
                  Launch Staff Portal!
                  <Sparkles className="h-6 w-6 group-hover/btn:-translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          {/* Bottom Links - FUN STYLE */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-center mb-6">
              <p className="text-slate-400 mb-3 flex items-center justify-center gap-2">
                <Star className="h-4 w-4 text-yellow-400" />
                New to the team?
                <Star className="h-4 w-4 text-yellow-400" />
              </p>
              <a
                href="/login/staff/signup"
                className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 font-bold ring-2 ring-emerald-400/30 transition-all duration-300 hover:scale-110 hover:ring-4 hover:ring-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/50"
              >
                🎉 Sign Up Here!
              </a>
            </div>

            {/* Other Portals */}
            <div className="rounded-2xl bg-slate-900/50 p-6 ring-1 ring-white/10">
              <p className="text-sm text-slate-400 text-center mb-4 font-semibold flex items-center justify-center gap-2">
                <Zap className="h-4 w-4 text-purple-400" />
                Need a different portal?
                <Zap className="h-4 w-4 text-purple-400" />
              </p>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/login/admin"
                  className="group/link flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-amber-400/30 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-amber-400 hover:shadow-lg hover:shadow-amber-500/30"
                >
                  <Sparkles className="h-4 w-4 text-amber-400 group-hover/link:rotate-180 transition-transform duration-300" />
                  <span className="text-sm font-bold text-amber-300">Admin 👑</span>
                </a>
                <a
                  href="/login/client"
                  className="group/link flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-1 ring-cyan-400/30 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30"
                >
                  <Heart className="h-4 w-4 text-cyan-400 group-hover/link:scale-125 transition-transform" />
                  <span className="text-sm font-bold text-cyan-300">Client 💼</span>
                </a>
              </div>
            </div>
          </div>

          {/* Demo Credentials - FUN STYLE */}
          <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 p-6 ring-2 ring-blue-400/30 transition-all duration-300 hover:scale-[1.02] hover:ring-blue-400/50 hover:shadow-xl hover:shadow-blue-500/30">
            <p className="text-sm text-blue-300 font-bold mb-3 flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 animate-pulse" />
              Demo Credentials (Try me!) 🎮
              <Zap className="h-4 w-4 animate-pulse" />
            </p>
            <div className="space-y-2 text-center">
              <div className="inline-block px-4 py-2 rounded-lg bg-blue-500/20 ring-1 ring-blue-400/50">
                <p className="text-sm text-blue-200 font-mono font-bold">📧 staff@shoreagents.com</p>
              </div>
              <div className="inline-block px-4 py-2 rounded-lg bg-indigo-500/20 ring-1 ring-indigo-400/50">
                <p className="text-sm text-indigo-200 font-mono font-bold">🔑 staff123</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

