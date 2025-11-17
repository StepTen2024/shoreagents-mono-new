"use client"

import { useState } from "react"
import { Upload, X, FileText, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type DocumentCategory = "CLIENT" | "TRAINING" | "PROCEDURE" | "CULTURE" | "SEO"

interface DocumentUploadProps {
  onSuccess: () => void
  onClose: () => void
}

interface DocumentToUpload {
  id: string
  title: string
  category: DocumentCategory
  file: File | null
}

export default function DocumentUpload({ onSuccess, onClose }: DocumentUploadProps) {
  const [documentsToUpload, setDocumentsToUpload] = useState<DocumentToUpload[]>([
    { id: crypto.randomUUID(), title: "", category: "TRAINING", file: null }
  ])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const addAnotherDocument = () => {
    setDocumentsToUpload([
      ...documentsToUpload,
      { id: crypto.randomUUID(), title: "", category: "TRAINING", file: null }
    ])
  }

  const removeDocument = (id: string) => {
    if (documentsToUpload.length === 1) {
      return
    }
    setDocumentsToUpload(documentsToUpload.filter(doc => doc.id !== id))
  }

  const updateDocument = (id: string, updates: Partial<DocumentToUpload>) => {
    setDocumentsToUpload(documentsToUpload.map(doc => 
      doc.id === id ? { ...doc, ...updates } : doc
    ))
  }

  const resetUploadForm = () => {
    setDocumentsToUpload([
      { id: crypto.randomUUID(), title: "", category: "TRAINING", file: null }
    ])
    setUploadProgress({ current: 0, total: 0 })
    setError(null)
  }

  const handleUpload = async () => {
    // Validate all documents
    console.log('[Upload Debug] Documents to upload:', documentsToUpload.map(d => ({ id: d.id, title: d.title, hasFile: !!d.file })))
    
    const invalidDocs = documentsToUpload.filter(doc => !doc.title || !doc.file)
    console.log('[Upload Debug] Invalid docs:', invalidDocs.map(d => ({ id: d.id, title: d.title, hasFile: !!d.file })))
    
    if (invalidDocs.length > 0) {
      setError("Please provide a title and file for all documents.")
      return
    }

    setUploading(true)
    setUploadProgress({ current: 0, total: documentsToUpload.length })
    setError(null)

    let successCount = 0
    let failCount = 0

    // Upload each document sequentially
    for (let i = 0; i < documentsToUpload.length; i++) {
      const doc = documentsToUpload[i]
      setUploadProgress({ current: i + 1, total: documentsToUpload.length })

      try {
        const formData = new FormData()
        formData.append('file', doc.file!)
        formData.append('title', doc.title)
        formData.append('category', doc.category)

        const response = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Upload failed:', response.status, errorData)
          throw new Error(errorData.error || errorData.details || `Failed to upload document (${response.status})`)
        }
        
        successCount++
      } catch (error: any) {
        console.error(`Error uploading document "${doc.title}":`, error)
        failCount++
      }
    }

    setUploading(false)
    
    if (failCount === 0) {
      setShowSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } else {
      setError(`${successCount} succeeded, ${failCount} failed`)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-[600px] max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 p-6 shadow-2xl ring-1 ring-white/10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Upload Document</h2>
            <p className="text-sm text-indigo-400 mt-1">Share documents with your clients. They will be able to view and reference these documents.</p>
          </div>
          <button
            onClick={() => {
              onClose()
              resetUploadForm()
            }}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4">
          {documentsToUpload.map((doc, index) => (
            <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
              {documentsToUpload.length > 1 && (
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                  <h4 className="text-sm font-bold text-white">
                    Document {index + 1}
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument(doc.id)}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              )}

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor={`title-${doc.id}`} className="text-white">Document Title *</Label>
                  <input
                    id={`title-${doc.id}`}
                    placeholder="e.g., Customer Service Guidelines"
                    value={doc.title}
                    onChange={(e) => updateDocument(doc.id, { title: e.target.value })}
                    disabled={uploading}
                    className="w-full rounded-lg bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-indigo-400/50"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`category-${doc.id}`} className="text-white">Category *</Label>
                  <Select 
                    value={doc.category} 
                    onValueChange={(value) => updateDocument(doc.id, { category: value as DocumentCategory })}
                    disabled={uploading}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-gray-200 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLIENT">Client Resources</SelectItem>
                      <SelectItem value="PROCEDURE">Procedures & SOPs</SelectItem>
                      <SelectItem value="TRAINING">Training Materials</SelectItem>
                      <SelectItem value="CULTURE">Company Culture</SelectItem>
                      <SelectItem value="SEO">SEO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`file-${doc.id}`} className="text-white">Document File *</Label>
                  <input
                    id={`file-${doc.id}`}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      console.log('[File Input] Selected file:', file?.name, 'for doc:', doc.id)
                      updateDocument(doc.id, { file })
                      console.log('[File Input] Updated document with file')
                      // Auto-fill title from filename if title is empty
                      if (file && !doc.title) {
                        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
                        updateDocument(doc.id, { title: fileNameWithoutExt })
                        console.log('[File Input] Auto-filled title:', fileNameWithoutExt)
                      }
                    }}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor={`file-${doc.id}`} 
                    className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer"
                  >
                    {doc.file ? (
                      <div className="space-y-2">
                        <FileText className="h-8 w-8 text-indigo-600 mx-auto" />
                        <p className="text-sm font-medium text-white">{doc.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.file.size)}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                        <p className="text-sm font-medium text-white">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">
                          PDF, DOC, DOCX, TXT, or MD (Max 10MB)
                        </p>
                      </div>
                    )}
                  </label>
                  {index === 0 && (
                    <p className="text-xs text-gray-500">
                      Text will be extracted automatically using CloudConvert and made searchable
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {uploading && uploadProgress.total > 0 && (
            <div className="bg-indigo-500/10 border border-indigo-200 rounded-lg p-3 ring-1 ring-indigo-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-indigo-300">
                  Uploading documents...
                </span>
                <span className="text-sm text-indigo-400">
                  {uploadProgress.current} of {uploadProgress.total}
                </span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 ring-1 ring-red-500/30">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {!uploading && (
            <Button
              type="button"
              variant="outline"
              onClick={addAnotherDocument}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Document
            </Button>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={() => {
              onClose()
              resetUploadForm()
            }}
            disabled={uploading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={uploading} 
            className="bg-indigo-600 hover:bg-indigo-700 flex-1"
          >
            {uploading 
              ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...` 
              : `Upload ${documentsToUpload.length > 1 ? `All (${documentsToUpload.length})` : 'Document'}`
            }
          </Button>
        </div>

        {/* Success Modal Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/95 backdrop-blur-sm">
            <div className="max-w-md text-center p-6">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 ring-2 ring-green-400/50">
                  <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Documents Uploaded!</h3>
              <p className="mb-6 text-sm text-slate-300">
                Your {documentsToUpload.length > 1 ? 'documents have' : 'document has'} been uploaded successfully.
                <br /><br />
                <span className="font-semibold text-indigo-400">Your AI assistant now has full access!</span>
                <br />
                <span className="font-semibold text-blue-400">🔄 Automatically shared with your assigned client</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}





