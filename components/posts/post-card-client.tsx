"use client"

import { useState } from "react"
import { Heart, MessageCircle, Share2, MoreVertical, User } from "lucide-react"
import Image from "next/image"
import { CommentThread } from "@/components/universal/comment-thread"
import { formatDistanceToNow } from "date-fns"

interface PostCardClientProps {
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

export function PostCardClient({ post, onReshare, onUpdate }: PostCardClientProps) {
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
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
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
              className="rounded-full ring-2 ring-blue-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ring-2 ring-blue-200">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* User info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-gray-900 font-semibold">{post.user.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {post.user.role}
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* More options */}
        <button className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Reshare indicator */}
      {post.isReshare && (
        <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
          <Share2 className="w-4 h-4" />
          <span>Reshared from {post.originalPost?.user.name}</span>
        </div>
      )}

      {/* Original post content (if reshare) */}
      {post.isReshare && post.originalPost && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="text-gray-900 text-sm font-medium">{post.originalPost.user.name}</span>
          </div>
          <p className="text-gray-700">{post.originalPost.content}</p>
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
        <p className="text-gray-900 mb-4">{post.reshareComment}</p>
      )}

      {/* Post content */}
      {!post.isReshare && (
        <p className="text-gray-900 mb-4 leading-relaxed">{post.content}</p>
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
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        {/* Reactions */}
        <div className="flex items-center gap-2">
          {topReactions.length > 0 ? (
            <>
              {topReactions.map(([emoji, count]) => (
                <div key={emoji} className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              ))}
            </>
          ) : (
            <span className="text-sm text-gray-500">No reactions yet</span>
          )}
        </div>

        {/* Comment count */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.commentCount} comments</span>
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
          <Heart className="w-5 h-5" />
          <span className="text-sm font-medium">React</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Comment</span>
        </button>
        <button
          onClick={() => onReshare?.(post.id)}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">Reshare</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <CommentThread
            commentableType="POST"
            commentableId={post.id}
            variant="client"
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  )
}

