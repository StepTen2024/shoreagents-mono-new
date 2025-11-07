"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { MessageSquare, Send, Edit2, Trash2, Reply, Loader2 } from "lucide-react"
import { ReactionPicker } from "./reaction-picker"
import { useCurrentUser } from "@/hooks/use-current-user"

interface Comment {
  id: string
  content: string
  authorType: string
  authorId: string
  createdAt: string
  updatedAt: string
  editedAt?: string
  isEdited: boolean
  isDeleted: boolean
  parentId?: string
  attachments: string[]
  reactions: Reaction[]
  replies?: Comment[]
}

interface Reaction {
  id: string
  emoji: string
  authorType: string
  authorId: string
}

interface CommentSectionProps {
  commentableType: string // "TICKET" | "TASK" | "CANDIDATE" | "TIME_ENTRY" | etc.
  commentableId: string
  darkMode?: boolean
}

export function CommentSection({
  commentableType,
  commentableId,
  darkMode = false,
}: CommentSectionProps) {
  // 🔥 AUTO-FETCH REAL USER DATA
  const { user: currentUser, loading: userLoading } = useCurrentUser()
  
  // Extract user data (with fallbacks)
  const currentUserType = currentUser?.type || "MANAGEMENT"
  const currentUserId = currentUser?.id || ""
  const currentUserName = currentUser?.name || "Unknown User"
  const currentUserAvatar = currentUser?.avatar || null
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchComments()
  }, [commentableType, commentableId])

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `/api/comments?type=${commentableType}&id=${commentableId}`
      )
      if (!response.ok) throw new Error("Failed to fetch comments")
      const data = await response.json()
      setComments(data.comments || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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
          content: newComment,
        }),
      })

      if (!response.ok) throw new Error("Failed to post comment")

      toast({
        title: "Success",
        description: "Comment posted successfully",
      })

      setNewComment("")
      fetchComments()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentableType,
          commentableId,
          content: replyContent,
          parentId,
        }),
      })

      if (!response.ok) throw new Error("Failed to post reply")

      toast({
        title: "Success",
        description: "Reply posted successfully",
      })

      setReplyContent("")
      setReplyingTo(null)
      fetchComments()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })

      if (!response.ok) throw new Error("Failed to edit comment")

      toast({
        title: "Success",
        description: "Comment edited successfully",
      })

      setEditingId(null)
      setEditContent("")
      fetchComments()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to edit comment",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete comment")

      toast({
        title: "Success",
        description: "Comment deleted successfully",
      })

      fetchComments()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      })
    }
  }

  const isOwnComment = (comment: Comment) => {
    return comment.authorType === currentUserType && comment.authorId === currentUserId
  }

  const CommentCard = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const isOwn = isOwnComment(comment)
    const isEditing = editingId === comment.id

    if (comment.isDeleted) {
      return (
        <div
          className={`${isReply ? "ml-12" : ""} p-3 rounded-lg ${
            darkMode ? "bg-slate-800/30" : "bg-gray-100"
          } italic text-sm ${darkMode ? "text-slate-500" : "text-gray-500"}`}
        >
          [Comment deleted]
        </div>
      )
    }

    return (
      <div className={`${isReply ? "ml-12" : ""} flex gap-3`}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={currentUserAvatar} />
          <AvatarFallback className={darkMode ? "bg-slate-700" : "bg-gray-300"}>
            {comment.authorType.slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div
            className={`rounded-lg p-3 ${
              darkMode
                ? "bg-slate-800/50 border border-slate-700"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span
                  className={`font-semibold text-sm ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {isOwn ? "You" : `${comment.authorType}`}
                </span>
                <span
                  className={`text-xs ml-2 ${
                    darkMode ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  {new Date(comment.createdAt).toLocaleString()}
                  {comment.isEdited && " (edited)"}
                </span>
              </div>

              {isOwn && !isEditing && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(comment.id)
                      setEditContent(comment.content)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={darkMode ? "bg-slate-900 text-white border-slate-700" : "bg-white text-gray-900 border-gray-300"}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment.id)}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null)
                      setEditContent("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p
                  className={`text-sm whitespace-pre-wrap ${
                    darkMode ? "text-slate-200" : "text-gray-700"
                  }`}
                >
                  {comment.content}
                </p>

                {/* Reactions */}
                <div className="flex items-center gap-2 mt-3">
                  <ReactionPicker
                    reactableType="COMMENT"
                    reactableId={comment.id}
                    existingReactions={comment.reactions}
                    onReactionChange={fetchComments}
                    darkMode={darkMode}
                  />

                  {!isReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(comment.id)}
                      className="text-xs"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Reply Input */}
          {replyingTo === comment.id && (
            <div className="mt-3 ml-2 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className={darkMode ? "bg-slate-900 text-white border-slate-700" : "bg-white text-gray-900 border-gray-300"}
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={submitting || !replyContent.trim()}
                >
                  {submitting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-1" />
                      Reply
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyContent("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentCard key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className={`h-5 w-5 ${darkMode ? "text-slate-400" : "text-gray-600"}`} />
        <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
          Comments ({comments.filter((c) => !c.parentId && !c.isDeleted).length})
        </h3>
      </div>

      {/* New Comment Input */}
      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className={darkMode ? "bg-slate-900 text-white border-slate-700" : "bg-white text-gray-900 border-gray-300"}
          rows={3}
        />
        <Button
          onClick={handleSubmitComment}
          disabled={submitting || !newComment.trim()}
          size="sm"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Post Comment
        </Button>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments
          .filter((c) => !c.parentId && !c.isDeleted)
          .map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}

        {comments.filter((c) => !c.parentId && !c.isDeleted).length === 0 && (
          <p className={`text-sm text-center py-8 ${darkMode ? "text-slate-500" : "text-gray-500"}`}>
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  )
}

