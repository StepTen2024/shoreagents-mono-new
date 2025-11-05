import { Skeleton } from "@/components/ui/skeleton"

export function TicketHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 bg-slate-700/50" />
        <Skeleton className="h-5 w-96 bg-slate-700/50" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-36 bg-slate-700/50 rounded-lg" />
        <Skeleton className="h-10 w-32 bg-slate-700/50 rounded-lg" />
      </div>
    </div>
  )
}

export function TicketTabsSkeleton() {
  return (
    <div className="grid w-full max-w-md grid-cols-4 gap-2 bg-slate-800/50 ring-1 ring-white/10 rounded-lg p-1 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 bg-slate-700/50 rounded-lg" />
      ))}
    </div>
  )
}

export function TicketSkeleton() {
  return (
    <div className="space-y-4">
      {/* Status bar skeleton */}
      <Skeleton className="h-4 w-full bg-gray-300 rounded-t-2xl" />
      
      <div className="space-y-4">
        {/* Header skeleton - Ticket ID and Priority */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 bg-gray-200 rounded-lg" />
          <Skeleton className="h-6 w-20 bg-gray-200 rounded-lg" />
        </div>

        {/* Title skeleton */}
        <Skeleton className="h-5 w-3/4 bg-gray-200" />

        {/* Category skeleton */}
        <Skeleton className="h-6 w-24 bg-gray-200 rounded-full" />

        {/* Description skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-gray-200" />
          <Skeleton className="h-4 w-5/6 bg-gray-200" />
        </div>

        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-12 bg-gray-200 rounded-lg" />
            <Skeleton className="h-6 w-12 bg-gray-200 rounded-lg" />
            <Skeleton className="h-4 w-16 bg-gray-200" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  )
}

export function TicketCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white shadow-lg border border-gray-200 p-5">
      <TicketSkeleton />
    </div>
  )
}

export function TicketListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl bg-slate-800/50 p-5 ring-1 ring-white/10 animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* Ticket ID and Priority */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 bg-slate-700/50 rounded-lg" />
                <Skeleton className="h-6 w-16 bg-slate-700/50 rounded-full" />
              </div>
              
              {/* Title */}
              <Skeleton className="h-5 w-3/4 bg-slate-700/50" />
              
              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-slate-700/50" />
                <Skeleton className="h-4 w-2/3 bg-slate-700/50" />
              </div>
              
              {/* Footer */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24 bg-slate-700/50 rounded-full" />
                <Skeleton className="h-4 w-20 bg-slate-700/50" />
              </div>
            </div>
            
            {/* Status badge */}
            <Skeleton className="h-8 w-24 bg-slate-700/50 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TicketStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-slate-800/50 p-4 ring-1 ring-white/10 animate-pulse">
          <div className="space-y-2">
            <Skeleton className="h-8 w-16 bg-slate-700/50" />
            <Skeleton className="h-4 w-24 bg-slate-700/50" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TicketFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Skeleton className="h-12 w-full bg-slate-800/50 rounded-lg ring-1 ring-white/10 animate-pulse" />
      </div>
      <Skeleton className="h-12 w-full sm:w-40 bg-slate-800/50 rounded-lg ring-1 ring-white/10 animate-pulse" />
      <Skeleton className="h-12 w-full sm:w-48 bg-slate-800/50 rounded-lg ring-1 ring-white/10 animate-pulse" />
    </div>
  )
}

export function TicketKanbanSkeleton({ count = 3 }: { count?: number }) {
  const columns = [
    { status: 'OPEN', label: 'Open', color: 'bg-blue-500/10 ring-blue-500/30' },
    { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-500/10 ring-amber-500/30' },
    { status: 'RESOLVED', label: 'Resolved', color: 'bg-emerald-500/10 ring-emerald-500/30' },
    { status: 'CLOSED', label: 'Closed', color: 'bg-slate-500/10 ring-slate-500/30' }
  ]
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => (
        <div key={column.status} className="flex flex-col">
          {/* Column Header */}
          <div className={`rounded-t-xl ${column.color} ring-1 p-4 animate-pulse`}>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24 bg-slate-700/50" />
              <Skeleton className="h-6 w-8 bg-slate-700/50 rounded-full" />
            </div>
          </div>

          {/* Column Content */}
          <div className="flex-1 space-y-3 rounded-b-xl bg-slate-800/30 ring-1 ring-white/10 p-3 min-h-[500px]">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-4 animate-pulse">
                <div className="space-y-3">
                  {/* Ticket ID and Priority */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16 bg-slate-700/50 rounded-lg" />
                    <Skeleton className="h-6 w-16 bg-slate-700/50 rounded-full" />
                  </div>

                  {/* Title */}
                  <Skeleton className="h-5 w-3/4 bg-slate-700/50" />

                  {/* Category */}
                  <Skeleton className="h-6 w-20 bg-slate-700/50 rounded-full" />

                  {/* Description */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-slate-700/50" />
                    <Skeleton className="h-4 w-4/5 bg-slate-700/50" />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                    <Skeleton className="h-4 w-16 bg-slate-700/50" />
                    <Skeleton className="h-8 w-8 rounded-full bg-slate-700/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}