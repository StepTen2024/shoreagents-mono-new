"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, User, Calendar, Clock, Star } from "lucide-react"
import { getReviewTemplate, getAllQuestions } from "@/lib/review-templates"
import { getReviewTypeBadge, formatReviewDate } from "@/lib/review-utils"

interface Review {
  id: string
  type: string
  status: string
  dueDate: string
  submittedDate: string
  evaluationPeriod: string
  ratings: number[]
  strengths: string
  improvements: string
  additionalComments?: string
  staff_users: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export default function ViewReviewPage({ 
  params 
}: { 
  params: Promise<{ reviewId: string }> 
}) {
  const router = useRouter()
  const [reviewId, setReviewId] = useState<string>("")
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => {
      setReviewId(p.reviewId)
      fetchReview(p.reviewId)
    })
  }, [params])

  const fetchReview = async (id: string) => {
    try {
      const response = await fetch(`/api/client/performance-reviews/${id}`)
      if (!response.ok) throw new Error("Failed to fetch review")
      
      const data = await response.json()
      setReview(data.review)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Loading review...</p>
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
        <Card className="max-w-md p-6 text-center bg-white border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || "Review not found"}</p>
          <Button onClick={() => router.push("/client/performance-reviews")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reviews
          </Button>
        </Card>
      </div>
    )
  }

  const template = getReviewTemplate(review.type as any)
  const typeBadge = getReviewTypeBadge(review.type as any)
  const questions = getAllQuestions(template)

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return "Poor"
      case 2: return "Below Expectations"
      case 3: return "Meets Expectations"
      case 4: return "Exceeds Expectations"
      case 5: return "Outstanding"
      default: return "Not Rated"
    }
  }

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1: return "text-red-600"
      case 2: return "text-orange-600"
      case 3: return "text-yellow-600"
      case 4: return "text-blue-600"
      case 5: return "text-green-600"
      default: return "text-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Back Button */}
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/client/performance-reviews")}
            className="p-2 hover:bg-purple-50 text-gray-600 hover:text-purple-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reviews
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Review Details</h1>
            </div>
            <p className="text-lg text-gray-600">{template.title}</p>
          </div>
          <div className="flex gap-3">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 p-4 min-w-[140px]">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  ✓
                </div>
                <div className="text-sm font-medium text-gray-700">Completed</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Staff Info Card */}
        <Card className="bg-white border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-lg p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-green-200 ring-2 ring-green-50">
              <AvatarImage src={review.staff_users.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-green-600 to-emerald-600 text-white text-xl font-semibold">
                {review.staff_users.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{review.staff_users.name}</h2>
              <p className="text-gray-600">{review.staff_users.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${typeBadge.bgColor} ${typeBadge.color}`}>
                  {typeBadge.icon} {typeBadge.label}
                </span>
                <span className="text-sm text-gray-600">
                  Evaluation Period: {review.evaluationPeriod}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Review Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Review Information</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span className="font-medium text-gray-900">{formatReviewDate(review.submittedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium text-gray-900">{formatReviewDate(review.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Completed</span>
              </div>
            </div>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Overall Rating</h3>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {review.ratings.length > 0 ? (review.ratings.reduce((a, b) => a + b, 0) / review.ratings.length).toFixed(1) : "N/A"}
              </div>
              <div className="text-lg text-gray-600">
                Average Rating
              </div>
            </div>
          </Card>
        </div>

        {/* Questions and Ratings */}
        <Card className="bg-white border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Question Ratings</h3>
          </div>
          
          <div className="space-y-6">
            {questions.map((question, index) => {
              const rating = review.ratings[index] || 0
              return (
                <div key={question.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                  <div className="mb-4">
                    <p className="text-base font-medium text-gray-900 mb-2">
                      {question.question}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-6 w-6 ${
                            star <= rating
                              ? "fill-purple-500 text-purple-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900">{rating}</span>
                      <span className={`text-sm font-medium ${getRatingColor(rating)}`}>
                        {getRatingLabel(rating)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Feedback */}
        <Card className="bg-white border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Written Feedback</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">✨ Key Strengths</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">{review.strengths}</p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">📈 Areas for Improvement</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">{review.improvements}</p>
              </div>
            </div>

            {review.additionalComments && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">💬 Additional Comments</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed">{review.additionalComments}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
