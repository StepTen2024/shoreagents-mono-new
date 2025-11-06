"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { CheckCircle, Sparkles } from "lucide-react"

export default function StaffSignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [matchedJobOffer, setMatchedJobOffer] = useState<any>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [createdAccount, setCreatedAccount] = useState<any>(null)
  const router = useRouter()

  // Verify email and auto-populate data
  const handleEmailBlur = async () => {
    if (!email || !email.includes('@')) return
    
    try {
      // Check if email matches a job acceptance
      const response = await fetch(`/api/auth/verify-staff-email?email=${encodeURIComponent(email)}`)
      const data = await response.json()
      
      if (data.success && data.matched) {
        console.log('✅ Email matched! Auto-populating data:', data)
        setEmailVerified(true)
        setMatchedJobOffer(data)
        
        // Auto-populate fields from BPOC/job acceptance
        if (data.candidateName && !name) {
          setName(data.candidateName)
        }
        if (data.phone && !phone) {
          setPhone(data.phone)
        }
      } else {
        setEmailVerified(false)
        setMatchedJobOffer(null)
      }
    } catch (error) {
      console.error('Error verifying email:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!name || !email || !password) {
      setError("Name, email, and password are required")
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
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Sign up failed")
      }

      console.log('✅ Account created:', data)
      setCreatedAccount(data)

      // Show welcome popup if matched to job offer
      if (data.fromJobAcceptance) {
        setShowWelcome(true)
        // Auto-login after 2 seconds, then redirect
        setTimeout(async () => {
          const loginResult = await signIn('credentials', {
            email,
            password,
            userType: 'staff',
            redirect: false
          })
          
          setShowWelcome(false) // Close the popup before redirect
          setLoading(false)
          
          if (loginResult?.ok) {
            router.push('/onboarding')
          } else {
            router.push('/login/staff?registered=true')
          }
        }, 2000)
      } else {
        // No match - redirect to login
        setLoading(false)
        router.push('/login/staff?registered=true')
      }
    } catch (err: any) {
      setError(err.message || "Sign up failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-4">
      <Card className="w-full max-w-2xl p-8 bg-slate-800/50 backdrop-blur border-slate-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 mb-4">
            <span className="text-2xl font-bold text-white">SP</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Staff Portal</h1>
          <p className="text-slate-400">Join as BPO Worker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <Label className="text-slate-300">Full Name *</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="mt-2 bg-slate-900/50 border-slate-600 text-white"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label className="text-slate-300">Email Address *</Label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="john@example.com"
                  className={`mt-2 bg-slate-900/50 text-white ${
                    emailVerified 
                      ? 'border-emerald-500 focus:border-emerald-500' 
                      : 'border-slate-600'
                  }`}
                  required
                />
                {emailVerified && matchedJobOffer && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-1">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                )}
              </div>
              {emailVerified && matchedJobOffer && (
                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Email verified! Joining {matchedJobOffer.company} as {matchedJobOffer.position}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label className="text-slate-300">Password *</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="mt-2 bg-slate-900/50 border-slate-600 text-white"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <Label className="text-slate-300">Confirm Password *</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="mt-2 bg-slate-900/50 border-slate-600 text-white"
                required
              />
            </div>

            {/* Phone */}
            <div className="md:col-span-2">
              <Label className="text-slate-300">Phone (Optional)</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="mt-2 bg-slate-900/50 border-slate-600 text-white"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-12 text-base"
          >
            {loading ? "Creating Account..." : "Create Staff Account"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700 text-center">
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

        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <p className="text-xs text-purple-400 font-semibold mb-1">
            🏢 For BPO Workers Only
          </p>
          <p className="text-xs text-purple-300">
            This portal is for offshore staff members. Your account will be linked to a company by management after registration.
          </p>
        </div>
      </Card>

      {/* Loading Overlay */}
      {loading && !showWelcome && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center max-w-md">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-2xl font-bold text-white mb-2">Creating Your Account</h3>
            <p className="text-slate-400">Setting up your profile and linking to your company...</p>
          </div>
        </div>
      )}

      {/* Welcome Popup */}
      {showWelcome && createdAccount && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-12 rounded-3xl border-4 border-white/20 shadow-2xl text-center max-w-lg transform animate-in zoom-in duration-500">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-lg mb-4 animate-bounce">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-5xl font-black text-white mb-3 drop-shadow-lg">
                🎉 Welcome to the Team!
              </h2>
              <div className="h-1 w-32 bg-white/40 rounded-full mx-auto"></div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/30">
              <p className="text-xl font-bold text-white mb-1">
                {createdAccount.user?.name}
              </p>
              <p className="text-white/90 text-sm mb-3">{createdAccount.user?.email}</p>
              
              <div className="flex items-center justify-center gap-2 text-white/90 text-sm bg-white/10 rounded-lg p-3">
                <CheckCircle className="h-5 w-5 text-white" />
                <span className="font-semibold">
                  Joining {createdAccount.company} as {createdAccount.position}
                </span>
              </div>
            </div>
            
            <p className="text-white/90 text-lg mb-6">
              Your account has been created successfully! <br />
              <span className="font-bold">Logging you in now...</span>
            </p>
            
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-0"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-300"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

