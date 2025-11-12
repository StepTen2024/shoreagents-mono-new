"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"

export default function LoginSelectorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">ShoreAgentsAI</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* System Admin */}
          <Link href="/login/admin">
            <Card className="h-80 p-8 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur border-indigo-500/30 hover:border-indigo-400 transition-all cursor-pointer group hover:scale-105">
              <div className="text-center h-full flex flex-col justify-center items-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-6 transition-shadow">
                  <span className="text-3xl font-bold text-white">SA</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">System Admin</h2>
                <p className="text-slate-300 mb-4">
                  Shore Agents Management
                </p>
                <div className="text-sm text-slate-400">
                  Manage staff, clients, and reviews
                </div>
              </div>
            </Card>
          </Link>

          {/* Staff Portal */}
          <Link href="/login/staff">
            <Card className="h-80 p-8 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 backdrop-blur border-purple-500/30 hover:border-purple-400 transition-all cursor-pointer group hover:scale-105">
              <div className="text-center h-full flex flex-col justify-center items-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 mb-6 transition-shadow">
                  <span className="text-3xl font-bold text-white">SP</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Staff Portal</h2>
                <p className="text-slate-300 mb-4">
                  Offshore Staff Dashboard
                </p>
                <div className="text-sm text-slate-400">
                  Track tasks, time, and performance
                </div>
              </div>
            </Card>
          </Link>

          {/* Client Portal */}
          <Link href="/login/client">
            <Card className="h-80 p-8 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur border-blue-500/30 hover:border-blue-400 transition-all cursor-pointer group hover:scale-105">
              <div className="text-center h-full flex flex-col justify-center items-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 mb-6 transition-shadow">
                  <span className="text-3xl font-bold text-white">CP</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Client Portal</h2>
                <p className="text-slate-300 mb-4">
                  Client Organization
                </p>
                <div className="text-sm text-slate-400">
                  Manage your offshore team
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm">
            Don't know which portal to use? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}