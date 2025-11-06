"use client"

import { useState, useEffect, useRef } from "react"
import { Heart, ThumbsUp, Flame, PartyPopper, Sparkles, MessageSquare, Send, Image as ImageIcon, FileText, Trash2, X, Laugh, Skull, Rocket, Zap, BrainCircuit, AtSign } from "lucide-react"
import Image from "next/image"
import { useWebSocket } from "@/lib/websocket-provider"

type PostType = "UPDATE" | "WIN" | "CELEBRATION" | "ACHIEVEMENT" | "KUDOS" | "ANNOUNCEMENT"
type ReactionType = "LIKE" | "LOVE" | "FIRE" | "CELEBRATE" | "CLAP" | "LAUGH" | "POO" | "ROCKET" | "SHOCKED" | "MIND_BLOWN"

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
  createdAt: string
  user: User
  reactions: Reaction[]
  comments: Comment[]
}

const reactionIcons = {
  LIKE: { icon: ThumbsUp, color: "text-blue-500", label: "Like" },
  LOVE: { icon: Heart, color: "text-red-500", label: "Love" },
  FIRE: { icon: Flame, color: "text-orange-500", label: "Fire" },
  CELEBRATE: { icon: PartyPopper, color: "text-purple-500", label: "Celebrate" },
  CLAP: { icon: Sparkles, color: "text-emerald-500", label: "Clap" },
  LAUGH: { icon: Laugh, color: "text-yellow-500", label: "Haha" },
  POO: { icon: Skull, color: "text-amber-600", label: "Poo" },
  ROCKET: { icon: Rocket, color: "text-cyan-500", label: "Rocket" },
  SHOCKED: { icon: Zap, color: "text-pink-500", label: "Shocked" },
  MIND_BLOWN: { icon: BrainCircuit, color: "text-fuchsia-500", label: "Mind Blown" },
}

export default function ClientActivityFeed() {
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

  // 🔥 Listen for real-time activity updates
  useEffect(() => {
    if (!on || !off) return

    // New post added
    const handleNewPost = (newPost: any) => {
      // Only add if it matches our audience filter (CLIENT or ALL)
      if (newPost.audience === 'CLIENT' || newPost.audience === 'ALL') {
        setPosts((prev) => [newPost, ...prev])
        console.log('✨ New post received:', newPost.id)
      }
    }

    // Reaction added/updated/removed
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

    // Comment added/deleted
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
  }, [on, off])

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
      const response = await fetch("/api/client/staff")
      const data = await response.json()
      setStaffList(data.staff || [])
    } catch (error) {
      console.error("Error fetching staff:", error)
    }
  }

  const fetchPosts = async (pageNum = 1) => {
    try {
      // Clients see posts for CLIENT and ALL audiences (15 posts per page)
      const response = await fetch(`/api/posts?audience=CLIENT&page=${pageNum}&limit=15`)
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
          type: "UPDATE",
          images: imageUrls,
          taggedUserIds: selectedStaff,
          audience: "CLIENT", // Client posts go to client feed
        }),
      })

      if (response.ok) {
        setNewPostContent("")
        setSelectedImages([])
        setImagePreviews([])
        setSelectedStaff([])
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
    const content = commentInputs[postId]
    if (!content?.trim()) return

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-white rounded-xl shadow"></div>
            <div className="h-48 bg-white rounded-xl shadow"></div>
            <div className="h-48 bg-white rounded-xl shadow"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📰 The Feed
          </h1>
          <p className="text-gray-600">Stay connected with your team</p>
        </div>

        {/* New Post Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share an update with your team..."
            className="w-full min-h-[100px] bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                  <span key={staffId} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    <AtSign className="h-3 w-3" />
                    {staff.name}
                    <button
                      onClick={() => setSelectedStaff(selectedStaff.filter(id => id !== staffId))}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : null
              })}
            </div>
          )}

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
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ImageIcon className="h-5 w-5" />
                <span>Add Images</span>
              </button>
              
              {/* Tag Staff Button */}
              <div className="relative">
                <button
                  onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <AtSign className="h-5 w-5" />
                  <span>Tag Staff</span>
                </button>

                {/* Staff Dropdown */}
                {showStaffDropdown && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10 max-h-64 overflow-y-auto">
                    {staffList.map((staff) => (
                      <label
                        key={staff.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer"
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
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {getInitials(staff.name)}
                          </div>
                        )}
                        <span className="text-sm text-gray-900">{staff.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCreatePost}
              disabled={(!newPostContent.trim() && selectedImages.length === 0) || uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-gray-600 text-lg">No posts yet</p>
            <p className="text-gray-500 text-sm mt-2">Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Post Header */}
                <div className="flex items-start gap-3 mb-4">
                  {post.user.avatar ? (
                    <Image
                      src={post.user.avatar}
                      alt={post.user.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {getInitials(post.user.name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{post.user.name}</h3>
                      {post.user.role && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {post.user.role}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-gray-900 mb-4 whitespace-pre-wrap">{post.content}</p>

                {/* Tagged Users */}
                {post.taggedUsers && post.taggedUsers.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {post.taggedUsers.map((staff) => (
                      <span key={staff.id} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                        <AtSign className="h-3 w-3" />
                        {staff.name}
                      </span>
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
                        className="w-full rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}

                {/* Reactions */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {Object.entries(reactionIcons).map(([type, { icon: Icon, color, label }]) => {
                    const count = post.reactions.filter((r) => r.type === type).length
                    const hasReacted = post.reactions.some((r) => r.type === type && r.user.id === currentUserId)
                    return (
                      <button
                        key={type}
                        onClick={() => handleReaction(post.id, type as ReactionType)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                          hasReacted
                            ? "bg-blue-50 border-2 border-blue-500"
                            : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${color}`} />
                        {count > 0 && <span className="text-sm font-medium text-gray-700">{count}</span>}
                      </button>
                    )
                  })}
                </div>

                {/* Comments */}
                <div className="border-t border-gray-200 pt-4">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 mb-3">
                      {comment.user.avatar ? (
                        <Image
                          src={comment.user.avatar}
                          alt={comment.user.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {getInitials(comment.user.name)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <p className="font-semibold text-sm text-gray-900">{comment.user.name}</p>
                          <p className="text-gray-800 text-sm">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{formatTimeAgo(comment.createdAt)}</span>
                          {comment.user.id === currentUserId && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Comment Input */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyPress={(e) => e.key === "Enter" && handleComment(post.id)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-gray-100 border border-gray-200 rounded-full px-4 py-2 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {!loading && hasMore && (
              <div className="flex flex-col items-center gap-2 py-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium transition-all hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-blue-500/20"
                >
                  {loadingMore ? "Loading..." : "Load More Posts"}
                </button>
                <p className="text-sm text-gray-500">
                  Showing {posts.length} of {total} posts
                </p>
              </div>
            )}

            {/* No More Posts Message */}
            {!loading && !hasMore && posts.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-gray-400">🎉 You've reached the end!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

