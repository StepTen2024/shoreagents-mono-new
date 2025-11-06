"use client"

import { useState, useEffect } from "react"
import { X, Upload, FileText, Users, Building2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface StaffUser {
  id: string
  name: string
  email: string
  avatar?: string
}

interface ClientCompany {
  id: string
  companyName: string
  logo?: string
}

export function DocumentUploadModal({ isOpen, onClose, onSuccess }: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<string>("PROCEDURE")
  const [description, setDescription] = useState("")
  const [sharedWithAll, setSharedWithAll] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  
  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [clientList, setClientList] = useState<ClientCompany[]>([])
  
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")

  // Fetch staff and clients on mount
  useEffect(() => {
    if (isOpen) {
      fetchStaffAndClients()
    }
  }, [isOpen])

  const fetchStaffAndClients = async () => {
    try {
      // Fetch staff users
      const staffRes = await fetch('/api/staff/users')
      if (staffRes.ok) {
        const staffData = await staffRes.json()
        setStaffList(staffData.staffUsers || [])
      }

      // Fetch client companies
      const clientRes = await fetch('/api/companies')
      if (clientRes.ok) {
        const clientData = await clientRes.json()
        setClientList(clientData.companies || [])
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md']
      const fileExt = '.' + selectedFile.name.split('.').pop()?.toLowerCase()
      
      if (!allowedTypes.includes(fileExt)) {
        setError(`Invalid file type. Please upload: ${allowedTypes.join(', ')}`)
        return
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }

      setFile(selectedFile)
      setError("")
      
      // Auto-fill title if empty
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "")
        setTitle(nameWithoutExt)
      }
    }
  }

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    )
  }

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!file) {
      setError("Please select a file")
      return
    }

    if (!title.trim()) {
      setError("Please enter a title")
      return
    }

    setUploading(true)
    setUploadProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title.trim())
      formData.append('category', category)
      formData.append('sharedWithAll', String(sharedWithAll))
      
      // Combine staff and client IDs for sharedWith array
      const sharedWith = [...selectedStaff, ...selectedClients]
      formData.append('sharedWith', JSON.stringify(sharedWith))

      setUploadProgress(30)

      const response = await fetch('/api/admin/documents', {
        method: 'POST',
        body: formData
      })

      setUploadProgress(70)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      setUploadProgress(100)

      console.log('✅ Document uploaded successfully:', data)

      // Show success message
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 500)

    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload document')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setTitle("")
    setCategory("PROCEDURE")
    setDescription("")
    setSharedWithAll(false)
    setSelectedStaff([])
    setSelectedClients([])
    setError("")
    setUploadProgress(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-900 border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20 ring-1 ring-red-500/30">
                <FileText className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Upload Admin Document</h2>
                <p className="text-sm text-slate-400">Share your expertise with staff and clients</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              disabled={uploading}
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Document File *
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.md"
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-white/20 rounded-lg hover:border-red-500/50 transition-colors cursor-pointer bg-slate-800/50"
                >
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-300">
                    {file ? file.name : 'Click to upload (PDF, DOC, DOCX, TXT, MD)'}
                  </span>
                </label>
                {file && (
                  <div className="mt-2 text-xs text-slate-400">
                    Size: {(file.size / 1024).toFixed(2)} KB
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Document Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                placeholder="e.g., SEO Best Practices 2025"
                disabled={uploading}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                disabled={uploading}
              >
                <option value="PROCEDURE">Procedure</option>
                <option value="TRAINING">Training</option>
                <option value="SEO">SEO</option>
                <option value="CULTURE">Culture</option>
                <option value="CLIENT">Client</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Sharing Section */}
            <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-white/10">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-red-400" />
                Sharing Settings
              </h3>

              {/* Share with All Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sharedWithAll}
                  onChange={(e) => setSharedWithAll(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-700 border-white/20 text-red-500 focus:ring-red-500/50"
                  disabled={uploading}
                />
                <span className="text-sm text-slate-300">
                  Share with ALL staff and clients
                </span>
              </label>

              {!sharedWithAll && (
                <>
                  {/* Select Staff */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Select Staff Members
                    </label>
                    <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-slate-900/50 rounded border border-white/5">
                      {staffList.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-2">Loading staff...</p>
                      ) : (
                        staffList.map((staff) => (
                          <label key={staff.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedStaff.includes(staff.id)}
                              onChange={() => toggleStaffSelection(staff.id)}
                              className="w-3 h-3 rounded bg-slate-700 border-white/20 text-purple-500"
                              disabled={uploading}
                            />
                            <span className="text-xs text-slate-300">{staff.name}</span>
                            <span className="text-[10px] text-slate-500">({staff.email})</span>
                          </label>
                        ))
                      )}
                    </div>
                    {selectedStaff.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        {selectedStaff.length} staff selected
                      </p>
                    )}
                  </div>

                  {/* Select Clients */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Select Client Companies
                    </label>
                    <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-slate-900/50 rounded border border-white/5">
                      {clientList.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-2">Loading clients...</p>
                      ) : (
                        clientList.map((client) => (
                          <label key={client.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedClients.includes(client.id)}
                              onChange={() => toggleClientSelection(client.id)}
                              className="w-3 h-3 rounded bg-slate-700 border-white/20 text-blue-500"
                              disabled={uploading}
                            />
                            <span className="text-xs text-slate-300">{client.companyName}</span>
                          </label>
                        ))
                      )}
                    </div>
                    {selectedClients.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        {selectedClients.length} clients selected
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Uploading & extracting text...</span>
                  <span className="text-slate-300">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  CloudConvert is extracting text content (3-8 seconds)
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="flex-1"
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={uploading || !file || !title.trim()}
              >
                {uploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}

