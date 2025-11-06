"use client"

import { X, Mail, User, Calendar, Shield } from "lucide-react"
import Image from "next/image"

interface ClientUser {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  createdAt: string
}

interface ClientUserModalProps {
  user: ClientUser | null
  isOpen: boolean
  onClose: () => void
}

export default function ClientUserModal({ user, isOpen, onClose }: ClientUserModalProps) {
  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-slate-900/95 via-indigo-900/30 to-slate-900/95 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-xl bg-slate-800/50 p-2 transition-all hover:bg-slate-800 hover:rotate-90"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Header with Avatar */}
        <div className="relative h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        </div>

        {/* Content */}
        <div className="relative px-8 pb-8">
          {/* Avatar */}
          <div className="relative -mt-16 mb-6">
            <div className="group relative inline-block">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur-lg" />
              <div className="relative h-32 w-32 overflow-hidden rounded-3xl ring-4 ring-slate-900">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-4xl font-bold text-white">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-6">
            {/* Name & Role */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{user.name}</h2>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-4 py-1.5 ring-1 ring-indigo-500/50">
                <Shield className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-300">{user.role}</span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-white/10">
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-400 mb-1">Email</div>
                  <div className="text-sm font-semibold text-white truncate">{user.email}</div>
                </div>
              </div>


              <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-white/10">
                <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2.5">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-400 mb-1">User ID</div>
                  <div className="text-xs font-mono font-semibold text-white truncate">{user.id}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-800/80 hover:ring-white/10">
                <div className="rounded-lg bg-gradient-to-br from-orange-500 to-red-500 p-2.5">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-400 mb-1">Member Since</div>
                  <div className="text-sm font-semibold text-white">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <a
                href={`mailto:${user.email}`}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/50"
              >
                <Mail className="h-4 w-4" />
                Send Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

