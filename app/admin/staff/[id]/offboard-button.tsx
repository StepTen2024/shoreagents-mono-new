"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UserMinus, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function OffboardButton({ staffUserId }: { staffUserId: string }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [initiating, setInitiating] = useState(false)
  const [formData, setFormData] = useState({
    reason: "",
    reasonDetails: "",
    lastWorkingDate: "",
    notes: ""
  })

  async function handleInitiate() {
    if (!formData.reason || !formData.lastWorkingDate) {
      toast.error("Please fill in all required fields")
      return
    }

    setInitiating(true)

    try {
      const response = await fetch("/api/admin/staff/offboarding/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffUserId,
          reason: formData.reason,
          reasonDetails: formData.reasonDetails,
          lastWorkingDate: formData.lastWorkingDate,
          offboardingNotes: formData.notes
        })
      })

      if (!response.ok) throw new Error("Failed")

      toast.success("Offboarding initiated successfully")
      setShowModal(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to initiate offboarding")
    } finally {
      setInitiating(false)
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setShowModal(true)}>
        <UserMinus className="h-4 w-4 mr-2" />
        Offboard Staff
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Initiate Staff Offboarding</DialogTitle>
            <DialogDescription>
              Start the offboarding process for this staff member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Reason for Leaving *</Label>
              <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESIGNATION">Resignation</SelectItem>
                  <SelectItem value="TERMINATION">Termination</SelectItem>
                  <SelectItem value="END_OF_CONTRACT">End of Contract</SelectItem>
                  <SelectItem value="MUTUAL_AGREEMENT">Mutual Agreement</SelectItem>
                  <SelectItem value="RETIREMENT">Retirement</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.reason === "OTHER" && (
              <div>
                <Label>Please Specify</Label>
                <Input
                  value={formData.reasonDetails}
                  onChange={(e) => setFormData({ ...formData, reasonDetails: e.target.value })}
                  placeholder="Provide details"
                />
              </div>
            )}

            <div>
              <Label>Last Working Date *</Label>
              <Input
                type="date"
                value={formData.lastWorkingDate}
                onChange={(e) => setFormData({ ...formData, lastWorkingDate: e.target.value })}
              />
            </div>

            <div>
              <Label>Offboarding Notes (Internal)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any notes for HR/Admin..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleInitiate} disabled={initiating}>
              {initiating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Initiating...</> : "Initiate Offboarding"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
