"use client"

import { useState, useRef, useEffect } from "react"
import { X, Upload, Image as ImageIcon, Loader2, Paperclip } from "lucide-react"
import Image from "next/image"
import { MentionPicker } from "@/components/universal/mention-picker"

interface MentionedUser {
  id: string
  name: string
  avatar: string | null
  email?: string
  type: 'STAFF' | 'CLIENT' | 'MANAGEMENT'
}

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    content: string
    type: string
    audience: string
    images: string[]
  }) => Promise<void>
  userType: "STAFF" | "CLIENT" | "MANAGEMENT"
  isDark?: boolean
}

export function CreatePostModal({ isOpen, onClose, onSubmit, userType, isDark = true }: CreatePostModalProps) {
  const [content, setContent] = useState("")
  const [postType, setPostType] = useState("UPDATE")
  const [audience, setAudience] = useState(getDefaultAudience(userType))
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [mentionedUsers, setMentionedUsers] = useState<MentionedUser[]>([])
  const [userInfo, setUserInfo] = useState<{type: string, companyId?: string} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch current user info for MentionPicker
  useEffect(() => {
    if (isOpen) {
      fetchUserInfo()
    }
  }, [isOpen])

  async function fetchUserInfo() {
    try {
      const response = await fetch('/api/user/me')
      if (response.ok) {
        const data = await response.json()
        setUserInfo({
          type: data.userType,
          companyId: data.companyId
        })
      }
    } catch (error) {
      console.error("Error fetching user info:", error)
    }
  }

  if (!isOpen) return null

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const data = await response.json()
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setImages((prev) => [...prev, ...uploadedUrls])
    } catch (error) {
      console.error("Error uploading images:", error)
      alert("Failed to upload images")
    } finally {
      setUploading(false)
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!content.trim()) {
      alert("Please write something!")
      return
    }

    setSubmitting(true)
    try {
      // Create the post first
      const postResponse = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          type: postType,
          audience,
          images,
        }),
      })

      if (!postResponse.ok) {
        throw new Error("Failed to create post")
      }

      const { post } = await postResponse.json()

      // Create mentions if any users are mentioned
      if (mentionedUsers.length > 0 && post?.id) {
        console.log(`📢 Creating ${mentionedUsers.length} mentions for post ${post.id}`)
        
        const mentionPromises = mentionedUsers.map(async (user) => {
          try {
            const response = await fetch("/api/mentions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mentionableType: "POST",
                mentionableId: post.id,
                mentionedUserId: user.id,
                mentionedUserType: user.type
              })
            })
            
            if (!response.ok) {
              console.error(`Failed to create mention for ${user.name}`)
            } else {
              console.log(`✅ Mentioned ${user.name} in post`)
            }
          } catch (error) {
            console.error(`Error mentioning ${user.name}:`, error)
          }
        })

        await Promise.all(mentionPromises)
      }

      // Reset form
      setContent("")
      setImages([])
      setPostType("UPDATE")
      setAudience(getDefaultAudience(userType))
      setMentionedUsers([])
      
      // Close modal
      onClose()
      
      // Trigger parent to refresh feed (with empty data as signal)
      try {
        await onSubmit({
          content: "",
          type: "",
          audience: "",
          images: []
        })
      } catch (err) {
        // Parent might try to create post - ignore that error since we already created it
        console.log("Note: Post already created, just refreshing feed")
      }
      
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Failed to create post")
    } finally {
      setSubmitting(false)
    }
  }

  const audienceOptions = getAudienceOptions(userType)
  const postTypeOptions = [
    { value: "UPDATE", label: "📢 Update", emoji: "📢" },
    { value: "WIN", label: "🏆 Win", emoji: "🏆" },
    { value: "CELEBRATION", label: "🎉 Celebration", emoji: "🎉" },
    { value: "ACHIEVEMENT", label: "⭐ Achievement", emoji: "⭐" },
    { value: "KUDOS", label: "👏 Kudos", emoji: "👏" },
    { value: "ANNOUNCEMENT", label: "📣 Announcement", emoji: "📣" },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${
        isDark 
          ? "bg-slate-900 border-2 border-indigo-500/30" 
          : "bg-white border-2 border-gray-200"
      } rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`}>
        {/* Header */}
        <div className={`${
          isDark ? "bg-gradient-to-r from-indigo-600 to-purple-600" : "bg-gradient-to-r from-blue-500 to-cyan-500"
        } p-6 flex items-center justify-between`}>
          <h2 className="text-2xl font-bold text-white">Create Post</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Post Type */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              Post Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {postTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPostType(option.value)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                    postType === option.value
                      ? isDark
                        ? "bg-indigo-500 text-white ring-2 ring-indigo-400"
                        : "bg-blue-500 text-white ring-2 ring-blue-400"
                      : isDark
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              Who can see this?
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className={`w-full p-3 rounded-lg border transition-colors ${
                isDark
                  ? "bg-slate-800 text-white border-slate-700 focus:border-indigo-500"
                  : "bg-white text-gray-900 border-gray-300 focus:border-blue-500"
              } focus:outline-none focus:ring-2 ${isDark ? "focus:ring-indigo-500/50" : "focus:ring-blue-500/50"}`}
            >
              {audienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              What's on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share something amazing..."
              rows={6}
              className={`w-full p-4 rounded-lg border resize-none transition-colors ${
                isDark
                  ? "bg-slate-800 text-white border-slate-700 placeholder:text-slate-500 focus:border-indigo-500"
                  : "bg-white text-gray-900 border-gray-300 placeholder:text-gray-400 focus:border-blue-500"
              } focus:outline-none focus:ring-2 ${isDark ? "focus:ring-indigo-500/50" : "focus:ring-blue-500/50"}`}
            />
          </div>

          {/* Mention Picker */}
          {userInfo && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                Tag People
              </label>
              <MentionPicker
                onMentionSelect={setMentionedUsers}
                selectedMentions={mentionedUsers}
                isDark={isDark}
                userType={userInfo.type as any}
                companyId={userInfo.companyId}
              />
            </div>
          )}

          {/* Image Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,image/gif"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`w-full p-4 rounded-lg border-2 border-dashed transition-all ${
                isDark
                  ? "border-indigo-500/30 hover:border-indigo-500/50 bg-slate-800/50"
                  : "border-blue-300 hover:border-blue-400 bg-blue-50/50"
              } ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex flex-col items-center gap-2">
                {uploading ? (
                  <Loader2 className={`w-6 h-6 animate-spin ${isDark ? "text-indigo-400" : "text-blue-600"}`} />
                ) : (
                  <ImageIcon className={`w-6 h-6 ${isDark ? "text-indigo-400" : "text-blue-600"}`} />
                )}
                <span className={`text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                  {uploading ? "Uploading..." : "Add images or GIFs"}
                </span>
              </div>
            </button>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <Image
                    src={img}
                    alt={`Preview ${idx + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                isDark
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className={`flex-1 py-3 rounded-lg font-medium text-white transition-all ${
                submitting || !content.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : isDark
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/30"
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Posting...
                </span>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getDefaultAudience(userType: "STAFF" | "CLIENT" | "MANAGEMENT"): string {
  switch (userType) {
    case "STAFF":
      return "MY_TEAM"
    case "CLIENT":
      return "MY_TEAM_AND_MANAGEMENT"
    case "MANAGEMENT":
      return "EVERYONE"
  }
}

function getAudienceOptions(userType: "STAFF" | "CLIENT" | "MANAGEMENT") {
  switch (userType) {
    case "STAFF":
      return [
        { value: "MY_TEAM", label: "👨‍👩‍👧‍👦 My Team (Department)" },
        { value: "ALL_STAFF", label: "👥 All Staff (Colleagues)" },
        { value: "ALL_STAFF_MGMT", label: "👥 All Staff + Management" },
        { value: "MY_CLIENT", label: "🏢 My Client's Feed" },
      ]
    case "CLIENT":
      return [
        { value: "MY_TEAM_AND_MANAGEMENT", label: "👥 My Team (Staff Only)" },
      ]
    case "MANAGEMENT":
      return [
        { value: "EVERYONE", label: "🌍 Everyone (Staff + Clients + Management)" },
        { value: "ALL_CLIENTS", label: "🏢 Just Clients" },
        { value: "ALL_STAFF_MGMT", label: "👥 Just Staff (+ Management)" },
        { value: "MANAGEMENT_ONLY", label: "👔 Management Only" },
      ]
  }
}


