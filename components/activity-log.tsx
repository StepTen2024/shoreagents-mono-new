"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Heart, ThumbsUp, Flame, PartyPopper, Sparkles, MessageSquare, Send, Image as ImageIcon, FileText, Trash2, X, Laugh, Skull, Rocket, Zap, BrainCircuit, AtSign, Bell, Users, Clock } from "lucide-react"
import Image from "next/image"
import { useWebSocket } from "@/lib/websocket-provider"
import { NotificationCenter } from "@/components/notification-center"
import { ActivitySkeleton } from "@/components/activity-skeleton"
import { useActivityPosts, useCreatePost, useAddReaction, useAddComment, useProfile, type ActivityPost } from "@/lib/hooks/use-activity"

type PostType = "UPDATE" | "WIN" | "CELEBRATION" | "ACHIEVEMENT" | "KUDOS" | "ANNOUNCEMENT"
type ReactionType = "LIKE" | "LOVE" | "FIRE" | "CELEBRATE" | "CLAP" | "LAUGH" | "POO" | "ROCKET" | "SHOCKED" | "MIND_BLOWN"

interface StaffMember {
  id: string
  name: string
  avatar: string | null
}

interface Reaction {
  id: string
  type: string
  createdAt: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
}

const reactionIcons = {
  LIKE: { icon: ThumbsUp, color: "text-blue-400", label: "Like" },
  LOVE: { icon: Heart, color: "text-red-400", label: "Love" },
  FIRE: { icon: Flame, color: "text-orange-400", label: "Fire" },
  CELEBRATE: { icon: PartyPopper, color: "text-purple-400", label: "Celebrate" },
  CLAP: { icon: Sparkles, color: "text-emerald-400", label: "Clap" },
  LAUGH: { icon: Laugh, color: "text-yellow-400", label: "Haha" },
  POO: { icon: Skull, color: "text-amber-600", label: "Poo" },
  ROCKET: { icon: Rocket, color: "text-cyan-400", label: "Rocket" },
  SHOCKED: { icon: Zap, color: "text-pink-400", label: "Shocked" },
  MIND_BLOWN: { icon: BrainCircuit, color: "text-fuchsia-400", label: "Mind Blown" },
}

export default function ActivityLog() {
  // Local state for UI - must be declared before React Query hooks
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({})
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [showReactorsModal, setShowReactorsModal] = useState(false)
  const [selectedPostReactions, setSelectedPostReactions] = useState<Reaction[]>([])
  const [reactionFilter, setReactionFilter] = useState<ReactionType | 'ALL'>('ALL')
  const [clickedReaction, setClickedReaction] = useState<string | null>(null)
  const processingReactions = useRef<Set<string>>(new Set())
  const lastClickTime = useRef<Map<string, number>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Tagging state
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [allStaffUsers, setAllStaffUsers] = useState<StaffMember[]>([])
  const [taggedUsers, setTaggedUsers] = useState<StaffMember[]>([])
  const [tagSearchQuery, setTagSearchQuery] = useState("")
  const [tagButtonRect, setTagButtonRect] = useState<DOMRect | null>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)
  const tagButtonRef = useRef<HTMLButtonElement>(null)
  
  // React Query hooks - using currentUserId from state above
  const { data: posts = [], isLoading, error, refetch, isFetching } = useActivityPosts()
  const { data: profileData, isLoading: isLoadingProfile } = useProfile()
  const createPostMutation = useCreatePost()
  const addReactionMutation = useAddReaction(
    currentUserId,
    profileData?.user ? {
      name: profileData.user.name,
      avatar: profileData.user.avatar
    } : undefined
  )
  const addCommentMutation = useAddComment(
    profileData?.user ? {
      id: profileData.user.id,
      name: profileData.user.name,
      avatar: profileData.user.avatar
    } : undefined
  )
  
  // 🔥 WebSocket for real-time updates
  const { on, off } = useWebSocket()

  // Set currentUserId from profile data
  useEffect(() => {
    if (profileData?.user?.id) {
      setCurrentUserId(profileData.user.id)
    }
  }, [profileData])

  // Fetch all staff users for tagging
  useEffect(() => {
    const fetchStaffUsers = async () => {
      try {
        const response = await fetch('/api/staff/users')
        if (response.ok) {
          const data = await response.json()
          setAllStaffUsers(data.staffUsers || [])
        }
      } catch (error) {
        console.error('Error fetching staff users:', error)
      }
    }
    fetchStaffUsers()
  }, [])

  // Close tag dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isClickInsideDropdown = tagDropdownRef.current?.contains(target)
      const isClickOnButton = tagButtonRef.current?.contains(target)
      
      if (!isClickInsideDropdown && !isClickOnButton) {
        setShowTagDropdown(false)
        setTagSearchQuery("")
      }
    }

    if (showTagDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTagDropdown])

  // 🔥 Listen for real-time activity updates
  useEffect(() => {
    if (!on || !off) return

    // New post added - trigger refetch
    const handleNewPost = (newPost: any) => {
      console.log('✨ New post received:', newPost.id)
      refetch()
    }

    // Reaction added/removed - trigger refetch
    const handleReactionAdded = () => {
      refetch()
    }

    const handleReactionRemoved = () => {
      refetch()
    }

    // Comment added/deleted - trigger refetch
    const handleCommentAdded = () => {
      refetch()
    }

    const handleCommentDeleted = () => {
      refetch()
    }

    // Register event listeners
    on('activity:newPost', handleNewPost)
    on('activity:reactionAdded', handleReactionAdded)
    on('activity:reactionRemoved', handleReactionRemoved)
    on('activity:commentAdded', handleCommentAdded)
    on('activity:commentDeleted', handleCommentDeleted)

    // Cleanup on unmount
    return () => {
      off('activity:newPost', handleNewPost)
      off('activity:reactionAdded', handleReactionAdded)
      off('activity:reactionRemoved', handleReactionRemoved)
      off('activity:commentAdded', handleCommentAdded)
      off('activity:commentDeleted', handleCommentDeleted)
    }
  }, [on, off, refetch])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const filesArray = Array.from(files).slice(0, 5) // Max 5 images
    setSelectedImages(filesArray)

    // Generate previews
    const previews = filesArray.map((file) => URL.createObjectURL(file))
    setImagePreviews(previews)
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleTagUser = (user: StaffMember) => {
    const isAlreadyTagged = taggedUsers.some(u => u.id === user.id)
    if (isAlreadyTagged) {
      setTaggedUsers(taggedUsers.filter(u => u.id !== user.id))
    } else {
      setTaggedUsers([...taggedUsers, user])
    }
  }

  const removeTaggedUser = (userId: string) => {
    setTaggedUsers(taggedUsers.filter(u => u.id !== userId))
  }

  const filteredStaffUsers = allStaffUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
    const notAlreadyTagged = !taggedUsers.some(u => u.id === user.id)
    const notCurrentUser = user.id !== currentUserId
    return matchesSearch && notAlreadyTagged && notCurrentUser
  })

  const createPost = async () => {
    if (!newPostContent.trim() && selectedImages.length === 0) return

    setUploading(true)
    let imageUrls: string[] = []

    // Upload images first if any
    if (selectedImages.length > 0) {
      const formData = new FormData()
      selectedImages.forEach((file) => {
        formData.append("images", file)
      })

      try {
        const uploadResponse = await fetch("/api/posts/images", {
          method: "POST",
          body: formData,
        })
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrls = uploadData.urls
        }
      } catch (error) {
        console.error("Error uploading images:", error)
      }
    }

    // Create post using React Query mutation
    try {
      await createPostMutation.mutateAsync({
        type: "UPDATE",
        content: newPostContent,
        images: imageUrls,
        audience: "STAFF",
        taggedUserIds: taggedUsers.map(u => u.id), // Add tagged user IDs
      })
      
      setNewPostContent("")
      setSelectedImages([])
      setImagePreviews([])
      setTaggedUsers([]) // Clear tagged users
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setUploading(false)
    }
  }

  const toggleReaction = async (postId: string, type: ReactionType) => {
    const reactionKey = `${postId}-${type}`
    
    // Check if this exact reaction is already being processed
    if (processingReactions.current.has(reactionKey)) {
      console.log(`🚫 [Frontend] ${type} is already being processed! Please wait...`)
      return
    }
    
    // Debounce: Per-reaction cooldown (each reaction has its own timer)
    const now = Date.now()
    const lastClick = lastClickTime.current.get(reactionKey) || 0
    const timeSinceLastClick = now - lastClick
    const COOLDOWN = 500 // 500ms cooldown per reaction (fast!)
    
    if (timeSinceLastClick < COOLDOWN) {
      console.log(`🚫 [Frontend] ${type} is on cooldown! Wait ${COOLDOWN - timeSinceLastClick}ms more`)
      return
    }
    
    // Mark as processing
    processingReactions.current.add(reactionKey)
    lastClickTime.current.set(reactionKey, now)
    console.log(`🎯 [Frontend] Click received for: ${type} on post ${postId.substring(0, 8)}...`)
    
    // Set clicked reaction for animation
    setClickedReaction(reactionKey)
    
    // Clear animation after it completes
    setTimeout(() => setClickedReaction(null), 300)
    
    console.log('🚀 [Frontend] Calling mutation...')
    const startTime = performance.now()
    
    // Fire and forget - optimistic updates handle everything
    addReactionMutation.mutate({ postId, type }, {
      onSuccess: () => {
        const endTime = performance.now()
        console.log(`✅ [Frontend] Mutation completed in ${Math.round(endTime - startTime)}ms`)
        
        // Remove from processing after a delay to ensure API fully completes
        setTimeout(() => {
          processingReactions.current.delete(reactionKey)
          console.log(`🔓 [Frontend] ${type} unlocked and ready`)
        }, 500)
      },
      onError: (error) => {
        console.error("❌ [Frontend] Error toggling reaction:", error)
        
        // Remove from processing immediately on error
        processingReactions.current.delete(reactionKey)
        console.log(`🔓 [Frontend] ${type} unlocked after error`)
      }
    })
  }

  const addComment = async (postId: string) => {
    const content = commentInputs[postId]
    if (!content?.trim()) return

    try {
      await addCommentMutation.mutateAsync({ postId, content })
      setCommentInputs({ ...commentInputs, [postId]: "" })
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      await fetch(`/api/posts/comments?id=${commentId}`, { method: "DELETE" })
      await refetch()
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const formatTimeAgo = (dateString: string, commentId?: string) => {
    // Check if this is an optimistic comment (temp ID)
    if (commentId && commentId.startsWith('temp-')) {
      return "uploading..."
    }
    
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  // Use the post's userReactions array from the API instead of checking reactions manually
  const hasUserReacted = (post: ActivityPost, type: string) => {
    // The API provides userReactions array with the reaction types the current user has
    return post.userReactions?.includes(type) || false
  }

  const getReactionCount = (post: ActivityPost, type: string) => {
    // Use reactionStats from API if available, otherwise count manually
    return post.reactionStats?.[type] || post.reactions.filter((r) => r.type === type).length
  }

  const openReactorsModal = (reactions: Reaction[]) => {
    setSelectedPostReactions(reactions)
    setReactionFilter('ALL') // Reset filter when opening modal
    setShowReactorsModal(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <ActivitySkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="rounded-xl bg-red-900/20 p-6 ring-1 ring-red-500/20">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <X className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-400">Failed to load activity feed</h3>
                <p className="text-sm text-red-300 mt-1">
                  {error instanceof Error ? error.message : 'Something went wrong'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-2xl space-y-4 overflow-visible">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-indigo-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">Team Feed 🎉</h1>
                {isFetching && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-400"></div>
                    Updating...
                  </div>
                )}
              </div>
              <p className="mt-1 text-slate-300">Share updates, wins, memes, and 💩 takes with the team!</p>
            </div>
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Bell className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Create Post */}
        <div className="rounded-xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10 overflow-visible">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What's on your mind? Share a win, meme, or update! 🚀"
            className="w-full rounded-lg bg-slate-800/50 p-4 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-indigo-400/50"
            rows={3}
          />

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tagged Users Display */}
          {taggedUsers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {taggedUsers.map((user) => (
                <div key={user.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={20}
                      height={20}
                      className="rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span>{user.name}</span>
                  <button
                    onClick={() => removeTaggedUser(user.id)}
                    className="ml-1 hover:text-red-400 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.gif,.pdf"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-4 py-2 text-sm text-slate-300 transition-all hover:bg-slate-700/50"
              >
                <ImageIcon className="h-4 w-4" />
                Add Image/GIF/PDF
              </button>
              
              {/* Tag People Button */}
              <button
                ref={tagButtonRef}
                onClick={() => {
                  if (!showTagDropdown && tagButtonRef.current) {
                    setTagButtonRect(tagButtonRef.current.getBoundingClientRect())
                  }
                  setShowTagDropdown(!showTagDropdown)
                }}
                className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-4 py-2 text-sm text-slate-300 transition-all hover:bg-slate-700/50"
              >
                <AtSign className="h-4 w-4" />
                Tag people
                {taggedUsers.length > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white">
                    {taggedUsers.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={createPost}
              disabled={uploading || (!newPostContent.trim() && selectedImages.length === 0)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 font-semibold text-white transition-all hover:from-indigo-500 hover:to-purple-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Posting...
                </>
              ) : (
                <>
                  Post 🚀
                </>
              )}
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <div className="rounded-xl bg-slate-900/50 p-12 text-center backdrop-blur-xl ring-1 ring-white/10">
            <p className="text-slate-400">No posts yet. Be the first to share something! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => {
              const isTagged = post.taggedUsers?.some(u => u.id === currentUserId)
              return (
              <div
                key={post.id}
                className={`animate-fade-in-up rounded-xl p-6 backdrop-blur-xl ring-1 transition-all hover:shadow-xl ${
                  isTagged 
                    ? 'bg-indigo-500/10 ring-indigo-400/40 hover:ring-indigo-400/60' 
                    : 'bg-slate-900/50 ring-white/10 hover:ring-white/20'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Post Header */}
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-indigo-400/30 transition-all hover:ring-indigo-400/60 hover:scale-105">
                    {post.user.avatar && post.user.avatar.startsWith('http') ? (
                      <Image
                        src={post.user.avatar}
                        alt={post.user.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.warn('Avatar failed to load for', post.user.name, ':', post.user.avatar);
                          console.warn('This might be due to CORS or network issues. Using fallback avatar.');
                          // Hide the image and show fallback
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback && fallback instanceof HTMLElement) {
                            fallback.style.display = 'flex';
                          }
                        }}
                        onLoad={() => {
                          console.log('Avatar loaded successfully for', post.user.name);
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ${post.user.avatar && post.user.avatar.startsWith('http') ? 'hidden' : ''}`}
                      style={{ display: (post.user.avatar && post.user.avatar.startsWith('http')) ? 'none' : 'flex' }}
                    >
                      {post.user.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-white hover:text-indigo-300 transition-colors cursor-pointer">{post.user.name}</div>
                      {isTagged && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full">
                          Tagged you
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400">{formatTimeAgo(post.createdAt)}</div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mt-4">
                  <p className="whitespace-pre-wrap text-white">{post.content}</p>
                </div>

                {/* Tagged Users */}
                {post.taggedUsers && post.taggedUsers.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.taggedUsers.map((staff) => (
                      <div key={staff.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">
                        {staff.avatar ? (
                          <Image
                            src={staff.avatar}
                            alt={staff.name}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {staff.name.charAt(0)}
                          </div>
                        )}
                        <span>{staff.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Post Images */}
                {post.images && post.images.length > 0 && (
                  <div className={`mt-4 grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                    {post.images.map((image, index) => {
                      const isPDF = image.toLowerCase().endsWith('.pdf')
                      return (
                        <div key={index} className="relative aspect-video overflow-hidden rounded-lg">
                          {isPDF ? (
                            <div className="flex h-full items-center justify-center bg-slate-800/50">
                              <div className="text-center">
                                <FileText className="mx-auto mb-2 h-12 w-12 text-indigo-400" />
                                <p className="text-sm text-slate-300">PDF Document</p>
                                <a
                                  href={image}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-block text-xs text-indigo-400 hover:underline"
                                >
                                  Open PDF
                                </a>
                              </div>
                            </div>
                          ) : (
                            <Image
                              src={image}
                              alt={`Post image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Reactions */}
                <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                  {/* Clickable Reaction Summary */}
                  {post.reactions.length > 0 && (
                    <div className="text-sm text-slate-400 relative z-10">
                      <button
                        onClick={() => openReactorsModal(post.reactions)}
                        className="flex items-center gap-2 text-white transition-all hover:text-indigo-300 relative"
                      >
                        {/* Top 3 Reactions */}
                        <div className="flex items-center -space-x-1 relative z-10">
                          {Object.entries(
                            post.reactions.reduce((acc, r) => {
                              acc[r.type] = (acc[r.type] || 0) + 1
                              return acc
                            }, {} as Record<string, number>)
                          )
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([type, count], idx) => {
                              const IconComponent = reactionIcons[type as ReactionType]?.icon || ThumbsUp
                              const color = reactionIcons[type as ReactionType]?.color || "text-blue-400"
                              const label = reactionIcons[type as ReactionType]?.label || "Like"
                              return (
                                <div
                                  key={type}
                                  className="group/icon relative flex items-center justify-center h-7 w-7 rounded-full bg-slate-800 ring-2 ring-slate-900 transition-transform hover:scale-125"
                                  style={{ zIndex: 10 + (3 - idx) }}
                                >
                                  <IconComponent className={`h-4 w-4 ${color}`} />
                                  
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/icon:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-[100]">
                                    <div className="rounded-lg bg-slate-800/95 backdrop-blur-sm px-2 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/10">
                                      {count} {label}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                                        <div className="border-4 border-transparent border-t-slate-800/95"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                        <span className="font-medium">
                          {post.reactions.length} reaction{post.reactions.length !== 1 ? 's' : ''}
                        </span>
                      </button>
                    </div>
                  )}
                  
                  {/* Reaction Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(reactionIcons).map(([type, { icon: Icon, color, label }]) => {
                      const count = getReactionCount(post, type as ReactionType)
                      const hasReacted = hasUserReacted(post, type as ReactionType)
                      const whoReacted = post.reactions
                        .filter((r) => r.type === type)
                        .map((r) => r.user.name)
                      const reactionKey = `${post.id}-${type}`
                      const isAnimating = clickedReaction === reactionKey
                      
                      return (
                        <button
                          key={type}
                          onClick={() => toggleReaction(post.id, type as ReactionType)}
                          className={`group relative flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-all duration-200 ${
                            hasReacted
                              ? `${color} bg-slate-800/70 ring-1 ring-current scale-105`
                              : "text-slate-400 hover:bg-slate-800/50 hover:scale-110 hover:text-white"
                          } active:scale-125 ${isAnimating ? 'animate-reaction-pop' : ''}`}
                        >
                          <Icon className={`h-4 w-4 transition-transform ${hasReacted ? "scale-110" : "group-hover:rotate-12"} ${isAnimating ? 'animate-reaction-pop' : ''}`} />
                          {count > 0 && <span className="font-semibold">{count}</span>}
                          
                          {/* Enhanced Beautiful Tooltip with Full Details */}
                          {whoReacted.length > 0 && (
                            <div className="pointer-events-none absolute -top-20 left-1/2 z-[100] -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1">
                              <div className="relative">
                                {/* Tooltip Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2">
                                  <div className="h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800"></div>
                                </div>
                                
                                {/* Tooltip Content */}
                                <div className="rounded-xl bg-slate-800/95 backdrop-blur-sm px-4 py-3 shadow-2xl ring-1 ring-white/10 min-w-[220px]">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Icon className={`h-5 w-5 ${color}`} />
                                    <span className="text-sm font-semibold text-white">{label}</span>
                                    <span className="text-xs text-slate-400">({count})</span>
                                  </div>
                                  
                                  {/* All Users List with Timestamps */}
                                  <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {post.reactions
                                      .filter((r) => r.type === type)
                                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                      .map((reaction, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                                          <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400"></div>
                                            <span className="truncate">{reaction.user.name}</span>
                                          </div>
                                          <span className="text-slate-500 text-[10px] ml-2">
                                            {new Date(reaction.createdAt).toLocaleTimeString([], { 
                                              hour: '2-digit', 
                                              minute: '2-digit' 
                                            })}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Fallback simple tooltip for empty reactions */}
                          {whoReacted.length === 0 && (
                            <div className="pointer-events-none absolute -top-10 left-1/2 z-[100] -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                              <div className="rounded-lg bg-slate-900/95 backdrop-blur-sm px-3 py-2 text-xs text-white shadow-xl ring-1 ring-white/10">
                                {label}
                              </div>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                  {post.comments.map((comment, idx) => (
                    <div 
                      key={comment.id} 
                      className="flex gap-3 animate-fade-in-up"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-white/10 transition-all hover:ring-white/30">
                        {comment.user.avatar ? (
                          <Image
                            src={comment.user.avatar}
                            alt={comment.user.name}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder-user.jpg"
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                            {comment.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="group rounded-lg bg-slate-800/50 p-3 transition-all hover:bg-slate-800/70">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-sm text-white">{comment.user.name}</div>
                            {comment.user.id === currentUserId && (
                              <button
                                onClick={() => deleteComment(comment.id)}
                                className="text-slate-400 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-slate-300">{comment.content}</p>
                        </div>
                        <div className="mt-1 ml-1 text-xs text-slate-500">{formatTimeAgo(comment.createdAt, comment.id)}</div>
                      </div>
                    </div>
                  ))}

                  {/* Add Comment */}
                  <div className="flex gap-2 items-center">
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-white/10">
                      {profileData?.user?.avatar ? (
                        <Image
                          src={profileData.user.avatar}
                          alt={profileData.user.name || "Your avatar"}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-user.jpg"
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                          {profileData?.user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                      }
                      onKeyPress={(e) => e.key === "Enter" && addComment(post.id)}
                      placeholder="Write a comment... 💬"
                      className="flex-1 rounded-lg bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-2 focus:ring-indigo-400/50 focus:bg-slate-800/70"
                    />
                    <button
                      onClick={() => addComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                      className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 p-2 text-white transition-all hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )})}

            {/* Posts are loaded via React Query */}
          </div>
        )}
      </div>

      {/* Tag Dropdown Portal */}
      {showTagDropdown && tagButtonRect && typeof window !== 'undefined' && createPortal(
        <div 
          ref={tagDropdownRef}
          className="fixed w-80 rounded-xl bg-slate-900/95 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl z-[9999] max-h-96 overflow-hidden flex flex-col"
          style={{
            top: `${tagButtonRect.bottom + window.scrollY + 8}px`,
            left: `${tagButtonRect.left + window.scrollX}px`,
          }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-white/10">
            <input
              type="text"
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              placeholder="Search staff..."
              className="w-full rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-indigo-400/50"
              autoFocus
            />
          </div>

          {/* Staff List */}
          <div className="overflow-y-auto max-h-72">
            {filteredStaffUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">
                {tagSearchQuery ? 'No staff found' : 'All staff members are tagged'}
              </div>
            ) : (
              <div className="p-2">
                {filteredStaffUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => toggleTagUser(user)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-all text-left"
                  >
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-white/10">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{user.name}</div>
                    </div>
                    <div className="flex items-center justify-center w-5 h-5 rounded border-2 border-slate-600">
                      {taggedUsers.some(u => u.id === user.id) && (
                        <div className="w-3 h-3 rounded bg-indigo-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Reactors Modal */}
      {showReactorsModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md h-[600px] flex flex-col rounded-2xl bg-slate-900/95 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-indigo-500/20 p-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {reactionFilter === 'ALL' 
                      ? 'All Reactions' 
                      : reactionIcons[reactionFilter as ReactionType]?.label || 'Reactions'
                    }
                  </h3>
                  <p className="text-sm text-slate-400">
                    {reactionFilter === 'ALL'
                      ? `${selectedPostReactions.length} reaction${selectedPostReactions.length !== 1 ? 's' : ''}`
                      : `${selectedPostReactions.filter(r => r.type === reactionFilter).length} ${reactionIcons[reactionFilter as ReactionType]?.label.toLowerCase() || 'reaction'}${selectedPostReactions.filter(r => r.type === reactionFilter).length !== 1 ? 's' : ''}`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReactorsModal(false)}
                className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-800/50 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="p-3 flex-shrink-0">
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {/* All Button */}
                <button
                  onClick={() => setReactionFilter('ALL')}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    reactionFilter === 'ALL'
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>All</span>
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold min-w-[18px] text-center">
                    {selectedPostReactions.length}
                  </span>
                </button>

                {/* Individual Reaction Filters */}
                {Object.entries(reactionIcons).map(([type, { icon: Icon, color }]) => {
                  const count = selectedPostReactions.filter(r => r.type === type).length
                  if (count === 0) return null // Don't show filter if no reactions of this type
                  
                  return (
                    <button
                      key={type}
                      onClick={() => setReactionFilter(type as ReactionType)}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                        reactionFilter === type
                          ? 'bg-slate-700 text-white ring-2 ring-white/20'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold min-w-[18px] text-center">
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0 scrollbar-hide">
              <div className="space-y-1.5">
                {selectedPostReactions
                  .filter(reaction => reactionFilter === 'ALL' || reaction.type === reactionFilter)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((reaction, idx) => {
                    const IconComponent = reactionIcons[reaction.type as ReactionType]?.icon || ThumbsUp
                    const color = reactionIcons[reaction.type as ReactionType]?.color || "text-blue-400"
                    const label = reactionIcons[reaction.type as ReactionType]?.label || "Like"
                    
                    return (
                      <div
                        key={idx}
                        className="group flex items-center gap-3 rounded-lg p-2 transition-all hover:bg-slate-800/50"
                      >
                        {/* User Avatar */}
                        <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-white/10">
                          {reaction.user.avatar ? (
                            <Image
                              src={reaction.user.avatar}
                              alt={reaction.user.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm">
                              {reaction.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm">{reaction.user.name}</div>
                        </div>

                        {/* Reaction Icon */}
                        <div className="rounded-full bg-slate-800/50 p-1.5">
                          <IconComponent className={`h-4 w-4 ${color}`} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-white/10 p-4 flex-shrink-0">
              <div className="text-center text-xs text-slate-500">
                Sorted by most recent
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
