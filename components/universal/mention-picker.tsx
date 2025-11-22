"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, AtSign, Loader2 } from "lucide-react"
import Image from "next/image"

interface MentionedUser {
  id: string
  name: string
  avatar: string | null
  email?: string
  type: 'STAFF' | 'CLIENT' | 'MANAGEMENT'
}

interface MentionPickerProps {
  onMentionSelect: (users: MentionedUser[]) => void
  selectedMentions: MentionedUser[]
  isDark?: boolean
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT'
  companyId?: string // For clients to see only their staff
}

export function MentionPicker({
  onMentionSelect,
  selectedMentions,
  isDark = true,
  userType,
  companyId
}: MentionPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [availableUsers, setAvailableUsers] = useState<MentionedUser[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch available users based on role
  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers()
    }
  }, [isOpen, userType, companyId])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function fetchAvailableUsers() {
    setLoading(true)
    try {
      let endpoint = ''
      
      // Determine which users to fetch based on role
      if (userType === 'CLIENT' && companyId) {
        // Clients can only mention their staff
        endpoint = `/api/users?type=staff&companyId=${companyId}`
      } else if (userType === 'STAFF') {
        // Staff can mention: their team, their client, management
        endpoint = `/api/users?type=all&forStaff=true`
      } else if (userType === 'MANAGEMENT') {
        // Management can mention anyone
        endpoint = `/api/users?type=all`
      }

      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setAvailableUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching users for mentions:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search term
  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(user =>
    // Exclude already selected users
    !selectedMentions.some(selected => selected.id === user.id)
  )

  function handleSelectUser(user: MentionedUser) {
    const newMentions = [...selectedMentions, user]
    onMentionSelect(newMentions)
    setSearchTerm("")
    setIsOpen(false)
  }

  function handleRemoveUser(userId: string) {
    const newMentions = selectedMentions.filter(user => user.id !== userId)
    onMentionSelect(newMentions)
  }

  return (
    <div className="space-y-3">
      {/* Selected Mentions */}
      {selectedMentions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMentions.map((user) => (
            <div
              key={user.id}
              className={`inline-flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg transition-colors ${
                isDark
                  ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDark
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                    : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                }`}>
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium">{user.name}</span>
              <button
                onClick={() => handleRemoveUser(user.id)}
                className={`p-0.5 rounded-full transition-colors ${
                  isDark
                    ? "hover:bg-indigo-500/50"
                    : "hover:bg-blue-200"
                }`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mention Button */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${
            isDark
              ? "bg-slate-800 text-slate-300 border-slate-700 hover:border-indigo-500/50"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
          }`}
        >
          <AtSign className="w-4 h-4" />
          <span className="text-sm">Mention someone...</span>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className={`absolute z-50 w-full mt-2 rounded-xl shadow-2xl border overflow-hidden ${
            isDark
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-gray-200"
          }`}>
            {/* Search Input */}
            <div className={`p-3 border-b ${isDark ? "border-slate-700" : "border-gray-200"}`}>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDark ? "text-slate-500" : "text-gray-400"
                }`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? "bg-slate-900 text-white border-slate-600 placeholder:text-slate-500 focus:border-indigo-500"
                      : "bg-gray-50 text-gray-900 border-gray-300 placeholder:text-gray-400 focus:border-blue-500"
                  } focus:outline-none focus:ring-2 ${isDark ? "focus:ring-indigo-500/50" : "focus:ring-blue-500/50"}`}
                  autoFocus
                />
              </div>
            </div>

            {/* User List */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className={`w-6 h-6 animate-spin ${isDark ? "text-indigo-500" : "text-blue-500"}`} />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                    {searchTerm ? "No users found" : "No available users"}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      isDark
                        ? "hover:bg-indigo-500/20 text-white"
                        : "hover:bg-blue-50 text-gray-900"
                    }`}
                  >
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                        isDark
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                          : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                        {user.name}
                      </p>
                      {user.email && (
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                          {user.email}
                        </p>
                      )}
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${
                      isDark ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-600"
                    }`}>
                      {user.type}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

