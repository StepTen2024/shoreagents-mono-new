"use client"

import { useState } from "react"
import { Heart, MessageCircle, Share2, MoreVertical, User } from "lucide-react"
import Image from "next/image"
import { CommentThread } from "@/components/universal/comment-thread"
import { formatDistanceToNow } from "date-fns"

interface PostCardAdminProps {
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

export function PostCardAdmin({ post, onReshare, onUpdate }: PostCardAdminProps) {
  const [showComments, setShowComments] = useState(false)

  // Group reactions by type with counts
  const reactionCounts = post.reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topReactions = Object.entries(reactionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-emerald-950 border-2 border-blue-500/30 rounded-2xl p-6 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 relative overflow-hidden group">
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar with premium ring */}
          <div className="relative">
            {post.user.avatar ? (
              <Image
                src={post.user.avatar}
                alt={post.user.name}
                width={48}
                height={48}
                className="rounded-full ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/30"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/30">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          {/* User info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold">{post.user.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/30 to-emerald-500/30 text-blue-300 border border-blue-500/30">
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
          <div className="mb-4 flex items-center gap-2 text-sm text-emerald-400">
            <Share2 className="w-4 h-4" />
            <span>Reshared from {post.originalPost?.user.name}</span>
          </div>
        )}

        {/* Original post content (if reshare) */}
        {post.isReshare && post.originalPost && (
          <div className="mb-4 p-4 bg-slate-800/50 border border-blue-500/20 rounded-xl backdrop-blur-sm">
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
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
                className={`rounded-xl object-cover w-full ${post.images.length === 1 ? 'h-96' : 'h-48'} ring-1 ring-white/10`}
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
                  <div key={emoji} className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                    <span className="text-lg">{emoji}</span>
                    <span className="text-sm text-blue-300">{count}</span>
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
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.commentCount} comments</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">React</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
          <button
            onClick={() => onReshare?.(post.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
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
              variant="management"
              onUpdate={onUpdate}
            />
          </div>
        )}
      </div>
    </div>
  )
}

