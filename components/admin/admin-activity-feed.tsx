"use client"

import { useState, useEffect, useRef } from "react"
import { Heart, ThumbsUp, Flame, PartyPopper, Sparkles, MessageSquare, Send, Image as ImageIcon, Trash2, X, Laugh, Skull, Rocket, Zap, BrainCircuit, AtSign, Users, Building, Shield, Globe } from "lucide-react"
import Image from "next/image"
import { useWebSocket } from "@/lib/websocket-provider"

type PostType = "UPDATE" | "WIN" | "CELEBRATION" | "ACHIEVEMENT" | "KUDOS" | "ANNOUNCEMENT"
type ReactionType = "LIKE" | "LOVE" | "FIRE" | "CELEBRATE" | "CLAP" | "LAUGH" | "POO" | "ROCKET" | "SHOCKED" | "MIND_BLOWN"
type PostAudience = "STAFF" | "CLIENT" | "MANAGEMENT" | "ALL"

interface User {
  id: string
  name: string
  avatar: string | null
  role?: string
}

interface StaffMember {
  id: string
  name: string
  avatar: string | null
}

interface Reaction {
  id: string
  type: ReactionType
  user: {
    id: string
    name: string
  }
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
}

interface Post {
  id: string
  content: string
  type: PostType
  images: string[]
  taggedUsers?: StaffMember[]
  audience?: PostAudience
  createdAt: string
  user: User
  reactions: Reaction[]
  comments: Comment[]
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

const audienceConfig = {
  STAFF: { icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", label: "Staff Only" },
  CLIENT: { icon: Building, color: "text-green-400", bg: "bg-green-500/10", label: "Client Feed" },
  MANAGEMENT: { icon: Shield, color: "text-purple-400", bg: "bg-purple-500/10", label: "Management" },
  ALL: { icon: Globe, color: "text-indigo-400", bg: "bg-indigo-500/10", label: "Everyone" },
}

export default function AdminActivityFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({})
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [showStaffDropdown, setShowStaffDropdown] = useState(false)
  const [selectedAudience, setSelectedAudience] = useState<PostAudience>("ALL")
  const [filterAudience, setFilterAudience] = useState<PostAudience | "ALL_FILTER">("ALL_FILTER")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 🔥 WebSocket for real-time updates
  const { on, off } = useWebSocket()

  useEffect(() => {
    fetchPosts()
    fetchCurrentUser()
    fetchStaff()
  }, [])

  useEffect(() => {
    setPage(1)
    setHasMore(true)
    fetchPosts(1)
  }, [filterAudience])

  // 🔥 Listen for real-time activity updates
  useEffect(() => {
    if (!on || !off) return

    // New post added
    const handleNewPost = (newPost: any) => {
      // Check if post matches current filter
      const matchesFilter = filterAudience === 'ALL_FILTER' || 
                           newPost.audience === filterAudience || 
                           newPost.audience === 'ALL'
      
      if (matchesFilter) {
        setPosts((prev) => [newPost, ...prev])
        console.log('✨ New post received:', newPost.id)
      }
    }

    // Reaction events
    const handleReactionAdded = (data: any) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === data.postId
            ? { ...post, reactions: [...post.reactions, data.reaction] }
            : post
        )
      )
    }

    const handleReactionUpdated = (data: any) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === data.postId
            ? {
                ...post,
                reactions: post.reactions.map((r) =>
                  r.user.id === data.reaction.user.id ? data.reaction : r
                ),
              }
            : post
        )
      )
    }

    const handleReactionRemoved = (data: any) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === data.postId
            ? {
                ...post,
                reactions: post.reactions.filter(
                  (r) => !(r.user.id === data.userId && r.type === data.type)
                ),
              }
            : post
        )
      )
    }

    // Comment events
    const handleCommentAdded = (data: any) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === data.postId
            ? { ...post, comments: [...post.comments, data.comment] }
            : post
        )
      )
    }

    const handleCommentDeleted = (data: any) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === data.postId
            ? {
                ...post,
                comments: post.comments.filter((c) => c.id !== data.commentId),
              }
            : post
        )
      )
    }

    // Register event listeners
    on('activity:newPost', handleNewPost)
    on('activity:reactionAdded', handleReactionAdded)
    on('activity:reactionUpdated', handleReactionUpdated)
    on('activity:reactionRemoved', handleReactionRemoved)
    on('activity:commentAdded', handleCommentAdded)
    on('activity:commentDeleted', handleCommentDeleted)

    // Cleanup on unmount
    return () => {
      off('activity:newPost', handleNewPost)
      off('activity:reactionAdded', handleReactionAdded)
      off('activity:reactionUpdated', handleReactionUpdated)
      off('activity:reactionRemoved', handleReactionRemoved)
      off('activity:commentAdded', handleCommentAdded)
      off('activity:commentDeleted', handleCommentDeleted)
    }
  }, [on, off, filterAudience])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/session")
      const data = await response.json()
      if (data?.user?.id) {
        setCurrentUserId(data.user.id)
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/admin/staff")
      const data = await response.json()
      setStaffList(data.staff || [])
    } catch (error) {
      console.error("Error fetching staff:", error)
    }
  }

  const fetchPosts = async (pageNum = 1) => {
    try {
      const baseUrl = filterAudience === "ALL_FILTER" 
        ? `/api/posts?page=${pageNum}&limit=15`
        : `/api/posts?audience=${filterAudience}&page=${pageNum}&limit=15`
      
      const response = await fetch(baseUrl)
      const data = await response.json()
      
      if (pageNum === 1) {
        setPosts(data.posts || [])
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])])
      }
      
      setHasMore(data.pagination?.hasMore || false)
      setTotal(data.pagination?.total || 0)
      setPage(pageNum)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await fetchPosts(page + 1)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    setSelectedImages(fileArray)

    const previews = fileArray.map((file) => URL.createObjectURL(file))
    setImagePreviews(previews)
  }

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setSelectedImages(newImages)
    setImagePreviews(newPreviews)
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && selectedImages.length === 0) return

    setUploading(true)
    try {
      let imageUrls: string[] = []

      if (selectedImages.length > 0) {
        const uploadPromises = selectedImages.map(async (file) => {
          const formData = new FormData()
          formData.append("file", file)

          const response = await fetch("/api/posts/images", {
            method: "POST",
            body: formData,
          })

          if (response.ok) {
            const data = await response.json()
            return data.url
          }
          return null
        })

        const uploaded = await Promise.all(uploadPromises)
        imageUrls = uploaded.filter(Boolean)
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPostContent,
          type: "ANNOUNCEMENT",
          images: imageUrls,
          taggedUserIds: selectedStaff,
          audience: selectedAudience,
        }),
      })

      if (response.ok) {
        setNewPostContent("")
        setSelectedImages([])
        setImagePreviews([])
        setSelectedStaff([])
        setSelectedAudience("ALL")
        fetchPosts()
      }
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleReaction = async (postId: string, reactionType: ReactionType) => {
    try {
      await fetch("/api/posts/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type: reactionType }),
      })
      fetchPosts()
    } catch (error) {
      console.error("Error adding reaction:", error)
    }
  }

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim()
    if (!content) return

    try {
      await fetch("/api/posts/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      })
      setCommentInputs({ ...commentInputs, [postId]: "" })
      fetchPosts()
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await fetch(`/api/posts/comments?commentId=${commentId}`, {
        method: "DELETE",
      })
      fetchPosts()
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Management Feed
            </h1>
            <p className="text-slate-400 mt-1">Control the narrative. Lead the team. 🚀</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterAudience("ALL_FILTER")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterAudience === "ALL_FILTER"
                ? "bg-indigo-500 text-white shadow-lg"
                : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
            }`}
          >
            🌍 All Posts
          </button>
          {(Object.keys(audienceConfig) as PostAudience[]).map((audience) => {
            const { icon: Icon, label } = audienceConfig[audience]
            return (
              <button
                key={audience}
                onClick={() => setFilterAudience(audience)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  filterAudience === audience
                    ? "bg-purple-500 text-white shadow-lg"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            )
          })}
        </div>

        {/* Create Post */}
        <div className="rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-6 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share something epic with your team..."
            className="w-full min-h-[120px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />

          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tagged Staff Display */}
          {selectedStaff.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedStaff.map((staffId) => {
                const staff = staffList.find((s) => s.id === staffId)
                return staff ? (
                  <span key={staffId} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">
                    <AtSign className="h-3 w-3" />
                    {staff.name}
                    <button
                      onClick={() => setSelectedStaff(selectedStaff.filter(id => id !== staffId))}
                      className="ml-1 hover:bg-indigo-500/30 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : null
              })}
            </div>
          )}

          {/* Audience Selector */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-slate-400">Post to:</span>
            <div className="flex gap-2">
              {(Object.keys(audienceConfig) as PostAudience[]).map((audience) => {
                const { icon: Icon, color, bg, label } = audienceConfig[audience]
                return (
                  <button
                    key={audience}
                    onClick={() => setSelectedAudience(audience)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedAudience === audience
                        ? `${bg} ${color} ring-2 ring-current`
                        : "bg-slate-800/50 text-slate-500 hover:bg-slate-700/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <ImageIcon className="h-5 w-5" />
                <span>Add Images</span>
              </button>
              
              {/* Tag Staff Button */}
              <div className="relative">
                <button
                  onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <AtSign className="h-5 w-5" />
                  <span>Tag Staff</span>
                </button>

                {/* Staff Dropdown */}
                {showStaffDropdown && (
                  <div className="absolute left-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-2 z-50 max-h-64 overflow-y-auto">
                    {staffList.map((staff) => (
                      <label
                        key={staff.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStaff.includes(staff.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStaff([...selectedStaff, staff.id])
                            } else {
                              setSelectedStaff(selectedStaff.filter(id => id !== staff.id))
                            }
                          }}
                          className="rounded border-slate-600 text-purple-600 focus:ring-purple-500"
                        />
                        {staff.avatar ? (
                          <Image
                            src={staff.avatar}
                            alt={staff.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                            {getInitials(staff.name)}
                          </div>
                        )}
                        <span className="text-sm text-white">{staff.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCreatePost}
              disabled={(!newPostContent.trim() && selectedImages.length === 0) || uploading}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {uploading ? "Posting..." : "🚀 Post"}
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 rounded-xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-slate-400 text-lg">No posts yet in this feed</p>
            <p className="text-slate-500 text-sm mt-2">Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const audienceInfo = audienceConfig[post.audience || 'ALL']
              const Icon = audienceInfo.icon
              
              return (
                <div key={post.id} className="rounded-xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10 transition-all hover:ring-white/20">
                  {/* Post Header */}
                  <div className="flex items-start gap-3 mb-4">
                    {post.user.avatar ? (
                      <Image
                        src={post.user.avatar}
                        alt={post.user.name}
                        width={48}
                        height={48}
                        className="rounded-full ring-2 ring-purple-500/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {getInitials(post.user.name)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white">{post.user.name}</h3>
                        {post.user.role && (
                          <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                            {post.user.role}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 ${audienceInfo.bg} ${audienceInfo.color} rounded-full flex items-center gap-1`}>
                          <Icon className="h-3 w-3" />
                          {audienceInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{formatTimeAgo(post.createdAt)}</p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-white mb-4 whitespace-pre-wrap">{post.content}</p>

                  {/* Tagged Users */}
                  {post.taggedUsers && post.taggedUsers.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
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
                  {post.images.length > 0 && (
                    <div className={`grid ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-3 mb-4`}>
                      {post.images.map((image, index) => (
                        <Image
                          key={index}
                          src={image}
                          alt={`Post image ${index + 1}`}
                          width={400}
                          height={300}
                          className="w-full rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Reactions */}
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    {/* Reaction Summary */}
                    {post.reactions.length > 0 && (
                      <div className="text-sm text-slate-400">
                        {Object.entries(reactionIcons).map(([type, { icon: Icon, color }]) => {
                          const reactions = post.reactions.filter((r) => r.type === type)
                          if (reactions.length === 0) return null
                          return (
                            <span key={type} className="inline-flex items-center gap-1 mr-3">
                              <Icon className={`h-4 w-4 ${color}`} />
                              <span>{reactions.length}</span>
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {/* Reaction Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {Object.entries(reactionIcons).map(([type, { icon: Icon, color, label }]) => (
                        <button
                          key={type}
                          onClick={() => handleReaction(post.id, type as ReactionType)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all hover:bg-slate-800/50 ${
                            post.reactions.some((r) => r.type === type && r.user.id === currentUserId)
                              ? `${color} bg-slate-800/50`
                              : "text-slate-400"
                          }`}
                          title={label}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      ))}
                    </div>

                    {/* Comments */}
                    {post.comments.length > 0 && (
                      <div className="space-y-3">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            {comment.user.avatar ? (
                              <Image
                                src={comment.user.avatar}
                                alt={comment.user.name}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                {getInitials(comment.user.name)}
                              </div>
                            )}
                            <div className="flex-1 bg-slate-800/50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-white text-sm">{comment.user.name}</p>
                                {comment.user.id === currentUserId && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-slate-300 text-sm mt-1">{comment.content}</p>
                              <p className="text-xs text-slate-500 mt-1">{formatTimeAgo(comment.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ""}
                        onChange={(e) =>
                          setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Load More Button */}
            {!loading && hasMore && (
              <div className="flex flex-col items-center gap-2 py-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium transition-all hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-purple-500/20"
                >
                  {loadingMore ? "Loading..." : "Load More Posts"}
                </button>
                <p className="text-sm text-slate-400">
                  Showing {posts.length} of {total} posts
                </p>
              </div>
            )}

            {/* No More Posts Message */}
            {!loading && !hasMore && posts.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-slate-500">🎉 You've reached the end!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

