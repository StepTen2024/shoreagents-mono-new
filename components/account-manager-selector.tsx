"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Edit, Check, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Manager {
  id: string
  name: string
  email: string
  department: string | null
  avatar: string | null
}

interface AccountManagerSelectorProps {
  companyId: string
  currentManager: Manager | null
}

export function AccountManagerSelector({ companyId, currentManager }: AccountManagerSelectorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedManagerId, setSelectedManagerId] = useState(currentManager?.id || "")
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchManagers()
  }, [])

  const fetchManagers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/management-users')
      if (response.ok) {
        const data = await response.json()
        setManagers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching managers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/companies/${companyId}/account-manager`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountManagerId: selectedManagerId || null })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Account Manager updated successfully"
        })
        setIsEditing(false)
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update Account Manager",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setSelectedManagerId(currentManager?.id || "")
    setIsEditing(false)
  }

  if (!isEditing && currentManager) {
    return (
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Account Manager</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={currentManager.avatar || undefined} />
            <AvatarFallback>
              {currentManager.name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium text-foreground">{currentManager.name}</div>
            <div className="text-xs text-muted-foreground">{currentManager.department}</div>
            {currentManager.email && (
              <a href={`mailto:${currentManager.email}`} className="text-xs text-blue-400 hover:underline">
                {currentManager.email}
              </a>
            )}
          </div>
        </div>
      </Card>
    )
  }

  if (!isEditing && !currentManager) {
    return (
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Account Manager</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          No account manager assigned
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 border-border bg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Account Manager</h2>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCancel}
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
          <SelectTrigger>
            <SelectValue placeholder="Select Account Manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">No Manager (Unassigned)</SelectItem>
            {managers.map((manager) => (
              <SelectItem key={manager.id} value={manager.id}>
                <div className="flex items-center gap-2">
                  <span>{manager.name}</span>
                  <span className="text-xs text-muted-foreground">({manager.department})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {selectedManagerId && selectedManagerId !== "unassigned" && (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <div className="text-xs text-muted-foreground mb-1">Selected:</div>
          <div className="font-medium text-foreground">
            {managers.find(m => m.id === selectedManagerId)?.name || currentManager?.name}
          </div>
        </div>
      )}
    </Card>
  )
}

