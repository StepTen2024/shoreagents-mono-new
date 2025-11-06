"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  ArrowLeft,
  Star,
  CheckCircle,
  User,
  Calendar,
  Mail,
  RefreshCw
} from "lucide-react"
import { 
  getReviewTypeBadge, 
  getStatusBadge, 
  getPerformanceBadge,
  formatReviewDate,
  getDueDateText
} from "@/lib/review-utils"
import { getReviewTemplate, getAllQuestions } from "@/lib/review-templates"

interface Review {
  id: string
  type: string
  status: string
  client: string
  reviewer: string
  reviewerName?: string
  reviewerTitle?: string
  dueDate: string
  submittedDate?: string
  evaluationPeriod: string
  ratings?: number[]
  overallScore?: number
  performanceLevel?: string
  strengths?: string
  improvements?: string
  additionalComments?: string
  managementNotes?: string
  reviewedBy?: string
  reviewedByName?: string
  reviewedDate?: string
  acknowledgedDate?: string
  createdAt: string
  updatedAt: string
  staff_users: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export default function StaffReviewDetailPage({ 
  params 
}: { 
  params: Promise<{ reviewId: string }> 
}) {
  const router = useRouter()
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    fetchReview()
  }, [])

  const fetchReview = async () => {
    try {
      const resolvedParams = await params
      const response = await fetch(`/api/performance-reviews/${resolvedParams.reviewId}`)
      if (!response.ok) throw new Error('Failed to fetch review')
      
      const data = await response.json()
      setReview(data.review)
    } catch (error) {
      console.error('Error fetching review:', error)
      setError('Failed to load review details')
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledgeReview = async () => {
    if (!review) return
    
    setProcessing(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/performance-reviews/${review.id}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      
      if (!response.ok) throw new Error("Failed to acknowledge review")
      
      setShowSuccessModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to acknowledge review")
    } finally {
      setProcessing(false)
    }
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

  const getAcknowledgmentDueDate = (reviewedDate: string) => {
    const reviewed = new Date(reviewedDate)
    const dueDate = new Date(reviewed)
    dueDate.setDate(reviewed.getDate() + 7) // Add 7 days
    return dueDate
  }

  const isOverdue = (dueDate: Date) => {
    return dueDate < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-8 rounded bg-slate-700/50" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 bg-slate-700/50" />
            <Skeleton className="h-4 w-64 bg-slate-700/50" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Feedback Skeleton */}
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32 bg-slate-700/50" />
                <Skeleton className="h-4 w-full bg-slate-700/50" />
                <Skeleton className="h-4 w-3/4 bg-slate-700/50" />
                <Skeleton className="h-4 w-1/2 bg-slate-700/50" />
              </div>
            </Card>

            {/* Ratings Breakdown Skeleton */}
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-40 bg-slate-700/50" />
                <div className="grid gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24 bg-slate-700/50" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-8 bg-slate-700/50" />
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Skeleton key={j} className="h-4 w-4 rounded bg-slate-700/50" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Staff Info Skeleton */}
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
              <div className="text-center space-y-4">
                <Skeleton className="h-16 w-16 rounded-full mx-auto bg-slate-700/50" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 mx-auto bg-slate-700/50" />
                  <Skeleton className="h-4 w-48 mx-auto bg-slate-700/50" />
                </div>
                <div className="flex justify-center gap-2">
                  <Skeleton className="h-6 w-20 rounded-full bg-slate-700/50" />
                  <Skeleton className="h-6 w-16 rounded-full bg-slate-700/50" />
                </div>
              </div>
            </Card>

            {/* Overall Score Skeleton */}
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Skeleton className="h-10 w-16 bg-slate-700/50" />
                  <Skeleton className="h-6 w-20 rounded-full bg-slate-700/50" />
                </div>
                <Skeleton className="h-4 w-24 mx-auto bg-slate-700/50" />
              </div>
            </Card>

            {/* Review Info Skeleton */}
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32 bg-slate-700/50" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-4 w-20 bg-slate-700/50" />
                      <Skeleton className="h-5 w-32 bg-slate-700/50" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="p-6">
        <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-12 text-center">
          <p className="text-muted-foreground">Review not found</p>
          <Button className="mt-4" onClick={() => router.push("/performance-reviews")}>
            Back to Reviews
          </Button>
        </Card>
      </div>
    )
  }

  const typeBadge = getReviewTypeBadge(review.type as any)
  const statusBadge = getStatusBadge(review.status as any)
  const perfBadge = review.performanceLevel ? getPerformanceBadge(review.performanceLevel as any) : null

  const template = getReviewTemplate(review.type as any)
  const questions = getAllQuestions(template)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/performance-reviews")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Review Details</h1>
          <p className="text-muted-foreground">View your performance review</p>
        </div>
      </div>

      {error && (
        <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 border-red-500 bg-red-50 p-4 dark:bg-red-950">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">

          {/* Client Feedback */}
          {review.strengths && (
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">✨ Strengths</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{review.strengths}</p>
            </Card>
          )}

          {review.improvements && (
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">📈 Areas for Improvement</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{review.improvements}</p>
            </Card>
          )}

          {review.additionalComments && (
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">💬 Additional Comments</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{review.additionalComments}</p>
            </Card>
          )}

          {/* Ratings Breakdown */}
          {review.ratings && review.ratings.length > 0 && (
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">📊 Ratings Breakdown</h3>
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const rating = review.ratings![index]
                  if (!rating) return null
                  
                  return (
                    <div key={question.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-foreground">{question.question}</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{question.category}</p>
                      <div className="h-px bg-border" />
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Management Notes */}
          {review.managementNotes && (
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">📝 Management Notes</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{review.managementNotes}</p>
            </Card>
            )}

            {/* Acknowledge Review Button */}
          {review.status === "UNDER_REVIEW" && (
            <Button
              onClick={handleAcknowledgeReview}
              disabled={processing}
              className="w-fit mx-auto"
            >
              {processing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Acknowledge Review
                </>
              )}
            </Button>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6 sticky top-6 h-fit">
          {/* Review Title Section */}
          <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">{typeBadge.label} Review</h2>
              <div className="flex justify-center gap-2 mt-3">
                <Badge className={`${statusBadge.bgColor} ${statusBadge.color} text-sm`}>
                  {getStatusLabel(review.status)}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Overall Score */}
          {review.overallScore && (
            <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6 flex flex-col justify-between">
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <p className="text-4xl font-bold text-primary">{review.overallScore}%</p>
                  {perfBadge && (
                    <Badge className={`${perfBadge.bgColor} ${perfBadge.color} text-sm ml-2`}>
                      {perfBadge.icon} {perfBadge.label}
                    </Badge>
                  )}
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground text-center">Overall Score</h3>
            </Card>
          )}

          {/* Review Info */}
          <Card className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Review Information</h3>
            
            <div className="space-y-2">
       {review.reviewedDate && (
         <div className="text-sm">
           <span className="text-muted-foreground">
             {review.acknowledgedDate ? "Acknowledgment Date:" : "Acknowledgment Due Date:"}
           </span>
           <div className={`font-medium ${
             review.acknowledgedDate 
               ? "text-green-400" 
               : getDueDateText(getAcknowledgmentDueDate(review.reviewedDate)) === "Due today" || 
                 getDueDateText(getAcknowledgmentDueDate(review.reviewedDate)) === "Due tomorrow" ||
                 getDueDateText(getAcknowledgmentDueDate(review.reviewedDate)).includes("overdue")
                 ? "text-red-400" 
                 : "text-foreground"
           }`}>
             {review.acknowledgedDate 
               ? formatReviewDate(review.acknowledgedDate)
               : getDueDateText(getAcknowledgmentDueDate(review.reviewedDate))
             }
           </div>
         </div>
       )}
              <div className="text-sm">
                <span className="text-muted-foreground">Period:</span>
                <div className="font-medium text-foreground">{review.evaluationPeriod}</div>
              </div>
              {review.submittedDate && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Client Reviewed Date:</span>
                  <div className="font-medium text-foreground">{formatReviewDate(review.submittedDate)}</div>
                </div>
              )}
            </div>
            
            <div className="border-t border-border pt-3 mt-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Reviewer:</span>
                <div className="font-medium text-foreground">{review.reviewerName || review.reviewer}</div>
              </div>
              <div className="text-sm mt-2">
                <span className="text-muted-foreground">Reviewer's Email:</span>
                <div className="font-medium text-foreground">{review.reviewer}</div>
              </div>
              {review.reviewerTitle && (
                <div className="text-sm mt-2">
                  <span className="text-muted-foreground">Title:</span>
                  <div className="font-medium text-foreground">{review.reviewerTitle}</div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Review Acknowledged Successfully
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You have successfully acknowledged your review. The review is now complete.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSuccessModal(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                router.push("/performance-reviews")
              }}
            >
              Back to Reviews
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
