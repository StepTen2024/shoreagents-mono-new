"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, User } from "lucide-react"

export default function AdminOffboardingDetail({ params }: { params: Promise<{ staffUserId: string }> }) {
  const router = useRouter()
  const { staffUserId } = use(params)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [offboarding, setOffboarding] = useState<any>(null)
  const [checklist, setChecklist] = useState({
    equipmentReturned: false,
    finalPaymentProcessed: false
  })

  useEffect(() => {
    fetchOffboarding()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffUserId])

  async function fetchOffboarding() {
    try {
      const response = await fetch(`/api/admin/staff/offboarding/${staffUserId}`)
      const data = await response.json()
      setOffboarding(data.offboarding)
      setChecklist({
        equipmentReturned: data.offboarding.equipmentReturned || false,
        finalPaymentProcessed: data.offboarding.finalPaymentProcessed || false
      })
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  async function handleComplete() {
    if (!checklist.equipmentReturned || !checklist.finalPaymentProcessed) {
      alert('Please complete all checklist items before finalizing')
      return
    }

    setCompleting(true)

    try {
      const response = await fetch(`/api/admin/staff/offboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffUserId,
          ...checklist
        })
      })

      if (!response.ok) throw new Error('Failed to complete')

      router.push('/admin/staff/offboarding')
    } catch (error) {
      alert('Failed to complete offboarding')
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!offboarding) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Offboarding record not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const exitData = offboarding.exitInterviewData ? JSON.parse(offboarding.exitInterviewData) : null

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        {/* Back Button at top */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/staff/offboarding')}
          className="hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {/* Name and View Profile on same row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{offboarding.staffUser.name}</h1>
            <p className="text-muted-foreground">Offboarding Details</p>
          </div>
          <Link href={`/admin/staff/${staffUserId}`}>
            <Button variant="ghost" size="sm" className="hover:bg-slate-100">
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Offboarding Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Reason</Label>
              <p className="font-medium">{offboarding.reason.replace('_', ' ')}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Working Date</Label>
              <p className="font-medium">
                {new Date(offboarding.lastWorkingDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Initiated By</Label>
              <p className="font-medium">Admin</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Badge>{offboarding.status}</Badge>
            </div>
          </div>
          {offboarding.offboardingNotes && (
            <div>
              <Label className="text-muted-foreground">Internal Notes</Label>
              <p className="text-sm mt-1">{offboarding.offboardingNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exit Interview Responses */}
      {exitData && (
        <Card>
          <CardHeader>
            <CardTitle>Exit Interview Responses</CardTitle>
            <CardDescription>
              Completed on {new Date(offboarding.updatedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Reason for Leaving</Label>
              <p className="text-sm mt-1">{exitData.reasonForLeaving || 'Not provided'}</p>
            </div>
            <Separator />
            <div>
              <Label>Overall Experience</Label>
              <p className="text-sm mt-1">{exitData.experienceRating || 'Not rated'}</p>
            </div>
            <Separator />
            <div>
              <Label>Manager Support</Label>
              <p className="text-sm mt-1">{exitData.managerSupport || 'Not provided'}</p>
            </div>
            <Separator />
            <div>
              <Label>Would Recommend?</Label>
              <p className="text-sm mt-1">{exitData.wouldRecommend || 'Not provided'}</p>
            </div>
            <Separator />
            <div>
              <Label>Suggestions</Label>
              <p className="text-sm mt-1">{exitData.suggestions || 'None provided'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Checklist */}
      {offboarding.status !== 'COMPLETED' && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Completion Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="equipment"
                checked={checklist.equipmentReturned}
                onCheckedChange={(checked) => setChecklist({ ...checklist, equipmentReturned: checked as boolean })}
              />
              <Label htmlFor="equipment">Equipment returned and verified</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="payment"
                checked={checklist.finalPaymentProcessed}
                onCheckedChange={(checked) => setChecklist({ ...checklist, finalPaymentProcessed: checked as boolean })}
              />
              <Label htmlFor="payment">Final payment processed</Label>
            </div>
            <Separator />
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Completing offboarding will revoke the staff member's system access and mark them as inactive.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleComplete}
              className="w-full"
              disabled={!checklist.equipmentReturned || !checklist.finalPaymentProcessed || completing}
            >
              {completing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Offboarding & Revoke Access
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {offboarding.status === 'COMPLETED' && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Offboarding completed on {new Date(offboarding.completedAt).toLocaleDateString()}. Staff access has been revoked.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
