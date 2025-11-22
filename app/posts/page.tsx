"use client"

import { useState, useEffect } from "react"
import { Plus, Filter, Loader2 } from "lucide-react"
import { PostCardStaff } from "@/components/posts/post-card-staff"
import { CreatePostModal } from "@/components/posts/create-post-modal"

export default function StaffPostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all_staff")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [filter])

  async function fetchPosts() {
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/feed?filter=${filter}&page=1&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        setHasMore(data.pagination?.hasMore || false)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreatePost(data: {
    content: string
    type: string
    audience: string
    images: string[]
  }) {
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to create post")
    }

    // Refresh feed
    fetchPosts()
  }

  async function handleReshare(postId: string) {
    const comment = prompt("Add a comment to your reshare (optional):")
    if (comment === null) return // User cancelled

    try {
      const response = await fetch("/api/posts/reshare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalPostId: postId,
          reshareComment: comment || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reshare")
      }

      // Refresh feed
      fetchPosts()
      alert("Post reshared successfully! 🎉")
    } catch (error) {
      console.error("Error resharing:", error)
      alert("Failed to reshare post")
    }
  }

  const filterOptions = [
    { value: "all_staff", label: "👥 All Staff", description: "Posts from all staff colleagues" },
    { value: "my_team", label: "👨‍👩‍👧‍👦 My Team", description: "Your department only" },
    { value: "my_client", label: "🏢 My Client", description: "Posts from your assigned client" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2">
                Social Feed
              </h1>
              <p className="text-slate-400">Connect, share, and celebrate with your team</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create Post
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filter === option.value
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-slate-400 mb-6">Be the first to share something amazing!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Create First Post
            </button>
          </div>
        ) : (
          /* Posts feed */
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCardStaff
                key={post.id}
                post={post}
                onReshare={handleReshare}
                onUpdate={fetchPosts}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create post modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePost}
        userType="STAFF"
        isDark={true}
      />
    </div>
  )
}


