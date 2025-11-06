"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Star, 
  ArrowRight, 
  Calendar, 
  User,
  CheckCircle
} from "lucide-react"
import { 
  getReviewTypeBadge, 
  getPerformanceBadge,
  formatReviewDate,
  getDueDateText
} from "@/lib/review-utils"
import { ReviewType, MONTH_1_TEMPLATE, MONTH_3_TEMPLATE, MONTH_5_TEMPLATE, RECURRING_TEMPLATE } from "@/lib/review-templates"

interface Review {
  id: string
  type: ReviewType
  status: string
  client: string
  reviewer: string
  reviewerName?: string
  reviewerTitle?: string
  dueDate: string
  submittedDate?: string
  evaluationPeriod?: string
  overallScore?: number
  performanceLevel?: string
  ratings?: number[]
  strengths?: string
  improvements?: string
  additionalComments?: string
  acknowledgedDate?: string
  createdAt: string
}

export default function StaffReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get template for review type
  const getTemplate = (type: ReviewType) => {
    switch (type) {
      case "MONTH_1": return MONTH_1_TEMPLATE
      case "MONTH_3": return MONTH_3_TEMPLATE
      case "MONTH_5": return MONTH_5_TEMPLATE
      case "RECURRING": return RECURRING_TEMPLATE
      default: return MONTH_1_TEMPLATE
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

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/performance-reviews")
      if (!response.ok) throw new Error("Failed to fetch reviews")
      
      const data = await response.json()
      setReviews(data.reviews)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }


  // Calculate scores
  const scores = reviews
    .filter(r => r.overallScore)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(r => r.overallScore!)
  
  const avgScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto w-full">
          <div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto w-full space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-purple-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Performance Reviews</h1>
              <p className="mt-1 text-slate-300">Your review history and feedback</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{reviews.length}</div>
              <div className="text-xs text-slate-400">Total Reviews</div>
            </div>
          </div>

          {/* Stats Row */}
          {scores.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{avgScore}%</div>
                <div className="text-xs text-slate-400">Average Score</div>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{scores[scores.length - 1]}%</div>
                <div className="text-xs text-slate-400">Latest Score</div>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-purple-400">
                  {reviews.filter(r => r.status === "UNDER_REVIEW").length}
                </div>
                <div className="text-xs text-slate-400">Waiting for Acknowledgement</div>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-emerald-400">
                  {reviews.filter(r => r.status === "COMPLETED").length}
                </div>
                <div className="text-xs text-slate-400">Acknowledged</div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Reviews</h2>
            <p className="mt-2 text-red-300">{error}</p>
          </div>
        )}

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.length === 0 ? (
            <div className="col-span-full rounded-xl bg-slate-900/50 p-12 text-center backdrop-blur-xl ring-1 ring-white/10">
              <p className="text-slate-400">No reviews available yet</p>
              <p className="mt-2 text-sm text-slate-500">
                Your performance reviews will appear here once completed by your client
              </p>
            </div>
          ) : (
            reviews.map((review) => {
              const typeBadge = getReviewTypeBadge(review.type)
              const perfBadge = review.performanceLevel 
                ? getPerformanceBadge(review.performanceLevel as any)
                : null
              const isNew = review.status === "UNDER_REVIEW"

              return (
                <Card 
                  key={review.id} 
                  className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 hover:ring-white/20 transition-all"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{typeBadge.label} Review</CardTitle>
                      <div className="flex items-center gap-2">
                        {isNew && (
                          <Badge className="animate-pulse bg-red-500/20 text-red-400 ring-red-500/30">
                            🔴 New
                          </Badge>
                        )}
                        {review.acknowledgedDate && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 ring-emerald-500/30">
                            🟢 Acknowledged
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Reviewer</div>
                        <div className="text-white font-medium">{review.reviewerName || review.reviewer}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Reviewer's Email</div>
                        <div className="text-white font-medium">{review.reviewer}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Evaluation Period</div>
                        <div className="text-white font-medium">{review.evaluationPeriod || "N/A"}</div>
                      </div>
                      {review.overallScore && (
                        <div>
                          <div className="text-sm text-slate-400 mb-1">Overall Score</div>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold text-purple-400">{review.overallScore}%</div>
                            {perfBadge && (
                              <Badge className={`${perfBadge.bgColor} ${perfBadge.color} text-sm`}>
                                {perfBadge.icon} {perfBadge.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>


                    <div className="pt-4 border-t border-slate-700">
                      <div className="flex items-center justify-between gap-4 text-sm text-slate-400 mb-3 pb-3 border-b border-slate-700">
                        {review.acknowledgedDate ? (
                          <div className="w-full rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 ring-1 ring-emerald-500/20 text-center">
                            Acknowledged on {formatReviewDate(review.acknowledgedDate)}
                          </div>
           ) : review.reviewedDate ? (
             <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <div className="text-sm text-slate-400 mb-1">Acknowledgment Due Date</div>
                 <div className={`font-medium ${
                   getDueDateText(getAcknowledgmentDueDate(review.reviewedDate)) === "Due today" || 
                   getDueDateText(getAcknowledgmentDueDate(review.reviewedDate)) === "Due tomorrow" ||
                   getDueDateText(getAcknowledgmentDueDate(review.reviewedDate)).includes("overdue")
                     ? "text-red-400" 
                     : "text-white"
                 }`}>
                   {getDueDateText(getAcknowledgmentDueDate(review.reviewedDate))}
                 </div>
               </div>
               <div>
                 <div className="text-sm text-slate-400 mb-1">Client Reviewed Date</div>
                 <div className="text-white font-medium">{new Date(review.submittedDate).toLocaleDateString()}</div>
               </div>
             </div>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                        {review.status === "UNDER_REVIEW" && (
                          <Badge className="bg-purple-500/20 text-purple-400 ring-purple-500/30">
                            Waiting for Acknowledgement
                          </Badge>
                        )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/performance-reviews/${review.id}`)}
                          className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}
