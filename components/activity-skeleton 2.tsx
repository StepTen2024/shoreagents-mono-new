'use client'

import { Skeleton } from "@/components/ui/skeleton"

export function ActivitySkeleton() {
  return (
    <div className="space-y-6">
      {/* Post Creation Skeleton */}
      <div className="rounded-xl bg-slate-800/50 p-6 ring-1 ring-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-20 w-full mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Posts Skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-slate-800/50 p-6 ring-1 ring-white/10">
          {/* Post Header */}
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          {/* Images Skeleton */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>

          {/* Tagged Users Skeleton */}
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          {/* Reactions Skeleton */}
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-20" />
          </div>

          <div className="flex gap-2 mb-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="h-8 w-12 rounded-full" />
            ))}
          </div>

          {/* Comments Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ActivityPostSkeleton() {
  return (
    <div className="rounded-xl bg-slate-800/50 p-6 ring-1 ring-white/10">
      {/* Post Header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Images Skeleton */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>

      {/* Tagged Users Skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Reactions Skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="flex gap-2 mb-4">
        {Array.from({ length: 6 }).map((_, j) => (
          <Skeleton key={j} className="h-8 w-12 rounded-full" />
        ))}
      </div>

      {/* Comments Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        {Array.from({ length: 2 }).map((_, k) => (
          <div key={k} className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}


