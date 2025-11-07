"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { 
  MessageCircle, 
  Send, 
  Trash2, 
  ThumbsUp,
  Heart,
  Flame,
  PartyPopper,
  Laugh,
  Rocket,
  Zap,
  Loader2,
  Paperclip,
  X,
  Image as ImageIcon
} from "lucide-react"

/**
 * UNIVERSAL COMMENT THREAD COMPONENT
 * 
 * Works with ANY entity type via polymorphic pattern.
 * 
 * Usage:
 * ```tsx
 * <CommentThread 
 *   commentableType="TICKET"
 *   commentableId={ticket.id}
 *   variant="staff"  // or "client" or "management"
 * />
 * ```
 */

interface CommentThreadProps {
  commentableType: string  // e.g., "TICKET", "CANDIDATE", "INTERVIEW", "TASK", etc.
  commentableId: string
  variant?: "staff" | "client" | "management"  // Portal styling
  showReactions?: boolean  // Show reaction buttons
  allowComments?: boolean  // Allow new comments
  placeholder?: string     // Custom placeholder text
  onUpdate?: () => void    // Callback when comment is added/deleted
}

interface Comment {
  id: string
  commentableType: string
  commentableId: string
  authorType: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  content: string
  attachments: string[]
  parentId: string | null
  createdAt: string
  updatedAt: string
}

interface ReactionData {
  reactions: any[]
  reactionCounts: Record<string, number>
  currentUserReaction: any | null
  totalReactions: number
}

// Reaction icon mapping (not used, kept for reference)
const REACTION_ICONS: Record<string, any> = {
  LIKE: ThumbsUp,
  LOVE: Heart,
  FIRE: Flame,
  CELEBRATE: PartyPopper,
  CLAP: ThumbsUp, // Fallback: lucide doesn't have Clap
  LAUGH: Laugh,
  POO: Zap, // Fallback: lucide doesn't have Poo
  ROCKET: Rocket,
  SHOCKED: Zap,
  MIND_BLOWN: Zap
}

const REACTION_LABELS: Record<string, string> = {
  LIKE: "👍",
  LOVE: "❤️",
  FIRE: "🔥",
  CELEBRATE: "🎉",
  CLAP: "👏",
  LAUGH: "😂",
  POO: "💩",
  ROCKET: "🚀",
  SHOCKED: "😱",
  MIND_BLOWN: "🤯"
}

export default function CommentThread({
  commentableType,
  commentableId,
  variant = "staff",
  showReactions = true,
  allowComments = true,
  placeholder = "Write a comment...",
  onUpdate
}: CommentThreadProps) {
  const { toast } = useToast()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [reactions, setReactions] = useState<ReactionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [attachments, setAttachments] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  // Styling based on portal variant
  // DARK for STAFF and MANAGEMENT, LIGHT for CLIENT only
  const isDark = variant !== "client"
  
  const accentColor = 
    variant === "staff" ? "from-indigo-500 to-purple-600" :
    variant === "client" ? "from-blue-500 to-cyan-600" :
    "from-blue-600 to-emerald-600"  // Management = blue/emerald
  
  const bgColor = isDark 
    ? "bg-slate-800/50 backdrop-blur-xl ring-1 ring-white/10" 
    : "bg-white border-2 border-gray-200"

  const inputBgColor = isDark 
    ? "bg-slate-900/50 border-white/10 text-white placeholder-slate-400" 
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"

  // Fetch comments
  const fetchComments = async () => {
    try {
      const response = await fetch(
        `/api/comments?commentableType=${commentableType}&commentableId=${commentableId}`
      )
      const data = await response.json()
      
      if (data.success) {
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error)
    }
  }

  // Fetch reactions
  const fetchReactions = async () => {
    if (!showReactions) return
    
    try {
      const response = await fetch(
        `/api/reactions?reactableType=${commentableType}&reactableId=${commentableId}`
      )
      const data = await response.json()
      
      if (data.success) {
        setReactions(data)
      }
    } catch (error) {
      console.error("Failed to fetch reactions:", error)
    }
  }

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchComments(),
        fetchReactions()
      ])
      setLoading(false)
    }
    
    loadData()
  }, [commentableType, commentableId])

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData
        })

        const data = await response.json()

        if (data.url) {
          uploadedUrls.push(data.url)
        } else {
          throw new Error(data.error || "Failed to upload image")
        }
      }

      setAttachments(prev => [...prev, ...uploadedUrls])
      toast({
        title: "Images uploaded!",
        description: `${uploadedUrls.length} image(s) attached to your comment.`,
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // Remove attachment
  const removeAttachment = (url: string) => {
    setAttachments(prev => prev.filter(a => a !== url))
  }

  // Submit comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentableType,
          commentableId,
          content: newComment.trim(),
          attachments: attachments.length > 0 ? attachments : undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        setNewComment("")
        setAttachments([])
        await fetchComments()
        onUpdate?.()  // Trigger parent refresh
        toast({
          title: "Comment added!",
          description: "Your comment has been posted.",
        })
      } else {
        throw new Error(data.error || "Failed to post comment")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments?commentId=${commentId}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (data.success) {
        await fetchComments()
        toast({
          title: "Comment deleted",
          description: "Your comment has been removed.",
        })
      } else {
        throw new Error(data.error || "Failed to delete comment")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment",
        variant: "destructive"
      })
    }
  }

  // Add/remove reaction
  const handleReaction = async (type: string) => {
    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reactableType: commentableType,
          reactableId: commentableId,
          type
        })
      })

      const data = await response.json()

      if (data.success) {
        await fetchReactions()
        setShowReactionPicker(false)
      } else {
        throw new Error(data.error || "Failed to react")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to react",
        variant: "destructive"
      })
    }
  }

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className={`rounded-xl p-6 ${bgColor}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className={`h-6 w-6 animate-spin ${isDark ? "text-indigo-400" : "text-blue-600"}`} />
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl p-6 ${bgColor}`}>
      {/* Header with reaction counts */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold flex items-center gap-2 ${
          isDark 
            ? "text-transparent bg-clip-text bg-gradient-to-r " + accentColor
            : "text-gray-900"
        }`}>
          <MessageCircle className="h-5 w-5" />
          💬 Comments {comments.length > 0 && `(${comments.length})`}
        </h3>

        {/* Reaction Summary */}
        {showReactions && reactions && reactions.totalReactions > 0 && (
          <div className="flex items-center gap-2">
            {Object.entries(reactions.reactionCounts).map(([type, count]) => (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold transition-all ${
                  reactions.currentUserReaction?.type === type
                    ? isDark 
                      ? "bg-indigo-500/30 ring-1 ring-indigo-500/50 text-indigo-300"
                      : "bg-blue-100 ring-1 ring-blue-300 text-blue-700"
                    : isDark
                      ? "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{REACTION_LABELS[type]}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-3 mb-4">
          {comments.map((comment) => {
            const isStaffComment = comment.authorType === "STAFF"
            const isClientComment = comment.authorType === "CLIENT"
            const isManagementComment = comment.authorType === "MANAGEMENT"

            const commentBg = isDark
              ? isManagementComment 
                ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 ring-1 ring-indigo-500/30"
                : isClientComment
                ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 ring-1 ring-green-500/30"
                : "bg-slate-700/50 ring-1 ring-white/10"
              : isManagementComment
                ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200"
                : isClientComment
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200"
                : "bg-gray-50 border-2 border-gray-200"

            const avatarColor = isManagementComment
              ? "bg-gradient-to-br from-indigo-500 to-purple-600"
              : isClientComment
              ? "bg-gradient-to-br from-green-500 to-emerald-600"
              : "bg-gradient-to-br from-blue-500 to-cyan-600"

            return (
              <div key={comment.id} className={`rounded-xl p-4 ${commentBg}`}>
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={comment.authorAvatar || undefined} />
                    <AvatarFallback className={`${avatarColor} text-white text-sm font-bold`}>
                      {getInitials(comment.authorName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}>
                          {comment.authorName}
                        </span>
                        <span className={`text-xs ${
                          isDark ? "text-slate-400" : "text-gray-500"
                        }`}>
                          •
                        </span>
                        <span className={`text-xs ${
                          isDark ? "text-slate-400" : "text-gray-500"
                        }`}>
                          {formatTime(comment.createdAt)}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className={`text-sm ${
                      isDark ? "text-slate-200" : "text-gray-700"
                    }`}>
                      {comment.content}
                    </p>

                    {/* Comment Attachments */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {comment.attachments.map((attachment, idx) => (
                          <a
                            key={idx}
                            href={attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`relative group block rounded-lg overflow-hidden ring-2 ${
                              isDark ? "ring-white/10 hover:ring-indigo-500/50" : "ring-gray-200 hover:ring-blue-500/50"
                            } transition-all`}
                          >
                            <img
                              src={attachment}
                              alt={`Attachment ${idx + 1}`}
                              className="w-32 h-32 object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className={`text-center py-8 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet. Be the first to comment!</p>
        </div>
      )}

      {/* New Comment Input */}
      {allowComments && (
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={`resize-none ${inputBgColor}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) {
                handleSubmitComment()
              }
            }}
          />

          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <div className={`flex flex-wrap gap-2 p-3 rounded-lg ${
              isDark ? "bg-slate-900/50" : "bg-gray-100"
            }`}>
              {attachments.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={url}
                    alt={`Attachment ${idx + 1}`}
                    className={`w-20 h-20 rounded-lg object-cover ring-2 ${
                      isDark ? "ring-white/10" : "ring-gray-200"
                    }`}
                  />
                  <button
                    onClick={() => removeAttachment(url)}
                    className={`absolute -top-2 -right-2 p-1 rounded-full ${
                      isDark 
                        ? "bg-red-500 hover:bg-red-600" 
                        : "bg-red-500 hover:bg-red-600"
                    } text-white opacity-0 group-hover:opacity-100 transition-opacity`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              isDark 
                ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 ring-1 ring-indigo-500/30" 
                : "bg-blue-50 border border-blue-200"
            }`}>
              <Loader2 className={`h-5 w-5 animate-spin ${
                isDark ? "text-indigo-400" : "text-blue-600"
              }`} />
              <span className={`text-sm font-semibold ${
                isDark ? "text-indigo-300" : "text-blue-700"
              }`}>
                📤 Uploading images...
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* Left: Reactions + Upload */}
            <div className="flex items-center gap-3">
              {/* Emoji Reactions - MODERN STYLE! */}
              {showReactions && (
                <div className="flex items-center gap-1">
                  {Object.entries(REACTION_LABELS).map(([type, emoji]) => {
                    const count = reactions?.reactionCounts[type] || 0
                    const hasReacted = reactions?.currentUserReaction?.reactionType === type
                    
                    return (
                      <button
                        key={type}
                        onClick={() => handleReaction(type)}
                        className={`group relative px-2 py-1 rounded-full text-lg transition-all duration-200 ${
                          hasReacted
                            ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/30 ring-2 ring-indigo-500/50 scale-110"
                            : count > 0
                            ? "bg-slate-700/30 hover:bg-slate-700/50"
                            : "opacity-60 hover:opacity-100 hover:scale-125"
                        } ${isDark ? "hover:bg-slate-700/50" : "hover:bg-gray-100"}`}
                        title={type}
                      >
                        {emoji}
                        {count > 0 && (
                          <span className={`ml-1 text-xs font-bold ${
                            hasReacted ? "text-indigo-300" : isDark ? "text-slate-300" : "text-gray-600"
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Image Upload Button */}
              <label className={`cursor-pointer p-2 rounded-lg transition-all ${
                isDark 
                  ? "bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-indigo-400" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-blue-600"
              }`}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Paperclip className="h-5 w-5" />
              </label>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitComment}
              disabled={(!newComment.trim() && attachments.length === 0) || submitting}
              className={`bg-gradient-to-r ${accentColor} hover:opacity-90`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

