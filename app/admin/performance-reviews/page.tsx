"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Star, Clock, CheckCircle2, User, Calendar, ArrowRight, MessageSquare } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getReviewTypeBadge, getPerformanceBadge, getDueDateText } from "@/lib/review-utils"

interface Review {
  id: string
  staffUserId: string
  type: string
  status: string
  client: string
  reviewer: string
  reviewerName?: string
  reviewerTitle?: string
  submittedDate?: string
  evaluationPeriod: string
  overallScore?: number
  acknowledgedDate?: string
  createdAt: string
  updatedAt: string
  dueDate: string
  ratings?: any
  performanceLevel?: string
  strengths?: string
  improvements?: string
  additionalComments?: string
  managementNotes?: string
  staff_users: {
    id: string
    name: string
    email: string
    avatar?: string
    companyId: string
  }
}

export default function AdminReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/admin/reviews')
      if (!response.ok) throw new Error('Failed to fetch reviews')
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  const handleViewDetails = (review: Review) => {
    router.push(`/admin/performance-reviews/${review.id}`)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending Client Review'
      case 'SUBMITTED': return 'Client Reviewed'
      case 'UNDER_REVIEW': return 'Waiting for Acknowledgement'
      case 'COMPLETED': return 'Completed'
      default: return status.replace('_', ' ')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 ring-yellow-500/30'
      case 'SUBMITTED': return 'bg-blue-500/20 text-blue-400 ring-blue-500/30'
      case 'UNDER_REVIEW': return 'bg-purple-500/20 text-purple-400 ring-purple-500/30'
      case 'COMPLETED': return 'bg-green-500/20 text-green-400 ring-green-500/30'
      default: return 'bg-slate-500/20 text-muted-foreground ring-slate-500/30'
    }
  }

  const getAcknowledgmentDueDate = (submittedDate: string) => {
    const submitted = new Date(submittedDate)
    const dueDate = new Date(submitted)
    dueDate.setDate(submitted.getDate() + 7) // Add 7 days
    return dueDate
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MONTHLY': return 'bg-blue-500/20 text-blue-400 ring-blue-500/30'
      case 'QUARTERLY': return 'bg-purple-500/20 text-purple-400 ring-purple-500/30'
      case 'ANNUAL': return 'bg-green-500/20 text-green-400 ring-green-500/30'
      default: return 'bg-slate-500/20 text-muted-foreground ring-slate-500/30'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="rounded-lg bg-card border p-6">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </Card>
          ))}
        </div>

        {/* Reviews Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="rounded-lg bg-card border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between gap-4 text-sm mb-3 pb-3 border-b border-border">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-6 w-32 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Star className="h-8 w-8 text-purple-400" />
            Performance Reviews
          </h1>
          <p className="text-muted-foreground">Manage staff performance reviews and evaluations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="rounded-lg bg-card border">
            <CardContent className="p-6">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-foreground">{reviews.length}</div>
                <div className="text-sm text-muted-foreground">Total Reviews</div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card border">
            <CardContent className="p-6">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-blue-500">
                  {reviews.filter(r => r.status === 'SUBMITTED').length}
                </div>
                <div className="text-sm text-muted-foreground">Client Reviewed</div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card border">
            <CardContent className="p-6">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-purple-500">
                  {reviews.filter(r => r.status === 'UNDER_REVIEW').length}
                </div>
                <div className="text-sm text-muted-foreground">Waiting for Acknowledgement</div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg bg-card border">
            <CardContent className="p-6">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-bold text-green-500">
                  {reviews.filter(r => r.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card className="rounded-lg bg-card border">
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Reviews Found</h3>
              <p className="text-muted-foreground">No performance reviews have been submitted yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <Card key={review.id} className="rounded-lg bg-card border hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <User className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-foreground">{review.staff_users.name}</CardTitle>
                        <CardDescription className="text-muted-foreground">{review.staff_users.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getReviewTypeBadge(review.type).bgColor} ${getReviewTypeBadge(review.type).color}`}>
                        {getReviewTypeBadge(review.type).icon} {getReviewTypeBadge(review.type).label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Company</div>
                      <div className="text-foreground font-medium">{review.client}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Reviewer</div>
                      <div className="text-foreground font-medium">{review.reviewerName || review.reviewer}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Reviewer's Email</div>
                      <div className="text-foreground font-medium">{review.reviewer}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Evaluation Period</div>
                      <div className="text-foreground font-medium">{review.evaluationPeriod}</div>
                    </div>
                    {review.overallScore && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Overall Score</div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-purple-400">{review.overallScore}%</div>
                          {review.performanceLevel && (
                            <Badge className={`${getPerformanceBadge(review.performanceLevel as any).bgColor} ${getPerformanceBadge(review.performanceLevel as any).color} text-sm`}>
                              {getPerformanceBadge(review.performanceLevel as any).icon} {getPerformanceBadge(review.performanceLevel as any).label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>


                  <div className="pt-4 border-t border-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {!review.submittedDate && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Client Review Due Date</div>
                          <div className={`font-medium ${
                            getDueDateText(review.dueDate) === "Due today" || 
                            getDueDateText(review.dueDate) === "Due tomorrow" ||
                            getDueDateText(review.dueDate).includes("overdue")
                              ? "text-red-400" 
                              : "text-foreground"
                          }`}>
                            {getDueDateText(review.dueDate)}
                          </div>
                        </div>
                      )}
                      {review.submittedDate && review.status === 'UNDER_REVIEW' && (
                        <>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Acknowledgment Due Date</div>
                            <div className={`font-medium ${
                              getDueDateText(getAcknowledgmentDueDate(review.submittedDate)) === "Due today" || 
                              getDueDateText(getAcknowledgmentDueDate(review.submittedDate)) === "Due tomorrow" ||
                              getDueDateText(getAcknowledgmentDueDate(review.submittedDate)).includes("overdue")
                                ? "text-red-400" 
                                : "text-foreground"
                            }`}>
                              {getDueDateText(getAcknowledgmentDueDate(review.submittedDate))}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Client Reviewed Date</div>
                            <div className="font-medium text-foreground">{new Date(review.submittedDate).toLocaleDateString()}</div>
                          </div>
                        </>
                      )}
                      {review.submittedDate && review.status !== 'UNDER_REVIEW' && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Client Reviewed Date</div>
                          <div className="font-medium text-foreground">{new Date(review.submittedDate).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={getStatusColor(review.status)}>
                        {getStatusLabel(review.status)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => handleViewDetails(review)}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  )
}

