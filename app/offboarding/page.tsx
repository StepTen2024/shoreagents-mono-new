"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export default function OffboardingExitForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [offboarding, setOffboarding] = useState<any>(null)
  const [formData, setFormData] = useState({
    reasonForLeaving: "",
    experienceRating: "",
    managerSupport: "",
    wouldRecommend: "",
    suggestions: "",
    laptopReturned: false,
    accessCardsReturned: false,
    documentsReturned: false,
    acknowledged: false
  })

  useEffect(() => {
    checkOffboardingStatus()
  }, [])

  async function checkOffboardingStatus() {
    try {
      const response = await fetch("/api/offboarding")
      const data = await response.json()

      if (!data.offboarding) {
        router.push("/")
        return
      }

      if (data.offboarding.exitInterviewCompleted) {
        router.push("/")
        return
      }

      setOffboarding(data.offboarding)
      setLoading(false)
    } catch (error) {
      console.error("Error:", error)
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!formData.acknowledged) {
      alert("Please acknowledge that you have reviewed the information")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/offboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error("Failed")

      router.push("/")
    } catch (error) {
      alert("Failed to submit exit form")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!offboarding) return null

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <Card className="max-w-4xl mx-auto bg-white/10 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Exit Interview & Offboarding</CardTitle>
          <CardDescription className="text-slate-300">
            Your last working day is {new Date(offboarding.lastWorkingDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Exit Interview</h3>

            <div>
              <Label className="text-white mb-2 block">What is your primary reason for leaving?</Label>
              <Textarea
                value={formData.reasonForLeaving}
                onChange={(e) => setFormData({ ...formData, reasonForLeaving: e.target.value })}
                rows={3}
                className="bg-slate-800/50 text-white border-slate-600 placeholder:text-slate-400"
                placeholder="Please describe your reason for leaving..."
              />
            </div>

            <div>
              <Label className="text-white mb-3 block">How would you rate your overall experience?</Label>
              <RadioGroup value={formData.experienceRating} onValueChange={(value) => setFormData({ ...formData, experienceRating: value })}>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="excellent" id="excellent" />
                  <Label htmlFor="excellent" className="text-white cursor-pointer">Excellent</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="good" id="good" />
                  <Label htmlFor="good" className="text-white cursor-pointer">Good</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="fair" id="fair" />
                  <Label htmlFor="fair" className="text-white cursor-pointer">Fair</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="poor" id="poor" />
                  <Label htmlFor="poor" className="text-white cursor-pointer">Poor</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-white mb-3 block">Did your manager provide adequate support?</Label>
              <RadioGroup value={formData.managerSupport} onValueChange={(value) => setFormData({ ...formData, managerSupport: value })}>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="text-white cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="text-white cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-white mb-3 block">Would you recommend ShoreAgents to others?</Label>
              <RadioGroup value={formData.wouldRecommend} onValueChange={(value) => setFormData({ ...formData, wouldRecommend: value })}>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="yes" id="rec-yes" />
                  <Label htmlFor="rec-yes" className="text-white cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="no" id="rec-no" />
                  <Label htmlFor="rec-no" className="text-white cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-white mb-2 block">Any suggestions for improvement?</Label>
              <Textarea
                value={formData.suggestions}
                onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                rows={4}
                className="bg-slate-800/50 text-white border-slate-600 placeholder:text-slate-400"
                placeholder="Please share your suggestions..."
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-white">Equipment Return</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="laptop"
                  checked={formData.laptopReturned}
                  onCheckedChange={(checked) => setFormData({ ...formData, laptopReturned: checked as boolean })}
                />
                <Label htmlFor="laptop" className="text-white cursor-pointer">Laptop/Computer Equipment</Label>
              </div>
              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="cards"
                  checked={formData.accessCardsReturned}
                  onCheckedChange={(checked) => setFormData({ ...formData, accessCardsReturned: checked as boolean })}
                />
                <Label htmlFor="cards" className="text-white cursor-pointer">Access Cards/Keys</Label>
              </div>
              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="docs"
                  checked={formData.documentsReturned}
                  onCheckedChange={(checked) => setFormData({ ...formData, documentsReturned: checked as boolean })}
                />
                <Label htmlFor="docs" className="text-white cursor-pointer">Company Documents</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-700 pt-6">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acknowledge"
                checked={formData.acknowledged}
                onCheckedChange={(checked) => setFormData({ ...formData, acknowledged: checked as boolean })}
              />
              <Label htmlFor="acknowledge" className="leading-normal text-white cursor-pointer">
                I acknowledge that I have reviewed all information and confirm its accuracy.
              </Label>
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
            disabled={!formData.acknowledged || submitting}
          >
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Submit Exit Form</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
