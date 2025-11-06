"use client"
// Updated: 2025-10-16 - Force rebuild

import { Star } from "lucide-react"
import { ReviewQuestion } from "@/lib/review-templates"

interface ReviewQuestionCardProps {
  question: ReviewQuestion
  value: number | null
  onChange: (questionId: string, value: number) => void
}

function ReviewQuestionCard({ question, value, onChange }: ReviewQuestionCardProps) {
  return (
    <div className="rounded-lg border-2 border-purple-200 bg-white p-6 shadow-sm hover:border-purple-400 transition-all hover:shadow-lg">
      <div className="mb-4">
        <p className="text-base font-medium text-gray-900">
          {question.question}
          {question.required && <span className="ml-1 text-red-500">*</span>}
        </p>
      </div>

      {/* 5-Star Rating */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(question.id, rating)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-10 w-10 transition-colors ${
                value && rating <= value
                  ? "fill-purple-500 text-purple-500"
                  : "text-gray-300 hover:text-purple-400"
              }`}
            />
          </button>
        ))}
        {value && (
          <span className="ml-4 text-sm font-medium text-gray-900">
            {value === 1 && "Poor"}
            {value === 2 && "Below Expectations"}
            {value === 3 && "Meets Expectations"}
            {value === 4 && "Exceeds Expectations"}
            {value === 5 && "Outstanding"}
          </span>
        )}
      </div>
    </div>
  )
}

export default ReviewQuestionCard
