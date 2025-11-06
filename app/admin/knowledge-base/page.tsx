"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Eye, Plus, Filter, Users, Building2, File } from "lucide-react"
import { DocumentSourceBadge } from "@/components/ui/document-source-badge"
import { DocumentUploadModal } from "@/components/admin/document-upload-modal"

interface Document {
  id: string
  title: string
  category: string
  uploadedBy: string
  size: string
  content?: string
  createdAt: string
  updatedAt: string
  source: 'STAFF' | 'CLIENT' | 'ADMIN'
  sharedWithAll: boolean
  sharedWith: string[]
  staff_users: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState<string>('ALL')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  useEffect(() => {
    fetchAllDocuments()
  }, [])

  const fetchAllDocuments = async () => {
    setLoading(true)
    try {
      // Admin only needs to fetch from admin endpoint (which returns all documents)
      const adminRes = await fetch('/api/admin/documents')
      const adminData = await adminRes.json()

      // Use admin documents
      const allDocs: Document[] = Array.isArray(adminData) ? adminData : []

      // Deduplicate by ID
      const uniqueDocs = Array.from(
        new Map(allDocs.map(doc => [doc.id, doc])).values()
      )

      setDocuments(uniqueDocs)
      console.log(`📋 [ADMIN] Fetched ${uniqueDocs.length} total documents`)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = sourceFilter === 'ALL' 
    ? documents 
    : documents.filter(doc => doc.source === sourceFilter)

  const stats = {
    total: documents.length,
    admin: documents.filter(d => d.source === 'ADMIN').length,
    staff: documents.filter(d => d.source === 'STAFF').length,
    client: documents.filter(d => d.source === 'CLIENT').length,
    totalSize: documents.reduce((acc, d) => {
      const sizeInKB = parseFloat(d.size.replace(' KB', ''))
      return acc + (isNaN(sizeInKB) ? 0 : sizeInKB)
    }, 0)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Knowledge Base</h1>
          <p className="text-sm text-slate-400 mt-1">
            Master view of all documents across Admin, Staff, and Clients
          </p>
        </div>
        <Button
          onClick={() => setUploadModalOpen(true)}
          className="gap-2 bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 bg-slate-800/50 border-white/10">
          <div className="text-sm text-slate-400">Total Documents</div>
          <div className="text-2xl font-semibold text-white mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4 bg-slate-800/50 border-white/10">
          <div className="text-sm text-slate-400">🔴 Admin</div>
          <div className="text-2xl font-semibold text-red-400 mt-1">{stats.admin}</div>
        </Card>
        <Card className="p-4 bg-slate-800/50 border-white/10">
          <div className="text-sm text-slate-400">🟣 Staff</div>
          <div className="text-2xl font-semibold text-purple-400 mt-1">{stats.staff}</div>
        </Card>
        <Card className="p-4 bg-slate-800/50 border-white/10">
          <div className="text-sm text-slate-400">🔵 Client</div>
          <div className="text-2xl font-semibold text-blue-400 mt-1">{stats.client}</div>
        </Card>
        <Card className="p-4 bg-slate-800/50 border-white/10">
          <div className="text-sm text-slate-400">Total Size</div>
          <div className="text-2xl font-semibold text-orange-400 mt-1">
            {stats.totalSize.toFixed(1)} KB
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-slate-800/50 border-white/10">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300">Filter by source:</span>
          <div className="flex gap-2">
            {['ALL', 'ADMIN', 'STAFF', 'CLIENT'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSourceFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sourceFilter === filter
                    ? 'bg-white/10 text-white ring-1 ring-white/20'
                    : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                {filter === 'ALL' ? 'All Documents' : filter}
              </button>
            ))}
          </div>
          <div className="ml-auto text-sm text-slate-400">
            Showing {filteredDocuments.length} of {documents.length} documents
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      <Card className="bg-slate-800/50 border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Document
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Uploaded By
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sharing
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                    Loading documents...
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                    No documents found. Upload your first document!
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-700/50">
                          <FileText className="w-4 h-4 text-slate-300" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{doc.title}</div>
                          <div className="text-xs text-slate-400">
                            {doc.content ? `${doc.content.length} characters` : 'No content'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <DocumentSourceBadge source={doc.source} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-300 capitalize">
                        {doc.category.toLowerCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-300">{doc.uploadedBy}</span>
                    </td>
                    <td className="px-4 py-3">
                      {doc.sharedWithAll ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <Users className="w-3 h-3" />
                          All
                        </span>
                      ) : doc.sharedWith.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-400">
                          <Users className="w-3 h-3" />
                          {doc.sharedWith.length}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Private</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {doc.size}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-slate-300 hover:text-white hover:bg-white/10"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          fetchAllDocuments()
        }}
      />

      {/* Document View Modal - TODO: Create this component */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-900 border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <DocumentSourceBadge source={selectedDocument.source} />
                  <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    VIEW ONLY
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className="text-slate-400">✕</span>
                </button>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">{selectedDocument.title}</h2>
              <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                <span>{selectedDocument.category}</span>
                <span>•</span>
                <span>Uploaded by {selectedDocument.uploadedBy}</span>
                <span>•</span>
                <span>{formatDate(selectedDocument.createdAt)}</span>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {selectedDocument.content || 'No content available'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
