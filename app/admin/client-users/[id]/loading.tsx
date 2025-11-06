import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </Card>

          {/* Company Card */}
          <Card className="p-6 border-border bg-card">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </Card>

          {/* Activity Card */}
          <Card className="p-6 border-border bg-card">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-4 w-full" />
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Account Info */}
          <Card className="p-6 border-border bg-card">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-4">
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div>
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6 border-border bg-card">
            <Skeleton className="h-5 w-20 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

