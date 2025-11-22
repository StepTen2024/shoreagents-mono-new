"use client"

import Image from "next/image"
import { AtSign } from "lucide-react"

interface MentionedUser {
  id: string
  name: string
  avatar: string | null
  type?: 'STAFF' | 'CLIENT' | 'MANAGEMENT'
}

interface MentionDisplayProps {
  mentions: MentionedUser[]
  isDark?: boolean
  compact?: boolean
}

export function MentionDisplay({ mentions, isDark = true, compact = false }: MentionDisplayProps) {
  if (!mentions || mentions.length === 0) {
    return null
  }

  if (compact) {
    // Compact display (just names with @ symbol)
    return (
      <div className="flex flex-wrap gap-1">
        {mentions.map((user) => (
          <span
            key={user.id}
            className={`inline-flex items-center gap-1 text-sm ${
              isDark ? "text-indigo-300" : "text-blue-600"
            }`}
          >
            <AtSign className="w-3 h-3" />
            <span>{user.name}</span>
          </span>
        ))}
      </div>
    )
  }

  // Full display with avatars
  return (
    <div className="flex flex-wrap gap-2">
      {mentions.map((user) => (
        <div
          key={user.id}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
            isDark
              ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={20}
              height={20}
              className="rounded-full"
            />
          ) : (
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              isDark
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
            }`}>
              {user.name.charAt(0)}
            </div>
          )}
          <span className="font-medium">{user.name}</span>
        </div>
      ))}
    </div>
  )
}

