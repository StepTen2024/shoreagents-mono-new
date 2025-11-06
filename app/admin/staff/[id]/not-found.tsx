import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserX } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="p-12 border-border bg-card text-center max-w-md">
        <UserX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Staff Member Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The staff member you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/admin/staff">
          <Button>Back to Staff Directory</Button>
        </Link>
      </Card>
    </div>
  )
}

