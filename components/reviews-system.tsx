"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Star, ThumbsUp, Clock, TrendingUp,
  ChevronDown, ChevronUp, Eye, Calendar, User, CheckCircle
} from "lucide-react"

type ReviewStatus = "PENDING_APPROVAL" | "APPROVED" | "FINALIZED" | "ACKNOWLEDGED" | "ARCHIVED"
type ReviewType = "MONTH_1" | "MONTH_3" | "MONTH_5" | "RECURRING_6M" | "AD_HOC"

interface Review {
  id: string
  type: ReviewType
  userId: string
  reviewer: string
  reviewerName?: string
  reviewerTitle?: string
  client: string
  submittedDate: string
  evaluationPeriod?: string
  status: ReviewStatus
  overallScore: number
  answers: any
  acknowledgedDate: string | null
}

export default function ReviewsSystem() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ReviewStatus | "all">("all")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}/${year}`
  }

  const getReviewTypeLabel = (type: ReviewType) => {
    const labels = {
      MONTH_1: "Month 1 Assessment",
      MONTH_3: "Month 3 Progress Check",
      MONTH_5: "Month 5 Regularization",
      RECURRING_6M: "6-Month Recurring Check-In",
      AD_HOC: "Ad-Hoc Feedback",
    }
    return labels[type] || type
  }

  const getReviewTypeColor = (type: ReviewType) => {
    const colors = {
      MONTH_1: "bg-blue-500/20 text-blue-400 ring-blue-500/30",
      MONTH_3: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
      MONTH_5: "bg-purple-500/20 text-purple-400 ring-purple-500/30",
      RECURRING_6M: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
      AD_HOC: "bg-pink-500/20 text-pink-400 ring-pink-500/30",
    }
    return colors[type] || "bg-slate-500/20 text-slate-400"
  }

  const getStatusColor = (status: ReviewStatus) => {
    const colors = {
      PENDING_APPROVAL: "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30",
      APPROVED: "bg-blue-500/20 text-blue-400 ring-blue-500/30",
      FINALIZED: "bg-purple-500/20 text-purple-400 ring-purple-500/30",
      ACKNOWLEDGED: "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30",
      ARCHIVED: "bg-slate-500/20 text-slate-400 ring-slate-500/30",
    }
    return colors[status] || "bg-slate-500/20 text-slate-400"
  }

  const filteredReviews = reviews.filter((review) => 
    filter === "all" || review.status === filter
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto w-full space-y-6">
          <div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto w-full">
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Reviews</h2>
            <p className="mt-2 text-red-300">{error}</p>
          </div>
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
            <div className="rounded-xl bg-white/10 px-4 py-2 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{reviews.length}</div>
              <div className="text-xs text-slate-400">Total Reviews</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs - Staff only sees FINALIZED (new) and ACKNOWLEDGED reviews */}
        <div className="flex gap-2 rounded-xl bg-slate-900/50 p-2 backdrop-blur-xl ring-1 ring-white/10">
          {(["all", "FINALIZED", "ACKNOWLEDGED", "ARCHIVED"] as const).map((status) => {
            const count = status === "all" ? reviews.length : reviews.filter(r => r.status === status).length
            const label = status === "all" ? "All" : 
                         status === "FINALIZED" ? "New" :
                         status === "ACKNOWLEDGED" ? "Acknowledged" :
                         status === "ARCHIVED" ? "Archived" : status
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  filter === status
                    ? "bg-white/20 text-white"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
                <span className="ml-2 text-xs">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.length === 0 ? (
            <div className="col-span-full rounded-xl bg-slate-900/50 p-12 text-center backdrop-blur-xl ring-1 ring-white/10">
              <p className="text-slate-400">No reviews found</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <Card
                key={review.id}
                className="rounded-xl bg-slate-800/50 ring-1 ring-white/10 hover:ring-white/20 transition-all"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{getReviewTypeLabel(review.type)} Review</CardTitle>
                    <div className="flex items-center gap-2">
                      {review.status === "FINALIZED" && (
                        <Badge className="bg-red-500/20 text-red-400 ring-red-500/30">
                          🔴 New Review
                        </Badge>
                      )}
                      {review.status === "ACKNOWLEDGED" && review.acknowledgedDate && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 ring-emerald-500/30">
                          Acknowledged
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
                          <div className="text-2xl font-bold text-purple-400">{review.overallScore.toFixed(1)}</div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.round(review.overallScore || 0)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-600"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between gap-4 text-sm text-slate-400 mb-3 pb-3 border-b border-slate-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {review.dueDate ? new Date(review.dueDate).toLocaleDateString() : "N/A"}
                      </div>
                      {review.submittedDate && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Submitted: {new Date(review.submittedDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {review.status === "UNDER_REVIEW" && (
                          <Badge className="bg-purple-500/20 text-purple-400 ring-purple-500/30">
                            Waiting for Acknowledgement
                          </Badge>
                        )}
                      </div>
                    </div>
                    {review.status === "ACKNOWLEDGED" && review.acknowledgedDate && (
                      <div className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400 ring-1 ring-emerald-500/20 text-center">
                        Acknowledged on {mounted ? formatDate(review.acknowledgedDate) : review.acknowledgedDate}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
