import { Skeleton } from "@/components/ui/skeleton"

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

export function TicketListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-12 text-sm font-medium text-gray-500">
          <div className="col-span-1"></div>
          <div className="col-span-2 text-left pl-2">
            Ticket ID
          </div>
          <div className="col-span-3 text-left pl-2">
            Title
          </div>
          <div className="col-span-2 text-left pl-2">
            Status
          </div>
          <div className="col-span-2 text-left pl-2">
            Priority
          </div>
          <div className="col-span-1 text-left pl-2">
            Category
          </div>
          <div className="col-span-1 text-left pl-2">
            Created
          </div>
        </div>
      </div>

      {/* Ticket Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="grid grid-cols-12 items-center">
              {/* Expand/Collapse Button */}
              <div className="col-span-1">
                <Skeleton className="h-8 w-8 bg-gray-200 rounded" />
              </div>

              {/* Ticket ID */}
              <div className="col-span-2 pl-2">
                <Skeleton className="h-4 w-16 bg-gray-200" />
              </div>

              {/* Title */}
              <div className="col-span-3 pl-2">
                <Skeleton className="h-4 w-3/4 bg-gray-200" />
              </div>

              {/* Status */}
              <div className="col-span-2 pl-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-gray-200 rounded" />
                  <Skeleton className="h-6 w-20 bg-gray-200 rounded-full" />
                </div>
              </div>

              {/* Priority */}
              <div className="col-span-2 pl-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-gray-200 rounded" />
                  <Skeleton className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
              </div>

              {/* Category */}
              <div className="col-span-1 pl-2">
                <Skeleton className="h-6 w-12 bg-gray-200 rounded-full" />
              </div>

              {/* Created Date */}
              <div className="col-span-1 pl-2">
                <Skeleton className="h-4 w-16 bg-gray-200 mb-1" />
                <Skeleton className="h-3 w-12 bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TicketStatsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-gray-200" />
            <Skeleton className="h-8 w-12 bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TicketFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32 bg-slate-800/50 rounded-lg" />
        <Skeleton className="h-10 w-32 bg-slate-800/50 rounded-lg" />
        <Skeleton className="h-10 w-32 bg-slate-800/50 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-48 bg-slate-800/50 rounded-lg" />
        <Skeleton className="h-10 w-24 bg-slate-800/50 rounded-lg" />
      </div>
    </div>
  )
}

export function TicketKanbanSkeleton({ count = 3 }: { count?: number }) {
  const columns = [
    { status: 'OPEN', label: 'Open', color: 'border-blue-500 bg-blue-950/20' },
    { status: 'IN_PROGRESS', label: 'In Progress', color: 'border-yellow-500 bg-yellow-950/20' },
    { status: 'RESOLVED', label: 'Resolved', color: 'border-green-500 bg-green-950/20' },
    { status: 'CLOSED', label: 'Closed', color: 'border-gray-500 bg-gray-950/20' }
  ]
  
  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map((column, idx) => (
        <div key={column.status} className="flex flex-col">
          {/* Column Header */}
          <div className={`border-t-4 ${column.color} rounded-t-lg backdrop-blur-xl p-3 shadow-sm ring-1 ring-white/10`}>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20 bg-slate-800/50" />
              <Skeleton className="h-4 w-6 bg-slate-800/50" />
            </div>
          </div>

          {/* Column Content */}
          <div className="flex-1 space-y-3 rounded-b-lg bg-slate-900/30 backdrop-blur-xl p-3 min-h-[500px]">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-slate-900/50 backdrop-blur-xl shadow-lg border border-white/10 p-5">
                <div className="space-y-4">
                  {/* Status bar skeleton */}
                  <Skeleton className="h-4 w-full bg-slate-800/50 rounded-t-2xl" />
                  
                  {/* Header skeleton - Ticket ID and Priority */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16 bg-slate-800/50 rounded-lg" />
                    <Skeleton className="h-6 w-20 bg-slate-800/50 rounded-lg" />
                  </div>

                  {/* Title skeleton */}
                  <Skeleton className="h-5 w-3/4 bg-slate-800/50" />

                  {/* Category skeleton */}
                  <Skeleton className="h-6 w-24 bg-slate-800/50 rounded-full" />

                  {/* Description skeleton */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-slate-800/50" />
                    <Skeleton className="h-4 w-5/6 bg-slate-800/50" />
                  </div>

                  {/* Footer skeleton */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-6 w-12 bg-slate-800/50 rounded-lg" />
                      <Skeleton className="h-6 w-12 bg-slate-800/50 rounded-lg" />
                      <Skeleton className="h-4 w-16 bg-slate-800/50" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full bg-slate-800/50" />
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