"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, Mail, Lock, User, Phone, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { signIn } from "next-auth/react"

export default function StaffSignUpPage() {
  const [step, setStep] = useState<'email' | 'details'>('email')
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [matchedData, setMatchedData] = useState<any>(null)
  const router = useRouter()

  // Step 1: Verify email against recruitment database
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setVerifying(true)

    try {
      const response = await fetch(`/api/auth/verify-staff-email?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (data.success && data.matched) {
        // Email found! Auto-populate and move to step 2
        setMatchedData(data)
        if (data.candidateName) setName(data.candidateName)
        if (data.phone) setPhone(data.phone)
        setStep('details')
      } else {
        setError("Email not found. Please use the same email you applied with, or contact recruitment.")
      }
    } catch (err) {
      setError("Unable to verify email. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  // Step 2: Create account with password
  const handleAccountCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name || !password) {
      setError("Name and password are required")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/signup/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Account creation failed")
      }

      // Auto-login and redirect to onboarding
      const loginResult = await signIn('credentials', {
        email,
        password,
        userType: 'staff',
        redirect: false
      })

      if (loginResult?.ok) {
        router.push('/onboarding')
      } else {
        router.push('/login/staff?registered=true')
      }
    } catch (err: any) {
      setError(err.message || "Account creation failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-slate-900/90 backdrop-blur-xl p-8 ring-1 ring-white/10 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p className="text-slate-400">
              {step === 'email' ? 'Enter your recruitment email' : 'Set up your password'}
            </p>
          </div>

          {/* STEP 1: Email Verification */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {/* Important Notice */}
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
                <p className="text-sm text-blue-300 font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Important
                </p>
                <p className="text-xs text-blue-200">
                  Use the <strong>same email address</strong> you provided during the recruitment process. 
                  This lets us match your application and pull your details automatically.
                </p>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@you-used-when-applying.com"
                    className="bg-slate-800/50 border-slate-700 text-white pl-10 h-12 focus:ring-2 focus:ring-emerald-500"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/50 px-4 py-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={verifying || !email}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg transition-all"
              >
                {verifying ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying Email...
                  </span>
                ) : (
                  "Verify & Continue"
                )}
              </Button>
            </form>
          )}

          {/* STEP 2: Account Details */}
          {step === 'details' && matchedData && (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
                <p className="text-sm text-emerald-300 font-medium flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  Email Verified!
                </p>
                <p className="text-xs text-emerald-200">
                  Joining <strong>{matchedData.company}</strong> as <strong>{matchedData.position}</strong>
                </p>
              </div>

              <form onSubmit={handleAccountCreate} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white pl-10 h-12 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number <span className="text-slate-500">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+63 XXX XXX XXXX"
                      className="bg-slate-800/50 border-slate-700 text-white pl-10 h-12 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="bg-slate-800/50 border-slate-700 text-white pl-10 h-12 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="bg-slate-800/50 border-slate-700 text-white pl-10 h-12 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/50 px-4 py-3">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login/staff"
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
