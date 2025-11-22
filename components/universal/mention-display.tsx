"use client"

import Image from "next/image"
import { AtSign } from "lucide-react"

interface MentionedUser {
  id: string
  name: string
  avatar: string | null
  type?: 'STAFF' | 'CLIENT' | 'MANAGEMENT'
  email?: string
}

interface Mention {
  id: string
  mentionableType: string
  mentionableId: string
  mentionedUserId: string
  mentionedUserType: string
  mentionerUserId: string
  mentionerUserType: string
  createdAt: string
  notificationSent: boolean
  mentionedUser?: MentionedUser | null
}

interface MentionDisplayProps {
  mentions: Mention[] | MentionedUser[]
  isDark?: boolean
  compact?: boolean
}

export function MentionDisplay({ mentions, isDark = true, compact = false }: MentionDisplayProps) {
  if (!mentions || mentions.length === 0) {
    return null
  }

  // Transform mentions to extract user data (handles both API response format and direct user format)
  const users: MentionedUser[] = mentions.map((item: any) => {
    // If it's already a user object (has name directly)
    if (item.name) {
      return item as MentionedUser
    }
    // If it's a mention object (has mentionedUser)
    if (item.mentionedUser) {
      return item.mentionedUser as MentionedUser
    }
    // Invalid format
    return null
  }).filter((user): user is MentionedUser => user !== null && user.name !== undefined)

  if (users.length === 0) {
    return null
  }

  if (compact) {
    // Compact display (just names with @ symbol)
    return (
      <div className="flex flex-wrap gap-1">
        {users.map((user) => (
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
      {users.map((user) => (
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
              {user.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <span className="font-medium">{user.name}</span>
          {user.type && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              isDark ? "bg-slate-700 text-slate-300" : "bg-gray-200 text-gray-600"
            }`}>
              {user.type}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

