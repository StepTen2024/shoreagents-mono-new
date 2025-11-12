"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Pencil } from "lucide-react"

type ProfileData = {
  currentRole: string
  roleDescription: string | null
  bio: string | null
  responsibilities: string | null
  startDate: Date
}

export function EditProfileModal({ profile }: { profile: ProfileData }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    currentRole: profile.currentRole,
    roleDescription: profile.roleDescription || "",
    bio: profile.bio || "",
    responsibilities: profile.responsibilities || "",
    startDate: new Date(profile.startDate).toISOString().split('T')[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/admin/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully!",
          variant: "success",
        })
        setOpen(false)
        router.refresh()
      } else {
        const error = await res.json()
        throw new Error(error.error || 'Update failed')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Pencil className="size-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Job Title */}
          <div>
            <Label htmlFor="currentRole">Job Title *</Label>
            <Input
              id="currentRole"
              value={formData.currentRole}
              onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
              placeholder="e.g., CEO, HR Manager, Account Manager"
              required
              className="mt-1.5"
            />
          </div>

          {/* Role Description */}
          <div>
            <Label htmlFor="roleDescription">What I Do</Label>
            <Textarea
              id="roleDescription"
              value={formData.roleDescription}
              onChange={(e) => setFormData({ ...formData, roleDescription: e.target.value })}
              placeholder="Describe your role in a few words... (e.g., Manages onboarding, employee relations, performance reviews)"
              rows={3}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">Brief description of your responsibilities</p>
          </div>

          {/* Start Date */}
          <div>
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              className="mt-1.5"
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself... (e.g., 10 years HR experience, passionate about team culture...)"
              rows={4}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">Your professional background and interests</p>
          </div>

          {/* Responsibilities */}
          <div>
            <Label htmlFor="responsibilities">Key Responsibilities</Label>
            <Textarea
              id="responsibilities"
              value={formData.responsibilities}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              placeholder="List your main responsibilities... (one per line)"
              rows={5}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">Detailed list of what you handle day-to-day</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

