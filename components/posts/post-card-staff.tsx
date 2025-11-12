"use client"

import { useState } from "react"
import { Heart, MessageCircle, Share2, MoreVertical, User } from "lucide-react"
import Image from "next/image"
import CommentThread from "@/components/universal/comment-thread"
import { formatDistanceToNow } from "date-fns"

interface PostCardStaffProps {
  post: {
    id: string
    content: string
    type: string
    images: string[]
    createdAt: string
    user: {
      id: string
      name: string
      avatar: string | null
      role: string
    }
    commentCount: number
    reactions: Array<{
      id: string
      emoji: string
      type: string
      authorType: string
      authorId: string
    }>
    audience: string
    isReshare?: boolean
    reshareComment?: string
    originalPost?: {
      id: string
      content: string
      type: string
      images: string[]
      createdAt: string
      user: {
        id: string
        name: string
        avatar: string | null
      }
    }
  }
  onReshare?: (postId: string) => void
  onUpdate?: () => void
}

export function PostCardStaff({ post, onReshare, onUpdate }: PostCardStaffProps) {
  const [showComments, setShowComments] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  // Group reactions by type with counts
  const reactionCounts = post.reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topReactions = Object.entries(reactionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  // Reaction picker options
  const reactionOptions = [
    { type: "LIKE", emoji: "👍" },
    { type: "LOVE", emoji: "❤️" },
    { type: "CELEBRATE", emoji: "🎉" },
    { type: "FIRE", emoji: "🔥" },
    { type: "LAUGH", emoji: "😂" },
    { type: "ROCKET", emoji: "🚀" },
  ]

  // Handle reaction
  const handleReaction = async (reactionType: string) => {
    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reactableType: "POST",
          reactableId: post.id,
          type: reactionType,
        }),
      })

      if (response.ok) {
        setShowReactionPicker(false)
        onUpdate?.() // Refresh the feed
      }
    } catch (error) {
      console.error("Error adding reaction:", error)
    }
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300 shadow-xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="relative">
          {post.user.avatar ? (
            <Image
              src={post.user.avatar}
              alt={post.user.name}
              width={48}
              height={48}
              className="rounded-full ring-2 ring-indigo-500/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-500/30">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* User info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold">{post.user.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {post.user.role}
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* More options */}
        <button className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Reshare indicator */}
      {post.isReshare && (
        <div className="mb-4 flex items-center gap-2 text-sm text-indigo-400">
          <Share2 className="w-4 h-4" />
          <span>Reshared from {post.originalPost?.user.name}</span>
        </div>
      )}

      {/* Original post content (if reshare) */}
      {post.isReshare && post.originalPost && (
        <div className="mb-4 p-4 bg-slate-800/50 border border-white/10 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            {post.originalPost.user.avatar ? (
              <Image
                src={post.originalPost.user.avatar}
                alt={post.originalPost.user.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="text-white text-sm font-medium">{post.originalPost.user.name}</span>
          </div>
          <p className="text-slate-300">{post.originalPost.content}</p>
          {post.originalPost.images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {post.originalPost.images.slice(0, 4).map((img, idx) => (
                <Image
                  key={idx}
                  src={img}
                  alt="Original post"
                  width={200}
                  height={200}
                  className="rounded-lg object-cover w-full h-32"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reshare comment (if any) */}
      {post.reshareComment && (
        <p className="text-white mb-4">{post.reshareComment}</p>
      )}

      {/* Post content */}
      {!post.isReshare && (
        <p className="text-white mb-4 leading-relaxed">{post.content}</p>
      )}

      {/* Images (if not reshare) */}
      {!post.isReshare && post.images.length > 0 && (
        <div className={`mb-4 grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.images.slice(0, 4).map((img, idx) => (
            <Image
              key={idx}
              src={img}
              alt="Post image"
              width={400}
              height={300}
              className={`rounded-xl object-cover w-full ${post.images.length === 1 ? 'h-96' : 'h-48'}`}
            />
          ))}
        </div>
      )}

      {/* Reactions & Comments footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        {/* Reactions */}
        <div className="flex items-center gap-2">
          {topReactions.length > 0 ? (
            <>
              {topReactions.map(([emoji, count]) => (
                <div key={emoji} className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-full">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-sm text-slate-400">{count}</span>
                </div>
              ))}
            </>
          ) : (
            <span className="text-sm text-slate-500">No reactions yet</span>
          )}
        </div>

        {/* Comment count */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.commentCount} comments</span>
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
        <div className="relative flex-1">
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="w-full flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">React</span>
          </button>

          {/* Reaction picker */}
          {showReactionPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl p-3 flex gap-2 z-10">
              {reactionOptions.map((reaction) => (
                <button
                  key={reaction.type}
                  onClick={() => handleReaction(reaction.type)}
                  className="text-2xl hover:scale-125 transition-transform p-2 hover:bg-white/10 rounded-lg"
                  title={reaction.type}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Comment</span>
        </button>
        <button
          onClick={() => onReshare?.(post.id)}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">Reshare</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <CommentThread
            commentableType="POST"
            commentableId={post.id}
            variant="staff"
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  )
}

