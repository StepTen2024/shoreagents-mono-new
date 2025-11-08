"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2 } from "lucide-react"
import { PostCardClient } from "@/components/posts/post-card-client"
import { CreatePostModal } from "@/components/posts/create-post-modal"

export default function ClientPostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/feed?filter=my_team&page=1&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
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
    if (comment === null) return

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

      fetchPosts()
      alert("Post reshared successfully! 🎉")
    } catch (error) {
      console.error("Error resharing:", error)
      alert("Failed to reshare post")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Team Feed
              </h1>
              <p className="text-gray-600">Stay connected with your team and management</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create Post
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-6">Be the first to share something with your team!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all"
            >
              Create First Post
            </button>
          </div>
        ) : (
          /* Posts feed */
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCardClient
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
        userType="CLIENT"
        isDark={false}
      />
    </div>
  )
}

