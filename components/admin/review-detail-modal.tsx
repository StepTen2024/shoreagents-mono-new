"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { X, User, Calendar, Star, MessageSquare, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Review {
  id: string
  staffUserId: string
  type: string
  status: string
  client: string
  reviewer: string
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

interface ReviewDetailModalProps {
  review: Review | null
  isOpen: boolean
  onClose: () => void
  onProcess: (reviewId: string, notes: string) => Promise<void>
}

export default function ReviewDetailModal({ review, isOpen, onClose, onProcess }: ReviewDetailModalProps) {
  const [managementNotes, setManagementNotes] = useState("")
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  if (!review) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 ring-yellow-500/30'
      case 'SUBMITTED': return 'bg-blue-500/20 text-blue-400 ring-blue-500/30'
      case 'UNDER_REVIEW': return 'bg-purple-500/20 text-purple-400 ring-purple-500/30'
      case 'COMPLETED': return 'bg-green-500/20 text-green-400 ring-green-500/30'
      default: return 'bg-slate-500/20 text-slate-400 ring-slate-500/30'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MONTHLY': return 'bg-blue-500/20 text-blue-400 ring-blue-500/30'
      case 'QUARTERLY': return 'bg-purple-500/20 text-purple-400 ring-purple-500/30'
      case 'ANNUAL': return 'bg-green-500/20 text-green-400 ring-green-500/30'
      default: return 'bg-slate-500/20 text-slate-400 ring-slate-500/30'
    }
  }

  const handleProcess = async () => {
    if (!managementNotes.trim()) {
      toast({
        title: "Error",
        description: "Please add management notes before processing",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    try {
      await onProcess(review.id, managementNotes)
      setManagementNotes("")
      onClose()
    } catch (error) {
      console.error('Error processing review:', error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <Star className="h-6 w-6 text-purple-400" />
              Performance Review Details
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Staff Info */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{review.staff_users.name}</h3>
              <p className="text-slate-400">{review.staff_users.email}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge className={getStatusColor(review.status)}>
                {review.status.replace('_', ' ')}
              </Badge>
              <Badge className={getTypeColor(review.type)}>
                {review.type}
              </Badge>
            </div>
          </div>

          {/* Review Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Client</h4>
              <p className="text-white font-medium">{review.client}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Reviewer</h4>
              <p className="text-white font-medium">{review.reviewer}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Evaluation Period</h4>
              <p className="text-white font-medium">{review.evaluationPeriod}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Due Date</h4>
              <p className="text-white font-medium">{new Date(review.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Overall Score */}
          {review.overallScore && (
            <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Overall Performance Score</h4>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-purple-400">
                  {(() => {
                    const score = typeof review.overallScore === 'number' ? review.overallScore : parseFloat(review.overallScore) || 0
                    // Cap the score at 5 if it's higher
                    const cappedScore = Math.min(score, 5)
                    return cappedScore.toFixed(1)
                  })()}
                </div>
                <div className="text-slate-400">out of 5</div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => {
                    const score = typeof review.overallScore === 'number' ? review.overallScore : parseFloat(review.overallScore) || 0
                    const cappedScore = Math.min(score, 5)
                    return (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(cappedScore) 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : i < cappedScore ? 'text-yellow-400 fill-yellow-400 opacity-50' : 'text-slate-600'
                        }`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Ratings */}
          {review.ratings && Object.keys(review.ratings).length > 0 ? (
            <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-3">Detailed Ratings</h4>
              <div className="space-y-2">
                {Object.entries(review.ratings).map(([key, value]) => {
                  // Convert numeric keys to meaningful names
                  const getCategoryName = (key: string) => {
                    const categoryMap: { [key: string]: string } = {
                      '0': 'Communication',
                      '1': 'Technical Skills',
                      '2': 'Problem Solving',
                      '3': 'Teamwork',
                      '4': 'Time Management',
                      '5': 'Quality of Work',
                      '6': 'Initiative',
                      '7': 'Adaptability',
                      'communication': 'Communication',
                      'technicalSkills': 'Technical Skills',
                      'problemSolving': 'Problem Solving',
                      'teamwork': 'Teamwork',
                      'timeManagement': 'Time Management',
                      'qualityOfWork': 'Quality of Work',
                      'initiative': 'Initiative',
                      'adaptability': 'Adaptability'
                    }
                    return categoryMap[key] || key.replace(/([A-Z])/g, ' $1').trim()
                  }

                  const score = typeof value === 'number' ? value : parseFloat(value) || 0
                  const cappedScore = Math.min(score, 5)
                  const categoryName = getCategoryName(key)

                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-slate-300 capitalize">{categoryName}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(cappedScore) 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : i < cappedScore ? 'text-yellow-400 fill-yellow-400 opacity-50' : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-white font-medium">{cappedScore.toFixed(1)}/5</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Detailed Ratings</h4>
              <p className="text-slate-500 italic">No detailed ratings available for this review.</p>
            </div>
          )}

          {/* Strengths */}
          {review.strengths && (
            <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Strengths</h4>
              <p className="text-slate-300 whitespace-pre-wrap">{review.strengths}</p>
            </div>
          )}

          {/* Areas for Improvement */}
          {review.improvements && (
            <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Areas for Improvement</h4>
              <p className="text-slate-300 whitespace-pre-wrap">{review.improvements}</p>
            </div>
          )}

          {/* Additional Comments */}
          {review.additionalComments && (
            <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Additional Comments</h4>
              <p className="text-slate-300 whitespace-pre-wrap">{review.additionalComments}</p>
            </div>
          )}

          {/* Management Notes */}
          {review.managementNotes && (
            <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-2">Management Notes</h4>
              <p className="text-slate-300 whitespace-pre-wrap">{review.managementNotes}</p>
            </div>
          )}

          {/* Process Review Section */}
          {review.status === 'SUBMITTED' && (
            <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-3">Process Review</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="managementNotes" className="text-slate-300">
                    Management Notes
                  </Label>
                  <Textarea
                    id="managementNotes"
                    value={managementNotes}
                    onChange={(e) => setManagementNotes(e.target.value)}
                    placeholder="Add your management notes and feedback..."
                    className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleProcess}
                  disabled={processing || !managementNotes.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {processing ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Process Review
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
            <h4 className="text-sm font-medium text-slate-400 mb-3">Timeline</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Calendar className="h-4 w-4" />
                Created: {new Date(review.createdAt).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Calendar className="h-4 w-4" />
                Due: {new Date(review.dueDate).toLocaleString()}
              </div>
              {review.submittedDate && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Submitted: {new Date(review.submittedDate).toLocaleString()}
                </div>
              )}
              {review.acknowledgedDate && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Acknowledged: {new Date(review.acknowledgedDate).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
