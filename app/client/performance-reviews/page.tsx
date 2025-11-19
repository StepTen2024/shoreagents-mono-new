"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calendar,
  Clock,
  User,
  ArrowRight,
  AlertCircle,
  Filter,
  Eye
} from "lucide-react"
import { 
  getReviewTypeBadge, 
  formatReviewDate,
  getDueDateText,
  getDueDateStatus,
  getDueDateStatusColor,
  isReviewOverdue
} from "@/lib/review-utils"

interface Review {
  id: string
  type: string
  status: string
  dueDate: string
  submittedDate?: string
  evaluationPeriod: string
  staff_users: {
    id: string
    name: string
    email: string
    avatar?: string
    staff_profiles?: {
      startDate: string
    } | null
  }
}

export default function ClientReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoCreating, setAutoCreating] = useState(false)
  const [filterMonth, setFilterMonth] = useState<string>("all")
  const [filterYear, setFilterYear] = useState<string>("all")

  useEffect(() => {
    fetchReviews()
  }, []) // Remove filterMonth, filterYear from dependencies

  const fetchReviews = async () => {
    try {
      // First, trigger review creation for this client's staff
      setAutoCreating(true)
      try {
        const autoCreateResponse = await fetch("/api/client/performance-reviews/auto-create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
        
        if (autoCreateResponse.ok) {
          const autoCreateData = await autoCreateResponse.json()
          console.log(`Auto-created ${autoCreateData.created} reviews`)
        }
      } catch (triggerError) {
        console.error("Auto-review creation failed:", triggerError)
        if (triggerError instanceof Error) {
          console.error("Error details:", triggerError.message)
        }
        // Continue anyway - reviews might already exist
      } finally {
        setAutoCreating(false)
      }

      // Fetch all reviews once
      const allReviewsResponse = await fetch("/api/client/performance-reviews")
      if (!allReviewsResponse.ok) throw new Error("Failed to fetch reviews")
      const allReviewsData = await allReviewsResponse.json()
      
      setReviews(allReviewsData.reviews || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  const pendingReviews = reviews.filter(r => r.status === "PENDING")
  
  // Client-side filtering for submitted reviews
  const getFilteredSubmittedReviews = () => {
    const submittedReviews = reviews.filter(r => r.status !== "PENDING")
    
    const hasMonthFilter = filterMonth && filterMonth !== "all"
    const hasYearFilter = filterYear && filterYear !== "all"
    
    if (!hasMonthFilter && !hasYearFilter) {
      return submittedReviews
    }
    
    return submittedReviews.filter(review => {
      if (!review.submittedDate) return false
      
      const submittedDate = new Date(review.submittedDate)
      const submittedMonth = submittedDate.getMonth() + 1 // getMonth() returns 0-11
      const submittedYear = submittedDate.getFullYear()
      
      const monthMatch = !hasMonthFilter || submittedMonth === parseInt(filterMonth)
      const yearMatch = !hasYearFilter || submittedYear === parseInt(filterYear)
      
      return monthMatch && yearMatch
    })
  }
  
  const submittedReviews = getFilteredSubmittedReviews()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">
            {autoCreating ? "Creating reviews..." : "Loading reviews..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Performance Reviews</h1>
            </div>
            <p className="text-lg text-gray-600">Evaluate and provide feedback for your staff members</p>
          </div>
          <div className="flex gap-3">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 p-4 min-w-[140px]">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {pendingReviews.length}
                </div>
                <div className="text-sm font-medium text-gray-700">Pending</div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 p-4 min-w-[140px]">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {submittedReviews.length}
                </div>
                <div className="text-sm font-medium text-gray-700">Completed</div>
              </div>
            </Card>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 p-4">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Pending Reviews Section */}
        {pendingReviews.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Pending Reviews <span className="text-purple-600">({pendingReviews.length})</span>
                </h2>
              </div>
            </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingReviews.map((review) => {
                const typeBadge = getReviewTypeBadge(review.type as any)
                const overdue = isReviewOverdue(review.dueDate)
                
                return (
                  <Card 
                    key={review.id} 
                    className={`bg-white border-2 transition-all hover:shadow-xl ${
                      overdue 
                        ? 'border-red-300 hover:border-red-400' 
                        : 'border-purple-200 hover:border-purple-400'
                    }`}
                  >
                    <div className="px-4 space-y-4">
                      {/* Overdue Banner */}
                      {overdue && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-700">Overdue</span>
                        </div>
                      )}
                      
                      {/* Staff Info */}
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-purple-200 ring-2 ring-purple-50">
                          <AvatarImage src={review.staff_users.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold">
                            {review.staff_users.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 relative">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 truncate">{review.staff_users.name}</h3>
                              <p className="text-sm text-gray-600 truncate">{review.staff_users.email}</p>
                            </div>
                            <Badge className={`${typeBadge.bgColor} ${typeBadge.color} text-xs font-semibold px-2 py-1 ml-2 flex-shrink-0`}>
                              {typeBadge.icon} {typeBadge.label}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Due Date</span>
                          </div>
                          <p className="font-semibold text-gray-900 text-xs">
                            {formatReviewDate(review.dueDate)}
                          </p>
                          {getDueDateStatus(review.dueDate) && (
                            <p className={`text-[10px] font-medium mt-1 ${getDueDateStatusColor(review.dueDate)}`}>
                              {getDueDateStatus(review.dueDate)}
                            </p>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Period</span>
                          </div>
                          {review.staff_users.staff_profiles?.startDate && (
                            <p className="font-semibold text-gray-900 text-xs">
                              {formatReviewDate(review.staff_users.staff_profiles.startDate)}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-600 mt-1">{review.evaluationPeriod}</p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                        onClick={() => router.push(`/client/performance-reviews/submit/${review.id}`)}
                      >
                        Complete Review
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {pendingReviews.length === 0 && submittedReviews.length === 0 && (
          <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-200 p-16 text-center shadow-sm">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-6">
              <User className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">All Caught Up!</h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              You don't have any reviews to complete at this time. New reviews will appear here when they're assigned.
            </p>
          </Card>
        )}

        {/* Separator */}
        {pendingReviews.length > 0 && submittedReviews.length > 0 && (
          <div className="border-t border-gray-200 my-8"></div>
        )}

        {/* Submitted Reviews Section */}
        {submittedReviews.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  Completed Reviews <span className="text-green-600">({submittedReviews.length})</span>
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-800 font-medium">Filter by:</span>
                </div>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-40 text-gray-900">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900 border border-gray-200">
                    <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">All Months</SelectItem>
                    <SelectItem value="1" className="text-gray-900 hover:bg-gray-50">January</SelectItem>
                    <SelectItem value="2" className="text-gray-900 hover:bg-gray-50">February</SelectItem>
                    <SelectItem value="3" className="text-gray-900 hover:bg-gray-50">March</SelectItem>
                    <SelectItem value="4" className="text-gray-900 hover:bg-gray-50">April</SelectItem>
                    <SelectItem value="5" className="text-gray-900 hover:bg-gray-50">May</SelectItem>
                    <SelectItem value="6" className="text-gray-900 hover:bg-gray-50">June</SelectItem>
                    <SelectItem value="7" className="text-gray-900 hover:bg-gray-50">July</SelectItem>
                    <SelectItem value="8" className="text-gray-900 hover:bg-gray-50">August</SelectItem>
                    <SelectItem value="9" className="text-gray-900 hover:bg-gray-50">September</SelectItem>
                    <SelectItem value="10" className="text-gray-900 hover:bg-gray-50">October</SelectItem>
                    <SelectItem value="11" className="text-gray-900 hover:bg-gray-50">November</SelectItem>
                    <SelectItem value="12" className="text-gray-900 hover:bg-gray-50">December</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="w-28 text-gray-900">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900 border border-gray-200">
                    <SelectItem value="all" className="text-gray-900 hover:bg-gray-50">All Years</SelectItem>
                    <SelectItem value="2024" className="text-gray-900 hover:bg-gray-50">2024</SelectItem>
                    <SelectItem value="2025" className="text-gray-900 hover:bg-gray-50">2025</SelectItem>
                    <SelectItem value="2026" className="text-gray-900 hover:bg-gray-50">2026</SelectItem>
                  </SelectContent>
                </Select>
                {(filterMonth && filterMonth !== "all") || (filterYear && filterYear !== "all") ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setFilterMonth("all")
                      setFilterYear("all")
                    }}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="space-y-3">
              {submittedReviews.map((review) => {
                const typeBadge = getReviewTypeBadge(review.type as any)
                
                return (
                  <Card 
                    key={review.id} 
                    className="bg-white border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-lg"
                  >
                    <div className="px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-green-200">
                            <AvatarImage src={review.staff_users.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-green-600 to-emerald-600 text-white">
                              {review.staff_users.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{review.staff_users.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`${typeBadge.bgColor} ${typeBadge.color}`}>
                                {typeBadge.icon} {typeBadge.label}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                Submitted {review.submittedDate ? formatReviewDate(review.submittedDate) : 'recently'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/client/performance-reviews/view/${review.id}`)}
                            className="border-purple-300 bg-white text-purple-700 hover:bg-purple-100 hover:border-purple-500 hover:text-purple-800 h-6 px-2 text-xs"
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

