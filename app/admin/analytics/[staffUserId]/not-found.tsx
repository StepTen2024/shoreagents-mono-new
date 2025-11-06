import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, UserX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/admin/analytics">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Analytics
        </Link>
      </Button>

      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <UserX className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle>Staff Member Not Found</CardTitle>
          <CardDescription>
            The staff member you're looking for doesn't exist or you don't have permission to view their analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/admin/analytics">Return to Analytics</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

