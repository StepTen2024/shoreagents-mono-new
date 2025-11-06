'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSocket } from '@/lib/socket'

// Types
export interface ActivityPost {
  id: string
  type: string
  content: string
  images: string[]
  createdAt: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
  reactions: Array<{
    id: string
    type: string
    createdAt: string
    user: {
      id: string
      name: string
      avatar: string | null
    }
  }>
  // 🚀 Facebook-style reaction analytics
  reactionStats: Record<string, number>
  // 🚀 User's reactions to this post
  userReactions: string[]
  // 🚀 Recent reactions timeline
  recentReactions: Array<{
    id: string
    type: string
    createdAt: string
    user: {
      id: string
      name: string
      avatar: string | null
    }
  }>
  // 🚀 Total reaction count
  totalReactions: number
  comments: Array<{
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      name: string
      avatar: string | null
    }
  }>
  taggedUsers: Array<{
    id: string
    name: string
    avatar: string | null
  }>
}

export interface CreatePostData {
  type: string
  content: string
  images?: string[]
  taggedUserIds?: string[]
  audience?: string
}

export interface ReactionData {
  postId: string
  type: string
}

export interface CommentData {
  postId: string
  content: string
}

// Query Keys
export const activityKeys = {
  all: ['activity'] as const,
  posts: () => [...activityKeys.all, 'posts'] as const,
  post: (id: string) => [...activityKeys.posts(), id] as const,
}

export const profileKeys = {
  all: ['profile'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
}

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (unreadOnly?: boolean) => [...notificationKeys.all, 'list', { unreadOnly }] as const,
}

// Custom Hooks
export function useActivityPosts() {
  return useQuery({
    queryKey: activityKeys.posts(),
    queryFn: async (): Promise<ActivityPost[]> => {
      const response = await fetch('/api/posts')
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      const data = await response.json()
      console.log('API Response:', data)
      // The API returns { posts: [...], pagination: {...} }
      return data.posts || []
    },
    staleTime: 1000 * 60, // 1 minute - data is fresh for 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes cache - keep in memory longer
    refetchInterval: false, // Disable interval, rely on websockets + manual refetch
    refetchIntervalInBackground: false,
    retry: 1, // Only retry once for faster failure
    retryDelay: 500, // 500ms retry delay (faster)
    refetchOnMount: 'always', // Always fetch on mount, but show cached data immediately
    refetchOnWindowFocus: false, // Don't refetch on window focus
    placeholderData: (previousData) => previousData, // Keep showing old data while fetching
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  return useMutation({
    mutationFn: async (data: CreatePostData): Promise<ActivityPost> => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create post')
      }
      
      return response.json()
    },
    onSuccess: (newPost) => {
      // Optimistically update the cache
      queryClient.setQueryData(activityKeys.posts(), (oldPosts: ActivityPost[] = []) => {
        return [newPost, ...oldPosts]
      })
      
      // Emit socket event for real-time updates
      if (socket) {
        socket.emit('newPost', newPost)
      }
    },
    onError: (error) => {
      console.error('Failed to create post:', error)
    },
  })
}

export function useAddReaction(currentUserId?: string, currentUser?: { name: string; avatar: string | null }) {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  return useMutation({
    mutationFn: async (data: ReactionData): Promise<{ action: string; reaction: any }> => {
      console.log('📤 [API Request] Sending:', data)
      const response = await fetch('/api/posts/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ [API Response] Error:', response.status, errorData)
        throw new Error(`Failed to toggle reaction: ${errorData.error || errorData.details || 'Unknown error'}`)
      }
      
      const result = await response.json()
      console.log('✅ [API Response] Success:', result)
      return result
    },
    onMutate: async ({ postId, type }) => {
      console.log('⚡ [Optimistic] Starting update for:', postId, type)
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: activityKeys.posts() })
      
      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(activityKeys.posts())
      
      // Optimistically update
      queryClient.setQueryData(activityKeys.posts(), (oldPosts: ActivityPost[] = []) => {
        return oldPosts.map(post => {
          if (post.id === postId) {
            const hasUserReaction = post.userReactions.includes(type)
            console.log('⚡ [Optimistic] User has reaction?', hasUserReaction, 'Current reactions:', post.userReactions)
            
            if (hasUserReaction) {
              // Remove reaction optimistically - immediately remove from UI
              console.log('🗑️ [Optimistic] Removing reaction')
              const updated = {
                ...post,
                userReactions: post.userReactions.filter(r => r !== type),
                reactions: post.reactions.filter(r => {
                  // Remove reactions of this type from current user (both optimistic and real)
                  if (r.type === type && r.user.id === currentUserId) {
                    return false // Remove it
                  }
                  return true // Keep it
                }),
                reactionStats: {
                  ...post.reactionStats,
                  [type]: Math.max(0, (post.reactionStats[type] || 1) - 1)
                },
                totalReactions: Math.max(0, post.totalReactions - 1)
              }
              console.log('✅ [Optimistic] Removed! New userReactions:', updated.userReactions)
              return updated
            } else {
              // Add reaction optimistically
              console.log('➕ [Optimistic] Adding reaction')
              const optimisticReaction = {
                id: `temp-${Date.now()}`,
                type,
                createdAt: new Date().toISOString(),
                user: {
                  id: currentUserId || 'current-user',
                  name: currentUser?.name || 'You',
                  avatar: currentUser?.avatar || null,
                }
              }
              const updated = {
                ...post,
                userReactions: [...post.userReactions, type],
                reactions: [optimisticReaction, ...post.reactions],
                reactionStats: {
                  ...post.reactionStats,
                  [type]: (post.reactionStats[type] || 0) + 1
                },
                totalReactions: post.totalReactions + 1
              }
              console.log('✅ [Optimistic] Added! New userReactions:', updated.userReactions)
              return updated
            }
          }
          return post
        })
      })
      
      return { previousPosts }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(activityKeys.posts(), context.previousPosts)
      }
    },
    onSuccess: (result, { postId, type }) => {
      console.log('✅ [API Success] Reaction toggle completed:', result.action)
      
      // Emit socket event
      if (socket) {
        if (result.action === 'added') {
          socket.emit('reactionAdded', { postId, type })
        } else {
          socket.emit('reactionRemoved', { postId, type })
        }
      }
      
      // Trigger refetch in background (don't wait for it)
      console.log('🔄 [Refetch] Triggering background refetch...')
      queryClient.invalidateQueries({ 
        queryKey: activityKeys.posts(),
        refetchType: 'active'
      })
    },
    onError: (err, variables, context) => {
      console.error('❌ [API Error] Reaction toggle failed:', err)
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(activityKeys.posts(), context.previousPosts)
      }
      // Refetch to ensure we have the correct state
      queryClient.invalidateQueries({ queryKey: activityKeys.posts() })
    },
  })
}

export function useAddComment(currentUser?: { id: string; name: string; avatar: string | null }) {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  return useMutation({
    mutationFn: async (data: CommentData): Promise<void> => {
      const response = await fetch('/api/posts/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to add comment')
      }
    },
    onMutate: async ({ postId, content }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: activityKeys.posts() })
      
      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(activityKeys.posts())
      
      // Optimistically update
      queryClient.setQueryData(activityKeys.posts(), (oldPosts: ActivityPost[] = []) => {
        return oldPosts.map(post => {
          if (post.id === postId) {
            // Add optimistic comment with current user's data
            const optimisticComment = {
              id: `temp-${Date.now()}`,
              content,
              createdAt: new Date().toISOString(),
              user: {
                id: currentUser?.id || 'current-user',
                name: currentUser?.name || 'You',
                avatar: currentUser?.avatar || null,
              }
            }
            return {
              ...post,
              comments: [...post.comments, optimisticComment]
            }
          }
          return post
        })
      })
      
      return { previousPosts }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(activityKeys.posts(), context.previousPosts)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: activityKeys.posts() })
    },
    onSuccess: (_, { postId }) => {
      // Emit socket event
      if (socket) {
        socket.emit('commentAdded', { postId })
      }
    },
  })
}

// Profile hook
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: async () => {
      const response = await fetch('/api/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - profile doesn't change often
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  })
}

// Notifications hook
export function useNotifications(unreadOnly = true, limit = 10) {
  return useQuery({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: async () => {
      const params = new URLSearchParams({
        unreadOnly: unreadOnly.toString(),
        limit: limit.toString(),
      })
      const response = await fetch(`/api/notifications?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      return response.json()
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1,
  })
}

// Socket integration for real-time updates
export function useActivitySocket() {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  // Listen for real-time updates
  React.useEffect(() => {
    if (!socket) return

    const handleNewPost = (newPost: ActivityPost) => {
      queryClient.setQueryData(activityKeys.posts(), (oldPosts: ActivityPost[] = []) => {
        return [newPost, ...oldPosts]
      })
    }

    const handleReactionUpdate = (data: { postId: string }) => {
      queryClient.invalidateQueries({ queryKey: activityKeys.posts() })
    }

    const handleCommentUpdate = (data: { postId: string }) => {
      queryClient.invalidateQueries({ queryKey: activityKeys.posts() })
    }

    socket.on('newPost', handleNewPost)
    socket.on('reactionAdded', handleReactionUpdate)
    socket.on('commentAdded', handleCommentUpdate)

    return () => {
      socket.off('newPost', handleNewPost)
      socket.off('reactionAdded', handleReactionUpdate)
      socket.off('commentAdded', handleCommentUpdate)
    }
  }, [socket, queryClient])
}
