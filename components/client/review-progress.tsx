"use client"

import { Check } from "lucide-react"

interface ReviewProgressProps {
  currentStep: number
  totalSteps: number
  completedQuestions: number
  totalQuestions: number
}

export function ReviewProgress({ 
  currentStep, 
  totalSteps,
  completedQuestions,
  totalQuestions
}: ReviewProgressProps) {
  const progress = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Step Indicators */}
      <div className="flex items-center justify-center w-full">
        <div className="flex items-center w-full max-w-4xl">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    step < currentStep
                      ? "border-purple-600 bg-purple-600 text-white"
                      : step === currentStep
                      ? "border-purple-600 bg-white text-purple-600"
                      : "border-gray-300 bg-white text-gray-500"
                  }`}
                >
                  {step < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step}</span>
                  )}
                </div>
                <span className="mt-2 text-xs text-gray-500">
                  Step {step}
                </span>
              </div>
              {step < totalSteps && (
                <div
                  className={`h-0.5 flex-1 mx-4 transition-colors ${
                    step < currentStep ? "bg-purple-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Overall Progress</span>
          <span className="font-medium text-gray-900">
            {completedQuestions} of {totalQuestions} questions answered
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold text-purple-600">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default ReviewProgress
