"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Loader2, 
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  User,
  Building
} from "lucide-react"

interface ContractData {
  id: string
  staffUserId: string
  contractHtml: string
  signatureUrl: string
  contractSigned: boolean
  signedAt: string
  createdAt: string
  staff_users: {
    name: string
    email: string
  }
  company: {
    companyName: string
  }
}

export default function AdminContractViewPage() {
  const router = useRouter()
  const params = useParams()
  const contractId = params.contractId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [contract, setContract] = useState<ContractData | null>(null)

  useEffect(() => {
    fetchContract()
  }, [contractId])

  const fetchContract = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/contracts/${contractId}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch contract")
      }
      
      const data = await response.json()
      setContract(data.contract)
    } catch (err) {
      setError("Failed to load contract details")
      console.error("Contract fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download functionality
    alert("PDF download functionality will be implemented soon!")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <span className="text-slate-300">Loading contract...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Alert className="max-w-md">
              <AlertDescription className="text-red-600">
                {error || "Contract not found"}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Employment Contract</h1>
              <p className="text-slate-400">Contract ID: {contract.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Contract Info */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contract Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Staff Member</p>
                <p className="text-white flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {contract.staff_users.name}
                </p>
                <p className="text-slate-300 text-sm">{contract.staff_users.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Company</p>
                <p className="text-white flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {contract.company.companyName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <Badge 
                  variant={contract.contractSigned ? "default" : "secondary"}
                  className={contract.contractSigned ? "bg-green-600" : "bg-yellow-600"}
                >
                  {contract.contractSigned ? "Signed" : "Pending"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-400">Signed Date</p>
                <p className="text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {contract.contractSigned ? new Date(contract.signedAt).toLocaleDateString() : "Not signed"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Content */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Contract Content</CardTitle>
            <CardDescription className="text-slate-400">
              Full employment contract details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-6 rounded-lg">
              <div 
                dangerouslySetInnerHTML={{ __html: contract.contractHtml }}
                className="prose max-w-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        {contract.contractSigned && contract.signatureUrl && (
          <Card className="mb-6 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Digital Signature</CardTitle>
              <CardDescription className="text-slate-400">
                Staff member's digital signature
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={contract.signatureUrl} 
                  alt="Digital Signature"
                  className="max-w-md mx-auto border border-gray-300 rounded"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
