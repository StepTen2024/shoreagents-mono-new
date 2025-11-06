"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, UserMinus, Plus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AdminOffboardingDashboard() {
  const [loading, setLoading] = useState(true)
  const [offboardings, setOffboardings] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [initiating, setInitiating] = useState(false)
  const [staffList, setStaffList] = useState<any[]>([])
  const [formData, setFormData] = useState({
    staffUserId: "",
    reason: "",
    reasonDetails: "",
    lastWorkingDate: "",
    notes: ""
  })

  useEffect(() => {
    fetchOffboardings()
    fetchStaffList()
  }, [filter])

  async function fetchOffboardings() {
    try {
      const response = await fetch(`/api/admin/staff/offboarding?filter=${filter}`)
      const data = await response.json()
      setOffboardings(data.offboardings || [])
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  async function fetchStaffList() {
    try {
      const response = await fetch("/api/admin/staff")
      const data = await response.json()
      setStaffList(data.staff || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  async function handleInitiate() {
    if (!formData.staffUserId || !formData.reason || !formData.lastWorkingDate) {
      toast.error("Please fill in all required fields")
      return
    }

    setInitiating(true)

    try {
      const response = await fetch("/api/admin/staff/offboarding/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffUserId: formData.staffUserId,
          reason: formData.reason,
          reasonDetails: formData.reasonDetails,
          lastWorkingDate: formData.lastWorkingDate,
          offboardingNotes: formData.notes
        })
      })

      if (!response.ok) throw new Error("Failed")

      toast.success("Offboarding initiated successfully")
      setShowModal(false)
      setFormData({
        staffUserId: "",
        reason: "",
        reasonDetails: "",
        lastWorkingDate: "",
        notes: ""
      })
      fetchOffboardings()
    } catch (error) {
      toast.error("Failed to initiate offboarding")
    } finally {
      setInitiating(false)
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      INITIATED: { variant: "secondary", label: "Initiated" },
      PENDING_EXIT: { variant: "warning", label: "Pending Exit Form" },
      PROCESSING: { variant: "default", label: "Processing" },
      COMPLETED: { variant: "success", label: "Completed" },
      CANCELLED: { variant: "destructive", label: "Cancelled" }
    }
    const config = variants[status] || variants.INITIATED
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Staff Offboarding</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Initiate Offboarding
        </Button>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Initiate Staff Offboarding</DialogTitle>
            <DialogDescription>
              Start the offboarding process for a staff member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Select Staff Member *</Label>
              <Select 
                value={formData.staffUserId} 
                onValueChange={(value) => setFormData({ ...formData, staffUserId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.filter(staff => !offboardings.some(ob => ob.staffUserId === staff.id && ob.status !== 'COMPLETED')).map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} ({staff.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
            <Button onClick={handleInitiate} disabled={initiating}>
              {initiating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Initiating...</> : "Initiate Offboarding"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value={filter} className="space-y-4 mt-6">
          {offboardings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No offboarding records found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {offboardings.map((offboarding) => (
                <Card key={offboarding.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">
                            {offboarding.staff_users.name}
                          </h3>
                          {getStatusBadge(offboarding.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Reason: {offboarding.reason.replace('_', ' ')}</p>
                          <p>Last Working Day: {new Date(offboarding.lastWorkingDate).toLocaleDateString()}</p>
                          <p>Exit Form: {offboarding.exitInterviewCompleted ? '✅ Completed' : '⏳ Pending'}</p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          {offboarding.equipmentReturned && (
                            <Badge variant="outline">Equipment Returned</Badge>
                          )}
                          {offboarding.accessRevoked && (
                            <Badge variant="outline">Access Revoked</Badge>
                          )}
                          {offboarding.finalPaymentProcessed && (
                            <Badge variant="outline">Payment Processed</Badge>
                          )}
                        </div>
                      </div>
                      <Link href={`/admin/staff/offboarding/${offboarding.staffUserId}`}>
                        <Button>View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
