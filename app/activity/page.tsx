import ActivityLog from "@/components/activity-log"
import { QueryProvider } from "@/lib/query-client"

export default function ActivityPage() {
  return (
    <QueryProvider>
      <ActivityLog />
    </QueryProvider>
  )
}
