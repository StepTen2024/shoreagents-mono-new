"use client"
// Updated: 2025-10-16 - Force rebuild

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, ArrowRight, Send, User, CheckCircle } from "lucide-react"
import { getReviewTemplate, getAllQuestions } from "@/lib/review-templates"
import { getReviewTypeBadge } from "@/lib/review-utils"
import ReviewQuestionCard from "@/components/client/review-question-card"
import ReviewProgress from "@/components/client/review-progress"

interface Review {
  id: string
  type: string
  status: string
  dueDate: string
  evaluationPeriod: string
  staff_users: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export default function SubmitReviewPage({ 
  params 
}: { 
  params: { reviewId: string } 
}) {
  const router = useRouter()
  const [reviewId, setReviewId] = useState<string>(params.reviewId)
  const [review, setReview] = useState<Review | null>(null)
  const [ratings, setRatings] = useState<{ [key: string]: number }>({})
  const [strengths, setStrengths] = useState("")
  const [improvements, setImprovements] = useState("")
  const [additionalComments, setAdditionalComments] = useState("")
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    if (params.reviewId) {
      setReviewId(params.reviewId)
      fetchReview(params.reviewId)
    }
  }, [params.reviewId])

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

  const handleRatingChange = (questionId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [questionId]: rating }))
  }

  const handleSubmit = async () => {
    if (!review) return

    setSubmitting(true)
    setError(null)

    try {
      const template = getReviewTemplate(review.type as any)
      const questions = getAllQuestions(template)
      const ratingsArray = questions.map(q => ratings[q.id] || 0)

      // Validate all questions answered
      if (ratingsArray.some(r => r === 0)) {
        throw new Error("Please answer all questions before submitting")
      }

      if (!strengths.trim()) {
        throw new Error("Please provide strengths feedback")
      }

      if (!improvements.trim()) {
        throw new Error("Please provide areas for improvement")
      }

      const response = await fetch("/api/client/performance-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          ratings: ratingsArray,
          strengths: strengths.trim(),
          improvements: improvements.trim(),
          additionalComments: additionalComments.trim() || undefined
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit review")
      }

      setShowSuccessModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review")
      setSubmitting(false)
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

  if (error && !review) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
        <Card className="max-w-md p-6 text-center bg-white border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/client/performance-reviews")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reviews
          </Button>
        </Card>
      </div>
    )
  }

  if (!review) return null

  const template = getReviewTemplate(review.type as any)
  const typeBadge = getReviewTypeBadge(review.type as any)
  const totalSteps = template.categories.length + 1 // categories + feedback step
  const currentCategory = currentStep < template.categories.length 
    ? template.categories[currentStep]
    : null

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
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Performance Review</h1>
            </div>
            <p className="text-lg text-gray-600">{template.title}</p>
          </div>
        </div>

        {/* Staff Info Card */}
        <Card className="bg-white border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-lg p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-purple-200 ring-2 ring-purple-50">
              <AvatarImage src={review.staff_users.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xl font-semibold">
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

        {/* Progress */}
        <ReviewProgress 
          currentStep={currentStep + 1} 
          totalSteps={totalSteps}
          completedQuestions={Object.keys(ratings).length}
          totalQuestions={getAllQuestions(template).length}
        />

        {error && (
          <Card className="border-red-200 bg-red-50 p-4">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Questions or Feedback Step */}
        {currentCategory ? (
          <Card className="bg-white border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-lg p-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentCategory.name}</h2>
              <p className="text-gray-600">{currentCategory.description}</p>
            </div>
            
            <div className="space-y-6">
              {currentCategory.questions.map((question) => (
                <ReviewQuestionCard
                  key={question.id}
                  question={question}
                  value={ratings[question.id] || null}
                  onChange={handleRatingChange}
                />
              ))}
            </div>
          </Card>
        ) : (
          <Card className="bg-white border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-lg p-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Final Feedback</h2>
              <p className="text-gray-600">Provide additional context and comments</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  ✨ What are this staff member's key strengths? <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="Describe what they do well..."
                  rows={4}
                  className="resize-none bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  📈 What areas need improvement? <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="Describe areas where they could improve..."
                  rows={4}
                  className="resize-none bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  💬 Additional Comments (Optional)
                </label>
                <Textarea
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  placeholder="Any other feedback or context..."
                  rows={4}
                  className="resize-none bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0 || submitting}
            className="border-purple-300 bg-white text-purple-700 hover:bg-purple-50 hover:border-purple-400"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep < totalSteps - 1 ? (
            <Button 
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Review
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-white p-8 max-w-md mx-4 text-center shadow-xl">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h2>
              <p className="text-gray-600">
                Your performance review has been successfully submitted. Thank you for your feedback!
              </p>
            </div>
            <Button 
              onClick={() => router.push("/client/performance-reviews")}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Back to Reviews
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}

