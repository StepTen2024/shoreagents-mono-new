"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"

// Map display names to database enum values
const departmentMap: Record<string, string> = {
  "CEO / Executive": "CEO_EXECUTIVE",
  "IT Department": "IT_DEPARTMENT",
  "HR Department": "HR_DEPARTMENT",
  "Nurse Department": "NURSE_DEPARTMENT",
  "Recruitment Department": "RECRUITMENT_DEPARTMENT",
  "Account Management": "ACCOUNT_MANAGEMENT",
  "Finance Department": "FINANCE_DEPARTMENT",
  "Nerds (Software Team)": "NERDS_DEPARTMENT",
  "Operations": "OPERATIONS",
}

export default function ManagementSignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [department, setDepartment] = useState("")
  const [role, setRole] = useState<"ADMIN" | "MANAGER">("MANAGER")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!name || !email || !password || !department) {
      setError("All required fields must be filled")
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
      const response = await fetch("/api/auth/signup/management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          department: departmentMap[department] || department, // Map to enum value
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Sign up failed")
      }

      // Success - redirect to login
      router.push("/login/admin?registered=true")
    } catch (err: any) {
      setError(err.message || "Sign up failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-2xl p-8 bg-slate-800/50 backdrop-blur border-slate-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4">
            <span className="text-2xl font-bold text-white">SA</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Shore Agents</h1>
          <p className="text-slate-400">Create Management Account</p>
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
                placeholder="Stephen Atcheler"
                className="mt-2 bg-slate-900/50 border-slate-600 text-white"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label className="text-slate-300">Email Address *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="stephen@shoreagents.com"
                className="mt-2 bg-slate-900/50 border-slate-600 text-white"
                required
              />
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
            <div>
              <Label className="text-slate-300">Phone (Optional)</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="mt-2 bg-slate-900/50 border-slate-600 text-white"
              />
            </div>

            {/* Department */}
            <div>
              <Label className="text-slate-300">Department *</Label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-2 w-full h-10 px-3 rounded-md bg-slate-900/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Department</option>
                <option value="CEO / Executive">👔 CEO / Executive</option>
                <option value="IT Department">💻 IT Department</option>
                <option value="HR Department">👤 HR Department</option>
                <option value="Nurse Department">🏥 Nurse Department</option>
                <option value="Recruitment Department">🎯 Recruitment Department</option>
                <option value="Account Management">📊 Account Management</option>
                <option value="Finance Department">💰 Finance Department</option>
                <option value="Nerds (Software Team)">🤓 Nerds (Software Team)</option>
                <option value="Operations">⚙️ Operations</option>
              </select>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <Label className="text-slate-300 mb-3 block">Role *</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  role === "ADMIN"
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-600 bg-slate-900/50 hover:border-slate-500"
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-white">Admin</div>
                  <div className="text-sm text-slate-400">Full system access</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole("MANAGER")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  role === "MANAGER"
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-600 bg-slate-900/50 hover:border-slate-500"
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-white">Manager</div>
                  <div className="text-sm text-slate-400">Department management</div>
                </div>
              </button>
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
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-12 text-base"
          >
            {loading ? "Creating Account..." : "Create Management Account"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700 text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login/admin"
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Sign In
            </Link>
          </p>
        </div>

        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400 font-semibold mb-1">
            🔒 For Shore Agents Management Only
          </p>
          <p className="text-xs text-yellow-300">
            This portal is for Shore Agents internal staff. BPO workers and clients have separate registration.
          </p>
        </div>
      </Card>
    </div>
  )
}

