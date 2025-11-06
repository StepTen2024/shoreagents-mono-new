"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, User, Building2, Clock, Edit, Trash2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DocumentDetail {
  id: string
  title: string
  category: string
  content: string
  uploadedBy: string
  staffUser?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  size: string
  fileUrl?: string
  updatedAt: string
  createdAt: string
  source?: string
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [document, setDocument] = useState<DocumentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    content: "",
  })

  useEffect(() => {
    fetchDocument()
  }, [id])

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/client/documents/${id}`)
      if (!response.ok) throw new Error("Failed to fetch document")
      const data = await response.json()
      // API returns document directly, not wrapped
      setDocument(data)
      setEditForm({
        title: data.title,
        category: data.category,
        content: data.content || "",
      })
    } catch (error) {
      console.error("Error fetching document:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editForm.title || !editForm.content) {
      alert("Please fill in all required fields")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/client/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) throw new Error("Failed to update document")

      await fetchDocument()
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating document:", error)
      alert("Failed to update document")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/client/documents/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete document")

      router.push("/client/knowledge-base")
    } catch (error) {
      console.error("Error deleting document:", error)
      alert("Failed to delete document")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading document...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document not found</h2>
          <p className="text-gray-600 mb-6">The document you're looking for doesn't exist or has been deleted.</p>
          <Link href="/client/knowledge-base">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Knowledge Base
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Check if this is a staff upload (staff uploads can't be edited by clients)
  const isStaffUpload = document.uploadedBy !== "TechCorp Inc."

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/client/knowledge-base"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Link>
        </div>

        {/* Document Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Header Section */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-4 rounded-lg ${isStaffUpload ? "bg-purple-50" : "bg-blue-50"}`}>
                  <FileText className={`h-8 w-8 ${isStaffUpload ? "text-purple-600" : "text-blue-600"}`} />
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="text-2xl font-bold mb-3"
                      placeholder="Document title..."
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">{document.title}</h1>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    {isStaffUpload ? (
                      <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                        <User className="h-3 w-3 mr-1" />
                        Staff Upload
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                        <Building2 className="h-3 w-3 mr-1" />
                        Company Doc
                      </Badge>
                    )}
                    {isEditing ? (
                      <Select
                        value={editForm.category}
                        onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client Resources</SelectItem>
                          <SelectItem value="procedure">Procedures & SOPs</SelectItem>
                          <SelectItem value="training">Training Materials</SelectItem>
                          <SelectItem value="culture">Company Culture</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                        {document.category.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {!isStaffUpload && (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setEditForm({
                            title: document.title,
                            category: document.category,
                            content: document.content || "",
                          })
                        }}
                        disabled={saving}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" onClick={() => setShowDeleteDialog(true)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last updated: {new Date(document.updatedAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                {isStaffUpload && document.staff_users ? (
                  <>
                    <User className="h-4 w-4" />
                    Uploaded by: {document.staff_users.name}
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4" />
                    Uploaded by: {document.uploadedBy}
                  </>
                )}
              </span>
              <span>Size: {document.size}</span>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            {isStaffUpload && (
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>📌 Note:</strong> This document was uploaded by your offshore staff member. 
                  It cannot be edited or deleted from the client portal.
                </p>
              </div>
            )}

            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Content</label>
                <Textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  rows={20}
                  className="resize-none font-mono text-sm"
                  placeholder="Enter document content..."
                />
              </div>
            ) : (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {document.content || "No content available"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}



