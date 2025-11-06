'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { useActivityPosts, useCreatePost, useAddReaction, useAddComment, useActivitySocket } from '@/lib/hooks/use-activity'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Smile, 
  ThumbsUp, 
  Fire, 
  PartyPopper, 
  Clap, 
  Laugh, 
  Rocket, 
  Zap,
  Send,
  Image as ImageIcon,
  Loader2
} from 'lucide-react'

const REACTION_EMOJIS = {
  LIKE: '👍',
  LOVE: '❤️',
  CELEBRATE: '🎉',
  FIRE: '🔥',
  CLAP: '👏',
  LAUGH: '😂',
  POO: '💩',
  ROCKET: '🚀',
  SHOCKED: '😱',
  MIND_BLOWN: '🤯',
}

const REACTION_ICONS = {
  LIKE: ThumbsUp,
  LOVE: Heart,
  CELEBRATE: PartyPopper,
  FIRE: Fire,
  CLAP: Clap,
  LAUGH: Laugh,
  POO: Smile,
  ROCKET: Rocket,
  SHOCKED: Zap,
  MIND_BLOWN: Zap,
}

export default function ActivityLogQuery() {
  const [newPostContent, setNewPostContent] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // React Query hooks
  const { data: posts = [], isLoading, error, refetch } = useActivityPosts()
  
  // Ensure posts is always an array
  const safePosts = Array.isArray(posts) ? posts : []
  
  // Debug logging
  console.log('Posts data:', posts)
  console.log('Safe posts:', safePosts)
  console.log('Is array:', Array.isArray(posts))
  const createPostMutation = useCreatePost()
  const addReactionMutation = useAddReaction()
  const addCommentMutation = useAddComment()

  // Socket integration for real-time updates
  useActivitySocket()

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostContent.trim() && selectedImages.length === 0) return

    try {
      await createPostMutation.mutateAsync({
        type: 'UPDATE',
        content: newPostContent,
        images: selectedImages,
        audience: 'ALL',
      })
      
      setNewPostContent('')
      setSelectedImages([])
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  const handleReaction = async (postId: string, type: string) => {
    try {
      await addReactionMutation.mutateAsync({ postId, type })
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  const handleAddComment = async (postId: string, content: string) => {
    try {
      await addCommentMutation.mutateAsync({ postId, content })
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file))
      setSelectedImages(prev => [...prev, ...newImages])
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading activity feed...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load activity feed</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Activity Feed</h1>
            <p className="text-slate-300">Stay updated with your team's achievements and milestones</p>
          </div>

          {/* Create Post Form */}
          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>YOU</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Share an update, achievement, or milestone..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-slate-300 resize-none"
                    />
                  </div>
                </div>

                {/* Image Preview */}
                {selectedImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={image}
                          alt={`Preview ${index + 1}`}
                          width={100}
                          height={100}
                          className="rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-slate-300 hover:text-white"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Add Images
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending || (!newPostContent.trim() && selectedImages.length === 0)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {createPostMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Post
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Posts */}
          <div className="space-y-6">
            {safePosts.map((post, index) => (
              <Card
                key={post.id}
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={post.user.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                        {post.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{post.user.name}</h3>
                        <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300">
                          {post.type}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-sm">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className="text-white leading-relaxed">{post.content}</p>
                  </div>

                  {/* Images */}
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {post.images.map((image, imgIndex) => (
                        <Image
                          key={imgIndex}
                          src={image}
                          alt={`Post image ${imgIndex + 1}`}
                          width={200}
                          height={200}
                          className="rounded-lg object-cover w-full h-32"
                        />
                      ))}
                    </div>
                  )}

                  {/* Tagged Users */}
                  {post.taggedUsers && post.taggedUsers.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-slate-400 text-sm">Tagged:</span>
                      <div className="flex gap-1">
                        {post.taggedUsers.map((user) => (
                          <div key={user.id} className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-slate-300 text-xs">{user.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reactions */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                        const count = post.reactions.filter(r => r.type === type).length
                        if (count === 0) return null
                        return (
                          <button
                            key={type}
                            onClick={() => handleReaction(post.id, type)}
                            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded-full px-2 py-1 transition-colors"
                          >
                            <span>{emoji}</span>
                            <span className="text-white text-sm">{count}</span>
                          </button>
                        )
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReactions(showReactions === post.id ? null : post.id)}
                      className="text-slate-300 hover:text-white"
                    >
                      <Smile className="h-4 w-4 mr-1" />
                      React
                    </Button>
                  </div>

                  {/* Reaction Picker */}
                  {showReactions === post.id && (
                    <div className="flex gap-2 mb-4 p-3 bg-white/5 rounded-lg">
                      {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                        <button
                          key={type}
                          onClick={() => {
                            handleReaction(post.id, type)
                            setShowReactions(null)
                          }}
                          className="text-2xl hover:scale-110 transition-transform"
                          title={type}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Comments */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.user.avatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                              {comment.user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white text-sm">{comment.user.name}</span>
                                <span className="text-slate-400 text-xs">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-white text-sm">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                        YOU
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Textarea
                        placeholder="Write a comment..."
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-slate-300 resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            const content = e.currentTarget.value.trim()
                            if (content) {
                              handleAddComment(post.id, content)
                              e.currentTarget.value = ''
                            }
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={(e) => {
                          const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement
                          const content = textarea.value.trim()
                          if (content) {
                            handleAddComment(post.id, content)
                            textarea.value = ''
                          }
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {safePosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No posts yet. Be the first to share something!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
